import {
  GenealogyMaster,
  MasterVerificationRequest,
  ServiceTierOption,
} from '../types/genealogyMaster';

/**
 * Authoritative Clan Genealogy Master Registry (성씨·본관별 공인 족보 마스터 명부)
 * 전국 주요 문중 및 대종회 족보 편찬위원장과 전례관 정보
 */
export const GENEALOGY_MASTERS: GenealogyMaster[] = [
  {
    id: 'master-kim-01',
    name: '김상원',
    hanja: '金相元',
    clanName: '경주 김씨 판도판서공파',
    surname: '김',
    organization: '경주김씨 대종회 족보편찬위원회',
    roleTitle: '수석 족보편찬위원장 (典籍監修)',
    experienceYears: 36,
    email: 'gyeongju.kim.master@jokbo.kr',
    phone: '02-732-8812',
    intro: '36년간 경주김씨 대동보 12질 편찬 및 대동세보 전산화를 총괄하였으며, 순한글 성명 및 실전(失傳) 혈통 고증의 최고 권위자입니다.',
    verifiedCount: 1420,
    isAvailable: true,
    rating: 4.98,
    specialties: ['순한글 성명 세손 고증', '판도판서공파 원전 실사', '파조 대동보 입적 심사'],
  },
  {
    id: 'master-lee-01',
    name: '이종무',
    hanja: '李宗茂',
    clanName: '전주 이씨 효령대군파',
    surname: '이',
    organization: '전주이씨 대동종약원',
    roleTitle: '종사연구소 수석연구원 · 전례이사',
    experienceYears: 29,
    email: 'jeonju.lee.master@jokbo.kr',
    phone: '02-765-2015',
    intro: '조선 왕실 전주이씨 선원록 및 효령대군파 보첩 감수 위원으로, 기독교적 작명이나 외자 이름의 세수 산정 전문가입니다.',
    verifiedCount: 1180,
    isAvailable: true,
    rating: 4.95,
    specialties: ['종교적/한글 작명 세수 배당', '선원록 원전 대조', '문중 공인 증서 발급'],
  },
  {
    id: 'master-jeong-01',
    name: '정태진',
    hanja: '鄭泰鎭',
    clanName: '동래 정씨 직제학공파',
    surname: '정',
    organization: '동래정씨 대종회 기록보존원',
    roleTitle: '보첩보존실장 · 한학 고증위원',
    experienceYears: 25,
    email: 'dongnae.jeong.master@jokbo.kr',
    phone: '051-552-3341',
    intro: '동래정씨 세보 8대 판본을 소장 및 연구 중이며, 항렬 미적용 여성 종원의 계보 정밀 등재를 다수 주관하였습니다.',
    verifiedCount: 890,
    isAvailable: true,
    rating: 4.92,
    specialties: ['여성 종원 계보 정밀 등재', '직제학공파 항렬 외 작명 고증', '조선조 문과 방목 대조'],
  },
  {
    id: 'master-park-01',
    name: '박영훈',
    hanja: '朴永勳',
    clanName: '밀양 박씨 규정공파',
    surname: '박',
    organization: '밀양박씨 대종중 학술자문위원회',
    roleTitle: '대종중 보첩심의위원장',
    experienceYears: 32,
    email: 'milyang.park.master@jokbo.kr',
    phone: '02-588-4419',
    intro: '신라 오릉보존회 및 밀양박씨 대동보 편찬 실무를 총괄해온 전통 족보학의 대가로, 현대식 개명 인물의 혈통 복원에 탁월합니다.',
    verifiedCount: 1310,
    isAvailable: true,
    rating: 4.96,
    specialties: ['현대식 개명자 원적 복원', '규정공파 분파도 대조', '지파간 상속 혈맥 확인'],
  },
  {
    id: 'master-kwon-01',
    name: '권순택',
    hanja: '權純澤',
    clanName: '안동 권씨 추밀공파',
    surname: '권',
    organization: '안동권씨 대종원 족보연구실',
    roleTitle: '안동 성화보(成化譜) 연구원장',
    experienceYears: 27,
    email: 'andong.kwon.master@jokbo.kr',
    phone: '054-858-1466',
    intro: '한국 최고(最古)의 성화보 연구 및 안동권씨 대동보 총람을 전산화한 계보학자입니다.',
    verifiedCount: 940,
    isAvailable: true,
    rating: 4.94,
    specialties: ['성화보 원전 대조', '고문서 판독', '남녀 동등 기재 고증'],
  },
];

/**
 * Service Tier Pricing & Options (유료 감정 서비스 등급 및 수수료 체계)
 */
