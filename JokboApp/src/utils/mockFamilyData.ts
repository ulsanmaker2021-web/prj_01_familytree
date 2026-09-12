import { FamilyMember, LineageInfo, LineageType } from '../types/family';

export type DeviceId = 'device_A' | 'device_B' | 'device_C' | 'device_D';

export interface DeviceProfile {
  id: DeviceId;
  ownerId: string;
  ownerName: string;
  ownerRelation: string;
  title: string;
  desc: string;
  avatarText: string;
  color: string;
  initialMemberIds: string[];
}

export const LINEAGES: Record<LineageType, LineageInfo> = {
  paternal: {
    key: 'paternal',
    label: '부친쪽 (친가)',
    shortLabel: '친가',
    clan: '경주 김씨 (慶州 金氏)',
    badgeColor: '#dc2626', // 친가: 선명한 붉은색
    description: '본인 직계 친족 가계',
  },
  maternal: {
    key: 'maternal',
    label: '모친쪽 (외가)',
    shortLabel: '외가',
    clan: '전주 이씨 (全州 李氏)',
    badgeColor: '#2563eb', // 외가: 선명한 푸른색
    description: '어머니 본가 가계',
  },
  inlaw_paternal: {
    key: 'inlaw_paternal',
    label: '사돈댁 부친쪽 (처가 친가)',
    shortLabel: '사돈(친가)',
    clan: '동래 정씨 (東萊 鄭氏)',
    badgeColor: '#d97706', // 사돈 친가: 앰버 골드
    description: '배우자 아버지 본가 가계',
  },
  inlaw_maternal: {
    key: 'inlaw_maternal',
    label: '사돈댁 모친쪽 (처가 외가)',
    shortLabel: '사돈(외가)',
    clan: '남원 양씨 (南原 梁氏)',
    badgeColor: '#7c3aed', // 사돈 외가: 바이올렛
    description: '배우자 어머니 본가 가계',
  },
};

// 4 Virtual Devices (Different relatives starting with disconnected trees)
export const DEVICE_PROFILES: Record<DeviceId, DeviceProfile> = {
  device_A: {
    id: 'device_A',
    ownerId: 'pat-3-1',
    ownerName: '김준혁',
    ownerRelation: '본인 (30대)',
    title: '스마트폰 A (김준혁 본인)',
    desc: '본인 직계 중심 (부모, 형제, 자녀) 족보 보유',
    avatarText: '준혁',
    color: '#dc2626', // 친가: 선명한 붉은색
    initialMemberIds: ['pat-3-1', 'pat-2-2', 'mat-2-1', 'pat-3-2', 'pat-3-3', 'pat-4-1', 'pat-4-2', 'inlaw-pat-3-1'],
  },
  device_B: {
    id: 'device_B',
    ownerId: 'inlaw-pat-3-1',
    ownerName: '정서연',
    ownerRelation: '배우자/아내 (30대)',
    title: '스마트폰 B (정서연 처가)',
    desc: '처가쪽 친정 가족 (장인, 장모, 처남) 족보 보유',
    avatarText: '서연',
    color: '#d97706',
    initialMemberIds: ['inlaw-pat-3-1', 'pat-3-1', 'inlaw-pat-2-1', 'inlaw-mat-2-1', 'inlaw-pat-3-2', 'pat-4-1', 'pat-4-2'],
  },
  device_C: {
    id: 'device_C',
    ownerId: 'pat-2-1',
    ownerName: '김영호',
    ownerRelation: '백부/종손 (60대)',
    title: '스마트폰 C (백부 김영호 종친)',
    desc: '친가 윗대 조부모, 당숙, 4촌·5촌 방계 종친 대거 보유',
    avatarText: '영호',
    color: '#1a1a18',
    initialMemberIds: ['pat-2-1', 'pat-1-1', 'pat-1-2', 'pat-2-2', 'pat-2-3', 'pat-3-1', 'pat-3-4', 'pat-2-4'],
  },
  device_D: {
    id: 'device_D',
    ownerId: 'mat-2-2',
    ownerName: '이은철',
    ownerRelation: '외숙/외삼촌 (50대)',
    title: '스마트폰 D (외숙 이은철 외가)',
    desc: '외조부모, 외숙/숙모, 이모/이모부, 외사촌, 외종조카 등 외가 4촌·5촌 보유',
    avatarText: '은철',
    color: '#2563eb', // 외가: 선명한 푸른색
    initialMemberIds: [
      'mat-2-2',
      'mat-1-1',
      'mat-1-2',
      'mat-2-1',
      'mat-2-3',
      'mat-2-5',
      'mat-2-6',
      'mat-2-7',
      'mat-3-1',
      'mat-3-2',
      'mat-3-3',
      'mat-3-4',
      'mat-4-1',
      'mat-4-2',
      'mat-2-4',
    ],
  },
};

