// Korean Hanja Dictionary & Surname Clan Recommender Utility

export interface HanjaCandidate {
  hanja: string;
  reading: string;
  meaning: string;
}

// 1. 한국인 성명 및 성씨에 가장 널리 쓰이는 음절별 한자 사전 (대법원 인명용 한자 기반 핵심 선별)
export const KOREAN_HANJA_DICT: Record<string, HanjaCandidate[]> = {
  // 주요 성씨
  최: [
    { hanja: '崔', reading: '최', meaning: '높을 최 / 성 최' },
  ],
  김: [
    { hanja: '金', reading: '김', meaning: '쇠 김 / 성 김' },
  ],
  이: [
    { hanja: '李', reading: '이', meaning: '오얏 리 / 성 이' },
  ],
  박: [
    { hanja: '朴', reading: '박', meaning: '순박할 박 / 성 박' },
  ],
  정: [
    { hanja: '鄭', reading: '정', meaning: '나라 정 / 성 정' },
    { hanja: '正', reading: '정', meaning: '바를 정' },
    { hanja: '廷', reading: '정', meaning: '조정 정' },
    { hanja: '靜', reading: '정', meaning: '고요할 정' },
    { hanja: '貞', reading: '정', meaning: '곧을 정' },
    { hanja: '禎', reading: '정', meaning: '상서로울 정' },
    { hanja: '定', reading: '정', meaning: '정할 정' },
  ],
  강: [
    { hanja: '姜', reading: '강', meaning: '성 강' },
    { hanja: '康', reading: '강', meaning: '편안할 강' },
    { hanja: '剛', reading: '강', meaning: '굳셀 강' },
    { hanja: '江', reading: '강', meaning: '강 강' },
  ],
  조: [
    { hanja: '趙', reading: '조', meaning: '나라 조 / 성 조' },
    { hanja: '曺', reading: '조', meaning: '무리 조 / 성 조' },
    { hanja: '祚', reading: '조', meaning: '복 조' },
    { hanja: '照', reading: '조', meaning: '비칠 조' },
  ],
  윤: [
    { hanja: '尹', reading: '윤', meaning: '다스릴 윤 / 성 윤' },
    { hanja: '潤', reading: '윤', meaning: '윤택할 윤' },
    { hanja: '允', reading: '윤', meaning: '진실로 윤' },
  ],
  장: [
    { hanja: '張', reading: '장', meaning: '베풀 장 / 성 장' },
    { hanja: '璋', reading: '장', meaning: '옥 장' },
    { hanja: '章', reading: '장', meaning: '글 장' },
    { hanja: '莊', reading: '장', meaning: '엄숙할 장' },
  ],
  임: [
    { hanja: '林', reading: '임', meaning: '수풀 림 / 성 임' },
    { hanja: '任', reading: '임', meaning: '맡길 임 / 성 임' },
  ],
  한: [
    { hanja: '韓', reading: '한', meaning: '나라 한 / 성 한' },
    { hanja: '漢', reading: '한', meaning: '한수 한' },
    { hanja: '瀚', reading: '한', meaning: '넓고 클 한' },
  ],
  신: [
    { hanja: '申', reading: '신', meaning: '납 신 / 성 신' },
    { hanja: '辛', reading: '신', meaning: '매울 신 / 성 신' },
    { hanja: '愼', reading: '신', meaning: '삼갈 신 / 성 신' },
    { hanja: '信', reading: '신', meaning: '믿을 신' },
  ],
  권: [
    { hanja: '權', reading: '권', meaning: '권세 권 / 성 권' },
  ],
  황: [
    { hanja: '黃', reading: '황', meaning: '누를 황 / 성 황' },
  ],
  안: [
    { hanja: '安', reading: '안', meaning: '편안할 안 / 성 안' },
  ],
  송: [
    { hanja: '宋', reading: '송', meaning: '송나라 송 / 성 송' },
  ],
  유: [
    { hanja: '柳', reading: '유', meaning: '버들 류 / 성 유' },
    { hanja: '劉', reading: '유', meaning: '성씨 유' },
    { hanja: '兪', reading: '유', meaning: '맑을 유' },
    { hanja: '裕', reading: '유', meaning: '넉넉할 유' },
    { hanja: '柔', reading: '유', meaning: '부드러울 유' },
  ],
  류: [
    { hanja: '柳', reading: '류', meaning: '버들 류 / 성 류' },
  ],
  홍: [
    { hanja: '洪', reading: '홍', meaning: '넓을 홍 / 성 홍' },
  ],
  양: [
    { hanja: '梁', reading: '양', meaning: '들보 양 / 성 양' },
    { hanja: '楊', reading: '양', meaning: '버들 양 / 성 양' },
  ],
  오: [
    { hanja: '吳', reading: '오', meaning: '오나라 오 / 성 오' },
  ],
  서: [
    { hanja: '徐', reading: '서', meaning: '천천히할 서 / 성 서' },
    { hanja: '瑞', reading: '서', meaning: '상서로울 서' },
    { hanja: '緖', reading: '서', meaning: '실마리 서' },
  ],
  백: [
    { hanja: '白', reading: '백', meaning: '흰 백 / 성 백' },
  ],
  허: [
    { hanja: '許', reading: '허', meaning: '허락할 허 / 성 허' },
  ],

  // 일반 이름 음절 (가장 빈번하게 사용되는 인명 한자)
  동: [
    { hanja: '東', reading: '동', meaning: '동녘 동' },
    { hanja: '棟', reading: '동', meaning: '용마루 동' },
    { hanja: '同', reading: '동', meaning: '한가지 동' },
    { hanja: '童', reading: '동', meaning: '아이 동' },
  ],
  현: [
    { hanja: '炫', reading: '현', meaning: '밝을 현' },
    { hanja: '鉉', reading: '현', meaning: '솥귀 현' },
    { hanja: '賢', reading: '현', meaning: '어질 현' },
    { hanja: '顯', reading: '현', meaning: '나타날 현' },
    { hanja: '玹', reading: '현', meaning: '옥빛 현' },
  ],
  준: [
    { hanja: '俊', reading: '준', meaning: '준걸 준' },
    { hanja: '準', reading: '준', meaning: '평평할 준' },
    { hanja: '晙', reading: '준', meaning: '밝을 준' },
    { hanja: '浚', reading: '준', meaning: '깊을 준' },
    { hanja: '濬', reading: '준', meaning: '깊을 준' },
  ],
  혁: [
    { hanja: '赫', reading: '혁', meaning: '빛날 혁' },
    { hanja: '爀', reading: '혁', meaning: '불빛 혁' },
    { hanja: '奕', reading: '혁', meaning: '클 혁' },
  ],
  민: [
    { hanja: '敏', reading: '민', meaning: '민첩할 민' },
    { hanja: '旼', reading: '민', meaning: '화할 민' },
    { hanja: '玟', reading: '민', meaning: '옥돌 민' },
    { hanja: '珉', reading: '민', meaning: '옥돌 민' },
    { hanja: '旻', reading: '민', meaning: '하늘 민' },
  ],
  호: [
    { hanja: '浩', reading: '호', meaning: '넓을 호' },
    { hanja: '鎬', reading: '호', meaning: '냄비 호' },
    { hanja: '昊', reading: '호', meaning: '하늘 호' },
    { hanja: '晧', reading: '호', meaning: '밝을 호' },
    { hanja: '虎', reading: '호', meaning: '범 호' },
  ],
  영: [
    { hanja: '英', reading: '영', meaning: '꽃부리 영' },
    { hanja: '永', reading: '영', meaning: '길 영' },
    { hanja: '榮', reading: '영', meaning: '영화 영' },
    { hanja: '泳', reading: '영', meaning: '헤엄칠 영' },
    { hanja: '瑛', reading: '영', meaning: '옥빛 영' },
  ],
  진: [
    { hanja: '鎭', reading: '진', meaning: '진압할 진' },
    { hanja: '眞', reading: '진', meaning: '참 진' },
    { hanja: '振', reading: '진', meaning: '떨칠 진' },
    { hanja: '珍', reading: '진', meaning: '보배 진' },
    { hanja: '辰', reading: '진', meaning: '별 진' },
  ],
  철: [
    { hanja: '澈', reading: '철', meaning: '맑을 철' },
    { hanja: '哲', reading: '철', meaning: '밝을 철' },
    { hanja: '鐵', reading: '철', meaning: '쇠 철' },
  ],
  연: [
    { hanja: '淵', reading: '연', meaning: '못 연' },
    { hanja: '然', reading: '연', meaning: '그러할 연' },
    { hanja: '延', reading: '연', meaning: '끌 연' },
    { hanja: '娟', reading: '연', meaning: '예쁠 연' },
    { hanja: '鍊', reading: '연', meaning: '단련할 연' },
  ],
  우: [
    { hanja: '宇', reading: '우', meaning: '집 우' },
    { hanja: '佑', reading: '우', meaning: '도울 우' },
    { hanja: '祐', reading: '우', meaning: '복 우' },
    { hanja: '雨', reading: '우', meaning: '비 우' },
    { hanja: '遇', reading: '우', meaning: '만날 우' },
  ],
  태: [
    { hanja: '泰', reading: '태', meaning: '클 태' },
    { hanja: '太', reading: '태', meaning: '클 태' },
    { hanja: '兌', reading: '태', meaning: '바꿀 태' },
  ],
  수: [
    { hanja: '秀', reading: '수', meaning: '빼어날 수' },
    { hanja: '洙', reading: '수', meaning: '물가 수' },
    { hanja: '壽', reading: '수', meaning: '목숨 수' },
    { hanja: '修', reading: '수', meaning: '닦을 수' },
  ],
  지: [
    { hanja: '志', reading: '지', meaning: '뜻 지' },
    { hanja: '智', reading: '지', meaning: '지혜 지' },
    { hanja: '知', reading: '지', meaning: '알 지' },
    { hanja: '祉', reading: '지', meaning: '복 지' },
  ],
  훈: [
    { hanja: '勳', reading: '훈', meaning: '공 훈' },
    { hanja: '訓', reading: '훈', meaning: '가르칠 훈' },
    { hanja: '燻', reading: '훈', meaning: '그을릴 훈' },
  ],
  성: [
    { hanja: '成', reading: '성', meaning: '이룰 성' },
    { hanja: '聖', reading: '성', meaning: '성스러울 성' },
    { hanja: '星', reading: '성', meaning: '별 성' },
    { hanja: '盛', reading: '성', meaning: '성할 성' },
  ],
  재: [
    { hanja: '在', reading: '재', meaning: '있을 재' },
    { hanja: '載', reading: '재', meaning: '실을 재' },
    { hanja: '宰', reading: '재', meaning: '재상 재' },
    { hanja: '材', reading: '재', meaning: '재목 재' },
  ],
  원: [
    { hanja: '源', reading: '원', meaning: '근원 원' },
    { hanja: '元', reading: '원', meaning: '으뜸 원' },
    { hanja: '遠', reading: '원', meaning: '멀 원' },
    { hanja: '苑', reading: '원', meaning: '동산 원' },
  ],
  승: [
    { hanja: '昇', reading: '승', meaning: '오를 승' },
    { hanja: '承', reading: '승', meaning: '이을 승' },
    { hanja: '勝', reading: '승', meaning: '이길 승' },
  ],
  은: [
    { hanja: '恩', reading: '은', meaning: '은혜 은' },
    { hanja: '銀', reading: '은', meaning: '은 은' },
    { hanja: '殷', reading: '은', meaning: '성할 은' },
  ],
  하: [
    { hanja: '河', reading: '하', meaning: '물 하' },
    { hanja: '夏', reading: '하', meaning: '여름 하' },
    { hanja: '荷', reading: '하', meaning: '연 하' },
  ],
};

