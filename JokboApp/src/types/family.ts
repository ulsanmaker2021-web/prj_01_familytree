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
  photoUrl?: string; // 인물 사진 URL (거실 액자형 가계도 약전용)
  achievements?: string[]; // 가문 내 주요 약력, 직함, 업적 (예: 창업주, 신지식인, 종손 등)
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