export const INITIAL_FAMILY_DATA: FamilyMember[] = [
  // ==========================================
  // 1. 부친쪽 (친가 - 경주 김씨)
  // ==========================================
  // 1대: 조부모
  {
    id: 'pat-1-1',
    name: '김진호',
    hanja: '金鎭浩',
    gender: 'M',
    generation: 1,
    lineage: 'paternal',
    relationship: '조부 (친할아버지)',
    clan: '경주 김씨 판도판서공파 27세손',
    birthDate: '1935-03-15',
    deathDate: '2018-11-20',
    isAlive: false,
    spouseId: 'pat-1-2',
    memo: '교직 35년 퇴임. 안동 선영 안장.',
  },
  {
    id: 'pat-1-2',
    name: '박순자',
    hanja: '朴順子',
    gender: 'F',
    generation: 1,
    lineage: 'paternal',
    relationship: '조모 (친할머니)',
    clan: '밀양 박씨',
    birthDate: '1938-08-22',
    isAlive: true,
    spouseId: 'pat-1-1',
    phone: '010-3412-8811',
    lastContactDate: '2026-08-01',
    contactCycleDays: 14,
    memo: '현재 안동 본가 거주. 건강 양호.',
  },
  // 2대: 부친, 백부, 고모, 5촌 당숙
  {
    id: 'pat-2-1',
    name: '김영호',
    hanja: '金英浩',
    gender: 'M',
    generation: 2,
    lineage: 'paternal',
    relationship: '큰아버지 (백부/종손)',
    clan: '경주 김씨 28세손',
    birthDate: '1959-05-10',
    isAlive: true,
    parentIds: ['pat-1-1', 'pat-1-2'],
    phone: '010-9182-4411',
    lastContactDate: '2026-07-15',
    contactCycleDays: 30,
    memo: '스마트폰 C 보유자. 대구 거주. 종친회 총무 역임.',
  },
  {
    id: 'pat-2-2',
    name: '김영수',
    hanja: '金英洙',
    gender: 'M',
    generation: 2,
    lineage: 'paternal',
    relationship: '아버지 (부친)',
    clan: '경주 김씨 28세손',
    birthDate: '1962-02-18',
    isAlive: true,
    parentIds: ['pat-1-1', 'pat-1-2'],
    spouseId: 'mat-2-1',
    phone: '010-5231-7788',
    lastContactDate: '2026-09-08',
    contactCycleDays: 7,
    memo: '서울 거주. 매주 주말 안부 전화.',
  },
  {
    id: 'pat-2-3',
    name: '김영숙',
    hanja: '金英淑',
    gender: 'F',
    generation: 2,
    lineage: 'paternal',
    relationship: '고모',
    clan: '경주 김씨 28세손',
    birthDate: '1965-10-03',
    isAlive: true,
    parentIds: ['pat-1-1', 'pat-1-2'],
    phone: '010-2399-6120',
    lastContactDate: '2026-06-20',
    contactCycleDays: 45,
    memo: '부산 거주. 화훼업 종사.',
  },
  {
    id: 'pat-2-4',
    name: '김진철',
    hanja: '金鎭澈',
    gender: 'M',
    generation: 2,
    lineage: 'paternal',
    relationship: '당숙 (5촌 어르신)',
    clan: '경주 김씨 28세손',
    birthDate: '1948-06-12',
    isAlive: true,
    phone: '010-8833-1199',
    lastContactDate: '2026-05-18',
    contactCycleDays: 60,
    memo: '친가 5촌 당숙어르신. 안동 종손가 지원.',
  },
  // 3대: 본인, 남동생, 여동생, 4촌 사촌형
  {
    id: 'pat-3-1',
    name: '김준혁',
    hanja: '金準赫',
    gender: 'M',
    generation: 3,
    lineage: 'paternal',
    relationship: '본인 (나)',
    clan: '경주 김씨 29세손',
    birthDate: '1990-04-25',
    isAlive: true,
    parentIds: ['pat-2-2', 'mat-2-1'],
    spouseId: 'inlaw-pat-3-1',
    phone: '010-1234-5678',
    lastContactDate: '2026-09-12',
    contactCycleDays: 1,
    memo: '스마트폰 A 보유자. 족보 앱 관리자.',
  },
  {
    id: 'pat-3-2',
    name: '김민혁',
    hanja: '金珉赫',
    gender: 'M',
    generation: 3,
    lineage: 'paternal',
    relationship: '남동생',
    clan: '경주 김씨 29세손',
    birthDate: '1993-11-14',
    isAlive: true,
    parentIds: ['pat-2-2', 'mat-2-1'],
    phone: '010-8877-3322',
    lastContactDate: '2026-09-05',
    contactCycleDays: 14,
    memo: '판교 IT 기업 근무.',
  },
  {
    id: 'pat-3-3',
    name: '김지우',
    hanja: '金智友',
    gender: 'F',
    generation: 3,
    lineage: 'paternal',
    relationship: '여동생',
    clan: '경주 김씨 29세손',
    birthDate: '1996-07-08',
    isAlive: true,
    parentIds: ['pat-2-2', 'mat-2-1'],
    phone: '010-4455-6677',
    lastContactDate: '2026-09-02',
    contactCycleDays: 14,
    memo: '디자이너 프리랜서 활동.',
  },
  {
    id: 'pat-3-4',
    name: '김태혁',
    hanja: '金泰赫',
    gender: 'M',
    generation: 3,
    lineage: 'paternal',
    relationship: '사촌형 (4촌 종형)',
    clan: '경주 김씨 29세손',
    birthDate: '1988-02-14',
    isAlive: true,
    parentIds: ['pat-2-1'],
    phone: '010-6622-4499',
    lastContactDate: '2026-06-10',
    contactCycleDays: 45,
    memo: '큰아버지 장남. 대구 거주.',
  },
  // 4대: 자녀
  {
    id: 'pat-4-1',
    name: '김도윤',
    hanja: '金道潤',
    gender: 'M',
    generation: 4,
    lineage: 'paternal',
    relationship: '장남 (아들)',
    clan: '경주 김씨 30세손',
    birthDate: '2020-05-12',
    isAlive: true,
    parentIds: ['pat-3-1', 'inlaw-pat-3-1'],
    memo: '유치원 재학 중.',
  },
  {
    id: 'pat-4-2',
    name: '김하은',
    hanja: '金夏恩',
    gender: 'F',
    generation: 4,
    lineage: 'paternal',
    relationship: '장녀 (딸)',
    clan: '경주 김씨 30세손',
    birthDate: '2023-09-20',
    isAlive: true,
    parentIds: ['pat-3-1', 'inlaw-pat-3-1'],
    memo: '어린이집 재학 중.',
  },

  // ==========================================
  // 2. 모친쪽 (외가 - 전주 이씨 계통)
  // ==========================================
  // 1대: 외조부모
  {
    id: 'mat-1-1',
    name: '이성한',
    hanja: '李成漢',
    gender: 'M',
    generation: 1,
    lineage: 'maternal',
    relationship: '외할아버지 (외조부)',
    clan: '전주 이씨 효령대군파',
    birthDate: '1937-01-19',
    isAlive: true,
    spouseId: 'mat-1-2',
    phone: '010-6712-3344',
    lastContactDate: '2026-07-28',
    contactCycleDays: 21,
    memo: '전주 본가 거주. 명절 및 생신 때 온 가족 방문.',
  },
  {
    id: 'mat-1-2',
    name: '권정자',
    hanja: '權貞子',
    gender: 'F',
    generation: 1,
    lineage: 'maternal',
    relationship: '외할머니 (외조모)',
    clan: '안동 권씨',
    birthDate: '1941-04-09',
    isAlive: true,
    spouseId: 'mat-1-1',
    phone: '010-6712-3345',
    lastContactDate: '2026-07-28',
    contactCycleDays: 21,
    memo: '전주 본가 거주. 손주들 안부 각별히 챙기심.',
  },

  // 2대: 모친, 외숙(외삼촌), 외숙모, 이모, 이모부
  {
    id: 'mat-2-1',
    name: '이은경',
    hanja: '李恩敬',
    gender: 'F',
    generation: 2,
    lineage: 'maternal',
    relationship: '어머니 (모친)',
    clan: '전주 이씨',
    birthDate: '1964-06-30',
    isAlive: true,
    parentIds: ['mat-1-1', 'mat-1-2'],
    spouseId: 'pat-2-2',
    phone: '010-5231-7789',
    lastContactDate: '2026-09-09',
    contactCycleDays: 7,
    memo: '서울 거주. 외가 모임 주도.',
  },
  {
    id: 'mat-2-2',
    name: '이은철',
    hanja: '李恩哲',
    gender: 'M',
    generation: 2,
    lineage: 'maternal',
    relationship: '외삼촌 (외숙)',
    clan: '전주 이씨',
    birthDate: '1967-09-15',
    isAlive: true,
    parentIds: ['mat-1-1', 'mat-1-2'],
    spouseId: 'mat-2-5',
    phone: '010-7822-1980',
    lastContactDate: '2026-07-10',
    contactCycleDays: 45,
    memo: '스마트폰 D 보유자. 대전 연구단지 재직. 자주 안부 교류.',
  },
  {
    id: 'mat-2-5',
    name: '박선영',
    hanja: '朴善英',
    gender: 'F',
    generation: 2,
    lineage: 'maternal',
    relationship: '외숙모 (외삼촌댁)',
    clan: '밀양 박씨',
    birthDate: '1970-02-18',
    isAlive: true,
    spouseId: 'mat-2-2',
    phone: '010-7822-1981',
    lastContactDate: '2026-08-01',
    contactCycleDays: 60,
    memo: '대전 거주. 명절 때 음식 정갈하게 준비해주심.',
  },
  {
    id: 'mat-2-3',
    name: '이은미',
    hanja: '李恩美',
    gender: 'F',
    generation: 2,
    lineage: 'maternal',
    relationship: '이모 (큰이모)',
    clan: '전주 이씨',
    birthDate: '1971-12-05',
    isAlive: true,
    parentIds: ['mat-1-1', 'mat-1-2'],
    spouseId: 'mat-2-6',
    phone: '010-4491-0023',
    lastContactDate: '2026-08-15',
    contactCycleDays: 30,
    memo: '수원 거주. 조카들 각별히 아끼심.',
  },
  {
    id: 'mat-2-6',
    name: '최진우',
    hanja: '崔鎭宇',
    gender: 'M',
    generation: 2,
    lineage: 'maternal',
    relationship: '이모부',
    clan: '경주 최씨',
    birthDate: '1968-05-11',
    isAlive: true,
    spouseId: 'mat-2-3',
    phone: '010-4491-0024',
    lastContactDate: '2026-08-15',
    contactCycleDays: 60,
    memo: '수원 거주. 주말마다 가족 모임 참여.',
  },
  {
    id: 'mat-2-7',
    name: '이은정',
    hanja: '李恩貞',
    gender: 'F',
    generation: 2,
    lineage: 'maternal',
    relationship: '작은이모',
    clan: '전주 이씨',
    birthDate: '1976-08-22',
    isAlive: true,
    parentIds: ['mat-1-1', 'mat-1-2'],
    phone: '010-3388-1290',
    lastContactDate: '2026-08-10',
    contactCycleDays: 45,
    memo: '분당 거주. 초등학교 교사.',
  },
  {
    id: 'mat-2-4',
    name: '이성국',
    hanja: '李成國',
    gender: 'M',
    generation: 2,
    lineage: 'maternal',
    relationship: '외당숙 (외가 5촌)',
    clan: '전주 이씨',
    birthDate: '1945-10-08',
    isAlive: true,
    phone: '010-5544-7711',
    lastContactDate: '2026-04-05',
    contactCycleDays: 60,
    memo: '외조부 사촌동생. 전주 종친회 활동.',
  },

  // 3대: 본인 세대의 외사촌 및 이종사촌 형제자매
  {
    id: 'mat-3-1',
    name: '이시우',
    hanja: '李時宇',
    gender: 'M',
    generation: 3,
    lineage: 'maternal',
    relationship: '외사촌동생 (4촌)',
    clan: '전주 이씨',
    birthDate: '1995-03-21',
    isAlive: true,
    parentIds: ['mat-2-2', 'mat-2-5'],
    phone: '010-9901-2244',
    lastContactDate: '2026-08-20',
    contactCycleDays: 60,
    memo: '외숙 이은철 장남. 대학원 박사과정.',
  },
  {
    id: 'mat-3-2',
    name: '이태우',
    hanja: '李泰宇',
    gender: 'M',
    generation: 3,
    lineage: 'maternal',
    relationship: '외사촌형 (4촌)',
    clan: '전주 이씨',
    birthDate: '1992-11-14',
    isAlive: true,
    parentIds: ['mat-2-2', 'mat-2-5'],
    phone: '010-9901-2245',
    lastContactDate: '2026-08-18',
    contactCycleDays: 45,
    memo: '외숙 이은철 차남. IT 기업 개발자.',
  },
  {
    id: 'mat-3-3',
    name: '최하린',
    hanja: '崔夏璘',
    gender: 'F',
    generation: 3,
    lineage: 'maternal',
    relationship: '이종사촌여동생 (4촌)',
    clan: '경주 최씨',
    birthDate: '1998-07-03',
    isAlive: true,
    parentIds: ['mat-2-6', 'mat-2-3'],
    phone: '010-4491-1188',
    lastContactDate: '2026-08-25',
    contactCycleDays: 60,
    memo: '큰이모 장녀. 디자인 스튜디오 근무.',
  },
  {
    id: 'mat-3-4',
    name: '최민우',
    hanja: '崔珉宇',
    gender: 'M',
    generation: 3,
    lineage: 'maternal',
    relationship: '이종사촌남동생 (4촌)',
    clan: '경주 최씨',
    birthDate: '2001-09-29',
    isAlive: true,
    parentIds: ['mat-2-6', 'mat-2-3'],
    phone: '010-4491-1199',
    lastContactDate: '2026-09-01',
    contactCycleDays: 60,
    memo: '큰이모 차남. 대학생.',
  },

  // 4대: 외가 쪽 조카들 (외사촌의 자녀들)
  {
    id: 'mat-4-1',
    name: '이준우',
    hanja: '李俊宇',
    gender: 'M',
    generation: 4,
    lineage: 'maternal',
    relationship: '외종조카 (5촌 조카)',
    clan: '전주 이씨',
    birthDate: '2022-04-15',
    isAlive: true,
    parentIds: ['mat-3-1'],
    memo: '외사촌 이시우 아들. 재롱둥이.',
  },
  {
    id: 'mat-4-2',
    name: '이서아',
    hanja: '李瑞娥',
    gender: 'F',
    generation: 4,
    lineage: 'maternal',
    relationship: '외종질녀 (5촌 조카)',
    clan: '전주 이씨',
    birthDate: '2024-08-10',
    isAlive: true,
    parentIds: ['mat-3-1'],
    memo: '외사촌 이시우 딸. 돌 지난 귀여운 아기.',
  },

  // ==========================================
  // 3. 사돈댁 부친쪽 (처가 친가 - 동래 정씨)
  // ==========================================
  // 1대: 처조부모
  {
    id: 'inlaw-pat-1-1',
    name: '정태원',
    hanja: '鄭泰元',
    gender: 'M',
    generation: 1,
    lineage: 'inlaw_paternal',
    relationship: '처조부 (사돈할아버지)',
    clan: '동래 정씨 직제학공파',
    birthDate: '1934-02-10',
    deathDate: '2020-03-18',
    isAlive: false,
    spouseId: 'inlaw-pat-1-2',
    memo: '부산 동래 선영 안장.',
  },
  {
    id: 'inlaw-pat-1-2',
    name: '윤명숙',
    hanja: '尹明淑',
    gender: 'F',
    generation: 1,
    lineage: 'inlaw_paternal',
    relationship: '처조모 (사돈할머니)',
    clan: '파평 윤씨',
    birthDate: '1939-11-25',
    isAlive: true,
    spouseId: 'inlaw-pat-1-1',
    phone: '010-7711-2299',
    lastContactDate: '2026-07-05',
    contactCycleDays: 30,
    memo: '부산 거주. 명절에 인사드림.',
  },
  // 2대: 장인, 처백부
  {
    id: 'inlaw-pat-2-1',
    name: '정우진',
    hanja: '鄭宇鎭',
    gender: 'M',
    generation: 2,
    lineage: 'inlaw_paternal',
    relationship: '장인어른 (시아버지/빙부)',
    clan: '동래 정씨',
    birthDate: '1961-04-14',
    isAlive: true,
    parentIds: ['inlaw-pat-1-1', 'inlaw-pat-1-2'],
    spouseId: 'inlaw-mat-2-1',
    phone: '010-3344-9900',
    lastContactDate: '2026-08-25',
    contactCycleDays: 14,
    memo: '분당 거주. 주말 골프 및 등산.',
  },
  {
    id: 'inlaw-pat-2-2',
    name: '정우택',
    hanja: '鄭宇澤',
    gender: 'M',
    generation: 2,
    lineage: 'inlaw_paternal',
    relationship: '처백부 (처가 큰아버지)',
    clan: '동래 정씨',
    birthDate: '1958-09-02',
    isAlive: true,
    parentIds: ['inlaw-pat-1-1', 'inlaw-pat-1-2'],
    phone: '010-8822-1100',
    lastContactDate: '2026-05-10',
    contactCycleDays: 60,
    memo: '울산 거주. 사업 경영.',
  },
  // 3대: 배우자, 처남
  {
    id: 'inlaw-pat-3-1',
    name: '정서연',
    hanja: '鄭瑞娟',
    gender: 'F',
    generation: 3,
    lineage: 'inlaw_paternal',
    relationship: '배우자 (아내)',
    clan: '동래 정씨',
    birthDate: '1992-08-17',
    isAlive: true,
    parentIds: ['inlaw-pat-2-1', 'inlaw-mat-2-1'],
    spouseId: 'pat-3-1',
    phone: '010-9988-7766',
    lastContactDate: '2026-09-12',
    contactCycleDays: 1,
    memo: '스마트폰 B 보유자. 초등학교 교사.',
  },
  {
    id: 'inlaw-pat-3-2',
    name: '정서진',
    hanja: '鄭瑞鎭',
    gender: 'M',
    generation: 3,
    lineage: 'inlaw_paternal',
    relationship: '처남 (처가 4촌격 동기)',
    clan: '동래 정씨',
    birthDate: '1995-12-03',
    isAlive: true,
    parentIds: ['inlaw-pat-2-1', 'inlaw-mat-2-1'],
    phone: '010-4433-2211',
    lastContactDate: '2026-08-18',
    contactCycleDays: 30,
    memo: '건축사사무소 근무.',
  },

  // ==========================================
  // 4. 사돈댁 모친쪽 (처가 외가 - 남원 양씨)
  // ==========================================
  // 1대: 처외조부모
  {
    id: 'inlaw-mat-1-1',
    name: '양기철',
    hanja: '梁基哲',
    gender: 'M',
    generation: 1,
    lineage: 'inlaw_maternal',
    relationship: '처외조부 (처가 외할아버지)',
    clan: '남원 양씨',
    birthDate: '1936-07-29',
    isAlive: true,
    spouseId: 'inlaw-mat-1-2',
    phone: '010-5511-8822',
    lastContactDate: '2026-06-15',
    contactCycleDays: 45,
    memo: '강릉 본가 거주. 농원 운영.',
  },
  {
    id: 'inlaw-mat-1-2',
    name: '김복순',
    hanja: '金福順',
    gender: 'F',
    generation: 1,
    lineage: 'inlaw_maternal',
    relationship: '처외조모 (처가 외할머니)',
    clan: '광산 김씨',
    birthDate: '1940-05-14',
    isAlive: true,
    spouseId: 'inlaw-mat-1-1',
    phone: '010-5511-8823',
    lastContactDate: '2026-06-15',
    contactCycleDays: 45,
    memo: '강릉 본가 거주.',
  },
  // 2대: 장모, 처외숙, 처이모
  {
    id: 'inlaw-mat-2-1',
    name: '양혜정',
    hanja: '梁惠貞',
    gender: 'F',
    generation: 2,
    lineage: 'inlaw_maternal',
    relationship: '장모님 (시어머니/빙모)',
    clan: '남원 양씨',
    birthDate: '1963-09-08',
    isAlive: true,
    parentIds: ['inlaw-mat-1-1', 'inlaw-mat-1-2'],
    spouseId: 'inlaw-pat-2-1',
    phone: '010-3344-9901',
    lastContactDate: '2026-08-28',
    contactCycleDays: 14,
    memo: '분당 거주. 손주들 자주 돌봐주심.',
  },
  {
    id: 'inlaw-mat-2-2',
    name: '양동현',
    hanja: '梁東賢',
    gender: 'M',
    generation: 2,
    lineage: 'inlaw_maternal',
    relationship: '처외숙 (처가 외삼촌)',
    clan: '남원 양씨',
    birthDate: '1966-03-22',
    isAlive: true,
    parentIds: ['inlaw-mat-1-1', 'inlaw-mat-1-2'],
    phone: '010-6677-1122',
    lastContactDate: '2026-04-12',
    contactCycleDays: 60,
    memo: '원주 거주. 자영업.',
  },
  {
    id: 'inlaw-mat-2-3',
    name: '양숙경',
    hanja: '梁淑卿',
    gender: 'F',
    generation: 2,
    lineage: 'inlaw_maternal',
    relationship: '처이모 (처가 이모)',
    clan: '남원 양씨',
    birthDate: '1970-11-19',
    isAlive: true,
    parentIds: ['inlaw-mat-1-1', 'inlaw-mat-1-2'],
    phone: '010-2211-9988',
    lastContactDate: '2026-05-20',
    contactCycleDays: 60,
    memo: '인천 거주.',
  },
];