// 2. 성씨별 본관 및 대표 분파 데이터베이스
export interface ClanBranchInfo {
  bonGwan: string; // 예: 경주 최씨
  branches: string[]; // 예: ['사성공파', '관가정공파', '광정공파']
}

export const SURNAME_CLAN_DATABASE: Record<string, ClanBranchInfo[]> = {
  최: [
    {
      bonGwan: '경주 최씨 (慶州 崔氏)',
      branches: ['사성공파', '관가정공파', '광정공파', '정랑공파', '상서공파', '판서공파'],
    },
    {
      bonGwan: '전주 최씨 (全州 崔氏)',
      branches: ['문성공파', '사도공파', '문충공파', '안련공파', '평도공파'],
    },
    {
      bonGwan: '해주 최씨 (海州 崔氏)',
      branches: ['문헌공파', '사정공파', '교리공파', '참판공파'],
    },
    {
      bonGwan: '강릉 최씨 (江陵 崔氏)',
      branches: ['충재공파', '대경공파', '통천공파', '판서공파'],
    },
    {
      bonGwan: '화순 최씨 (和順 崔氏)',
      branches: ['대사헌공파', '판서공파', '부사공파'],
    },
    {
      bonGwan: '탐진 최씨 (耽津 崔氏)',
      branches: ['장령공파', '참판공파', '진사공파'],
    },
    {
      bonGwan: '삭녕 최씨 (朔寧 崔氏)',
      branches: ['문정공파', '판서공파'],
    },
    {
      bonGwan: '동주 최씨 (東州 崔氏)',
      branches: ['철원공파', '직제학공파'],
    },
  ],
  김: [
    {
      bonGwan: '경주 김씨 (慶州 金氏)',
      branches: ['판도판서공파', '태사공파', '계림군파', '상서공파', '영분공파'],
    },
    {
      bonGwan: '김해 김씨 (金海 金氏)',
      branches: ['삼현파', '경파', '사군파', '문경공파', '판도판서공파'],
    },
    {
      bonGwan: '안동 김씨 (安東 金氏)',
      branches: ['구안동파', '신안동파', '문온공파', '제학공파'],
    },
    {
      bonGwan: '광산 김씨 (光山 金氏)',
      branches: ['사계공파', '문정공파', '양간공파', '낭장공파'],
    },
    {
      bonGwan: '강릉 김씨 (江陵 金氏)',
      branches: ['명주군파', '태사공파', '판서공파'],
    },
    {
      bonGwan: '의성 김씨 (義城 金氏)',
      branches: ['태자파', '찬성공파', '문민공파'],
    },
    {
      bonGwan: '선산 김씨 (善山 金氏)',
      branches: ['백암파', '농암파', '문하시중공파'],
    },
  ],
  이: [
    {
      bonGwan: '전주 이씨 (全州 李氏)',
      branches: ['효령대군파', '밀성군파', '덕천군파', '광평대군파', '양녕대군파', '무림군파'],
    },
    {
      bonGwan: '경주 이씨 (慶州 李氏)',
      branches: ['백사공파', '익재공파', '국당공파', '상서공파', '월성군파'],
    },
    {
      bonGwan: '광주 이씨 (廣州 李氏)',
      branches: ['석탄공파', '둔촌공파', '좌통례공파'],
    },
    {
      bonGwan: '연안 이씨 (延安 李氏)',
      branches: ['저헌공파', '별제공파', '판관공파'],
    },
    {
      bonGwan: '한산 이씨 (韓山 李氏)',
      branches: ['목은공파', '문효공파', '정랑공파'],
    },
    {
      bonGwan: '성주 이씨 (星州 李氏)',
      branches: ['교리공파', '참판공파', '문열공파'],
    },
  ],
  박: [
    {
      bonGwan: '밀양 박씨 (密陽 朴氏)',
      branches: ['규정공파', '은산군파', '문열공파', '충헌공파', '사우당파'],
    },
    {
      bonGwan: '반남 박씨 (潘南 朴氏)',
      branches: ['호군공파', '세양공파', '참판공파'],
    },
    {
      bonGwan: '함양 박씨 (咸陽 朴氏)',
      branches: ['어사공파', '소감공파', '부사공파'],
    },
    {
      bonGwan: '순천 박씨 (順天 朴氏)',
      branches: ['판서공파', '참의공파'],
    },
    {
      bonGwan: '고령 박씨 (高靈 朴氏)',
      branches: ['어사공파', '부정공파'],
    },
  ],
  정: [
    {
      bonGwan: '동래 정씨 (東萊 鄭氏)',
      branches: ['직제학공파', '대제학공파', '참판공파', '교리공파', '수찬공파'],
    },
    {
      bonGwan: '경주 정씨 (慶州 鄭氏)',
      branches: ['문헌공파', '양경공파', '판윤공파'],
    },
    {
      bonGwan: '진주 정씨 (晉州 鄭氏)',
      branches: ['은열공파', '공대공파', '어사공파'],
    },
    {
      bonGwan: '연일 정씨 (延日 鄭氏)',
      branches: ['포은공파', '송강공파', '생원공파'],
    },
    {
      bonGwan: '하동 정씨 (河東 鄭氏)',
      branches: ['일두공파', '판서공파'],
    },
  ],
  강: [
    {
      bonGwan: '진주 강씨 (晉州 姜氏)',
      branches: ['은열공파', '박사공파', '관서공파', '통정공파'],
    },
    {
      bonGwan: '신천 강씨 (信川 康氏)',
      branches: ['문헌공파', '부사공파'],
    },
  ],
  조: [
    {
      bonGwan: '한양 조씨 (漢陽 趙氏)',
      branches: ['양경공파', '정원공파', '참판공파'],
    },
    {
      bonGwan: '풍양 조씨 (豊壤 趙氏)',
      branches: ['회양공파', '한산공파'],
    },
    {
      bonGwan: '창녕 조씨 (昌寧 曺氏)',
      branches: ['태학사공파', '대사헌공파'],
    },
    {
      bonGwan: '함안 조씨 (咸安 趙氏)',
      branches: ['어모공파', '참의공파'],
    },
  ],
  윤: [
    {
      bonGwan: '파평 윤씨 (坡平 尹氏)',
      branches: ['판도공파', '소정공파', '태위공파', '정정공파'],
    },
    {
      bonGwan: '해남 윤씨 (海南 尹氏)',
      branches: ['고산공파', '어초은공파'],
    },
  ],
  장: [
    {
      bonGwan: '인동 장씨 (仁同 張氏)',
      branches: ['남산파', '진상파', '진사공파'],
    },
    {
      bonGwan: '안동 장씨 (安東 張氏)',
      branches: ['태사공파', '판서공파'],
    },
  ],
  임: [
    {
      bonGwan: '나주 임씨 (羅州 林氏)',
      branches: ['절도사공파', '참판공파', '판서공파'],
    },
    {
      bonGwan: '평택 임씨 (平澤 林氏)',
      branches: ['충정공파', '전서공파'],
    },
  ],
  한: [
    {
      bonGwan: '청주 한씨 (淸州 韓氏)',
      branches: ['양절공파', '문정공파', '충성공파', '참판공파'],
    },
  ],
  신: [
    {
      bonGwan: '평산 신씨 (平山 申氏)',
      branches: ['사간공파', '문희공파', '정언공파'],
    },
    {
      bonGwan: '고령 신씨 (高靈 申氏)',
      branches: ['문충공파', '영성군파'],
    },
  ],
  황: [
    {
      bonGwan: '창원 황씨 (昌原 黃氏)',
      branches: ['공희공파', '회산군파'],
    },
    {
      bonGwan: '장수 황씨 (長水 黃氏)',
      branches: ['방촌공파', '호안공파'],
    },
  ],
  안: [
    {
      bonGwan: '순흥 안씨 (順興 安氏)',
      branches: ['참판공파', '양도공파', '안무사공파'],
    },
  ],
  송: [
    {
      bonGwan: '은진 송씨 (恩津 宋氏)',
      branches: ['우암공파', '동춘당공파', '정랑공파'],
    },
    {
      bonGwan: '여산 송씨 (礪山 宋氏)',
      branches: ['원윤공파', '밀직공파'],
    },
  ],
  홍: [
    {
      bonGwan: '남양 홍씨 (南陽 洪氏)',
      branches: ['당홍계 (판원사공파)', '토홍계 (문정공파)'],
    },
    {
      bonGwan: '풍산 홍씨 (豊山 洪氏)',
      branches: ['모당공파', '부사공파'],
    },
  ],
  양: [
    {
      bonGwan: '남원 양씨 (南原 梁氏)',
      branches: ['대방군파', '병부공파', '용성군파'],
    },
    {
      bonGwan: '제주 양씨 (濟州 梁氏)',
      branches: ['성주공파', '판서공파'],
    },
  ],
};