export const SERVICE_TIER_OPTIONS: ServiceTierOption[] = [
  {
    tier: 'basic',
    title: '기본 제적·호적 전산 대조',
    price: 30000,
    priceText: '30,000원',
    durationText: '1~2일 소요',
    badge: '빠른 확인',
    description: '제적등본과 조부모 성함을 바탕으로 문중 전산 DB에서 직계 세수를 신속하게 대조합니다.',
    features: [
      '문중 전산망 직계 계통 1차 확인',
      '부모/조부 혈맥 연결성 검증',
      '세(世) 및 세손(世孫) 공식 기산표 제공',
      '이메일 검증 결과 요약서 발송',
    ],
  },
  {
    tier: 'standard',
    title: '대동보 원전 수기 실사 (추천)',
    price: 50000,
    priceText: '50,000원',
    durationText: '2~3일 소요',
    badge: '가장 인기 · 정밀 고증',
    description: '종친회에 보관된 고문헌 대동보 실물을 마스터가 직접 실사하여, 순한글/종교적 성명의 공식 세손을 확정합니다.',
    features: [
      '종친회 보관 한문 대동보(大同譜) 실물 수기 대조',
      '순한글/종교적 성명의 항렬 대체 세손 공식 판정',
      '조선시대 족보 기산 원칙에 따른 오차 완벽 해결',
      '족보 마스터 직인 날인된 정밀 고증서(PDF) 발급',
      '1:1 고증 문의 및 진행 상황 실시간 SMS/이메일 알림',
    ],
  },
  {
    tier: 'premium',
    title: '종중 공인 가문 인증서 발급',
    price: 100000,
    priceText: '100,000원',
    durationText: '3~5일 소요',
    badge: '최고 권위 · 영구 보존',
    description: '대종회 공식 편찬위원회 정식 심의를 거쳐, 영구 보존용 가문 공인 등재 번호와 실물 보첩 인증서를 발행합니다.',
    features: [
      '대동보 원전 실사 및 편찬위원회 전원 일치 심의',
      '가문 대동보 차기 개수판 정식 등재 권리 부여',
      '디지털 위변조 방지 블록체인 가문 공인 증서 발급',
      '고급 전통 한지 케이스 실물 공인서 우편 발송 (무료)',
      '평생 족보 마스터 가문 전례 자문 우선권 부여',
    ],
  },
];

/**
 * Initial In-Memory Requests (샘플 고증 의뢰 및 진행 내역)
 */
let storedRequests: MasterVerificationRequest[] = [
  {
    id: 'REQ-2026-0920-001',
    memberId: 'pat-4-2',
    memberName: '김하은',
    memberClan: '경주 김씨 판도판서공파',
    memberGender: 'F',
    memberBirthDate: '2022-09-05',
    parentInfo: '부: 김준혁(金準赫), 모: 정서연(鄭瑞然)',
    grandParentInfo: '조부: 김영수(金榮洙), 조모: 이은경(李恩慶)',
    nonHangnyeolReason: 'hangul_pure',
    reasonDetail: '순우리말 이름(하은)으로 지어져 30세 토(土) 변 항렬자(潤/圭)가 성명에 직접 들어가지 않음.',
    masterId: 'master-kim-01',
    masterName: '김상원',
    masterOrganization: '경주김씨 대종회 족보편찬위원회',
    masterEmail: 'gyeongju.kim.master@jokbo.kr',
    serviceTier: 'standard',
    serviceFee: 50000,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    paidAt: '2026-09-20 09:30',
    applicantName: '김준혁',
    applicantPhone: '010-3847-1920',
    applicantEmail: 'junhyuk.kim@jokbo.com',
    requestMemo: '안녕하세요 마스터님. 딸 아이 이름이 순우리말이라 족보상 몇 세손에 해당하는지 대동보 원전으로 정밀 실사 부탁드립니다.',
    attachedDocsSummary: ['가족관계증명서(상세)', '김영수 조부 제적등본'],
    status: 'document_verifying', // 대동보 원전 수기 실사 진행 중
    submittedAt: '2026-09-20 09:30',
    updatedAt: '2026-09-20 09:45',
    masterReviewNote: '【마스터 1차 소견】: 부친 김준혁(29세·赫 항렬)의 장녀로서 직계 계통 무결성이 확인되었습니다. 현재 대종회 소장 무진보(戊辰譜) 제14권 382페이지 판도판서공파 30세(29세손) 계통부에 등재 실사 중입니다.',
    confirmedClanGen: 30,
    confirmedDescendantOrder: 29,
  },
];

/**
 * Helper: Find masters by clan or surname
 */
export function getMastersForClan(clanName?: string, surname?: string): GenealogyMaster[] {
  if (!clanName && !surname) return GENEALOGY_MASTERS;

  const clanFiltered = clanName
    ? GENEALOGY_MASTERS.filter((m) => clanName.includes(m.surname) || clanName.includes(m.clanName.split(' ')[0]))
    : [];

  if (clanFiltered.length > 0) return clanFiltered;

  if (surname) {
    const surnameFiltered = GENEALOGY_MASTERS.filter((m) => m.surname === surname);
    if (surnameFiltered.length > 0) return surnameFiltered;
  }

  return GENEALOGY_MASTERS;
}

export function getAllMasters(): GenealogyMaster[] {
  return GENEALOGY_MASTERS;
}

export function getMasterById(masterId: string): GenealogyMaster | undefined {
  return GENEALOGY_MASTERS.find((m) => m.id === masterId);
}

export function getRequestsForMember(memberId: string): MasterVerificationRequest[] {
  return storedRequests.filter((r) => r.memberId === memberId);
}

export function getAllRequests(): MasterVerificationRequest[] {
  return [...storedRequests];
}

export function submitMasterRequest(newRequest: MasterVerificationRequest): MasterVerificationRequest {
  storedRequests = [newRequest, ...storedRequests];
  return newRequest;
}

export function updateMasterRequestStatus(
  requestId: string,
  newStatus: MasterVerificationRequest['status'],
  masterNote?: string
): boolean {
  const req = storedRequests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = newStatus;
  req.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
  if (masterNote) req.masterReviewNote = masterNote;
  if (newStatus === 'approved') {
    req.completedAt = req.updatedAt;
    req.issuedCertificateNo = '公認-慶州金氏-2026-0089號';
  }
  return true;
}
