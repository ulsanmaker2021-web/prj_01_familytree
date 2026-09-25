export type UserRole = 'admin' | 'direct_family' | 'collateral' | 'guest';

export interface UserProfile {
  id: string;
  memberId: string; // Linked FamilyMember.id in the tree
  name: string;
  hanja?: string;
  clan: string;
  role: UserRole;
  roleLabel: string;
  phone: string;
  birthDate?: string;
  fatherName?: string;
  motherName?: string;
  is2FAVerified: boolean;
  avatarUrl?: string;
  clanInviteCode: string;
  lastLoginAt: string;
  securityTier: '1단계(기본)' | '2단계(2FA 완료)' | '3단계(문중 공인 최고 보안)';
  isCustomRegistered?: boolean;
  pinCode?: string; // 6자리 2차 보안 PIN 해시
  biometricKey?: string; // 스마트폰 생체인증 자격증명 ID
}

export interface ClanInviteToken {
  code: string;
  clanName: string;
  branchName: string;
  issuedByElderName: string;
  issuedByElderTitle: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface BruteForceState {
  failedAttempts: number;
  isLocked: boolean;
  lockUntil: number | null; // timestamp in ms
}

export interface SecuritySession {
  token: string;
  user: UserProfile;
  loginAt: string;
  expiresAt: string;
}