// 성명에서 성씨(1자 또는 복성 2자) 추출 함수
export function extractSurname(fullName: string): string {
  const clean = fullName.trim();
  if (!clean) return '';

  // 2자 복성 체크 (남궁, 황보, 제갈, 사공, 선우, 서문, 독고)
  const compoundSurnames = ['남궁', '황보', '제갈', '사공', '선우', '서문', '독고'];
  for (const comp of compoundSurnames) {
    if (clean.startsWith(comp)) {
      return comp;
    }
  }

  // 1자 성씨
  return clean.charAt(0);
}

// 음절별 한자 후보 목록 가져오기
export function getHanjaCandidates(syllable: string): HanjaCandidate[] {
  return KOREAN_HANJA_DICT[syllable] || [];
}

// 성씨에 따른 본관 및 파 추천 목록 생성
export function getRecommendedClans(surname: string): { label: string; value: string }[] {
  if (!surname) {
    return [
      { label: '경주 김씨 판도판서공파', value: '경주 김씨 판도판서공파' },
      { label: '전주 이씨 효령대군파', value: '전주 이씨 효령대군파' },
      { label: '밀양 박씨 규정공파', value: '밀양 박씨 규정공파' },
      { label: '동래 정씨 직제학공파', value: '동래 정씨 직제학공파' },
    ];
  }

  const clanList = SURNAME_CLAN_DATABASE[surname];
  if (!clanList || clanList.length === 0) {
    // DB에 직접 지정되지 않은 성씨의 경우 표준 기본 본관 생성
    return [
      { label: `${surname}씨 본가 (직접 입력)`, value: `${surname}씨 본가` },
      { label: `경주 ${surname}씨`, value: `경주 ${surname}씨` },
      { label: `전주 ${surname}씨`, value: `전주 ${surname}씨` },
      { label: `안동 ${surname}씨`, value: `안동 ${surname}씨` },
    ];
  }

  const results: { label: string; value: string }[] = [];

  // 각 본관의 대표 파들을 조합하여 추천 리스트 생성
  for (const clan of clanList) {
    const clanNameShort = clan.bonGwan.split(' ')[0] + ' ' + clan.bonGwan.split(' ')[1];
    // 상위 대표 2개 파 추가
    for (let i = 0; i < Math.min(2, clan.branches.length); i++) {
      const branch = clan.branches[i];
      results.push({
        label: `${clanNameShort} ${branch}`,
        value: `${clanNameShort} ${branch}`,
      });
    }
  }

  return results.slice(0, 8); // 최대 8개 추천 버튼 제공
}
