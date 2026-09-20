import { UserProfile, UserRole, ClanInviteToken, BruteForceState } from '../types/auth';

// 1. 공인 가문 보안 계정 레지스트리 (체험 및 시뮬레이션용)
export const DEMO_SECURITY_ACCOUNTS: (UserProfile & { password: string })[] = [
  {
    id: 'user-kim-junhyeok',
    memberId: 'pat-3-1',
    name: '김준혁',
    hanja: '金準赫',
    clan: '경주 김씨 판도판서공파 (29세손)',
    role: 'direct_family',
    roleLabel: '직계 가족 (본인)',
    phone: '010-1234-5678',
    password: 'password123!',
    is2FAVerified: true,
    clanInviteCode: 'KJ-KIM-2026-9872X',
    lastLoginAt: '2026-09-20 11:20',
    securityTier: '2단계(2FA 완료)',
  },
  {
    id: 'user-kim-youngho',
    memberId: 'pat-2-1',
    name: '김영호',
    hanja: '金英浩',
    clan: '경주 김씨 판도판서공파 (28세손)',
    role: 'admin',
    roleLabel: '가문 종손 (관리자)',
    phone: '010-9182-4411',
    password: 'password123!',
    is2FAVerified: true,
    clanInviteCode: 'KJ-KIM-2026-9872X',
    lastLoginAt: '2026-09-19 18:40',
    securityTier: '3단계(문중 공인 최고 보안)',
  },
  {
    id: 'user-kim-jincheol',
    memberId: 'pat-2-4',
    name: '김진철',
    hanja: '金鎭澈',
    clan: '경주 김씨 판도판서공파 (28세손)',
    role: 'collateral',
    roleLabel: '방계 친족 (5촌 당숙)',
    phone: '010-8833-1199',
    password: 'password123!',
    is2FAVerified: true,
    clanInviteCode: 'KJ-KIM-2026-9872X',
    lastLoginAt: '2026-09-18 14:15',
    securityTier: '2단계(2FA 완료)',
  },
  {
    id: 'user-jeong-seoyeon',
    memberId: 'inlaw-pat-3-1',
    name: '정서연',
    hanja: '鄭瑞淵',
    clan: '동래 정씨 직제학공파',
    role: 'direct_family',
    roleLabel: '직계 배우자 (아내)',
    phone: '010-9876-5432',
    password: 'password123!',
    is2FAVerified: true,
    clanInviteCode: 'DR-JUNG-2026-8831A',
    lastLoginAt: '2026-09-20 09:30',
    securityTier: '2단계(2FA 완료)',
  },
];

// 1-1. 사용자 직접 등록 영구 저장소 (LocalStorage 기반 가문 DB)
export const STORAGE_KEY_CUSTOM_ACCOUNTS = 'jokbo_registered_accounts_v1';

export function getCustomRegisteredAccounts(): (UserProfile & { password: string })[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CUSTOM_ACCOUNTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read custom accounts from localStorage:', e);
    return [];
  }
}

export function getAllSecurityAccounts(): (UserProfile & { password: string })[] {
  const custom = getCustomRegisteredAccounts();
  return [...DEMO_SECURITY_ACCOUNTS, ...custom];
}

export function saveCustomAccount(account: UserProfile & { password: string }): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const current = getCustomRegisteredAccounts();
    const cleanPhone = account.phone.replace(/[^0-9]/g, '');
    const filtered = current.filter((a) => a.phone.replace(/[^0-9]/g, '') !== cleanPhone);
    filtered.push(account);
    window.localStorage.setItem(STORAGE_KEY_CUSTOM_ACCOUNTS, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Failed to save custom account:', e);
    return false;
  }
}

export function clearCustomAccounts(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_CUSTOM_ACCOUNTS);
  }
}

// 2. 가문 폐쇄형 공인 보안 초대 토큰 목록
export const VALID_CLAN_INVITE_TOKENS: Record<string, ClanInviteToken> = {
  'KJ-KIM-2026-9872X': {
    code: 'KJ-KIM-2026-9872X',
    clanName: '경주 김씨 (慶州 金氏)',
    branchName: '판도판서공파',
    issuedByElderName: '김영호',
    issuedByElderTitle: '종친회 종손(宗孫)',
    validUntil: '2026-12-31',
    maxUses: 50,
    usedCount: 14,
    status: 'active',
  },
  'JJ-LEE-2026-4125E': {
    code: 'JJ-LEE-2026-4125E',
    clanName: '전주 이씨 (全州 李氏)',
    branchName: '효령대군파',
    issuedByElderName: '이성한',
    issuedByElderTitle: '외가 종손(外家 宗孫)',
    validUntil: '2026-12-31',
    maxUses: 30,
    usedCount: 8,
    status: 'active',
  },
  'DR-JUNG-2026-8831A': {
    code: 'DR-JUNG-2026-8831A',
    clanName: '동래 정씨 (東萊 鄭氏)',
    branchName: '직제학공파',
    issuedByElderName: '정우진',
    issuedByElderTitle: '장인어른 (처가 대표)',
    validUntil: '2026-12-31',
    maxUses: 20,
    usedCount: 5,
    status: 'active',
  },
};

