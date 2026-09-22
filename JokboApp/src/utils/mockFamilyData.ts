import { FamilyMember, LineageInfo, LineageType } from '../types/family';
import { generateVirtualAvatarSvg } from './avatarGenerator';

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
    ownerName: '홍길동',
    ownerRelation: '본인 (30대)',
    title: '스마트폰 A (홍길동 본인)',
    desc: '본인 직계 중심 (부모, 형제, 자녀) 족보 보유',
    avatarText: '길동',
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
    ownerName: '전우치',
    ownerRelation: '백부/종손 (60대)',
    title: '스마트폰 C (백부 전우치 종친)',
    desc: '친가 윗대 조부모, 당숙, 4촌·5촌 방계 종친 대거 보유',
    avatarText: '우치',
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

const RAW_FAMILY_DATA: FamilyMember[] = [
  // ==========================================
  // 1. 부친쪽 (친가 - 경주 김씨)
  // ==========================================
  // 1대: 조부모
  {
    id: 'pat-1-1',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['창업주 since 1965', '경주김씨 안동종친회 고문', '안동 교육공로훈장 서훈'],
  },
  {
    id: 'pat-1-2',
    photoUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['가문 대모(大母) · 종부', '안동종가 전통가양주 계승', '생존 가문 최고 어르신(88세)'],
  },
  // 2대: 부친, 백부, 고모, 5촌 당숙
  {
    id: 'pat-2-1',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&auto=format&fit=crop&q=80',
    name: '전우치',
    hanja: '田禹治',
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
    achievements: ['現 경주김씨 가문 종손', '1990년 가업 계승 및 확장', '대구 농업기술혁신 대상 수상'],
  },
  {
    id: 'pat-2-2',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['現 서울지방중소벤처기업청 기술자문', '공학박사 · 국책연구원 수석연구원'],
  },
  {
    id: 'pat-2-3',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['영남 플로리스트협회 부회장', '부산 화훼수출영농조합 이사'],
  },
  {
    id: 'pat-2-4',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['안동 유도회(儒道會) 회원', '종친회 족보편찬위원'],
  },
  // 3대: 본인, 남동생, 여동생, 4촌 사촌형
  {
    id: 'pat-3-1',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    name: '홍길동',
    hanja: '洪吉童',
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
    achievements: ['IT 벤처 창업대표 (AI 디지털 족보)', '경주김씨 청장년회 이사'],
  },
  {
    id: 'pat-3-2',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['판교 카카오 플랫폼 시니어 엔지니어', '정보처리기술사 취득'],
  },
  {
    id: 'pat-3-3',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['홍익대 시각디자인 졸', '브랜드 디자인 스튜디오 대표'],
  },
  {
    id: 'pat-3-4',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['대구 가업 스마트팜 2대 대표', '농림축산식품부 청년농업인 1기'],
  },
  // 4대: 자녀
  {
    id: 'pat-4-1',
    photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['가문 차세대 30대손 장손', '유치원 재학 중'],
  },
  {
    id: 'pat-4-2',
    photoUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['가문 30대손 장녀', '건강하게 무럭무럭 성장 중'],
  },

  // ==========================================
  // 2. 모친쪽 (외가 - 전주 이씨 계통)
  // ==========================================
  // 1대: 외조부모
  {
    id: 'mat-1-1',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['외가 1대 종손 · 전통서예 대가', '전주 향교 전훈(典訓) 역임', '외가 최고령 어르신(89세)'],
  },
  {
    id: 'mat-1-2',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['외가 자애로운 대모(大母)', '안동 전통 약선요리 계승', '생존 외가 종부(85세)'],
  },

  // 2대: 모친, 외숙(외삼촌), 외숙모, 이모, 이모부
  {
    id: 'mat-2-1',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['가문 지혜로운 어머니(賢母)', '중등 교육공무원 30년 정년퇴임', '외가 화목의 중심축'],
  },
  {
    id: 'mat-2-2',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['한국전자통신연구원(ETRI) 책임연구원', '전주이씨 대전종친회 간사'],
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
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=240&auto=format&fit=crop&q=80',
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
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80',
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
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['現 신소재 벤처기업 상임고문', '한양대 금속공학 졸 · 제조업 혁신가'],
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
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
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
    achievements: ['서울교대 졸 · 초등 수석교사', '가문 차세대 든든한 동반자(賢妻)'],
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
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
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

// Initialize with generation-tailored webtoon illustration SVG avatars for simulation testing.
// Real photos uploaded by users will replace these, and simulation data can be purged before production.
export const INITIAL_FAMILY_DATA: FamilyMember[] = RAW_FAMILY_DATA.map((member) => ({
  ...member,
  photoUrl: member.photoUrl && !member.photoUrl.includes('unsplash')
    ? member.photoUrl
    : generateVirtualAvatarSvg(member),
}));

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

// Helper to clean up raw relationship strings for "친족 (호칭)" display
export function formatKinshipTitle(raw: string): string {
  if (!raw || raw === '친족' || raw === '미등록 친족 후보' || raw === '미등록 친족' || raw === '미등록') {
    return '친족';
  }
  if (raw.startsWith('친족 (')) {
    return raw;
  }
  if (raw.includes('본인')) {
    return '본인 (중심)';
  }
  // Specific compound kinships must be checked BEFORE general '부' / '모'
  if (raw.includes('외할아버지') || raw.includes('외조부')) {
    return '친족 (외할아버지)';
  }
  if (raw.includes('외할머니') || raw.includes('외조모')) {
    return '친족 (외할머니)';
  }
  if (raw.includes('친할아버지') || raw.includes('친조부') || raw.includes('할아버지') || raw.includes('조부')) {
    return '친족 (할아버지)';
  }
  if (raw.includes('친할머니') || raw.includes('친조모') || raw.includes('할머니') || raw.includes('조모')) {
    return '친족 (할머니)';
  }
  if (raw.includes('큰아버지') || raw.includes('백부')) {
    return '친족 (큰아버지)';
  }
  if (raw.includes('작은아버지') || raw.includes('숙부')) {
    return '친족 (작은아버지)';
  }
  if (raw.includes('외숙모')) {
    return '친족 (외숙모)';
  }
  if (raw.includes('이모부')) {
    return '친족 (이모부)';
  }
  if (raw.includes('고모부')) {
    return '친족 (고모부)';
  }
  if (raw.includes('외삼촌') || raw.includes('외숙')) {
    return '친족 (외삼촌)';
  }
  if (raw.includes('고모')) {
    return '친족 (고모)';
  }
  if (raw.includes('이모')) {
    return '친족 (이모)';
  }
  if (raw.includes('사촌')) {
    return '친족 (사촌)';
  }
  if (raw.includes('당숙')) {
    return '친족 (당숙)';
  }
  if (raw.includes('남동생')) {
    return '친족 (남동생)';
  }
  if (raw.includes('여동생')) {
    return '친족 (여동생)';
  }
  if (raw.includes('오빠')) {
    return '친족 (오빠)';
  }
  if (raw.includes('누나')) {
    return '친족 (누나)';
  }
  if (raw.includes('언니')) {
    return '친족 (언니)';
  }
  if (raw.includes('형') && !raw.includes('형제')) {
    return '친족 (형)';
  }
  if (raw.includes('동기간') || raw.includes('형제') || raw.includes('남매') || raw.includes('자매')) {
    return '친족 (동기간)';
  }
  if (raw.includes('아내') || raw.includes('남편') || raw.includes('배우자')) {
    return '친족 (배우자)';
  }
  if (raw.includes('아들') || raw.includes('장남') || raw.includes('차남')) {
    return '친족 (아들)';
  }
  if (raw.includes('딸') || raw.includes('장녀') || raw.includes('차녀')) {
    return '친족 (딸)';
  }
  if (raw.includes('아버지') || raw.includes('부친') || raw.includes('선친') || /(^|[^\w가-힣])부([^\w가-힣]|$)/.test(raw) || raw === '부') {
    return '친족 (아버지)';
  }
  if (raw.includes('어머니') || raw.includes('모친') || /(^|[^\w가-힣])모([^\w가-힣]|$)/.test(raw) || raw === '모') {
    return '친족 (어머니)';
  }

  // Fallback for custom labels
  const clean = raw.replace(/\(.*?\)/g, '').replace(/[0-9]/g, '').trim();
  return clean ? `친족 (${clean})` : '친족';
}

// Compute kinship relationship from the perspective of centerId
export function getKinshipRelation(
  centerId: string,
  targetId: string,
  allMembers?: FamilyMember[]
): KinshipResult {
  if (targetId === centerId) {
    return { title: '본인 (중심)' };
  }

  // 1. Dynamic graph-based kinship analysis if allMembers is provided
  if (allMembers && allMembers.length > 0) {
    const center = allMembers.find((m) => m.id === centerId);
    const target = allMembers.find((m) => m.id === targetId);

    if (center && target) {
      // 1-1. Direct Parent of center (1촌)
      if (center.parentIds && center.parentIds.includes(target.id)) {
        const isMale =
          target.gender === 'M' ||
          target.relationship?.includes('부') ||
          target.relationship?.includes('아버지');
        return {
          title: isMale ? '친족 (아버지)' : '친족 (어머니)',
          chonText: '1촌',
        };
      }

      // 1-2. Direct Child of center (1촌)
      if (target.parentIds && target.parentIds.includes(center.id)) {
        const isMale = target.gender === 'M';
        return {
          title: isMale ? '친족 (아들)' : '친족 (딸)',
          chonText: '1촌',
        };
      }

      // 1-3. Spouse (0촌)
      if (center.spouseId === target.id || target.spouseId === center.id) {
        return {
          title: '친족 (배우자)',
          chonText: '0촌',
        };
      }

      // 1-4. Siblings (2촌) - Same parents
      const sharedParents = (center.parentIds || []).filter((pid) => (target.parentIds || []).includes(pid));
      if (sharedParents.length > 0) {
        const isTargetOlder = (target.birthDate || '9999') < (center.birthDate || '9999');
        let sibTitle = '친족 (동기간)';
        if (target.gender === 'M') {
          if (center.gender === 'F') {
            sibTitle = isTargetOlder ? '친족 (오빠)' : '친족 (남동생)';
          } else {
            sibTitle = isTargetOlder ? '친족 (형)' : '친족 (남동생)';
          }
        } else if (target.gender === 'F') {
          if (center.gender === 'F') {
            sibTitle = isTargetOlder ? '친족 (언니)' : '친족 (여동생)';
          } else {
            sibTitle = isTargetOlder ? '친족 (누나)' : '친족 (여동생)';
          }
        }
        return {
          title: sibTitle,
          chonText: '2촌',
        };
      }

      // 1-5. Grandparents (2촌)
      const centerParents = allMembers.filter((m) => (center.parentIds || []).includes(m.id));
      const father = centerParents.find((p) => p.gender === 'M' || p.relationship?.includes('부') || p.relationship?.includes('아버지'));
      const mother = centerParents.find((p) => p.gender === 'F' || p.relationship?.includes('모') || p.relationship?.includes('어머니'));

      if (father && father.parentIds && father.parentIds.includes(target.id)) {
        return {
          title: target.gender === 'M' ? '친족 (할아버지)' : '친족 (할머니)',
          chonText: '2촌',
        };
      }
      if (mother && mother.parentIds && mother.parentIds.includes(target.id)) {
        return {
          title: target.gender === 'M' ? '친족 (외할아버지)' : '친족 (외할머니)',
          chonText: '2촌',
        };
      }

      // 1-6. Target has a specified relationship field
      if (target.relationship && target.relationship !== '친족' && target.relationship !== '미등록') {
        const formatted = formatKinshipTitle(target.relationship);
        let chonText: string | undefined = undefined;
        if (formatted.includes('아버지') || formatted.includes('어머니') || formatted.includes('아들') || formatted.includes('딸')) chonText = '1촌';
        else if (formatted.includes('배우자')) chonText = '0촌';
        else if (formatted.includes('형') || formatted.includes('동생') || formatted.includes('오빠') || formatted.includes('누나') || formatted.includes('언니') || formatted.includes('할아버지') || formatted.includes('할머니') || formatted.includes('동기간')) chonText = '2촌';
        else if (formatted.includes('삼촌') || formatted.includes('고모') || formatted.includes('이모') || formatted.includes('백부') || formatted.includes('숙부')) chonText = '3촌';
        else if (formatted.includes('사촌')) chonText = '4촌';
        else if (formatted.includes('당숙')) chonText = '5촌';

        return {
          title: formatted,
          chonText,
        };
      }
    }
  }

  // 2. Known relation lookups for main personas in simulation demo mode
  if (centerId === 'pat-3-1') {
    // Kim Jun-hyeok's perspective
    if (targetId === 'inlaw-pat-3-1') return { title: '친족 (아내)', chonText: '0촌' };
    if (targetId === 'pat-2-2') return { title: '친족 (아버지)', chonText: '1촌' };
    if (targetId === 'mat-2-1') return { title: '친족 (어머니)', chonText: '1촌' };
    if (targetId === 'pat-3-2') return { title: '친족 (남동생)', chonText: '2촌' };
    if (targetId === 'pat-3-3') return { title: '친족 (여동생)', chonText: '2촌' };
    if (targetId === 'pat-4-1') return { title: '친족 (아들)', chonText: '1촌' };
    if (targetId === 'pat-4-2') return { title: '친족 (딸)', chonText: '1촌' };
    if (targetId === 'pat-1-1') return { title: '친족 (할아버지)', chonText: '2촌' };
    if (targetId === 'pat-1-2') return { title: '친족 (할머니)', chonText: '2촌' };
    if (targetId === 'mat-1-1') return { title: '친족 (외할아버지)', chonText: '2촌' };
    if (targetId === 'mat-1-2') return { title: '친족 (외할머니)', chonText: '2촌' };
    if (targetId === 'pat-2-1') return { title: '친족 (큰아버지)', chonText: '3촌' };
    if (targetId === 'pat-2-3') return { title: '친족 (고모)', chonText: '3촌' };
    if (targetId === 'pat-3-4') return { title: '친족 (사촌형)', chonText: '4촌' };
    if (targetId === 'pat-2-4') return { title: '친족 (당숙)', chonText: '5촌' };
    if (targetId === 'mat-2-2') return { title: '친족 (외삼촌)', chonText: '3촌' };
    if (targetId === 'mat-2-5') return { title: '친족 (외숙모)', chonText: '인척' };
    if (targetId === 'mat-2-3') return { title: '친족 (큰이모)', chonText: '3촌' };
    if (targetId === 'mat-2-6') return { title: '친족 (이모부)', chonText: '인척' };
    if (targetId === 'mat-2-7') return { title: '친족 (작은이모)', chonText: '3촌' };
    if (targetId === 'mat-3-1') return { title: '친족 (외사촌동생)', chonText: '4촌' };
    if (targetId === 'mat-3-2') return { title: '친족 (외사촌형)', chonText: '4촌' };
    if (targetId === 'mat-3-3') return { title: '친족 (이종사촌)', chonText: '4촌' };
    if (targetId === 'mat-3-4') return { title: '친족 (이종사촌)', chonText: '4촌' };
    if (targetId === 'mat-4-1') return { title: '친족 (외종조카)', chonText: '5촌' };
    if (targetId === 'mat-4-2') return { title: '친족 (외종질녀)', chonText: '5촌' };
    if (targetId === 'mat-2-4') return { title: '친족 (외당숙)', chonText: '5촌' };
    if (targetId === 'inlaw-pat-2-1') return { title: '친족 (장인어른)', chonText: '인척' };
    if (targetId === 'inlaw-mat-2-1') return { title: '친족 (장모님)', chonText: '인척' };
    if (targetId === 'inlaw-pat-3-2') return { title: '친족 (처남)', chonText: '인척' };
  } else if (centerId === 'inlaw-pat-3-1') {
    // Jeong Seo-yeon's perspective
    if (targetId === 'pat-3-1') return { title: '친족 (남편)', chonText: '0촌' };
    if (targetId === 'inlaw-pat-2-1') return { title: '친족 (친정아버지)', chonText: '1촌' };
    if (targetId === 'inlaw-mat-2-1') return { title: '친족 (친정어머니)', chonText: '1촌' };
    if (targetId === 'inlaw-pat-3-2') return { title: '친족 (남동생)', chonText: '2촌' };
    if (targetId === 'pat-2-2') return { title: '친족 (시아버지)', chonText: '인척' };
    if (targetId === 'mat-2-1') return { title: '친족 (시어머니)', chonText: '인척' };
    if (targetId === 'pat-4-1') return { title: '친족 (아들)', chonText: '1촌' };
    if (targetId === 'pat-4-2') return { title: '친족 (딸)', chonText: '1촌' };
    if (targetId === 'inlaw-pat-2-2') return { title: '친족 (큰아버지)', chonText: '3촌' };
    if (targetId === 'inlaw-mat-2-2') return { title: '친족 (외삼촌)', chonText: '3촌' };
    if (targetId === 'inlaw-mat-2-3') return { title: '친족 (이모)', chonText: '3촌' };
  } else if (centerId === 'pat-2-1') {
    // Kim Yeong-ho's perspective
    if (targetId === 'pat-1-1') return { title: '친족 (선친/부)', chonText: '1촌' };
    if (targetId === 'pat-1-2') return { title: '친족 (어머님/모)', chonText: '1촌' };
    if (targetId === 'pat-2-2') return { title: '친족 (남동생)', chonText: '2촌' };
    if (targetId === 'pat-2-3') return { title: '친족 (여동생)', chonText: '2촌' };
    if (targetId === 'pat-3-1') return { title: '친족 (조카)', chonText: '3촌' };
    if (targetId === 'pat-3-4') return { title: '친족 (아들)', chonText: '1촌' };
    if (targetId === 'pat-2-4') return { title: '친족 (당숙)', chonText: '4촌' };
  } else if (centerId === 'mat-2-2') {
    // Lee Eun-cheol's perspective
    if (targetId === 'mat-1-1') return { title: '친족 (선친/부)', chonText: '1촌' };
    if (targetId === 'mat-1-2') return { title: '친족 (어머님/모)', chonText: '1촌' };
    if (targetId === 'mat-2-1') return { title: '친족 (누님)', chonText: '2촌' };
    if (targetId === 'mat-2-3') return { title: '친족 (여동생)', chonText: '2촌' };
    if (targetId === 'mat-2-5') return { title: '친족 (아내)', chonText: '0촌' };
    if (targetId === 'mat-2-6') return { title: '친족 (매제)', chonText: '인척' };
    if (targetId === 'mat-2-7') return { title: '친족 (여동생)', chonText: '2촌' };
    if (targetId === 'pat-3-1') return { title: '친족 (조카)', chonText: '3촌' };
    if (targetId === 'mat-3-1') return { title: '친족 (차남)', chonText: '1촌' };
    if (targetId === 'mat-3-2') return { title: '친족 (장남)', chonText: '1촌' };
    if (targetId === 'mat-3-3') return { title: '친족 (생질녀)', chonText: '3촌' };
    if (targetId === 'mat-3-4') return { title: '친족 (생질)', chonText: '3촌' };
    if (targetId === 'mat-4-1') return { title: '친족 (손자)', chonText: '2촌' };
    if (targetId === 'mat-4-2') return { title: '친족 (손녀)', chonText: '2촌' };
    if (targetId === 'mat-2-4') return { title: '친족 (사촌)', chonText: '4촌' };
  }

  const targetMember = (allMembers || INITIAL_FAMILY_DATA).find((m) => m.id === targetId);
  if (targetMember && targetMember.relationship && targetMember.relationship !== '친족') {
    return { title: formatKinshipTitle(targetMember.relationship) };
  }
  return { title: '친족' };
}

// ==========================================
// 4. 관계 형성을 위한 미연결 가상 친족 데이터 (테스트용)
// ==========================================
const RAW_UNCONNECTED_MEMBERS: FamilyMember[] = [
  {
    id: 'unc-1',
    name: '김태성',
    hanja: '金泰成',
    gender: 'M',
    generation: 3,
    lineage: 'paternal',
    relationship: '미연결 종친 후보 (30대)',
    clan: '경주 김씨 판도판서공파 29세손',
    birthDate: '1991-05-12',
    isAlive: true,
    parentIds: [], // 현재 부모 미지정 상태
    phone: '010-4321-9988',
    lastContactDate: '2026-09-10',
    contactCycleDays: 30,
    memo: '대구 거주. 족보 등록을 위해 찾아온 백부 전우치의 숨겨진 장성한 차남 후보. 아직 부자 결연이 맺어지지 않은 상태.',
  },
  {
    id: 'unc-2',
    name: '최소율',
    hanja: '崔昭律',
    gender: 'F',
    generation: 3,
    lineage: 'maternal',
    relationship: '미연결 외가 친족 (20대)',
    clan: '경주 최씨',
    birthDate: '2003-08-20',
    isAlive: true,
    parentIds: [], // 현재 부모 미지정 상태
    phone: '010-7788-5522',
    lastContactDate: '2026-09-08',
    contactCycleDays: 30,
    memo: '수원 거주. 큰이모 이은미의 막내딸(차녀). 아직 족보 앱에 등록 및 모녀 결연이 맺어지지 않은 상태.',
  },
  {
    id: 'unc-3',
    name: '박지민',
    hanja: '朴智敏',
    gender: 'F',
    generation: 3,
    lineage: 'paternal',
    relationship: '미연결 배우자 후보',
    clan: '밀양 박씨',
    birthDate: '1994-10-15',
    isAlive: true,
    spouseId: undefined, // 미혼
    phone: '010-2233-8811',
    lastContactDate: '2026-09-11',
    contactCycleDays: 14,
    memo: '남동생 김민혁의 예비 신부. 양가 상견례 후 가계도 혼인 결연 대기 중.',
  },
];

export const UNCONNECTED_TEST_MEMBERS: FamilyMember[] = RAW_UNCONNECTED_MEMBERS.map((member) => ({
  ...member,
  photoUrl: generateVirtualAvatarSvg(member),
}));

export interface KinshipAnalysisResult {
  chonText: string;
  titleAtoB: string;
  titleBtoA: string;
  summary: string;
  isDirect: boolean;
}

export function calculateKinshipBetween(
  personAId: string,
  personBId: string,
  allMembers: FamilyMember[]
): KinshipAnalysisResult {
  if (personAId === personBId) {
    return {
      chonText: '본인',
      titleAtoB: '본인',
      titleBtoA: '본인',
      summary: '동일 인물입니다.',
      isDirect: true,
    };
  }

  const pA = allMembers.find((m) => m.id === personAId);
  const pB = allMembers.find((m) => m.id === personBId);

  if (!pA || !pB) {
    return {
      chonText: '미상',
      titleAtoB: '미등록',
      titleBtoA: '미등록',
      summary: '인물 정보를 찾을 수 없습니다.',
      isDirect: false,
    };
  }

  // 1. Spouses (0촌)
  if (pA.spouseId === pB.id || pB.spouseId === pA.id) {
    return {
      chonText: '0촌 (부부)',
      titleAtoB: pB.gender === 'F' ? '아내 (배우자)' : '남편 (배우자)',
      titleBtoA: pA.gender === 'F' ? '아내 (배우자)' : '남편 (배우자)',
      summary: '부부(夫婦) 관계 (0촌 결연)',
      isDirect: true,
    };
  }

  // 2. Parent-Child (1촌)
  if (pB.parentIds && pB.parentIds.includes(pA.id)) {
    return {
      chonText: '1촌 (부모-자녀)',
      titleAtoB: pB.gender === 'M' ? '아들 (자녀)' : '딸 (자녀)',
      titleBtoA: pA.gender === 'M' ? '아버지 (부친)' : '어머니 (모친)',
      summary: `${pA.name}님이 ${pB.name}님의 부모입니다.`,
      isDirect: true,
    };
  }
  if (pA.parentIds && pA.parentIds.includes(pB.id)) {
    return {
      chonText: '1촌 (부모-자녀)',
      titleAtoB: pB.gender === 'M' ? '아버지 (부친)' : '어머니 (모친)',
      titleBtoA: pA.gender === 'M' ? '아들 (자녀)' : '딸 (자녀)',
      summary: `${pB.name}님이 ${pA.name}님의 부모입니다.`,
      isDirect: true,
    };
  }

  // 3. Siblings (2촌)
  const sharedParents = (pA.parentIds || []).filter((pid) => (pB.parentIds || []).includes(pid));
  if (sharedParents.length > 0) {
    const aOlder = (pA.birthDate || '9999') < (pB.birthDate || '9999');
    return {
      chonText: '2촌 (동기간)',
      titleAtoB: aOlder
        ? pB.gender === 'M' ? '남동생' : '여동생'
        : pB.gender === 'M' ? (pA.gender === 'M' ? '형' : '오빠') : (pA.gender === 'M' ? '누나' : '언니'),
      titleBtoA: aOlder
        ? pA.gender === 'M' ? (pB.gender === 'M' ? '형' : '오빠') : (pB.gender === 'M' ? '누나' : '언니')
        : pA.gender === 'M' ? '남동생' : '여동생',
      summary: '같은 부모를 둔 형제·자매(2촌) 관계입니다.',
      isDirect: true,
    };
  }

  // 4. Uncle/Aunt ↔ Nephew/Niece (3촌)
  // Check if A is sibling of B's parents
  const bParents = allMembers.filter((m) => (pB.parentIds || []).includes(m.id));
  const isParentSibling = bParents.some((bp) =>
    (bp.parentIds || []).some((bppId) => (pA.parentIds || []).includes(bppId))
  );
  if (isParentSibling) {
    const title = pA.lineage === 'maternal'
      ? (pA.gender === 'M' ? '외삼촌 (외숙)' : '이모')
      : (pA.gender === 'M' ? '큰아버지/작은아버지' : '고모');
    return {
      chonText: '3촌 (숙질간)',
      titleAtoB: pB.gender === 'M' ? '조카 (생질)' : '조카딸 (질녀)',
      titleBtoA: title,
      summary: `${pA.name}님과 ${pB.name}님은 3촌 숙질간입니다.`,
      isDirect: true,
    };
  }

  // 5. First Cousins (4촌)
  // Check if A's parents and B's parents share grandparents
  const aParents = allMembers.filter((m) => (pA.parentIds || []).includes(m.id));
  const shareGrandparent = aParents.some((ap) =>
    bParents.some((bp) => (ap.parentIds || []).some((appId) => (bp.parentIds || []).includes(appId)))
  );
  if (shareGrandparent) {
    return {
      chonText: '4촌 (사촌간)',
      titleAtoB: pB.gender === 'M' ? '사촌형제' : '사촌자매',
      titleBtoA: pA.gender === 'M' ? '사촌형제' : '사촌자매',
      summary: `${pA.name}님과 ${pB.name}님은 4촌 사촌 형제자매입니다.`,
      isDirect: true,
    };
  }

  // Unconnected / Not established
  return {
    chonText: '미연결',
    titleAtoB: '친족 후보 (미연결)',
    titleBtoA: '친족 후보 (미연결)',
    summary: '현재 가계도 상에 직접적인 혈연/혼인 결연이 형성되지 않은 상태입니다.',
    isDirect: false,
  };
}

export interface ElderApproverInfo {
  id: string;
  name: string;
  relation: string;
  generation: number;
  reason: string;
  phone?: string;
  badge: string;
  isAlive: boolean;
}

// 🌿 2차 결연 승인은 반드시 현재 생존해 계신(isAlive: true) 직계 존속 및 윗대 어르신만 가능
export const DESIGNATED_ELDERS: ElderApproverInfo[] = [
  {
    id: 'pat-1-2',
    name: '박순자',
    relation: '친할머니 (친조모, 88세)',
    generation: 1,
    reason: '조부(김태호) 작고로 인하여, 현재 생존해 계신 친가 직계 최고령 어르신으로서 결연을 공인합니다.',
    phone: '010-3412-8811',
    badge: '친가 최고 어르신 (🌿 생존)',
    isAlive: true,
  },
  {
    id: 'pat-2-1',
    name: '전우치',
    relation: '큰아버지 (백부 / 가문 종손, 67세)',
    generation: 2,
    reason: '가문의 장자이자 종손 어르신(생존)으로서 친족 혈통 및 방계 편입을 검증합니다.',
    phone: '010-9182-4411',
    badge: '종친회 종손 (🌿 생존)',
    isAlive: true,
  },
  {
    id: 'pat-2-2',
    name: '김영수',
    relation: '아버지 (직계 존속 부친, 64세)',
    generation: 2,
    reason: '직계 존속 부친(생존)으로서 자녀 및 형제의 결연을 확인하고 승인합니다.',
    phone: '010-5231-7788',
    badge: '직계 부모 (🌿 생존)',
    isAlive: true,
  },
  {
    id: 'mat-1-1',
    name: '이성한',
    relation: '외할아버지 (외조부, 89세)',
    generation: 1,
    reason: '외가 직계 최고 어르신(생존)으로서 외가 친족 결연의 진위 여부를 최종 검증합니다.',
    phone: '010-6712-3344',
    badge: '외가 종손 (🌿 생존)',
    isAlive: true,
  },
  {
    id: 'mat-1-2',
    name: '권정자',
    relation: '외할머니 (외조모, 85세)',
    generation: 1,
    reason: '외가 모계 어르신(생존)으로서 이모·외사촌 등 친족 관계를 보증합니다.',
    phone: '010-4491-8899',
    badge: '모계 어르신 (🌿 생존)',
    isAlive: true,
  },
  {
    id: 'mat-2-1',
    name: '이정숙',
    relation: '어머니 (직계 존속 모친, 62세)',
    generation: 2,
    reason: '직계 존속 모친(생존)으로서 자녀 및 외가 혈족의 결연을 확인하고 승인합니다.',
    phone: '010-8822-1199',
    badge: '직계 모친 (🌿 생존)',
    isAlive: true,
  },
];

// 🌿 생존 윗대 어르신 자동 매칭 엔진 (작고하신 선조는 승인 권한에서 자동 배제)
export function findElderApproverFor(
  personAId: string,
  personBId: string,
  allMembers: FamilyMember[]
): ElderApproverInfo {
  const pA = allMembers.find((m) => m.id === personAId);
  const pB = allMembers.find((m) => m.id === personBId);

  // 1. 외가 혈통 결연: 생존해 계신 외조부/외조모/모친 우선 추천
  if (pA?.lineage === 'maternal' || pB?.lineage === 'maternal') {
    const matGrandpa = allMembers.find((m) => m.id === 'mat-1-1' && m.isAlive);
    if (matGrandpa) {
      const elder = DESIGNATED_ELDERS.find((e) => e.id === 'mat-1-1');
      if (elder) return elder;
    }
    const matGrandma = allMembers.find((m) => m.id === 'mat-1-2' && m.isAlive);
    if (matGrandma) {
      const elder = DESIGNATED_ELDERS.find((e) => e.id === 'mat-1-2');
      if (elder) return elder;
    }
    const matMother = allMembers.find((m) => m.id === 'mat-2-1' && m.isAlive);
    if (matMother) {
      const elder = DESIGNATED_ELDERS.find((e) => e.id === 'mat-2-1');
      if (elder) return elder;
    }
  }

  // 2. 직계 자녀 또는 형제/인척 결연: 생존해 계신 부친(김영수) 우선 추천
  if (
    personAId === 'pat-3-2' ||
    personBId === 'pat-3-2' ||
    personAId === 'pat-3-1' ||
    personBId === 'pat-3-1'
  ) {
    const father = allMembers.find((m) => m.id === 'pat-2-2' && m.isAlive);
    if (father) {
      const elder = DESIGNATED_ELDERS.find((e) => e.id === 'pat-2-2');
      if (elder) return elder;
    }
  }

  // 3. 친가 방계 결연: 조부(김태호)가 작고하셨으므로 생존해 계신 친조모(박순자) 또는 백부(전우치 종손) 매칭
  const grandma = allMembers.find((m) => m.id === 'pat-1-2' && m.isAlive);
  if (grandma) {
    const elder = DESIGNATED_ELDERS.find((e) => e.id === 'pat-1-2');
    if (elder) return elder;
  }

  const uncle = allMembers.find((m) => m.id === 'pat-2-1' && m.isAlive);
  if (uncle) {
    const elder = DESIGNATED_ELDERS.find((e) => e.id === 'pat-2-1');
    if (elder) return elder;
  }

  // 4. 안전 기본값: 생존해 있는 첫 번째 어르신 반환
  return DESIGNATED_ELDERS.find((e) => e.isAlive) || DESIGNATED_ELDERS[0];
}