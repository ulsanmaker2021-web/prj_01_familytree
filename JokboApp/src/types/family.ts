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
}

export interface LineageInfo {
  key: LineageType;
  label: string;
  shortLabel: string;
  clan: string;
  badgeColor: string;
  description: string;
}