// 3. 가문 초대 코드 검증 함수
export function verifyClanInviteCode(code: string): {
  isValid: boolean;
  token?: ClanInviteToken;
  message: string;
} {
  const normalized = code.trim().toUpperCase();
  const token = VALID_CLAN_INVITE_TOKENS[normalized];

  if (!token) {
    return {
      isValid: false,
      message: '유효하지 않거나 존재하지 않는 가문 보안 초대 코드입니다. 가문 어르신께 문의하십시오.',
    };
  }

  if (token.status !== 'active') {
    return {
      isValid: false,
      message: '만료되었거나 사용이 중지된 초대 코드입니다.',
    };
  }

  if (token.usedCount >= token.maxUses) {
    return {
      isValid: false,
      message: '초대 코드의 최대 허용 인원 수가 초과되었습니다.',
    };
  }

  return {
    isValid: true,
    token,
    message: `${token.clanName} ${token.branchName} 가문 코드가 성공적으로 확인되었습니다.`,
  };
}

// 4. 개인정보 등급별 마스킹 알고리즘 (Privacy Masking Engine)
// 대한민국 개인정보보호법 제18조 및 가문 혈족 보호 규정에 의거
export function maskSensitiveInfo(
  value: string | undefined,
  type: 'phone' | 'birthDate' | 'memo',
  viewerRole: UserRole,
  isDirectRelation: boolean = false
): string {
  if (!value) return '';

  // 관리자(admin) 및 직계 가족(direct_family)이거나 동일 직계 결연자일 경우 마스킹 해제
  if (viewerRole === 'admin' || (viewerRole === 'direct_family' && isDirectRelation)) {
    return value;
  }

  // 방계 친족(collateral) 또는 미승인 사용자(guest)인 경우 엄격 마스킹 적용
  if (type === 'phone') {
    // 010-1234-5678 -> 010-****-5678
    const cleaned = value.replace(/\s+/g, '');
    if (cleaned.length >= 11) {
      return cleaned.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
    }
    return '010-****-****';
  }

  if (type === 'birthDate') {
    // 1990-04-25 -> 1990년 **월 **일 (생년 및 연령대만 노출하여 사생활 보호)
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[0]}년 **월 **일 (생년만 공개)`;
    }
    return '****년 **월 **일';
  }

  if (type === 'memo') {
    // 상세 주소, 개인 신상 메모는 방계 친족에게 노출 차단
    return '🔒 개인정보 보호 정책에 따라 직계 가족에게만 공개되는 비공개 메모입니다.';
  }

  return value;
}

// 5. 무차별 대입 공격 (Brute-Force) 방어 모듈
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5분

let bruteForceState: BruteForceState = {
  failedAttempts: 0,
  isLocked: false,
  lockUntil: null,
};

export function recordFailedLogin(): {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  const now = Date.now();

  // If already locked, check if lockout expired
  if (bruteForceState.isLocked && bruteForceState.lockUntil) {
    if (now < bruteForceState.lockUntil) {
      const remainingSeconds = Math.ceil((bruteForceState.lockUntil - now) / 1000);
      return { isLocked: true, remainingAttempts: 0, lockoutSeconds: remainingSeconds };
    } else {
      // Lock expired, reset
      bruteForceState = {
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
      };
    }
  }

  bruteForceState.failedAttempts += 1;

  if (bruteForceState.failedAttempts >= MAX_ATTEMPTS) {
    bruteForceState.isLocked = true;
    bruteForceState.lockUntil = now + LOCKOUT_DURATION_MS;
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_ATTEMPTS - bruteForceState.failedAttempts,
    lockoutSeconds: 0,
  };
}

export function resetBruteForceLock(): void {
  bruteForceState = {
    failedAttempts: 0,
    isLocked: false,
    lockUntil: null,
  };
}

export function getBruteForceStatus(): BruteForceState & { lockoutSecondsRemaining: number } {
  const now = Date.now();
  if (bruteForceState.isLocked && bruteForceState.lockUntil) {
    if (now < bruteForceState.lockUntil) {
      return {
        ...bruteForceState,
        lockoutSecondsRemaining: Math.ceil((bruteForceState.lockUntil - now) / 1000),
      };
    } else {
      resetBruteForceLock();
    }
  }
  return {
    ...bruteForceState,
    lockoutSecondsRemaining: 0,
  };
}
