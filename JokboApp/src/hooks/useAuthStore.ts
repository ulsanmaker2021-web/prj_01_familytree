import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
export type { UserProfile, UserRole };
import {
  DEMO_SECURITY_ACCOUNTS,
  getAllSecurityAccounts,
  getCustomRegisteredAccounts,
  saveCustomAccount,
  clearCustomAccounts,
  verifyClanInviteCode,
  recordFailedLogin,
  resetBruteForceLock,
  getBruteForceStatus,
  stripPhoneNumber,
  formatPhoneNumber,
} from '../utils/securityAuth';
import { isFirebaseConfigured } from '../config/firebaseConfig';
import {
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  clearPhoneAuthSession,
  hasActiveFirebaseSession,
} from '../services/firebaseAuthService';
import {
  fetchUserFromSupabase,
  syncUserToSupabase,
} from '../services/supabaseDataService';
import {
  saveAllToCloudDatabase,
  fetchAllFromCloudDatabase,
} from '../services/unifiedCloudSyncService';
import { hashPassword, verifyPassword, hashPin, verifyPin } from '../utils/cryptoHelper';
import {
  isPlatformBiometricsAvailable,
  registerPlatformBiometric,
  authenticatePlatformBiometric,
} from '../services/biometricAuthService';
import { isSupabaseConnected } from '../config/supabaseClient';

export interface RegisterMemberParams {
  name: string;
  hanja?: string;
  clan: string;
  role: UserRole;
  roleLabel: string;
  phone: string;
  password: string;
  pinCode?: string; // 6자리 2차 보안 PIN 번호
  birthDate?: string;
  fatherName?: string;
  motherName?: string;
}

// ==========================================
// 🔐 [로그인 세션 영구 저장소 (LocalStorage)]
// ==========================================
const AUTH_SESSION_KEY = 'jokbo_auth_session_v1';

export function getStoredAuthSession(): { userId: string; authenticated: boolean } | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && session.authenticated && session.userId ? session : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredAuthSession(userId: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const session = {
      userId,
      authenticated: true,
      loginAt: new Date().toISOString(),
    };
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearStoredAuthSession(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }
}

// Check for URL sync parameter (?jokbo_sync=...) when opening on smartphone
import { checkAndApplyUrlSync, importSyncPackage } from '../utils/deviceSyncHelper';
checkAndApplyUrlSync();

// Initial session restore from localStorage
const storedSession = getStoredAuthSession();
let initialUser: UserProfile = DEMO_SECURITY_ACCOUNTS[0];
let initialAuthenticated = false;
let initialLoginModalOpen = true;

if (storedSession) {
  const all = getAllSecurityAccounts();
  const matched = all.find((a) => a.id === storedSession.userId);
  if (matched) {
    initialUser = matched;
    initialAuthenticated = true;
    initialLoginModalOpen = false;
  }
}

// Global Auth State
let globalCurrentUser: UserProfile = initialUser;
let globalIsAuthenticated: boolean = initialAuthenticated;
let globalIsLoginModalOpen: boolean = initialLoginModalOpen;
let globalPending2FA: {
  phone: string;
  expectedOtp: string;
  user: UserProfile;
  isFirebase?: boolean;
  biometricSupported?: boolean;
  biometricType?: 'fingerprint' | 'face' | 'platform';
} | null = null;

const authListeners = new Set<() => void>();

function notifyAuth() {
  authListeners.forEach((listener) => listener());
}

export function getGlobalCurrentUser(): UserProfile {
  return globalCurrentUser;
}

export function getGlobalIsAuthenticated(): boolean {
  return globalIsAuthenticated;
}

export function updateGlobalCurrentUserProfile(updates: Partial<UserProfile>) {
  globalCurrentUser = { ...globalCurrentUser, ...updates };
  if (globalCurrentUser.isCustomRegistered) {
    const all = getCustomRegisteredAccounts();
    const existing = all.find((a) => a.id === globalCurrentUser.id);
    if (existing) {
      saveCustomAccount({ ...existing, ...globalCurrentUser });
    }
  }
  notifyAuth();
}

export function addAuthListener(cb: () => void): () => void {
  authListeners.add(cb);
  return () => {
    authListeners.delete(cb);
  };
}