// Helper Functions
export function getDaysSinceContact(dateStr?: string): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  const now = new Date('2026-09-13');
  const diffTime = Math.abs(now.getTime() - target.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getLifeStatus(member: FamilyMember): {
  isAlive: boolean;
  statusText: string;
  ageText: string;
  badgeBg: string;
  badgeTextColor: string;
  fullDesc: string;
} {
  const currentYear = 2026;
  const birthYear = member.birthDate ? parseInt(member.birthDate.substring(0, 4), 10) : 0;
  const deathYear = member.deathDate ? parseInt(member.deathDate.substring(0, 4), 10) : 0;

  if (member.isAlive) {
    const age = birthYear ? currentYear - birthYear : 0;
    const ageStr = age > 0 ? `만 ${age}세` : '';
    return {
      isAlive: true,
      statusText: '생존',
      ageText: ageStr,
      badgeBg: '#eaf3de',
      badgeTextColor: '#27500a',
      fullDesc: `🌿 생존 (${ageStr})`,
    };
  } else {
    const passedAge = birthYear && deathYear ? deathYear - birthYear + 1 : 0;
    const desc = passedAge > 0 && deathYear
      ? `향년 ${passedAge}세 (${deathYear}년 별세)`
      : deathYear ? `${deathYear}년 별세` : '작고';
    return {
      isAlive: false,
      statusText: '작고',
      ageText: desc,
      badgeBg: '#2e2e2a',
      badgeTextColor: '#faf8f0',
      fullDesc: `🕯️ 작고 (${desc})`,
    };
  }
}

export interface KinshipResult {
  title: string;
  chonText?: string;
}

// Compute kinship relationship from the perspective of centerId
export function getKinshipRelation(centerId: string, targetId: string): KinshipResult {
  if (targetId === centerId) {
    return { title: '본인 (중심)' };
  }

  // Known relation lookups for main personas
  if (centerId === 'pat-3-1') {
    // Kim Jun-hyeok's perspective
    if (targetId === 'inlaw-pat-3-1') return { title: '배우자 (아내)', chonText: '0촌' };
    if (targetId === 'pat-2-2') return { title: '아버지 (부친)', chonText: '1촌' };
    if (targetId === 'mat-2-1') return { title: '어머니 (모친)', chonText: '1촌' };
    if (targetId === 'pat-3-2') return { title: '남동생', chonText: '2촌' };
    if (targetId === 'pat-3-3') return { title: '여동생', chonText: '2촌' };
    if (targetId === 'pat-4-1') return { title: '장남 (아들)', chonText: '1촌' };
    if (targetId === 'pat-4-2') return { title: '장녀 (딸)', chonText: '1촌' };
    if (targetId === 'pat-1-1') return { title: '친조부 (할아버지)', chonText: '2촌' };
    if (targetId === 'pat-1-2') return { title: '친조모 (할머니)', chonText: '2촌' };
    if (targetId === 'mat-1-1') return { title: '외조부 (외할아버지)', chonText: '2촌' };
    if (targetId === 'mat-1-2') return { title: '외조모 (외할머니)', chonText: '2촌' };
    if (targetId === 'pat-2-1') return { title: '큰아버지 (백부)', chonText: '3촌' };
    if (targetId === 'pat-2-3') return { title: '고모', chonText: '3촌' };
    if (targetId === 'pat-3-4') return { title: '사촌형 (종형)', chonText: '4촌' };
    if (targetId === 'pat-2-4') return { title: '당숙 (5촌 당숙)', chonText: '5촌' };
    if (targetId === 'mat-2-2') return { title: '외삼촌 (외숙)', chonText: '3촌' };
    if (targetId === 'mat-2-5') return { title: '외숙모 (외삼촌댁)', chonText: '인척' };
    if (targetId === 'mat-2-3') return { title: '큰이모', chonText: '3촌' };
    if (targetId === 'mat-2-6') return { title: '이모부', chonText: '인척' };
    if (targetId === 'mat-2-7') return { title: '작은이모', chonText: '3촌' };
    if (targetId === 'mat-3-1') return { title: '외사촌동생 (이시우)', chonText: '4촌' };
    if (targetId === 'mat-3-2') return { title: '외사촌형 (이태우)', chonText: '4촌' };
    if (targetId === 'mat-3-3') return { title: '이종사촌여동생 (최하린)', chonText: '4촌' };
    if (targetId === 'mat-3-4') return { title: '이종사촌남동생 (최민우)', chonText: '4촌' };
    if (targetId === 'mat-4-1') return { title: '외종조카 (이준우)', chonText: '5촌' };
    if (targetId === 'mat-4-2') return { title: '외종질녀 (이서아)', chonText: '5촌' };
    if (targetId === 'mat-2-4') return { title: '외당숙 (5촌)', chonText: '5촌' };
    if (targetId === 'inlaw-pat-2-1') return { title: '장인어른', chonText: '인척' };
    if (targetId === 'inlaw-mat-2-1') return { title: '장모님', chonText: '인척' };
    if (targetId === 'inlaw-pat-3-2') return { title: '처남', chonText: '인척' };
  } else if (centerId === 'inlaw-pat-3-1') {
    // Jeong Seo-yeon's perspective
    if (targetId === 'pat-3-1') return { title: '남편', chonText: '0촌' };
    if (targetId === 'inlaw-pat-2-1') return { title: '아버지 (친정)', chonText: '1촌' };
    if (targetId === 'inlaw-mat-2-1') return { title: '어머니 (친정)', chonText: '1촌' };
    if (targetId === 'inlaw-pat-3-2') return { title: '남동생', chonText: '2촌' };
    if (targetId === 'pat-2-2') return { title: '시아버지', chonText: '인척' };
    if (targetId === 'mat-2-1') return { title: '시어머니', chonText: '인척' };
    if (targetId === 'pat-4-1') return { title: '장남 (아들)', chonText: '1촌' };
    if (targetId === 'pat-4-2') return { title: '장녀 (딸)', chonText: '1촌' };
    if (targetId === 'inlaw-pat-2-2') return { title: '큰아버지 (백부)', chonText: '3촌' };
    if (targetId === 'inlaw-mat-2-2') return { title: '외삼촌', chonText: '3촌' };
    if (targetId === 'inlaw-mat-2-3') return { title: '이모', chonText: '3촌' };
  } else if (centerId === 'pat-2-1') {
    // Kim Yeong-ho's perspective
    if (targetId === 'pat-1-1') return { title: '선친 (부친)', chonText: '1촌' };
    if (targetId === 'pat-1-2') return { title: '어머님 (모친)', chonText: '1촌' };
    if (targetId === 'pat-2-2') return { title: '아우 (남동생)', chonText: '2촌' };
    if (targetId === 'pat-2-3') return { title: '여동생', chonText: '2촌' };
    if (targetId === 'pat-3-1') return { title: '조카 (준혁)', chonText: '3촌' };
    if (targetId === 'pat-3-4') return { title: '장남 (태혁)', chonText: '1촌' };
    if (targetId === 'pat-2-4') return { title: '사촌형제 (당숙)', chonText: '4촌' };
  } else if (centerId === 'mat-2-2') {
    // Lee Eun-cheol's perspective
    if (targetId === 'mat-1-1') return { title: '선친 (부친)', chonText: '1촌' };
    if (targetId === 'mat-1-2') return { title: '어머님 (모친)', chonText: '1촌' };
    if (targetId === 'mat-2-1') return { title: '누님', chonText: '2촌' };
    if (targetId === 'mat-2-3') return { title: '큰여동생 (이모)', chonText: '2촌' };
    if (targetId === 'mat-2-5') return { title: '배우자 (아내)', chonText: '0촌' };
    if (targetId === 'mat-2-6') return { title: '매제 (이모부)', chonText: '인척' };
    if (targetId === 'mat-2-7') return { title: '작은여동생', chonText: '2촌' };
    if (targetId === 'pat-3-1') return { title: '생질 (조카)', chonText: '3촌' };
    if (targetId === 'mat-3-1') return { title: '차남 (시우)', chonText: '1촌' };
    if (targetId === 'mat-3-2') return { title: '장남 (태우)', chonText: '1촌' };
    if (targetId === 'mat-3-3') return { title: '생질녀 (최하린)', chonText: '3촌' };
    if (targetId === 'mat-3-4') return { title: '생질 (최민우)', chonText: '3촌' };
    if (targetId === 'mat-4-1') return { title: '손자 (이준우)', chonText: '2촌' };
    if (targetId === 'mat-4-2') return { title: '손녀 (이서아)', chonText: '2촌' };
    if (targetId === 'mat-2-4') return { title: '사촌형제 (성국)', chonText: '4촌' };
  }

  const targetMember = INITIAL_FAMILY_DATA.find((m) => m.id === targetId);
  if (targetMember) {
    return { title: targetMember.relationship };
  }
  return { title: '친족' };
}