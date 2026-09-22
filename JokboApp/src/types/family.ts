export type LineageType = 'paternal' | 'maternal' | 'inlaw_paternal' | 'inlaw_maternal';

export interface FamilyMember {
  id: string;
  name: string;
  hanja?: string;
  gender: 'M' | 'F';
  generation: number; // 1: 조부모, 2: 부모/사돈, 3: 본인/배우자, 4: 자녀
  lineage: LineageType;
  relationship: string; // 호칭 (예: 조부, 외조모, 장인, 백부, 본인 등)
  clan?: string; // 본관 (예: 경주 김씨, 전주 이씨, 동래 정씨 등)
  birthDate?: string;
  deathDate?: string;
  isAlive: boolean;
  parentIds?: string[];
  spouseId?: string;
  phone?: string;
  lastContactDate?: string; // YYYY-MM-DD
  contactCycleDays?: number; // 권장 안부 주기 (일)
  memo?: string;
  burialSite?: string; // 묘소 / 봉안당 위치 (선산 장지)
  lunarBirth?: boolean; // 음력 생일 여부
  photoUrl?: string; // 인물 사진 URL (거실 액자형 가계도 약전용)
  achievements?: string[]; // 가문 내 주요 약력, 직함, 업적 (예: 창업주, 신지식인, 종손 등)
  clanGeneration?: number; // 시조 기준 세(世) (예: 29세 또는 30세)
  descendantOrder?: number; // 시조 기준 세손/대손(孫) (예: 28세손 또는 29세손)
  hangnyeolChar?: string; // 공인 항렬자(돌림자) (예: '赫')
  isVerifiedLineage?: boolean; // 족보 항렬 및 세손 검증 공인 여부
}

export interface LineageInfo {
  key: LineageType;
  label: string;
  shortLabel: string;
  clan: string;
  badgeColor: string;
  description: string;
}

export type RelationType = 'parent_child' | 'child_parent' | 'spouse' | 'sibling';

export type ApprovalStatus = 'pending_peer' | 'pending_elder' | 'approved' | 'rejected';

export type OperationMode = 'centralized' | 'decentralized';

export interface EstablishedLink {
  id: string;
  personAId: string;
  personBId: string;
  relationType: RelationType;
  establishedDate: string;
  note?: string;
  isNewlyFormed?: boolean;
  formationMode?: 'centralized' | 'decentralized_p2p';
  status?: ApprovalStatus;
  requesterId?: string;
  receiverId?: string;
  approverElderId?: string;
  approverElderName?: string;
  approverElderRelation?: string;
  elderApprovedAt?: string;
  elderComment?: string;
  rejectReason?: string;
  p2pInvitationCode?: string;
  certificateNo?: string;
  certificateIssued?: boolean;
  titleAtoB?: string;
  titleBtoA?: string;
  chonText?: string;
}

// 📱 스마트 형제·남매·자매(동기간) 전화번호 결연 신청 및 부모 대조 패키지
export type SiblingSubtype = 'brother' | 'sister' | 'sibling_mixed' | 'general';

export interface SmartKinshipRequest {
  id: string;
  senderUserId: string;
  senderMemberId: string;
  senderName: string;
  senderPhone: string;
  senderBirthDate?: string;
  senderGender?: 'M' | 'F';
  senderFatherName?: string;
  senderMotherName?: string;
  senderClan?: string;
  receiverPhone: string; // 수신 대상 동기간 전화번호 (숫자만)
  receiverUserId?: string;
  relationType: RelationType; // 'sibling'
  siblingSubtype?: SiblingSubtype; // 'brother' (형제), 'sister' (자매), 'sibling_mixed' (남매), 'general' (동기간)
  siblingSubtypeLabel?: string; // 예: '형제', '남매', '자매', '동기간'
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  fatherMatched?: boolean;
  motherMatched?: boolean;
  matchScore?: number; // 0 ~ 100
  certificateNo?: string;
  note?: string;
}