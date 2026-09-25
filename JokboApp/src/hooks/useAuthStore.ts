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
import { hashPassword, verifyPassword } from '../utils/cryptoHelper';
import { isSupabaseConnected } from '../config/supabaseClient';

export interface RegisterMemberParams {
  name: string;
  hanja?: string;
  clan: string;
  role: UserRole;
  roleLabel: string;
  phone: string;
  password: string;
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

    // 1차 인증 성공 ➔ 2단계 인증(2FA) 발송 (Firebase 활성화 시 실제 SMS 발송, 미설정 시 모의 발송)
    const useFirebase = options?.useFirebase ?? isFirebaseConfigured();

    if (useFirebase) {
      const fbRes = await sendFirebasePhoneOtp(account.phone);
      if (fbRes.success) {
        globalPending2FA = {
          phone: account.phone,
          expectedOtp: '', // Firebase가 내부적으로 관리
          user: account,
          isFirebase: true,
        };
        notifyAuth();
        return {
          success: true,
          require2FA: true,
          isFirebase: true,
          message: fbRes.message,
        };
      } else {
        return {
          success: false,
          require2FA: false,
          isFirebase: true,
          message: `${fbRes.message} (※ 아래 설정에서 [모의 시뮬레이션 모드]로 전환할 수 있습니다)`,
        };
      }
    }

    // 모의 시뮬레이션 모드 OTP 생성 (6자리)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    globalPending2FA = {
      phone: account.phone,
      expectedOtp: generatedOtp,
      user: account,
      isFirebase: false,
    };
    notifyAuth();

    return {
      success: true,
      require2FA: true,
      isFirebase: false,
      otpCode: generatedOtp, // 시뮬레이션용 화면 노출용
      message: `2단계 인증: [${formatPhoneNumber(account.phone)}] 번호로 6자리 보안 OTP가 발송되었습니다.`,
    };
  };

  // 3. 2FA OTP 보안 코드 확인 및 최종 세션 승인
  const verify2FA = async (inputOtp: string) => {
    if (!globalPending2FA) {
      return { success: false, message: '진행 중인 2단계 인증 세션이 없습니다.' };
    }

    if (globalPending2FA.isFirebase) {
      const fbVerify = await verifyFirebasePhoneOtp(inputOtp);
      if (!fbVerify.success) {
        return { success: false, message: fbVerify.message };
      }
    } else {
      if (inputOtp.trim() !== globalPending2FA.expectedOtp) {
        return { success: false, message: '보안 OTP 번호가 일치하지 않습니다. 다시 확인해주세요.' };
      }
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
      message: `2단계 본인 확인 완료! ${globalCurrentUser.name}님으로 안전하게 로그인되었습니다.`,
    };
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
      birthDate: params.birthDate?.trim() || undefined,
      fatherName: params.fatherName?.trim() || undefined,
      motherName: params.motherName?.trim() || undefined,
      is2FAVerified: false,
      clanInviteCode: 'REG-LOCAL-DB',
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
