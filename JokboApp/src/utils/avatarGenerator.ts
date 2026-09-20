import { FamilyMember } from '../types/family';

/**
 * Generates a dignified, cohesive vector webtoon/illustration SVG avatar for family members.
 * Tailored by generation, gender, relationship, and persona so that tests and simulations
 * have rich, delightful, and immediate visual identity without depending on external image servers.
 */
export function generateVirtualAvatarSvg(member: Partial<FamilyMember>): string {
  const gender = member.gender || 'M';
  const gen = member.generation || 3;
  const isMale = gender === 'M';
  const seedId = member.id || member.name || 'avatar';

  // Generation-specific & Gender-specific styles
  let bgGradStart = '#fef3c7';
  let bgGradEnd = '#fed7aa';
  let skinColor = '#ffdfbf';
  let blushColor = 'rgba(244, 114, 182, 0.35)';
  let hairColor = '#292524';
  let clothesColor = '#1e293b';
  let clothesCollar = '#f8fafc';
  let accessory = '';

  if (gen === 1) {
    // 1대: 조부모 (품격 있는 은발, 온화한 미소, 단아한 한복/의관)
    hairColor = '#94a3b8'; // 은발
    if (isMale) {
      bgGradStart = '#fee2e2';
      bgGradEnd = '#fecaca';
      clothesColor = '#334155'; // 학자풍 짙은 회색 도포/의복
      clothesCollar = '#e2e8f0';
      // 안경 + 온화한 콧수염
      accessory = `
        <circle cx="48" cy="56" r="8" fill="none" stroke="#64748b" stroke-width="2"/>
        <circle cx="72" cy="56" r="8" fill="none" stroke="#64748b" stroke-width="2"/>
        <line x1="56" y1="56" x2="64" y2="56" stroke="#64748b" stroke-width="2"/>
        <path d="M53 72 Q60 70 60 73 Q60 70 67 72 Q60 76 53 72 Z" fill="#94a3b8"/>
      `;
    } else {
      bgGradStart = '#fce7f3';
      bgGradEnd = '#fbcfe8';
      clothesColor = '#831843'; // 고운 자주색 종부 한복
      clothesCollar = '#fdf2f8';
      // 은빛 쪽머리 비녀 & 단아한 진주 귀걸이
      accessory = `
        <ellipse cx="60" cy="22" rx="14" ry="10" fill="#94a3b8"/>
        <circle cx="72" cy="20" r="4" fill="#fbbf24"/>
        <path d="M72 20 L84 16" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
        <circle cx="37" cy="62" r="3" fill="#f8fafc"/>
        <circle cx="83" cy="62" r="3" fill="#f8fafc"/>
      `;
    }
  } else if (gen === 2) {
    // 2대: 부모 세대 (중후한 정장/블라우스, 신뢰감 주는 스타일)
    hairColor = isMale ? '#334155' : '#1c1917';
    if (isMale) {
      bgGradStart = '#fee2e2';
      bgGradEnd = '#ffedd5';
      clothesColor = '#1e3a8a'; // 감청색 신사 정장
      clothesCollar = '#ffffff';
      // 단정한 붉은색 넥타이
      accessory = `
        <polygon points="60,86 63,98 60,118 57,98" fill="#dc2626"/>
      `;
    } else {
      bgGradStart = '#e0e7ff';
      bgGradEnd = '#ede9fe';
      clothesColor = '#065f46'; // 기품 있는 에메랄드 블라우스
      clothesCollar = '#fef08a';
      // 진주 목걸이 & 귀걸이
      accessory = `
        <circle cx="52" cy="88" r="2.5" fill="#f8fafc"/>
        <circle cx="56" cy="90" r="2.5" fill="#f8fafc"/>
        <circle cx="60" cy="91" r="3" fill="#f8fafc"/>
        <circle cx="64" cy="90" r="2.5" fill="#f8fafc"/>
        <circle cx="68" cy="88" r="2.5" fill="#f8fafc"/>
        <circle cx="36" cy="63" r="2.5" fill="#f8fafc"/>
        <circle cx="84" cy="63" r="2.5" fill="#f8fafc"/>
      `;
    }
  } else if (gen === 3) {
    // 3대: 본인, 배우자, 형제 (스마트 캐주얼, 트렌디 헤어)
    hairColor = '#1e293b';
    if (isMale) {
      bgGradStart = '#fef3c7';
      bgGradEnd = '#fed7aa';
      clothesColor = '#0f172a';
      clothesCollar = '#38bdf8';
      // IT 창업가 본인(김준혁): 스마트 뿔테 안경
      if (member.id === 'pat-3-1' || member.relationship?.includes('본인')) {
        accessory = `
          <rect x="42" y="50" width="14" height="11" rx="3" fill="none" stroke="#1e293b" stroke-width="2"/>
          <rect x="64" y="50" width="14" height="11" rx="3" fill="none" stroke="#1e293b" stroke-width="2"/>
          <line x1="56" y1="55" x2="64" y2="55" stroke="#1e293b" stroke-width="2"/>
        `;
      }
    } else {
      bgGradStart = '#fef2f2';
      bgGradEnd = '#fed7aa';
      clothesColor = '#c2410c'; // 따뜻한 코랄/오렌지 정장
      clothesCollar = '#fff7ed';
      // 골드 귀걸이 & 우아한 목선
      accessory = `
        <circle cx="36" cy="62" r="2.5" fill="#f59e0b"/>
        <circle cx="84" cy="62" r="2.5" fill="#f59e0b"/>
        <path d="M52 86 Q60 92 68 86" stroke="#fbbf24" stroke-width="2.5" fill="none"/>
      `;
    }
  } else if (gen === 4) {
    // 4대: 자녀 세대 (귀엽고 발랄한 유아/어린이)
    skinColor = '#ffe4cb';
    blushColor = 'rgba(244, 63, 94, 0.45)';
    if (isMale) {
      bgGradStart = '#dcfce7';
      bgGradEnd = '#bbf7d0';
      hairColor = '#1c1917';
      clothesColor = '#0284c7'; // 청량한 블루 맨투맨
      clothesCollar = '#fef08a';
      // 장난꾸러기 모자 포인트
      accessory = `
        <path d="M42 30 Q60 16 78 30" fill="#f59e0b"/>
        <circle cx="60" cy="18" r="4" fill="#ef4444"/>
      `;
    } else {
      bgGradStart = '#fce7f3';
      bgGradEnd = '#fbcfe8';
      hairColor = '#292524';
      clothesColor = '#ec4899'; // 사랑스러운 핑크 원피스
      clothesCollar = '#ffffff';
      // 앙증맞은 리본 머리핀
      accessory = `
        <polygon points="76,26 86,22 86,30" fill="#ef4444"/>
        <polygon points="76,26 66,22 66,30" fill="#ef4444"/>
        <circle cx="76" cy="26" r="3" fill="#fef08a"/>
      `;
    }
  }

  // Hair paths
  let hairPath = '';
  if (isMale) {
    if (gen === 1) {
      // 노년 남성 은발
      hairPath = `
        <path d="M36 48 C34 30 46 22 60 22 C74 22 86 30 84 48 C80 34 72 28 60 28 C48 28 40 34 36 48 Z" fill="${hairColor}"/>
        <path d="M34 46 C32 54 33 62 36 66 C36 58 37 52 39 46 Z" fill="${hairColor}"/>
        <path d="M86 46 C88 54 87 62 84 66 C84 58 83 52 81 46 Z" fill="${hairColor}"/>
      `;
    } else if (gen === 4) {
      // 남아 바가지/뱅헤어
      hairPath = `
        <path d="M36 48 C34 26 50 20 60 20 C70 20 86 26 84 48 C80 32 74 28 60 28 C46 28 40 32 36 48 Z" fill="${hairColor}"/>
        <path d="M38 42 Q60 38 82 42 Q60 34 38 42 Z" fill="${hairColor}"/>
      `;
    } else {
      // 2~3대 남성 댄디 가르마
      hairPath = `
        <path d="M34 50 C32 28 46 20 60 20 C74 20 88 28 86 50 C80 32 70 26 58 26 C44 26 38 32 34 50 Z" fill="${hairColor}"/>
        <path d="M38 40 Q48 30 64 36 Q46 32 38 40 Z" fill="${hairColor}"/>
        <path d="M33 46 C32 54 34 60 37 64 C36 56 36 50 38 46 Z" fill="${hairColor}"/>
        <path d="M87 46 C88 54 86 60 83 64 C84 56 84 50 82 46 Z" fill="${hairColor}"/>
      `;
    }
  } else {
    if (gen === 1) {
      // 노년 여성 쪽머리
      hairPath = `
        <path d="M34 52 C32 30 46 24 60 24 C74 24 88 30 86 52 C82 34 72 30 60 30 C48 30 38 34 34 52 Z" fill="${hairColor}"/>
        <path d="M34 50 C30 58 32 68 37 70 C35 62 36 54 38 48 Z" fill="${hairColor}"/>
        <path d="M86 50 C90 58 88 68 83 70 C85 62 84 54 82 48 Z" fill="${hairColor}"/>
      `;
    } else if (gen === 4) {
      // 여아 양갈래
      hairPath = `
        <path d="M36 50 C34 28 48 22 60 22 C72 22 86 28 84 50 C80 32 72 28 60 28 C48 28 40 32 36 50 Z" fill="${hairColor}"/>
        <circle cx="32" cy="50" r="9" fill="${hairColor}"/>
        <circle cx="88" cy="50" r="9" fill="${hairColor}"/>
      `;
    } else {
      // 2~3대 여성 세련된 웨이브 / 단발
      hairPath = `
        <path d="M34 54 C30 28 46 20 60 20 C74 20 90 28 86 54 C84 34 74 28 60 28 C46 28 36 34 34 54 Z" fill="${hairColor}"/>
        <path d="M32 50 C26 64 28 78 35 84 C32 74 33 60 37 50 Z" fill="${hairColor}"/>
        <path d="M88 50 C94 64 92 78 85 84 C88 74 87 60 83 50 Z" fill="${hairColor}"/>
      `;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_${seedId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgGradStart}"/>
      <stop offset="100%" stop-color="${bgGradEnd}"/>
    </linearGradient>
    <filter id="sh_${seedId}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background Circle -->
  <circle cx="60" cy="60" r="58" fill="url(#bg_${seedId})" stroke="#e2e8f0" stroke-width="2"/>

  <!-- Body / Clothes -->
  <path d="M26 116 C26 94 40 84 60 84 C80 84 94 94 94 116 Z" fill="${clothesColor}" filter="url(#sh_${seedId})"/>
  <path d="M48 84 L60 100 L72 84 Z" fill="${clothesCollar}"/>

  <!-- Neck -->
  <rect x="52" y="70" width="16" height="18" rx="4" fill="${skinColor}"/>

  <!-- Face -->
  <ellipse cx="60" cy="58" rx="24" ry="26" fill="${skinColor}" filter="url(#sh_${seedId})"/>

  <!-- Cheeks Blush -->
  <ellipse cx="44" cy="64" rx="5" ry="3" fill="${blushColor}"/>
  <ellipse cx="76" cy="64" rx="5" ry="3" fill="${blushColor}"/>

  <!-- Eyes -->
  <ellipse cx="48" cy="56" rx="2.8" ry="3.5" fill="#1e293b"/>
  <circle cx="47" cy="55" r="1" fill="#ffffff"/>
  <ellipse cx="72" cy="56" rx="2.8" ry="3.5" fill="#1e293b"/>
  <circle cx="71" cy="55" r="1" fill="#ffffff"/>

  <!-- Eyebrows -->
  <path d="M43 49 Q48 47 53 50" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M67 50 Q72 47 77 49" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" fill="none"/>

  <!-- Nose -->
  <path d="M59 62 Q60 64 62 64" stroke="#d97706" stroke-width="1.8" stroke-linecap="round" fill="none"/>

  <!-- Warm Smile -->
  <path d="M52 69 Q60 76 68 69" stroke="#991b1b" stroke-width="2" stroke-linecap="round" fill="none"/>

  <!-- Hair -->
  ${hairPath}

  <!-- Special Accessories (Glasses, Ties, Pearls, Hairpins) -->
  ${accessory}

  <!-- Outer Ring Highlight -->
  <circle cx="60" cy="60" r="57" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns the member's photo URL if set, or generates a virtual illustration avatar SVG.
 * Guaranteed to always return a valid, renderable image URI.
 */
export function getMemberAvatar(member?: Partial<FamilyMember> | null): string {
  if (!member) {
    return generateVirtualAvatarSvg({ gender: 'M', generation: 3, name: '인물' });
  }

  // If member has an explicit photoUrl set, use it
  if (member.photoUrl && member.photoUrl.trim().length > 0) {
    return member.photoUrl;
  }

  // Fallback: automatically generate virtual webtoon / illustration avatar
  return generateVirtualAvatarSvg(member);
}

/**
 * Returns true if the member has a real custom uploaded photo (not a generated SVG avatar)
 */
export function hasCustomPhoto(member?: Partial<FamilyMember> | null): boolean {
  if (!member || !member.photoUrl) return false;
  return !member.photoUrl.startsWith('data:image/svg+xml');
}