export function useAuthStore() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(globalCurrentUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(globalIsAuthenticated);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(globalIsLoginModalOpen);
  const [pending2FA, setPending2FA] = useState<typeof globalPending2FA>(globalPending2FA);
  const [bruteForce, setBruteForce] = useState(getBruteForceStatus());

  useEffect(() => {
    const handleUpdate = () => {
      setCurrentUser(globalCurrentUser);
      setIsAuthenticated(globalIsAuthenticated);
      setIsLoginModalOpen(globalIsLoginModalOpen);
      setPending2FA(globalPending2FA);
      setBruteForce(getBruteForceStatus());
    };

    authListeners.add(handleUpdate);
    return () => {
      authListeners.delete(handleUpdate);
    };
  }, []);

  // 1. 데모 가문 계정으로 원클릭 빠른 전환 로그인
  const loginWithDemoAccount = (accountId: string) => {
    const allAccounts = getAllSecurityAccounts();
    const target = allAccounts.find((acc) => acc.id === accountId);
    if (!target) return { success: false, message: '존재하지 않는 계정입니다.' };

    resetBruteForceLock();
    globalCurrentUser = target;
    globalIsAuthenticated = true;
    globalIsLoginModalOpen = false;
    globalPending2FA = null;
    saveStoredAuthSession(target.id);
    notifyAuth();

    return {
      success: true,
      message: `${target.name} (${target.roleLabel}) 계정으로 안전하게 로그인되었습니다.`,
    };
  };

  // 2. 휴대폰 번호 및 비밀번호로 1차 로그인 시도 (2FA OTP 발송 단계)
  const loginWithCredentials = async (
    phone: string,
    password: string,
    options?: { useFirebase?: boolean }
  ) => {
    const bfStatus = getBruteForceStatus();
    if (bfStatus.isLocked) {
      return {
        success: false,
        isLocked: true,
        message: `무차별 대입 방어를 위해 계정이 잠겨있습니다. ${bfStatus.lockoutSecondsRemaining}초 후 다시 시도해주세요.`,
      };
    }

    const cleanPhone = stripPhoneNumber(phone);
    const allAccounts = getAllSecurityAccounts();
    let account = allAccounts.find(
      (acc) => stripPhoneNumber(acc.phone) === cleanPhone
    );

    // [통합 클라우드 DB 실시간 조회 & 동기화] 로컬 존재 여부와 무관하게 최신 클라우드 DB 계정/가계도/부모 정보 확인
    try {
      const cloudRes = await fetchAllFromCloudDatabase(cleanPhone);
      if (cloudRes.success && cloudRes.user) {
        account = cloudRes.user;
        saveCustomAccount(cloudRes.user);

        // 가계도 및 결연 정보 로컬 저장소 동기화
        if (cloudRes.familyTree && cloudRes.familyTree.length > 0) {
          try {
            localStorage.setItem('jokbo_custom_tree_v1_' + account.id, JSON.stringify(cloudRes.familyTree));
          } catch (e) {}
        }
        if (cloudRes.establishedLinks && cloudRes.establishedLinks.length > 0) {
          try {
            localStorage.setItem('jokbo_custom_links_v1_' + account.id, JSON.stringify(cloudRes.establishedLinks));
            localStorage.setItem('jokbo_custom_links_v1_global', JSON.stringify(cloudRes.establishedLinks));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Cloud DB hydration warning on login:', err);
    }

    if (!account) {
      return {
        success: false,
        isLocked: false,
        isNotRegistered: true,
        message: `가문에 등록되지 않은 휴대전화 번호입니다. [📝 신규 가입 (등재)] 메뉴에서 회원 등록을 먼저 진행해주세요.`,
      };
    }

    const isPassValid = await verifyPassword(password, account.password);
    if (!isPassValid) {
      const lockRes = recordFailedLogin();
      notifyAuth();

      if (lockRes.isLocked) {
        return {
          success: false,
          isLocked: true,
          message: `비밀번호 5회 오류로 인해 5분간 로그인이 잠겼습니다.`,
        };
      }
      return {
        success: false,
        isLocked: false,
        message: `비밀번호가 일치하지 않습니다. (남은 시도: ${lockRes.remainingAttempts}회)`,
      };
    }

    // 2단계 인증: 스마트폰 생체인증 (지문/Face ID) 및 6자리 PIN 하이브리드 세션 준비
    let bioSupported = false;
    let bioType: 'fingerprint' | 'face' | 'platform' = 'fingerprint';
    try {
      const bioCheck = await isPlatformBiometricsAvailable();
      bioSupported = bioCheck.supported;
      bioType = bioCheck.type || 'fingerprint';
    } catch (e) {}

    // 1차 인증 성공 ➔ 2단계 인증(2FA) 준비
    // [사용자 요청: Firebase SMS 일시 잠금]
    // 국내 통신사 스팸 필터 점검 기간 동안 SMS 발송을 일시 중단하고 100% 신뢰할 수 있는 6자리 PIN / 생체인증으로 즉시 연결
    globalPending2FA = {
      phone: account.phone,
      expectedOtp: '',
      user: account,
      isFirebase: false,
      biometricSupported: bioSupported,
      biometricType: bioType,
    };
    notifyAuth();

    return {
      success: true,
      require2FA: true,
      isFirebase: false,
      biometricSupported: bioSupported,
      biometricType: bioType,
      message: `2단계 보안 인증: 6자리 가문 보안 PIN 번호 또는 스마트폰 생체인증으로 승인해주세요.`,
    };
  };

  // 3-A. 스마트폰 자체 생체인증 (지문인식 / Face ID / WebAuthn) 확인
  const verifyBiometric2FA = async () => {
    if (!globalPending2FA) {
      return { success: false, message: '진행 중인 2단계 인증 세션이 없습니다.' };
    }

    const user = globalPending2FA.user;

    // 1) 기기에 이미 등록된 자격증명으로 인증 시도
    let bioAuth = await authenticatePlatformBiometric(user.id, user.biometricKey);

    // 2) 기기에 등록된 자격증명이 없거나 첫 시도인 경우, 즉시 원터치 등록 및 승인 연동
    if (!bioAuth.success && !user.biometricKey) {
      const regBio = await registerPlatformBiometric(user.id, user.name);
      if (regBio.success) {
        user.biometricKey = regBio.credentialId;
        bioAuth = { success: true, message: '🎉 스마트폰 생체인증 등록 및 본인확인이 완료되었습니다!' };
      } else {
        return { success: false, message: regBio.message };
      }
    } else if (!bioAuth.success) {
      return { success: false, message: bioAuth.message };
    }

    resetBruteForceLock();
    clearPhoneAuthSession();

    globalCurrentUser = {
      ...user,
      is2FAVerified: true,
      securityTier: '2단계(2FA 완료)',
      lastLoginAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
    };
    globalIsAuthenticated = true;
    globalIsLoginModalOpen = false;
    globalPending2FA = null;
    saveStoredAuthSession(globalCurrentUser.id);

    if (globalCurrentUser.isCustomRegistered) {
      saveCustomAccount(globalCurrentUser);
      syncUserToSupabase(globalCurrentUser).catch(() => {});
    }

    notifyAuth();
    return {
      success: true,
      message: `🎉 생체인증 완료! ${globalCurrentUser.name}님으로 안전하게 로그인되었습니다.`,
    };
  };

  // 3-B. 6자리 보안 PIN 번호 확인 (PC 및 생체센서 미지원 기기용)
  const verifyPin2FA = async (inputPin: string) => {
    if (!globalPending2FA) {
      return { success: false, message: '진행 중인 2단계 인증 세션이 없습니다.' };
    }

    const cleanPin = (inputPin || '').replace(/[^0-9]/g, '');
    if (cleanPin.length !== 6) {
      return { success: false, message: '6자리 숫자 보안 PIN 번호를 입력해주세요.' };
    }

    const user = globalPending2FA.user;
    let isMatch = false;

    if (user.pinCode) {
      isMatch = await verifyPin(cleanPin, user.pinCode);
    } else {
      // 등록된 PIN이 없는 기존 계정의 경우: 휴대폰 번호 끝 6자리 또는 123456 기본 허용
      const phoneTail = stripPhoneNumber(user.phone).slice(-6);
      if (cleanPin === phoneTail || cleanPin === '123456') {
        isMatch = true;
        // 향후 빠른 로그인을 위해 이번에 입력한 PIN으로 자동 해시 저장
        hashPin(cleanPin).then((h) => {
          user.pinCode = h;
          if (user.isCustomRegistered) {
            saveCustomAccount(user);
            syncUserToSupabase(user).catch(() => {});
          }
        });
      }
    }

    if (!isMatch) {
      const lockRes = recordFailedLogin();
      notifyAuth();
      if (lockRes.isLocked) {
        return {
          success: false,
          isLocked: true,
          message: '보안 PIN 5회 오류로 인해 5분간 로그인이 잠겼습니다.',
        };
      }
      return {
        success: false,
        isLocked: false,
        message: `보안 PIN 번호가 일치하지 않습니다. (남은 시도: ${lockRes.remainingAttempts}회)`,
      };
    }

    resetBruteForceLock();
    clearPhoneAuthSession();

    globalCurrentUser = {
      ...user,
      is2FAVerified: true,
      securityTier: '2단계(2FA 완료)',
      lastLoginAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
    };
    globalIsAuthenticated = true;
    globalIsLoginModalOpen = false;
    globalPending2FA = null;
    saveStoredAuthSession(globalCurrentUser.id);
    notifyAuth();

    return {
      success: true,
      message: `보안 PIN 인증 완료! ${globalCurrentUser.name}님으로 안전하게 로그인되었습니다.`,
    };
  };

  // 3-C. 기존 2FA OTP 및 Firebase 호환
  const verify2FA = async (inputOtp: string) => {
    if (!globalPending2FA) {
      return { success: false, message: '진행 중인 2단계 인증 세션이 없습니다.' };
    }

    if (globalPending2FA.isFirebase) {
      // 1) 입력한 번호가 6자리 보안 PIN 번호와 일치하는 경우 즉시 승인 (Firebase SMS 장애/미수신 시에도 100% 로그인 보장)
      const pinResult = await verifyPin2FA(inputOtp);
      if (pinResult.success) {
        return pinResult;
      }

      // 2) PIN 불일치 시 Firebase SMS 코드 검증 시도
      const fbVerify = await verifyFirebasePhoneOtp(inputOtp);
      if (!fbVerify.success) {
        return {
          success: false,
          message: '보안 PIN 번호 또는 Firebase SMS 인증번호가 일치하지 않습니다.',
        };
      }

      resetBruteForceLock();
      clearPhoneAuthSession();
      globalCurrentUser = {
        ...globalPending2FA.user,
        is2FAVerified: true,
        lastLoginAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
      };
      globalIsAuthenticated = true;
      globalIsLoginModalOpen = false;
      globalPending2FA = null;
      saveStoredAuthSession(globalCurrentUser.id);
      notifyAuth();

      return {
        success: true,
        message: `2단계 SMS 확인 완료! ${globalCurrentUser.name}님으로 안전하게 로그인되었습니다.`,
      };
    }

    // PIN 번호 검증으로 전달
    return verifyPin2FA(inputOtp);
  };

  // 4. 가문 고유 보안 초대 코드 등록 및 신규 참여
  const registerWithClanCode = (
    clanCode: string,
    newUserName: string,
    phone: string
  ) => {
    const verifyRes = verifyClanInviteCode(clanCode);
    if (!verifyRes.isValid || !verifyRes.token) {
      return { success: false, message: verifyRes.message };
    }

    const token = verifyRes.token;
    token.usedCount += 1;

    const newUser: UserProfile = {
      id: `user-clan-${Date.now()}`,
      memberId: 'pat-3-1', // Default link
      name: newUserName.trim() || '가문 신규 혈족',
      clan: `${token.clanName} ${token.branchName}`,
      role: 'direct_family',
      roleLabel: '가문 인증 정회원',
      phone: stripPhoneNumber(phone) || '01000000000',
      is2FAVerified: true,
      clanInviteCode: token.code,
      lastLoginAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
      securityTier: '2단계(2FA 완료)',
    };

    resetBruteForceLock();
    globalCurrentUser = newUser;
    globalIsAuthenticated = true;
    globalIsLoginModalOpen = false;
    globalPending2FA = null;
    saveStoredAuthSession(newUser.id);
    notifyAuth();

    return {
      success: true,
      message: `${token.clanName} 가문 코드가 승인되어 정회원으로 등록되었습니다.`,
    };
  };

  // 5. 가문 신규 등록 (직접 회원가입 및 족보 등재 신청)
  const registerNewMember = async (params: RegisterMemberParams) => {
    const cleanPhone = stripPhoneNumber(params.phone);
    if (cleanPhone.length < 10) {
      return { success: false, message: '올바른 휴대전화 번호(10~11자리)를 입력해주세요.' };
    }
    if (!params.name.trim()) {
      return { success: false, message: '성명(실명)을 입력해주세요.' };
    }
    if (!params.password || params.password.length < 4) {
      return { success: false, message: '비밀번호는 최소 4자리 이상으로 설정해주세요.' };
    }

    const allAccounts = getAllSecurityAccounts();
    const isDup = allAccounts.some(
      (acc) => stripPhoneNumber(acc.phone) === cleanPhone
    );
    if (isDup) {
      return {
        success: false,
        message: '이미 등록된 휴대전화 번호입니다. 기존 등록 번호로 로그인하시거나 번호를 다시 확인해주세요.',
      };
    }

    // 비밀번호 SHA-256 + Salt 보안 해시 암호화
    const hashedPassword = await hashPassword(params.password);

    // 6자리 보안 PIN 번호 해싱 (미입력 시 휴대폰 끝 6자리 기본값)
    const cleanPin = (params.pinCode || '').replace(/[^0-9]/g, '');
    const pinToHash = cleanPin.length === 6 ? cleanPin : cleanPhone.slice(-6);
    const hashedPin = await hashPin(pinToHash);

    // 데이터베이스에는 '-' 하이픈 없이 숫자만 저장
    const newAccount: UserProfile & { password: string } = {
      id: `user-custom-${Date.now()}`,
      memberId: `custom-mem-${Date.now()}`,
      name: params.name.trim(),
      hanja: params.hanja?.trim() || undefined,
      clan: params.clan.trim() || '경주 김씨 판도판서공파',
      role: params.role || 'direct_family',
      roleLabel: params.roleLabel || '가문 등록 정회원',
      phone: cleanPhone, // DB에는 하이픈 없이 숫자만 보관
      password: hashedPassword,
      pinCode: hashedPin,
      clanInviteCode: `PIN:${hashedPin}`,
      birthDate: params.birthDate?.trim() || undefined,
      fatherName: params.fatherName?.trim() || undefined,
      motherName: params.motherName?.trim() || undefined,
      is2FAVerified: false,
      lastLoginAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
      securityTier: '2단계(2FA 완료)',
      isCustomRegistered: true,
    };

    const saved = saveCustomAccount(newAccount);
    if (!saved) {
      return { success: false, message: '가문 데이터베이스(LocalStorage) 저장 중 오류가 발생했습니다.' };
    }

    // [통합 클라우드 DB 실시간 동기화] Firebase Firestore 및 Supabase에 실시간 등록
    saveAllToCloudDatabase(newAccount, [], []).catch((err) =>
      console.warn('Failed to sync new user to Cloud DB:', err)
    );

    notifyAuth();
    return {
      success: true,
      user: newAccount,
      message: `🎉 [가문 등재 완료] ${newAccount.name}님의 정보가 성공적으로 등록되었습니다! 등록하신 번호(${formatPhoneNumber(cleanPhone)})로 로그인해주세요.`,
    };
  };

  // 6. 보안 로그아웃
  const logout = () => {
    clearStoredAuthSession();
    globalIsAuthenticated = false;
    globalIsLoginModalOpen = true;
    globalPending2FA = null;
    notifyAuth();
  };

  // 7. 보안 로그인 모달 열기/닫기
  const openLoginModal = () => {
    globalIsLoginModalOpen = true;
    notifyAuth();
  };

  const closeLoginModal = () => {
    // Only allow closing if already authenticated
    if (globalIsAuthenticated) {
      globalIsLoginModalOpen = false;
      notifyAuth();
    }
  };

  // 8. 동기화 코드로 계정 및 가계도 복원
  const applySyncCode = (code: string) => {
    const res = importSyncPackage(code);
    if (res.success && res.account) {
      globalCurrentUser = res.account;
      globalIsAuthenticated = true;
      globalIsLoginModalOpen = false;
      notifyAuth();
    }
    return res;
  };

  return {
    currentUser,
    isAuthenticated,
    isLoginModalOpen,
    pending2FA,
    bruteForce,
    registeredAccounts: getAllSecurityAccounts(),
    customAccounts: getCustomRegisteredAccounts(),
    isFirebaseReady: isFirebaseConfigured(),
    registerNewMember,
    clearAllCustomAccounts: () => {
      clearCustomAccounts();
      notifyAuth();
    },
    loginWithDemoAccount,
    loginWithCredentials,
    verify2FA,
    verifyBiometric2FA,
    verifyPin2FA,
    cancelPending2FA: () => {
      clearPhoneAuthSession();
      globalPending2FA = null;
      notifyAuth();
    },
    registerWithClanCode,
    logout,
    openLoginModal,
    closeLoginModal,
    updateCurrentUserProfile: updateGlobalCurrentUserProfile,
    applySyncCode,
  };
}
