// Korean Hanja Dictionary & Surname Clan Recommender Utility

export interface HanjaCandidate {
  hanja: string;
  reading: string;
  meaning: string;
}

// 1. 한국인 성명 및 성씨에 가장 널리 쓰이는 음절별 한자 사전 (대법원 인명용 한자 기반 핵심 선별)
export const KOREAN_HANJA_DICT: Record<string, HanjaCandidate[]> = {
  최: [
    { hanja: '崔', reading: '최', meaning: '높을 최 / 성 최' },
  ],
  김: [
    { hanja: '金', reading: '김', meaning: '쇠 김 / 성 김' },
  ],
  이: [
    { hanja: '李', reading: '이', meaning: '오얏 리 / 성 이' },
    { hanja: '怡', reading: '이', meaning: '기쁠 이' },
    { hanja: '異', reading: '이', meaning: '다를 이' },
    { hanja: '履', reading: '이', meaning: '밟을 이' },
  ],
  박: [
    { hanja: '朴', reading: '박', meaning: '순박할 박 / 성 박' },
    { hanja: '博', reading: '박', meaning: '넓을 박' },
    { hanja: '薄', reading: '박', meaning: '엷을 박' },
  ],
  정: [
    { hanja: '鄭', reading: '정', meaning: '나라 정 / 성 정' },
    { hanja: '正', reading: '정', meaning: '바를 정' },
    { hanja: '廷', reading: '정', meaning: '조정 정' },
    { hanja: '靜', reading: '정', meaning: '고요할 정' },
    { hanja: '貞', reading: '정', meaning: '곧을 정' },
    { hanja: '禎', reading: '정', meaning: '상서로울 정' },
    { hanja: '定', reading: '정', meaning: '정할 정' },
    { hanja: '晶', reading: '정', meaning: '밝을 정' },
    { hanja: '庭', reading: '정', meaning: '뜰 정' },
    { hanja: '情', reading: '정', meaning: '뜻 정' },
  ],
  강: [
    { hanja: '姜', reading: '강', meaning: '성 강' },
    { hanja: '康', reading: '강', meaning: '편안할 강' },
    { hanja: '剛', reading: '강', meaning: '굳셀 강' },
    { hanja: '江', reading: '강', meaning: '강 강' },
    { hanja: '鋼', reading: '강', meaning: '강철 강' },
    { hanja: '綱', reading: '강', meaning: '벼리 강' },
  ],
  조: [
    { hanja: '趙', reading: '조', meaning: '나라 조 / 성 조' },
    { hanja: '曺', reading: '조', meaning: '무리 조 / 성 조' },
    { hanja: '祚', reading: '조', meaning: '복 조' },
    { hanja: '照', reading: '조', meaning: '비칠 조' },
    { hanja: '朝', reading: '조', meaning: '아침 조' },
    { hanja: '助', reading: '조', meaning: '도울 조' },
  ],
  윤: [
    { hanja: '尹', reading: '윤', meaning: '다스릴 윤 / 성 윤' },
    { hanja: '潤', reading: '윤', meaning: '윤택할 윤' },
    { hanja: '允', reading: '윤', meaning: '진실로 윤' },
    { hanja: '胤', reading: '윤', meaning: '자손 윤' },
  ],
  장: [
    { hanja: '張', reading: '장', meaning: '베풀 장 / 성 장' },
    { hanja: '璋', reading: '장', meaning: '옥 장' },
    { hanja: '章', reading: '장', meaning: '글 장' },
    { hanja: '莊', reading: '장', meaning: '엄숙할 장' },
    { hanja: '長', reading: '장', meaning: '길 장' },
    { hanja: '奬', reading: '장', meaning: '권할 장' },
  ],
  임: [
    { hanja: '林', reading: '임', meaning: '수풀 림 / 성 임' },
    { hanja: '任', reading: '임', meaning: '맡길 임 / 성 임' },
    { hanja: '壬', reading: '임', meaning: '아홉째천간 임' },
  ],
  한: [
    { hanja: '韓', reading: '한', meaning: '나라 한 / 성 한' },
    { hanja: '漢', reading: '한', meaning: '한수 한' },
    { hanja: '瀚', reading: '한', meaning: '넓고 클 한' },
    { hanja: '翰', reading: '한', meaning: '날개 한' },
  ],
  신: [
    { hanja: '申', reading: '신', meaning: '납 신 / 성 신' },
    { hanja: '辛', reading: '신', meaning: '매울 신 / 성 신' },
    { hanja: '愼', reading: '신', meaning: '삼갈 신 / 성 신' },
    { hanja: '信', reading: '신', meaning: '믿을 신' },
    { hanja: '新', reading: '신', meaning: '새 신' },
    { hanja: '晨', reading: '신', meaning: '새벽 신' },
  ],
  권: [
    { hanja: '權', reading: '권', meaning: '권세 권 / 성 권' },
    { hanja: '勸', reading: '권', meaning: '권할 권' },
  ],
  황: [
    { hanja: '黃', reading: '황', meaning: '누를 황 / 성 황' },
    { hanja: '滉', reading: '황', meaning: '깊을 황' },
    { hanja: '煌', reading: '황', meaning: '빛날 황' },
    { hanja: '皇', reading: '황', meaning: '임금 황' },
  ],
  안: [
    { hanja: '安', reading: '안', meaning: '편안할 안 / 성 안' },
    { hanja: '顔', reading: '안', meaning: '얼굴 안' },
  ],
  송: [
    { hanja: '宋', reading: '송', meaning: '송나라 송 / 성 송' },
    { hanja: '松', reading: '송', meaning: '소나무 송' },
    { hanja: '頌', reading: '송', meaning: '기릴 송' },
  ],
  유: [
    { hanja: '柳', reading: '유', meaning: '버들 류 / 성 유' },
    { hanja: '劉', reading: '유', meaning: '성씨 유' },
    { hanja: '兪', reading: '유', meaning: '맑을 유' },
    { hanja: '裕', reading: '유', meaning: '넉넉할 유' },
    { hanja: '柔', reading: '유', meaning: '부드러울 유' },
    { hanja: '有', reading: '유', meaning: '있을 유' },
    { hanja: '悠', reading: '유', meaning: '멀 유' },
    { hanja: '維', reading: '유', meaning: '바를 유' },
  ],
  류: [
    { hanja: '柳', reading: '류', meaning: '버들 류 / 성 류' },
    { hanja: '劉', reading: '류', meaning: '성씨 류' },
  ],
  홍: [
    { hanja: '洪', reading: '홍', meaning: '넓을 홍 / 성 홍' },
    { hanja: '弘', reading: '홍', meaning: '넓을 홍' },
    { hanja: '鴻', reading: '홍', meaning: '큰기러기 홍' },
    { hanja: '泓', reading: '홍', meaning: '깊을 홍' },
  ],
  양: [
    { hanja: '梁', reading: '양', meaning: '들보 양 / 성 양' },
    { hanja: '楊', reading: '양', meaning: '버들 양 / 성 양' },
    { hanja: '陽', reading: '양', meaning: '볕 양' },
    { hanja: '養', reading: '양', meaning: '기를 양' },
    { hanja: '襄', reading: '양', meaning: '도울 양' },
  ],
  오: [
    { hanja: '吳', reading: '오', meaning: '오나라 오 / 성 오' },
    { hanja: '吾', reading: '오', meaning: '나 오' },
    { hanja: '悟', reading: '오', meaning: '깨달을 오' },
  ],
  서: [
    { hanja: '徐', reading: '서', meaning: '천천히할 서 / 성 서' },
    { hanja: '瑞', reading: '서', meaning: '상서로울 서' },
    { hanja: '緖', reading: '서', meaning: '실마리 서' },
    { hanja: '序', reading: '서', meaning: '차례 서' },
    { hanja: '敍', reading: '서', meaning: '펼 서' },
    { hanja: '暑', reading: '서', meaning: '더울 서' },
  ],
  백: [
    { hanja: '白', reading: '백', meaning: '흰 백 / 성 백' },
    { hanja: '伯', reading: '백', meaning: '맏 백' },
  ],
  허: [
    { hanja: '許', reading: '허', meaning: '허락할 허 / 성 허' },
  ],
  남: [
    { hanja: '南', reading: '남', meaning: '남녘 남 / 성 남' },
    { hanja: '男', reading: '남', meaning: '사내 남' },
    { hanja: '湳', reading: '남', meaning: '물 이름 남' },
  ],
  심: [
    { hanja: '沈', reading: '심', meaning: '성 심' },
    { hanja: '心', reading: '심', meaning: '마음 심' },
    { hanja: '深', reading: '심', meaning: '깊을 심' },
    { hanja: '尋', reading: '심', meaning: '찾을 심' },
  ],
  노: [
    { hanja: '盧', reading: '노', meaning: '성 노' },
    { hanja: '魯', reading: '노', meaning: '노나라 노' },
    { hanja: '路', reading: '노', meaning: '길 로/노' },
    { hanja: '勞', reading: '노', meaning: '수고로울 노' },
  ],
  하: [
    { hanja: '河', reading: '하', meaning: '물 하 / 성 하' },
    { hanja: '夏', reading: '하', meaning: '여름 하' },
    { hanja: '荷', reading: '하', meaning: '연꽃 하' },
    { hanja: '賀', reading: '하', meaning: '하례할 하' },
    { hanja: '霞', reading: '하', meaning: '노을 하' },
  ],
  곽: [
    { hanja: '郭', reading: '곽', meaning: '성곽 곽 / 성 곽' },
  ],
  성: [
    { hanja: '成', reading: '성', meaning: '이룰 성 / 성 성' },
    { hanja: '聖', reading: '성', meaning: '성스러울 성' },
    { hanja: '星', reading: '성', meaning: '별 성' },
    { hanja: '盛', reading: '성', meaning: '성할 성' },
    { hanja: '誠', reading: '성', meaning: '정성 성' },
    { hanja: '城', reading: '성', meaning: '성 성' },
  ],
  차: [
    { hanja: '車', reading: '차', meaning: '수레 차 / 성 차' },
  ],
  주: [
    { hanja: '朱', reading: '주', meaning: '붉을 주 / 성 주' },
    { hanja: '周', reading: '주', meaning: '두루 주 / 성 주' },
    { hanja: '柱', reading: '주', meaning: '기둥 주' },
    { hanja: '宙', reading: '주', meaning: '집 주' },
    { hanja: '珠', reading: '주', meaning: '구슬 주' },
    { hanja: '洲', reading: '주', meaning: '섬 주' },
  ],
  우: [
    { hanja: '禹', reading: '우', meaning: '하우씨 우 / 성 우' },
    { hanja: '宇', reading: '우', meaning: '집 우' },
    { hanja: '佑', reading: '우', meaning: '도울 우' },
    { hanja: '祐', reading: '우', meaning: '복 우' },
    { hanja: '雨', reading: '우', meaning: '비 우' },
    { hanja: '遇', reading: '우', meaning: '만날 우' },
    { hanja: '友', reading: '우', meaning: '벗 우' },
    { hanja: '愚', reading: '우', meaning: '어리석을 우' },
    { hanja: '羽', reading: '우', meaning: '깃 우' },
  ],
  구: [
    { hanja: '具', reading: '구', meaning: '갖출 구 / 성 구' },
    { hanja: '丘', reading: '구', meaning: '언덕 구 / 성 구' },
    { hanja: '九', reading: '구', meaning: '아홉 구' },
    { hanja: '求', reading: '구', meaning: '구할 구' },
    { hanja: '久', reading: '구', meaning: '오랠 구' },
    { hanja: '口', reading: '구', meaning: '입 구' },
  ],
  전: [
    { hanja: '全', reading: '전', meaning: '온전할 전 / 성 전' },
    { hanja: '田', reading: '전', meaning: '밭 전 / 성 전' },
    { hanja: '錢', reading: '전', meaning: '돈 전 / 성 전' },
    { hanja: '典', reading: '전', meaning: '법 전' },
    { hanja: '前', reading: '전', meaning: '앞 전' },
    { hanja: '傳', reading: '전', meaning: '전할 전' },
  ],
  민: [
    { hanja: '閔', reading: '민', meaning: '성 민' },
    { hanja: '敏', reading: '민', meaning: '민첩할 민' },
    { hanja: '旼', reading: '민', meaning: '화할 민' },
    { hanja: '玟', reading: '민', meaning: '옥돌 민' },
    { hanja: '珉', reading: '민', meaning: '옥돌 민' },
    { hanja: '旻', reading: '민', meaning: '하늘 민' },
    { hanja: '民', reading: '민', meaning: '백성 민' },
  ],
  진: [
    { hanja: '陳', reading: '진', meaning: '베풀 진 / 성 진' },
    { hanja: '鎭', reading: '진', meaning: '진압할 진' },
    { hanja: '眞', reading: '진', meaning: '참 진' },
    { hanja: '振', reading: '진', meaning: '떨칠 진' },
    { hanja: '珍', reading: '진', meaning: '보배 진' },
    { hanja: '辰', reading: '진', meaning: '별 진' },
    { hanja: '進', reading: '진', meaning: '나아갈 진' },
    { hanja: '晉', reading: '진', meaning: '나아갈 진' },
  ],
  지: [
    { hanja: '池', reading: '지', meaning: '못 지 / 성 지' },
    { hanja: '智', reading: '지', meaning: '지혜 지' },
    { hanja: '志', reading: '지', meaning: '뜻 지' },
    { hanja: '知', reading: '지', meaning: '알 지' },
    { hanja: '祉', reading: '지', meaning: '복 지' },
    { hanja: '芝', reading: '지', meaning: '지초 지' },
    { hanja: '持', reading: '지', meaning: '가질 지' },
  ],
  엄: [
    { hanja: '嚴', reading: '엄', meaning: '엄할 엄 / 성 엄' },
  ],
  채: [
    { hanja: '蔡', reading: '채', meaning: '성 채' },
    { hanja: '采', reading: '채', meaning: '풍채 채' },
    { hanja: '彩', reading: '채', meaning: '채색 채' },
    { hanja: '埰', reading: '채', meaning: '사패지 채' },
  ],
  원: [
    { hanja: '源', reading: '원', meaning: '근원 원' },
    { hanja: '元', reading: '원', meaning: '으뜸 원' },
    { hanja: '遠', reading: '원', meaning: '멀 원' },
    { hanja: '苑', reading: '원', meaning: '동산 원' },
    { hanja: '原', reading: '원', meaning: '근본 원' },
  ],
  천: [
    { hanja: '千', reading: '천', meaning: '일천 천 / 성 천' },
    { hanja: '天', reading: '천', meaning: '하늘 천' },
    { hanja: '川', reading: '천', meaning: '내 천' },
  ],
  방: [
    { hanja: '方', reading: '방', meaning: '모 방 / 성 방' },
    { hanja: '房', reading: '방', meaning: '방 방 / 성 방' },
    { hanja: '邦', reading: '방', meaning: '나라 방 / 성 방' },
    { hanja: '芳', reading: '방', meaning: '꽃다울 방' },
  ],
  공: [
    { hanja: '孔', reading: '공', meaning: '구멍 공 / 성 공' },
    { hanja: '公', reading: '공', meaning: '공평할 공' },
    { hanja: '功', reading: '공', meaning: '공 공' },
  ],
  현: [
    { hanja: '玄', reading: '현', meaning: '검을 현 / 성 현' },
    { hanja: '炫', reading: '현', meaning: '밝을 현' },
    { hanja: '鉉', reading: '현', meaning: '솥귀 현' },
    { hanja: '賢', reading: '현', meaning: '어질 현' },
    { hanja: '顯', reading: '현', meaning: '나타날 현' },
    { hanja: '玹', reading: '현', meaning: '옥빛 현' },
    { hanja: '絃', reading: '현', meaning: '줄 현' },
    { hanja: '俔', reading: '현', meaning: '염탐할 현' },
  ],
  함: [
    { hanja: '咸', reading: '함', meaning: '다 함 / 성 함' },
    { hanja: '涵', reading: '함', meaning: '젖을 함' },
    { hanja: '含', reading: '함', meaning: '머금을 함' },
  ],
  변: [
    { hanja: '邊', reading: '변', meaning: '가 변 / 성 변' },
    { hanja: '卞', reading: '변', meaning: '성 변' },
  ],
  염: [
    { hanja: '廉', reading: '염', meaning: '청렴할 염 / 성 염' },
  ],
  여: [
    { hanja: '余', reading: '여', meaning: '나 여 / 성 여' },
    { hanja: '呂', reading: '여', meaning: '성 여' },
    { hanja: '汝', reading: '여', meaning: '너 여' },
    { hanja: '如', reading: '여', meaning: '같을 여' },
    { hanja: '麗', reading: '여', meaning: '고울 려/여' },
  ],
  추: [
    { hanja: '秋', reading: '추', meaning: '가을 추 / 성 추' },
    { hanja: '鄒', reading: '추', meaning: '추나라 추 / 성 추' },
  ],
  도: [
    { hanja: '都', reading: '도', meaning: '도읍 도 / 성 도' },
    { hanja: '道', reading: '도', meaning: '길 도' },
    { hanja: '度', reading: '도', meaning: '법도 도' },
    { hanja: '燾', reading: '도', meaning: '비출 도' },
    { hanja: '島', reading: '도', meaning: '섬 도' },
  ],
  석: [
    { hanja: '昔', reading: '석', meaning: '옛 석 / 성 석' },
    { hanja: '石', reading: '석', meaning: '돌 석 / 성 석' },
    { hanja: '錫', reading: '석', meaning: '주석 석 / 줄 석' },
    { hanja: '碩', reading: '석', meaning: '클 석' },
    { hanja: '奭', reading: '석', meaning: '클 석' },
  ],
  선: [
    { hanja: '宣', reading: '선', meaning: '베풀 선 / 성 선' },
    { hanja: '善', reading: '선', meaning: '착할 선' },
    { hanja: '鮮', reading: '선', meaning: '고울 선' },
    { hanja: '璿', reading: '선', meaning: '옥 선' },
    { hanja: '先', reading: '선', meaning: '먼저 선' },
    { hanja: '選', reading: '선', meaning: '가릴 선' },
  ],
  설: [
    { hanja: '薛', reading: '설', meaning: '성 설' },
    { hanja: '卨', reading: '설', meaning: '사람이름 설' },
    { hanja: '雪', reading: '설', meaning: '눈 설' },
  ],
  마: [
    { hanja: '馬', reading: '마', meaning: '말 마 / 성 마' },
    { hanja: '麻', reading: '마', meaning: '삼 마 / 성 마' },
  ],
  길: [
    { hanja: '吉', reading: '길', meaning: '길할 길 / 성 길' },
  ],
  연: [
    { hanja: '延', reading: '연', meaning: '끌 연 / 성 연' },
    { hanja: '燕', reading: '연', meaning: '제비 연 / 성 연' },
    { hanja: '淵', reading: '연', meaning: '못 연' },
    { hanja: '然', reading: '연', meaning: '그러할 연' },
    { hanja: '娟', reading: '연', meaning: '예쁠 연' },
    { hanja: '鍊', reading: '연', meaning: '단련할 연' },
    { hanja: '演', reading: '연', meaning: '넓힐 연' },
  ],
  위: [
    { hanja: '魏', reading: '위', meaning: '나라 위 / 성 위' },
    { hanja: '韋', reading: '위', meaning: '다룸가죽 위 / 성 위' },
    { hanja: '偉', reading: '위', meaning: '클 위' },
    { hanja: '衛', reading: '위', meaning: '지킬 위' },
    { hanja: '緯', reading: '위', meaning: '씨 위' },
  ],
  표: [
    { hanja: '表', reading: '표', meaning: '겉 표 / 성 표' },
    { hanja: '杓', reading: '표', meaning: '자루 표' },
  ],
  명: [
    { hanja: '明', reading: '명', meaning: '밝을 명 / 성 명' },
    { hanja: '命', reading: '명', meaning: '목숨 명' },
    { hanja: '銘', reading: '명', meaning: '새길 명' },
  ],
  기: [
    { hanja: '奇', reading: '기', meaning: '기이할 기 / 성 기' },
    { hanja: '箕', reading: '기', meaning: '키 기 / 성 기' },
    { hanja: '基', reading: '기', meaning: '터 기' },
    { hanja: '起', reading: '기', meaning: '일어날 기' },
    { hanja: '杞', reading: '기', meaning: '구기자 기' },
    { hanja: '祈', reading: '기', meaning: '빌 기' },
    { hanja: '祺', reading: '기', meaning: '복 기' },
    { hanja: '驥', reading: '기', meaning: '천리마 기' },
  ],
  반: [
    { hanja: '潘', reading: '반', meaning: '성 반' },
    { hanja: '班', reading: '반', meaning: '나눌 반 / 성 반' },
  ],
  라: [
    { hanja: '羅', reading: '라', meaning: '벌일 라 / 성 라' },
  ],
  왕: [
    { hanja: '王', reading: '왕', meaning: '임금 왕 / 성 왕' },
  ],
  금: [
    { hanja: '琴', reading: '금', meaning: '거문고 금 / 성 금' },
    { hanja: '錦', reading: '금', meaning: '비단 금' },
    { hanja: '今', reading: '금', meaning: '이제 금' },
  ],
  옥: [
    { hanja: '玉', reading: '옥', meaning: '구슬 옥 / 성 옥' },
    { hanja: '沃', reading: '옥', meaning: '기름질 옥' },
  ],
  육: [
    { hanja: '陸', reading: '육', meaning: '뭍 륙/육 / 성 육' },
    { hanja: '育', reading: '육', meaning: '기를 육' },
  ],
  인: [
    { hanja: '印', reading: '인', meaning: '도장 인 / 성 인' },
    { hanja: '仁', reading: '인', meaning: '어질 인' },
    { hanja: '寅', reading: '인', meaning: '동방 인' },
    { hanja: '人', reading: '인', meaning: '사람 인' },
    { hanja: '認', reading: '인', meaning: '알 인' },
  ],
  탁: [
    { hanja: '卓', reading: '탁', meaning: '높을 탁 / 성 탁' },
    { hanja: '鐸', reading: '탁', meaning: '목탁 탁' },
  ],
  국: [
    { hanja: '鞠', reading: '국', meaning: '공 국 / 성 국' },
    { hanja: '國', reading: '국', meaning: '나라 국' },
    { hanja: '菊', reading: '국', meaning: '국화 국' },
  ],
  남궁: [
    { hanja: '南宮', reading: '남궁', meaning: '복성 남궁' },
  ],
  황보: [
    { hanja: '皇甫', reading: '황보', meaning: '복성 황보' },
  ],
  제갈: [
    { hanja: '諸葛', reading: '제갈', meaning: '복성 제갈' },
  ],
  선우: [
    { hanja: '鮮于', reading: '선우', meaning: '복성 선우' },
  ],
  독고: [
    { hanja: '獨孤', reading: '독고', meaning: '복성 독고' },
  ],
  가: [
    { hanja: '佳', reading: '가', meaning: '아름다울 가' },
    { hanja: '嘉', reading: '가', meaning: '기쁠 가' },
    { hanja: '珂', reading: '가', meaning: '옥돌 가' },
    { hanja: '迦', reading: '가', meaning: '부처 가' },
  ],
  건: [
    { hanja: '建', reading: '건', meaning: '세울 건' },
    { hanja: '健', reading: '건', meaning: '튼튼할 건' },
    { hanja: '乾', reading: '건', meaning: '하늘 건' },
    { hanja: '虔', reading: '건', meaning: '정성 건' },
  ],
  결: [
    { hanja: '潔', reading: '결', meaning: '맑을 결' },
    { hanja: '結', reading: '결', meaning: '맺을 결' },
  ],
  겸: [
    { hanja: '謙', reading: '겸', meaning: '겸손할 겸' },
    { hanja: '兼', reading: '겸', meaning: '겸할 겸' },
  ],
  경: [
    { hanja: '景', reading: '경', meaning: '빛날 경' },
    { hanja: '慶', reading: '경', meaning: '경사 경' },
    { hanja: '庚', reading: '경', meaning: '별 경' },
    { hanja: '敬', reading: '경', meaning: '공경할 경' },
    { hanja: '經', reading: '경', meaning: '지날 경' },
    { hanja: '炅', reading: '경', meaning: '빛날 경' },
  ],
  계: [
    { hanja: '啓', reading: '계', meaning: '열 계' },
    { hanja: '季', reading: '계', meaning: '계절 계' },
    { hanja: '繼', reading: '계', meaning: '이을 계' },
  ],
  고: [
    { hanja: '高', reading: '고', meaning: '높을 고' },
    { hanja: '皐', reading: '고', meaning: '물가 고' },
  ],
  관: [
    { hanja: '寬', reading: '관', meaning: '너그러울 관' },
    { hanja: '官', reading: '관', meaning: '벼슬 관' },
    { hanja: '觀', reading: '관', meaning: '볼 관' },
    { hanja: '冠', reading: '관', meaning: '갓 관' },
  ],
  광: [
    { hanja: '光', reading: '광', meaning: '빛 광' },
    { hanja: '廣', reading: '광', meaning: '넓을 광' },
    { hanja: '匡', reading: '광', meaning: '바를 광' },
  ],
  교: [
    { hanja: '敎', reading: '교', meaning: '가르칠 교' },
    { hanja: '交', reading: '교', meaning: '사귈 교' },
    { hanja: '橋', reading: '교', meaning: '다리 교' },
  ],
  규: [
    { hanja: '奎', reading: '규', meaning: '별 규' },
    { hanja: '珪', reading: '규', meaning: '옥 규' },
    { hanja: '圭', reading: '규', meaning: '옥 규' },
    { hanja: '揆', reading: '규', meaning: '헤아릴 규' },
    { hanja: '規', reading: '규', meaning: '법 규' },
  ],
  균: [
    { hanja: '均', reading: '균', meaning: '고를 균' },
    { hanja: '鈞', reading: '균', meaning: '쇠고리 균' },
    { hanja: '勻', reading: '균', meaning: '적을 균' },
  ],
  극: [
    { hanja: '克', reading: '극', meaning: '이길 극' },
    { hanja: '極', reading: '극', meaning: '극진할 극' },
  ],
  근: [
    { hanja: '根', reading: '근', meaning: '뿌리 근' },
    { hanja: '謹', reading: '근', meaning: '삼갈 근' },
    { hanja: '槿', reading: '근', meaning: '무궁화 근' },
    { hanja: '勤', reading: '근', meaning: '부지런할 근' },
    { hanja: '斤', reading: '근', meaning: '도끼 근' },
  ],
  나: [
    { hanja: '那', reading: '나', meaning: '어찌 나' },
    { hanja: '娜', reading: '나', meaning: '아리따울 나' },
    { hanja: '拿', reading: '나', meaning: '잡을 나' },
  ],
  다: [
    { hanja: '多', reading: '다', meaning: '많을 다' },
    { hanja: '茶', reading: '다', meaning: '차 다' },
  ],
  단: [
    { hanja: '丹', reading: '단', meaning: '붉을 단' },
    { hanja: '端', reading: '단', meaning: '바를 단' },
    { hanja: '壇', reading: '단', meaning: '제단 단' },
  ],
  담: [
    { hanja: '潭', reading: '담', meaning: '못 담' },
    { hanja: '湛', reading: '담', meaning: '맑을 담' },
    { hanja: '談', reading: '담', meaning: '말씀 담' },
  ],
  대: [
    { hanja: '大', reading: '대', meaning: '큰 대' },
    { hanja: '代', reading: '대', meaning: '대신할 대' },
    { hanja: '玳', reading: '대', meaning: '대모 대' },
  ],
  덕: [
    { hanja: '德', reading: '덕', meaning: '덕 덕' },
  ],
  동: [
    { hanja: '東', reading: '동', meaning: '동녘 동' },
    { hanja: '棟', reading: '동', meaning: '용마루 동' },
    { hanja: '同', reading: '동', meaning: '한가지 동' },
    { hanja: '童', reading: '동', meaning: '아이 동' },
  ],
  두: [
    { hanja: '斗', reading: '두', meaning: '말 두' },
    { hanja: '頭', reading: '두', meaning: '머리 두' },
    { hanja: '杜', reading: '두', meaning: '막을 두' },
  ],
  득: [
    { hanja: '得', reading: '득', meaning: '얻을 득' },
  ],
  란: [
    { hanja: '蘭', reading: '란', meaning: '난초 란' },
    { hanja: '爛', reading: '란', meaning: '빛날 란' },
  ],
  람: [
    { hanja: '嵐', reading: '람', meaning: '남기 람' },
    { hanja: '藍', reading: '람', meaning: '쪽 람' },
  ],
  래: [
    { hanja: '來', reading: '래', meaning: '올 래' },
    { hanja: '萊', reading: '래', meaning: '명아주 래' },
  ],
  려: [
    { hanja: '麗', reading: '려', meaning: '고울 려' },
    { hanja: '黎', reading: '려', meaning: '검을 려' },
  ],
  련: [
    { hanja: '蓮', reading: '련', meaning: '연꽃 련' },
    { hanja: '連', reading: '련', meaning: '이을 련' },
    { hanja: '憐', reading: '련', meaning: '어여쁠 련' },
  ],
  렬: [
    { hanja: '烈', reading: '렬', meaning: '열렬할 렬' },
    { hanja: '列', reading: '렬', meaning: '줄 렬' },
  ],
  령: [
    { hanja: '領', reading: '령', meaning: '거느릴 령' },
    { hanja: '玲', reading: '령', meaning: '옥소리 령' },
    { hanja: '伶', reading: '령', meaning: '영리할 령' },
  ],
  로: [
    { hanja: '魯', reading: '로', meaning: '노나라 로' },
    { hanja: '路', reading: '로', meaning: '길 로' },
    { hanja: '露', reading: '로', meaning: '이슬 로' },
  ],
  록: [
    { hanja: '祿', reading: '록', meaning: '녹 록' },
    { hanja: '錄', reading: '록', meaning: '기록할 록' },
    { hanja: '鹿', reading: '록', meaning: '사슴 록' },
  ],
  론: [
    { hanja: '論', reading: '론', meaning: '논할 론' },
  ],
  룡: [
    { hanja: '龍', reading: '룡', meaning: '용 룡' },
  ],
  루: [
    { hanja: '樓', reading: '루', meaning: '다락 루' },
    { hanja: '縷', reading: '루', meaning: '실 루' },
  ],
  리: [
    { hanja: '里', reading: '리', meaning: '마을 리' },
    { hanja: '利', reading: '리', meaning: '이로울 리' },
    { hanja: '理', reading: '리', meaning: '다스릴 리' },
  ],
  린: [
    { hanja: '璘', reading: '린', meaning: '옥빛 린' },
    { hanja: '潾', reading: '린', meaning: '맑을 린' },
    { hanja: '麟', reading: '린', meaning: '기린 린' },
    { hanja: '隣', reading: '린', meaning: '이웃 린' },
  ],
  림: [
    { hanja: '林', reading: '림', meaning: '수풀 림' },
    { hanja: '琳', reading: '림', meaning: '옥 림' },
    { hanja: '霖', reading: '림', meaning: '장마 림' },
  ],
  만: [
    { hanja: '萬', reading: '만', meaning: '일만 만' },
    { hanja: '晩', reading: '만', meaning: '늦을 만' },
    { hanja: '滿', reading: '만', meaning: '찰 만' },
  ],
  무: [
    { hanja: '武', reading: '무', meaning: '호반 무' },
    { hanja: '茂', reading: '무', meaning: '무성할 무' },
    { hanja: '務', reading: '무', meaning: '힘쓸 무' },
  ],
  문: [
    { hanja: '文', reading: '문', meaning: '글월 문' },
    { hanja: '汶', reading: '문', meaning: '내 이름 문' },
    { hanja: '門', reading: '문', meaning: '문 문' },
  ],
  미: [
    { hanja: '美', reading: '미', meaning: '아름다울 미' },
    { hanja: '薇', reading: '미', meaning: '고비 미' },
    { hanja: '眉', reading: '미', meaning: '눈썹 미' },
  ],
  범: [
    { hanja: '範', reading: '범', meaning: '법 범' },
    { hanja: '凡', reading: '범', meaning: '무릇 범' },
    { hanja: '汎', reading: '범', meaning: '넓을 범' },
  ],
  병: [
    { hanja: '炳', reading: '병', meaning: '밝을 병' },
    { hanja: '秉', reading: '병', meaning: '잡을 병' },
    { hanja: '柄', reading: '병', meaning: '자루 병' },
    { hanja: '丙', reading: '병', meaning: '남녘 병' },
  ],
  보: [
    { hanja: '普', reading: '보', meaning: '넓을 보' },
    { hanja: '甫', reading: '보', meaning: '클 보' },
    { hanja: '保', reading: '보', meaning: '지킬 보' },
    { hanja: '寶', reading: '보', meaning: '보배 보' },
  ],
  복: [
    { hanja: '福', reading: '복', meaning: '복 복' },
    { hanja: '復', reading: '복', meaning: '돌아올 복' },
  ],
  본: [
    { hanja: '本', reading: '본', meaning: '근본 본' },
  ],
  봉: [
    { hanja: '奉', reading: '봉', meaning: '받들 봉' },
    { hanja: '鳳', reading: '봉', meaning: '봉황 봉' },
    { hanja: '峯', reading: '봉', meaning: '봉우리 봉' },
  ],
  부: [
    { hanja: '富', reading: '부', meaning: '부유할 부' },
    { hanja: '夫', reading: '부', meaning: '지아비 부' },
    { hanja: '溥', reading: '부', meaning: '넓을 부' },
  ],
  빈: [
    { hanja: '彬', reading: '빈', meaning: '빛날 빈' },
    { hanja: '斌', reading: '빈', meaning: '빛날 빈' },
    { hanja: '濱', reading: '빈', meaning: '물가 빈' },
  ],
  사: [
    { hanja: '士', reading: '사', meaning: '선비 사' },
    { hanja: '思', reading: '사', meaning: '생각할 사' },
    { hanja: '泗', reading: '사', meaning: '물 이름 사' },
  ],
  산: [
    { hanja: '山', reading: '산', meaning: '뫼 산' },
    { hanja: '産', reading: '산', meaning: '낳을 산' },
  ],
  상: [
    { hanja: '相', reading: '상', meaning: '서로 상' },
    { hanja: '常', reading: '상', meaning: '항상 상' },
    { hanja: '尙', reading: '상', meaning: '오히려 상' },
    { hanja: '祥', reading: '상', meaning: '상서로울 상' },
    { hanja: '商', reading: '상', meaning: '장사 상' },
  ],
  수: [
    { hanja: '秀', reading: '수', meaning: '빼어날 수' },
    { hanja: '洙', reading: '수', meaning: '물가 수' },
    { hanja: '壽', reading: '수', meaning: '목숨 수' },
    { hanja: '修', reading: '수', meaning: '닦을 수' },
    { hanja: '守', reading: '수', meaning: '지킬 수' },
    { hanja: '水', reading: '수', meaning: '물 수' },
  ],
  숙: [
    { hanja: '淑', reading: '숙', meaning: '맑을 숙' },
    { hanja: '肅', reading: '숙', meaning: '엄숙할 숙' },
  ],
  순: [
    { hanja: '純', reading: '순', meaning: '순수할 순' },
    { hanja: '淳', reading: '순', meaning: '순박할 순' },
    { hanja: '順', reading: '순', meaning: '순할 순' },
    { hanja: '珣', reading: '순', meaning: '옥돌 순' },
    { hanja: '荀', reading: '순', meaning: '풀 이름 순' },
  ],
  숭: [
    { hanja: '崇', reading: '숭', meaning: '높을 숭' },
  ],
  승: [
    { hanja: '昇', reading: '승', meaning: '오를 승' },
    { hanja: '承', reading: '승', meaning: '이을 승' },
    { hanja: '勝', reading: '승', meaning: '이길 승' },
    { hanja: '陞', reading: '승', meaning: '오를 승' },
  ],
  시: [
    { hanja: '時', reading: '시', meaning: '때 시' },
    { hanja: '是', reading: '시', meaning: '옳을 시' },
    { hanja: '始', reading: '시', meaning: '비로소 시' },
    { hanja: '詩', reading: '시', meaning: '시 시' },
  ],
  식: [
    { hanja: '植', reading: '식', meaning: '심을 식' },
    { hanja: '湜', reading: '식', meaning: '물맑을 식' },
    { hanja: '寔', reading: '식', meaning: '이 식' },
  ],
  실: [
    { hanja: '實', reading: '실', meaning: '열매 실' },
  ],
  아: [
    { hanja: '娥', reading: '아', meaning: '예쁠 아' },
    { hanja: '雅', reading: '아', meaning: '우아할 아' },
    { hanja: '亞', reading: '아', meaning: '버금 아' },
    { hanja: '芽', reading: '아', meaning: '싹 아' },
  ],
  애: [
    { hanja: '愛', reading: '애', meaning: '사랑 애' },
  ],
  열: [
    { hanja: '烈', reading: '열', meaning: '열렬할 열' },
    { hanja: '悅', reading: '열', meaning: '기쁠 열' },
  ],
  엽: [
    { hanja: '燁', reading: '엽', meaning: '빛날 엽' },
    { hanja: '葉', reading: '엽', meaning: '잎 엽' },
  ],
  영: [
    { hanja: '英', reading: '영', meaning: '꽃부리 영' },
    { hanja: '永', reading: '영', meaning: '길 영' },
    { hanja: '榮', reading: '영', meaning: '영화 영' },
    { hanja: '泳', reading: '영', meaning: '헤엄칠 영' },
    { hanja: '瑛', reading: '영', meaning: '옥빛 영' },
    { hanja: '煐', reading: '영', meaning: '빛날 영' },
    { hanja: '映', reading: '영', meaning: '비칠 영' },
  ],
  예: [
    { hanja: '藝', reading: '예', meaning: '재주 예' },
    { hanja: '睿', reading: '예', meaning: '밝을 예' },
    { hanja: '禮', reading: '예', meaning: '예도 예' },
    { hanja: '譽', reading: '예', meaning: '기릴 예' },
  ],
  온: [
    { hanja: '溫', reading: '온', meaning: '따뜻할 온' },
  ],
  완: [
    { hanja: '完', reading: '완', meaning: '완전할 완' },
    { hanja: '浣', reading: '완', meaning: '빨 완' },
    { hanja: '琬', reading: '완', meaning: '옥 이름 완' },
  ],
  요: [
    { hanja: '堯', reading: '요', meaning: '요임금 요' },
    { hanja: '曜', reading: '요', meaning: '빛날 요' },
    { hanja: '耀', reading: '요', meaning: '빛날 요' },
  ],
  용: [
    { hanja: '鎔', reading: '용', meaning: '쇠녹일 용' },
    { hanja: '容', reading: '용', meaning: '용납할 용' },
    { hanja: '庸', reading: '용', meaning: '쓸 용' },
    { hanja: '湧', reading: '용', meaning: '솟을 용' },
    { hanja: '龍', reading: '용', meaning: '용 용' },
    { hanja: '勇', reading: '용', meaning: '날랠 용' },
  ],
  욱: [
    { hanja: '旭', reading: '욱', meaning: '아침해 욱' },
    { hanja: '昱', reading: '욱', meaning: '밝을 욱' },
    { hanja: '郁', reading: '욱', meaning: '성할 욱' },
  ],
  운: [
    { hanja: '雲', reading: '운', meaning: '구름 운' },
    { hanja: '運', reading: '운', meaning: '돌 운' },
    { hanja: '澐', reading: '운', meaning: '큰물결 운' },
  ],
  웅: [
    { hanja: '雄', reading: '웅', meaning: '영웅/수컷 웅' },
  ],
  월: [
    { hanja: '月', reading: '월', meaning: '달 월' },
  ],
  율: [
    { hanja: '律', reading: '율', meaning: '법 율' },
    { hanja: '栗', reading: '율', meaning: '밤 율' },
    { hanja: '譎', reading: '율', meaning: '속일 율' },
  ],
  은: [
    { hanja: '恩', reading: '은', meaning: '은혜 은' },
    { hanja: '銀', reading: '은', meaning: '은 은' },
    { hanja: '殷', reading: '은', meaning: '성할 은' },
    { hanja: '慇', reading: '은', meaning: '괴로워할 은' },
  ],
  을: [
    { hanja: '乙', reading: '을', meaning: '새 을' },
  ],
  응: [
    { hanja: '應', reading: '응', meaning: '응할 응' },
  ],
  의: [
    { hanja: '義', reading: '의', meaning: '옳을 의' },
    { hanja: '宜', reading: '의', meaning: '마땅 의' },
    { hanja: '儀', reading: '의', meaning: '거동 의' },
    { hanja: '懿', reading: '의', meaning: '아름다울 의' },
  ],
  익: [
    { hanja: '益', reading: '익', meaning: '더할 익' },
    { hanja: '翊', reading: '익', meaning: '도울 익' },
    { hanja: '翼', reading: '익', meaning: '날개 익' },
  ],
  일: [
    { hanja: '一', reading: '일', meaning: '한 일' },
    { hanja: '日', reading: '일', meaning: '날 일' },
    { hanja: '鎰', reading: '일', meaning: '중량 일' },
    { hanja: '馹', reading: '일', meaning: '역말 일' },
    { hanja: '逸', reading: '일', meaning: '편안할 일' },
  ],
  자: [
    { hanja: '慈', reading: '자', meaning: '사랑할 자' },
    { hanja: '子', reading: '자', meaning: '아들 자' },
    { hanja: '滋', reading: '자', meaning: '불을 자' },
  ],
  작: [
    { hanja: '作', reading: '작', meaning: '지을 작' },
  ],
  재: [
    { hanja: '在', reading: '재', meaning: '있을 재' },
    { hanja: '載', reading: '재', meaning: '실을 재' },
    { hanja: '宰', reading: '재', meaning: '재상 재' },
    { hanja: '材', reading: '재', meaning: '재목 재' },
    { hanja: '裁', reading: '재', meaning: '마를 재' },
    { hanja: '栽', reading: '재', meaning: '심을 재' },
  ],
  제: [
    { hanja: '濟', reading: '제', meaning: '건널 제' },
    { hanja: '諸', reading: '제', meaning: '모든 제' },
    { hanja: '提', reading: '제', meaning: '끌 제' },
    { hanja: '齊', reading: '제', meaning: '가지런할 제' },
    { hanja: '悌', reading: '제', meaning: '공손할 제' },
  ],
  종: [
    { hanja: '鍾', reading: '종', meaning: '쇠북 종' },
    { hanja: '宗', reading: '종', meaning: '마루 종' },
    { hanja: '鐘', reading: '종', meaning: '쇠북 종' },
    { hanja: '從', reading: '종', meaning: '좇을 종' },
  ],
  준: [
    { hanja: '俊', reading: '준', meaning: '준걸 준' },
    { hanja: '準', reading: '준', meaning: '평평할 준' },
    { hanja: '晙', reading: '준', meaning: '밝을 준' },
    { hanja: '浚', reading: '준', meaning: '깊을 준' },
    { hanja: '濬', reading: '준', meaning: '깊을 준' },
    { hanja: '畯', reading: '준', meaning: '농부 준' },
  ],
  중: [
    { hanja: '重', reading: '중', meaning: '무거울 중' },
    { hanja: '中', reading: '중', meaning: '가운데 중' },
    { hanja: '仲', reading: '중', meaning: '버금 중' },
  ],
  직: [
    { hanja: '直', reading: '직', meaning: '곧을 직' },
  ],
  찬: [
    { hanja: '燦', reading: '찬', meaning: '빛날 찬' },
    { hanja: '瓚', reading: '찬', meaning: '옥 찬' },
    { hanja: '讚', reading: '찬', meaning: '기릴 찬' },
    { hanja: '贊', reading: '찬', meaning: '도울 찬' },
  ],
  창: [
    { hanja: '昌', reading: '창', meaning: '창성할 창' },
    { hanja: '昶', reading: '창', meaning: '밝을 창' },
    { hanja: '彰', reading: '창', meaning: '밝을 창' },
    { hanja: '創', reading: '창', meaning: '비로소 창' },
  ],
  철: [
    { hanja: '澈', reading: '철', meaning: '맑을 철' },
    { hanja: '哲', reading: '철', meaning: '밝을 철' },
    { hanja: '鐵', reading: '철', meaning: '쇠 철' },
  ],
  청: [
    { hanja: '淸', reading: '청', meaning: '맑을 청' },
    { hanja: '靑', reading: '청', meaning: '푸를 청' },
  ],
  초: [
    { hanja: '初', reading: '초', meaning: '처음 초' },
    { hanja: '楚', reading: '초', meaning: '초나라 초' },
    { hanja: '草', reading: '초', meaning: '풀 초' },
  ],
  총: [
    { hanja: '聰', reading: '총', meaning: '총명할 총' },
    { hanja: '總', reading: '총', meaning: '다스릴 총' },
  ],
  춘: [
    { hanja: '春', reading: '춘', meaning: '봄 춘' },
  ],
  충: [
    { hanja: '忠', reading: '충', meaning: '충성 충' },
  ],
  치: [
    { hanja: '致', reading: '치', meaning: '이를 치' },
    { hanja: '治', reading: '치', meaning: '다스릴 치' },
  ],
  태: [
    { hanja: '泰', reading: '태', meaning: '클 태' },
    { hanja: '太', reading: '태', meaning: '클 태' },
    { hanja: '兌', reading: '태', meaning: '바꿀 태' },
    { hanja: '胎', reading: '태', meaning: '아이밸 태' },
  ],
  택: [
    { hanja: '澤', reading: '택', meaning: '은혜 택' },
    { hanja: '宅', reading: '택', meaning: '집 택' },
  ],
  판: [
    { hanja: '判', reading: '판', meaning: '판단할 판' },
  ],
  풍: [
    { hanja: '豊', reading: '풍', meaning: '풍년 풍' },
    { hanja: '風', reading: '풍', meaning: '바람 풍' },
  ],
  필: [
    { hanja: '弼', reading: '필', meaning: '도울 필' },
    { hanja: '必', reading: '필', meaning: '반드시 필' },
  ],
  학: [
    { hanja: '鶴', reading: '학', meaning: '학 학' },
    { hanja: '學', reading: '학', meaning: '배울 학' },
  ],
  해: [
    { hanja: '海', reading: '해', meaning: '바다 해' },
    { hanja: '偕', reading: '해', meaning: '함께 해' },
    { hanja: '解', reading: '해', meaning: '풀 해' },
  ],
  행: [
    { hanja: '幸', reading: '행', meaning: '다행 행' },
    { hanja: '行', reading: '행', meaning: '다닐 행' },
  ],
  향: [
    { hanja: '香', reading: '향', meaning: '향기 향' },
    { hanja: '向', reading: '향', meaning: '향할 향' },
  ],
  헌: [
    { hanja: '憲', reading: '헌', meaning: '법 헌' },
    { hanja: '軒', reading: '헌', meaning: '집 헌' },
    { hanja: '獻', reading: '헌', meaning: '바칠 헌' },
  ],
  혁: [
    { hanja: '赫', reading: '혁', meaning: '빛날 혁' },
    { hanja: '爀', reading: '혁', meaning: '불빛 혁' },
    { hanja: '奕', reading: '혁', meaning: '클 혁' },
  ],
  형: [
    { hanja: '炯', reading: '형', meaning: '밝을 형' },
    { hanja: '珩', reading: '형', meaning: '패옥 형' },
    { hanja: '衡', reading: '형', meaning: '저울 형' },
    { hanja: '亨', reading: '형', meaning: '형통할 형' },
  ],
  혜: [
    { hanja: '惠', reading: '혜', meaning: '은혜 혜' },
    { hanja: '慧', reading: '혜', meaning: '지혜 혜' },
    { hanja: '蕙', reading: '혜', meaning: '난초 혜' },
  ],
  호: [
    { hanja: '浩', reading: '호', meaning: '넓을 호' },
    { hanja: '鎬', reading: '호', meaning: '냄비 호' },
    { hanja: '昊', reading: '호', meaning: '하늘 호' },
    { hanja: '晧', reading: '호', meaning: '밝을 호' },
    { hanja: '虎', reading: '호', meaning: '범 호' },
    { hanja: '祜', reading: '호', meaning: '복 호' },
    { hanja: '湖', reading: '호', meaning: '호수 호' },
  ],
  화: [
    { hanja: '和', reading: '화', meaning: '화할 화' },
    { hanja: '華', reading: '화', meaning: '빛날 화' },
    { hanja: '火', reading: '화', meaning: '불 화' },
  ],
  환: [
    { hanja: '煥', reading: '환', meaning: '빛날 환' },
    { hanja: '桓', reading: '환', meaning: '굳셀 환' },
    { hanja: '丸', reading: '환', meaning: '알 환' },
    { hanja: '奐', reading: '환', meaning: '빛날 환' },
  ],
  회: [
    { hanja: '會', reading: '회', meaning: '모일 회' },
    { hanja: '晦', reading: '회', meaning: '그믐 회' },
    { hanja: '淮', reading: '회', meaning: '물 이름 회' },
  ],
  효: [
    { hanja: '孝', reading: '효', meaning: '효도 효' },
    { hanja: '曉', reading: '효', meaning: '새벽 효' },
    { hanja: '效', reading: '효', meaning: '본받을 효' },
  ],
  후: [
    { hanja: '厚', reading: '후', meaning: '두터울 후' },
    { hanja: '後', reading: '후', meaning: '뒤 후' },
  ],
  훈: [
    { hanja: '勳', reading: '훈', meaning: '공 훈' },
    { hanja: '訓', reading: '훈', meaning: '가르칠 훈' },
    { hanja: '燻', reading: '훈', meaning: '그을릴 훈' },
  ],
  휘: [
    { hanja: '輝', reading: '휘', meaning: '빛날 휘' },
    { hanja: '徽', reading: '휘', meaning: '아름다울 휘' },
  ],
  희: [
    { hanja: '熙', reading: '희', meaning: '빛날 희' },
    { hanja: '喜', reading: '희', meaning: '기쁠 희' },
    { hanja: '僖', reading: '희', meaning: '기쁠 희' },
    { hanja: '禧', reading: '희', meaning: '복 희' },
    { hanja: '姬', reading: '희', meaning: '아가씨 희' },
    { hanja: '希', reading: '희', meaning: '바랄 희' },
  ],
  흠: [
    { hanja: '欽', reading: '흠', meaning: '공경할 흠' },
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
