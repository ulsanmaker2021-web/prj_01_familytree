import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
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
} from '../utils/securityAuth';

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

// Global Auth State
let globalCurrentUser: UserProfile = DEMO_SECURITY_ACCOUNTS[0]; // 기본 프로필: 김준혁 (본인)
let globalIsAuthenticated: boolean = false; // 기본 미인증 상태 (최초 접속 시 로그인 강제)
let globalIsLoginModalOpen: boolean = true; // 최초 접속 시 보안 로그인 게이트웨이 즉시 표시
let globalPending2FA: {
  phone: string;
  expectedOtp: string;
  user: UserProfile;
} | null = null;

const authListeners = new Set<() => void>();

function notifyAuth() {
  authListeners.forEach((listener) => listener());
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
    notifyAuth();

    return {
      success: true,
      message: `${target.name} (${target.roleLabel}) 계정으로 안전하게 로그인되었습니다.`,
    };
  };

  // 2. 휴대폰 번호 및 비밀번호로 1차 로그인 시도 (2FA OTP 발송 단계)
  const loginWithCredentials = (phone: string, password: string) => {
    const bfStatus = getBruteForceStatus();
    if (bfStatus.isLocked) {
      return {
        success: false,
        isLocked: true,
        message: `무차별 대입 방어를 위해 계정이 잠겨있습니다. ${bfStatus.lockoutSecondsRemaining}초 후 다시 시도해주세요.`,
      };
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const allAccounts = getAllSecurityAccounts();
    const account = allAccounts.find(
      (acc) => acc.phone.replace(/[^0-9]/g, '') === cleanPhone
    );

    if (!account || account.password !== password) {
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

    // 1차 인증 성공 ➔ 2단계 인증(2FA) 모의 SMS OTP 생성 (6자리)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    globalPending2FA = {
      phone: account.phone,
      expectedOtp: generatedOtp,
      user: account,
    };
    notifyAuth();

    return {
      success: true,
      require2FA: true,
      otpCode: generatedOtp, // 시뮬레이션용 화면 노출용
      message: `2단계 인증: [${account.phone}] 번호로 6자리 보안 OTP가 발송되었습니다.`,
    };
  };

  // 3. 2FA OTP 보안 코드 확인 및 최종 세션 승인
  const verify2FA = (inputOtp: string) => {
    if (!globalPending2FA) {
      return { success: false, message: '진행 중인 2단계 인증 세션이 없습니다.' };
    }

    if (inputOtp.trim() !== globalPending2FA.expectedOtp) {
      return { success: false, message: '보안 OTP 번호가 일치하지 않습니다. 다시 확인해주세요.' };
    }

    resetBruteForceLock();
    globalCurrentUser = {
      ...globalPending2FA.user,
      is2FAVerified: true,
      lastLoginAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
    };
    globalIsAuthenticated = true;
    globalIsLoginModalOpen = false;
    globalPending2FA = null;
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
      phone: phone.trim() || '010-0000-0000',
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
    notifyAuth();

    return {
      success: true,
      message: `${token.clanName} 가문 코드가 승인되어 정회원으로 등록되었습니다.`,
    };
  };

  // 5. 가문 신규 등록 (직접 회원가입 및 족보 등재 신청)
  const registerNewMember = (params: RegisterMemberParams) => {
    const cleanPhone = params.phone.trim().replace(/[^0-9]/g, '');
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
      (acc) => acc.phone.replace(/[^0-9]/g, '') === cleanPhone
    );
    if (isDup) {
      return {
        success: false,
        message: '이미 등록된 휴대전화 번호입니다. 기존 등록 번호로 로그인하시거나 번호를 다시 확인해주세요.',
      };
    }

    const formattedPhone = cleanPhone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    const newAccount: UserProfile & { password: string } = {
      id: `user-custom-${Date.now()}`,
      memberId: `custom-mem-${Date.now()}`,
      name: params.name.trim(),
      hanja: params.hanja?.trim() || undefined,
      clan: params.clan.trim() || '경주 김씨 판도판서공파',
      role: params.role || 'direct_family',
      roleLabel: params.roleLabel || '가문 등록 정회원',
      phone: formattedPhone,
      password: params.password,
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

    notifyAuth();
    return {
      success: true,
      user: newAccount,
      message: `🎉 [가문 등재 완료] ${newAccount.name}님의 정보가 성공적으로 등록되었습니다! 등록하신 번호로 로그인해주세요.`,
    };
  };

  // 6. 보안 로그아웃
  const logout = () => {
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

  return {
    currentUser,
    isAuthenticated,
    isLoginModalOpen,
    pending2FA,
    bruteForce,
    registeredAccounts: getAllSecurityAccounts(),
    customAccounts: getCustomRegisteredAccounts(),
    registerNewMember,
    clearAllCustomAccounts: () => {
      clearCustomAccounts();
      notifyAuth();
    },
    loginWithDemoAccount,
    loginWithCredentials,
    verify2FA,
    registerWithClanCode,
    logout,
    openLoginModal,
    closeLoginModal,
  };
}
