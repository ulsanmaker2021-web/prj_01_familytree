import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { INITIAL_FAMILY_DATA } from '../utils/mockFamilyData';
import { getMemberAvatar } from '../utils/avatarGenerator';
import { verifyMemberLineage } from '../utils/genealogyVerification';
import { MasterTrackingDashboardModal } from './MasterTrackingDashboardModal';
import html2canvas from 'html2canvas';

interface FramedMasterpieceViewProps {
  members: FamilyMember[];
  onSelectMember?: (member: FamilyMember) => void;
  onReturnToMain?: () => void;
}

// Fixed canvas dimensions for high-resolution gallery framing (16:10 / 16:9 ratio)
const FRAME_WIDTH = 1560;
const FRAME_HEIGHT = 1080;

export const FramedMasterpieceView: React.FC<FramedMasterpieceViewProps> = ({
  members,
  onSelectMember,
  onReturnToMain,
}) => {
  // Lineage mode:
  // 'lineage_direct' (부계 혈통 직계 중심: 조부모 ➔ 부친 ➔ 본인/형제 ➔ 자녀)
  // 'bilateral' (친가·외가 양가 조부모 대등 배치)
  const [lineageMode, setLineageMode] = useState<'lineage_direct' | 'bilateral'>('lineage_direct');
  const [isMasterDashboardVisible, setIsMasterDashboardVisible] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeOuterFrame, setIncludeOuterFrame] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  // In-page fallback print styles
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const styleId = 'framed-masterpiece-global-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      @page {
        size: landscape;
        margin: 6mm;
      }
      @media print {
        header, nav, [role="tablist"], [data-testid="device-simulator-bar"],
        .no-print, [role="navigation"] {
          display: none !important;
        }
      }
    `;
  }, []);

  // High-Resolution Image Capture & Print Handler (html2canvas 기반 100% 무결 이미지화 인쇄)
  const handlePrintMasterpiece = async (
    orientation: 'landscape' | 'portrait' = 'landscape',
    withOuterFrame: boolean = true
  ) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const targetId = withOuterFrame ? 'framed-masterpiece-canvas' : 'framed-canvas-parchment';
    let targetEl = document.getElementById(targetId);
    if (!targetEl) {
      targetEl = document.getElementById('framed-masterpiece-canvas');
    }

    if (!targetEl) {
      window.print();
      return;
    }

    setIsCapturing(true);

    try {
      // Capture the exact DOM layout into a high-resolution canvas
      const canvas = await html2canvas(targetEl, {
        scale: 2, // 2x for ultra-sharp crisp text, portraits, and calligraphy
        useCORS: true,
        allowTaint: true,
        backgroundColor: withOuterFrame ? '#451a03' : '#fdfbf7',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgDataUrl = canvas.toDataURL('image/png');

      // Remove existing print iframe if any
      let iframe = document.getElementById('jokbo-print-iframe') as HTMLIFrameElement | null;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = 'jokbo-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        setIsCapturing(false);
        return;
      }

      const htmlContent = '<!DOCTYPE html>' +
        '<html lang="ko">' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<title>가족 가계도 거실 표구 액자 (家 族 家 系 圖)</title>' +
        '<style>' +
        '@page {' +
        '  size: ' + orientation + ';' +
        '  margin: 6mm;' +
        '}' +
        '*, *::before, *::after {' +
        '  box-sizing: border-box !important;' +
        '  -webkit-print-color-adjust: exact !important;' +
        '  print-color-adjust: exact !important;' +
        '}' +
        'html, body {' +
        '  margin: 0 !important;' +
        '  padding: 0 !important;' +
        '  width: 100vw !important;' +
        '  height: 100vh !important;' +
        '  overflow: hidden !important;' +
        '  background-color: #ffffff !important;' +
        '  display: flex !important;' +
        '  align-items: center !important;' +
        '  justify-content: center !important;' +
        '}' +
        '.print-img-wrapper {' +
        '  width: 100vw;' +
        '  height: 100vh;' +
        '  display: flex;' +
        '  align-items: center;' +
        '  justify-content: center;' +
        '  overflow: hidden;' +
        '  page-break-inside: avoid !important;' +
        '  page-break-after: avoid !important;' +
        '  page-break-before: avoid !important;' +
        '}' +
        '.print-img {' +
        '  max-width: calc(100vw - 12mm);' +
        '  max-height: calc(100vh - 12mm);' +
        '  width: auto;' +
        '  height: auto;' +
        '  object-fit: contain;' +
        '  display: block;' +
        '  margin: auto;' +
        '  border-radius: 4px;' +
        '  box-shadow: 0 4px 12px rgba(0,0,0,0.15);' +
        '}' +
        '@media print {' +
        '  @page {' +
        '    size: ' + orientation + ';' +
        '    margin: 6mm;' +
        '  }' +
        '  html, body {' +
        '    width: 100vw !important;' +
        '    height: 100vh !important;' +
        '    overflow: hidden !important;' +
        '    background: #ffffff !important;' +
        '  }' +
        '  .print-img-wrapper {' +
        '    width: 100vw !important;' +
        '    height: 100vh !important;' +
        '    page-break-inside: avoid !important;' +
        '    page-break-after: avoid !important;' +
        '  }' +
        '  .print-img {' +
        '    max-width: calc(100vw - 12mm) !important;' +
        '    max-height: calc(100vh - 12mm) !important;' +
        '    object-fit: contain !important;' +
        '    box-shadow: none !important;' +
        '  }' +
        '}' +
        '</style>' +
        '</head>' +
        '<body class="orientation-' + orientation + '">' +
        '<div class="print-img-wrapper">' +
        '<img src="' + imgDataUrl + '" class="print-img" alt="가족 가계도 거실 표구 액자" />' +
        '</div>' +
        '</body>' +
        '</html>';

      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        setIsCapturing(false);
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print error:', e);
          window.print();
        }
      }, 400);

      iframe.contentWindow?.addEventListener('afterprint', () => {
        setTimeout(() => {
          iframe?.remove();
        }, 1000);
      });
    } catch (err) {
      console.error('html2canvas capture error:', err);
      setIsCapturing(false);
      window.print();
    }
  };

  // Direct High-Resolution Image (PNG) Download (디지털 액자 파일 다운로드)
  const handleDownloadImage = async (withOuterFrame: boolean = true) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const targetId = withOuterFrame ? 'framed-masterpiece-canvas' : 'framed-canvas-parchment';
    let targetEl = document.getElementById(targetId);
    if (!targetEl) {
      targetEl = document.getElementById('framed-masterpiece-canvas');
    }
    if (!targetEl) return;

    setIsCapturing(true);

    try {
      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: withOuterFrame ? '#451a03' : '#fdfbf7',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      const imgDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = '가족가계도_거실표구액자_명작.png';
      link.href = imgDataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Fallback to INITIAL_FAMILY_DATA so historical ancestors are never missing
  const findMember = (id: string) =>
    members.find((m) => m.id === id) || INITIAL_FAMILY_DATA.find((m) => m.id === id);

  // 1대 조부모
  const pat1_1 = findMember('pat-1-1'); // 김진호 (친조부)
  const pat1_2 = findMember('pat-1-2'); // 박순자 (친조모)

  // 1대 외조부모 (양가 모드용)
  const mat1_1 = findMember('mat-1-1'); // 이성한 (외조부)
  const mat1_2 = findMember('mat-1-2'); // 권정자 (외조모)

  // 2대 부모
  const pat2_2 = findMember('pat-2-2'); // 김영수 (부친)
  const mat2_1 = findMember('mat-2-1'); // 이은경 (모친)

  // 3대 본인, 부인, 형제자매
  const pat3_1 = findMember('pat-3-1'); // 김준혁 (본인)
  const inlaw3_1 = findMember('inlaw-pat-3-1'); // 정서연 (부인/배우자)
  const pat3_2 = findMember('pat-3-2'); // 김민혁 (남동생)
  const pat3_3 = findMember('pat-3-3'); // 김지우 (여동생)

  // 4대 자녀
  const pat4_1 = findMember('pat-4-1'); // 김도윤 (장남)
  const pat4_2 = findMember('pat-4-2'); // 김하은 (장녀)

  // Dignified Person Card Component with Profile Photo
  const renderCard = (
    member?: FamilyMember,
    roleTitle?: string,
    width: number = 205,
    height: number = 145,
    accentColor: string = '#b45309'
  ) => {
    if (!member) {
      return (
        <View style={[styles.cardContainer, { width, height, borderColor: '#e7e5e4' }]}>
          <Text style={styles.emptyCardText}>정보 미등록</Text>
        </View>
      );
    }

    const birthYear = member.birthDate ? parseInt(member.birthDate.substring(0, 4), 10) : null;
    const deathYear = member.deathDate ? parseInt(member.deathDate.substring(0, 4), 10) : null;
    const yearsText = birthYear
      ? deathYear
        ? `${birthYear}~${deathYear}`
        : `${birthYear}~ `
      : '생몰 미상';

    const isMale = member.gender === 'M';

    const verification = verifyMemberLineage(member);

    return (
      <TouchableOpacity
        key={member.id}
        style={[
          styles.cardContainer,
          { width, height, borderColor: accentColor, borderTopWidth: 3, borderTopColor: accentColor },
        ]}
        onPress={() => onSelectMember && onSelectMember(member)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderRow}>
          {/* Profile Photo / Dignified Avatar Ring */}
          <View style={[styles.avatarFrame, { borderColor: accentColor }]}>
            <Image
              source={{ uri: getMemberAvatar(member) }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>

          {/* Identity */}
          <View style={styles.identityCol}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName}>{member.name}</Text>
              {member.hanja && <Text style={styles.cardHanja}>({member.hanja})</Text>}
            </View>
            <Text style={styles.lifespanText}>[{yearsText}]</Text>
            <View style={styles.clanAndGenRow}>
              <Text style={[styles.clanText, { color: accentColor }]}>
                {member.clan || '본관'}
              </Text>
              <View style={styles.dualGenBadge}>
                <Text style={styles.dualGenBadgeText}>{verification.shortBadge}</Text>
              </View>
            </View>
            <Text style={styles.roleTitleText}>
              {roleTitle || member.relationship}
            </Text>
          </View>
        </View>

        {/* Lineage & Hangnyeol Verification Bar */}
        <View style={styles.verificationBar}>
          <Text style={styles.verificationBarText} numberOfLines={1}>
            🛡️ {verification.hangnyeolStatus}
          </Text>
        </View>

        {/* Biography */}
        <View style={styles.bioBox}>
          {member.achievements && member.achievements.length > 0 ? (
            member.achievements.slice(0, 1).map((ach, idx) => (
              <Text key={idx} style={styles.bioText} numberOfLines={1}>
                • {ach}
              </Text>
            ))
          ) : (
            <Text style={styles.bioText} numberOfLines={1}>
              • {member.memo || '가문 화합 및 우애 계승'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Gallery Top Control Toolbar */}
      <View style={styles.topToolbar}>
        <View style={styles.toolbarLeft}>
          <View style={styles.masterBadgeRow}>
            <View style={styles.masterBadge}>
              <Text style={styles.masterBadgeText}>🏛️ 가문 거실 액자형 가계도 (표구 명작)</Text>
            </View>
            <View style={styles.verificationHeaderBadge}>
              <Text style={styles.verificationHeaderBadgeText}>
                🛡️ 족보 항렬·세손 자체 검증 공인
              </Text>
            </View>
          </View>
          <Text style={styles.toolbarDesc}>
            대동보(大同譜) 항렬자 오행 상생 검증 · [30세(世) = 29세손(孫)] 원전 기산법 공인 적용
          </Text>
        </View>

        <View style={styles.toolbarRight}>
          {/* Mode Switcher */}
          <View style={styles.modeGroup}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                lineageMode === 'lineage_direct' && styles.modeBtnActive,
              ]}
              onPress={() => setLineageMode('lineage_direct')}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  lineageMode === 'lineage_direct' && styles.modeBtnTextActive,
                ]}
              >
                👑 직계 4대 가계도 (부계 정통)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                lineageMode === 'bilateral' && styles.modeBtnActive,
              ]}
              onPress={() => setLineageMode('bilateral')}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  lineageMode === 'bilateral' && styles.modeBtnTextActive,
                ]}
              >
                ⚖️ 친가·외가 조부모 포함
              </Text>
            </TouchableOpacity>
          </View>

          {/* Master Verification Service Center Button */}
          <TouchableOpacity
            style={styles.masterCenterBtn}
            onPress={() => setIsMasterDashboardVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.masterCenterBtnText}>🏛️ 족보 마스터 감정 센터</Text>
          </TouchableOpacity>

          {/* Return to Main Menu */}
          {onReturnToMain && (
            <TouchableOpacity
              style={styles.returnMainBtn}
              onPress={onReturnToMain}
              activeOpacity={0.85}
            >
              <Text style={styles.returnMainBtnText}>🏠 전체 메뉴 (가계도 홈)</Text>
            </TouchableOpacity>
          )}

          {/* Print Button Group */}
          <View style={styles.printButtonGroup}>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => handlePrintMasterpiece('landscape', true)}
              disabled={isCapturing}
              activeOpacity={0.85}
            >
              <Text style={styles.printBtnText}>
                {isCapturing ? '⏳ 액자 이미지화 중...' : '🖨️ 액자 인쇄 / PDF (가로형 1장)'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadImgBtn}
              onPress={() => handleDownloadImage(true)}
              disabled={isCapturing}
              activeOpacity={0.85}
            >
              <Text style={styles.downloadImgBtnText}>
                {isCapturing ? '⏳ 생성 중...' : '🖼️ 액자 이미지(PNG) 저장'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.printOptionBtn}
              onPress={() => setIsPrintModalOpen(true)}
              disabled={isCapturing}
              activeOpacity={0.85}
            >
              <Text style={styles.printOptionBtnText}>⚙️ 인쇄 설정</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Scrollable Canvas Frame */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.canvasScrollContent}
      >
        <View
          nativeID="framed-masterpiece-canvas"
          {...({ id: 'framed-masterpiece-canvas' } as any)}
          style={styles.frameOuter}
        >
          <View style={styles.frameWoodMatting}>
            <View
              nativeID="framed-canvas-parchment"
              {...({ id: 'framed-canvas-parchment' } as any)}
              style={styles.canvasParchment}
            >
              {/* ================= HEADER: CALLIGRAPHY TITLE ================= */}
              <View style={styles.calligraphyHeader}>
                <View style={styles.headerDecoLine} />
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.headerClanHanja}>慶州金氏 · 全州李氏 · 東萊鄭氏</Text>
                  <Text style={styles.headerMainTitle}>가 족 가 계 도 (家 族 家 系 圖)</Text>
                  <Text style={styles.headerMotto}>
                    崇祖愛族 · 孝悌忠信 · 內外和睦 (부계 혈통의 정통성과 부부 결합의 아름다운 결실을 기리다)
                  </Text>
                </View>
                <View style={styles.headerDecoLine} />
              </View>

              {/* ================= TREE DIAGRAM AREA WITH SVG CONNECTIONS ================= */}
              <View style={styles.treeDiagramArea}>
                {/* SVG Vector Connector Lines */}
                {/* @ts-ignore: React Native Web supports native svg element */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 1480,
                    height: 860,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  {/* ========================================================================= */}
                  {/* LINE 1: 조부모 중간(X=595, Y=175) ➔ 부친 김영수(X=595, Y=235) */}
                  {/* ========================================================================= */}
                  <line x1="595" y1="175" x2="595" y2="235" stroke="#dc2626" strokeWidth="3" />
                  <circle cx="595" cy="175" r="4" fill="#dc2626" />
                  <circle cx="595" cy="235" r="4" fill="#dc2626" />

                  {/* If Bilateral mode: 외가 조부모 부부 중간 하단(X=1215, Y=175) ➔ 모친 이은경(X=855, Y=235) */}
                  {lineageMode === 'bilateral' && (
                    <>
                      <line x1="1215" y1="175" x2="1215" y2="205" stroke="#2563eb" strokeWidth="2.5" />
                      <line x1="855" y1="205" x2="1215" y2="205" stroke="#2563eb" strokeWidth="2.5" />
                      <line x1="855" y1="205" x2="855" y2="235" stroke="#2563eb" strokeWidth="2.5" />
                      <circle cx="1215" cy="175" r="4" fill="#2563eb" />
                      <circle cx="855" cy="235" r="3.5" fill="#2563eb" />
                    </>
                  )}

                  {/* ========================================================================= */}
                  {/* LINE 2: 부모 중간 하부(X=725, Y=380) ➔ 3대 형제자매 버스선(Y=430) */}
                  {/* ========================================================================= */}
                  <line x1="725" y1="380" x2="725" y2="430" stroke="#1f2937" strokeWidth="3" />
                  <circle cx="725" cy="380" r="4" fill="#1f2937" />

                  {/* 3대 형제자매 수평 분배 버스선 (X=320 ~ X=1130) */}
                  <line x1="320" y1="430" x2="1130" y2="430" stroke="#1f2937" strokeWidth="2.5" />

                  {/* 수직 분배 드롭선: 오직 혈육(본인, 남동생, 여동생)에게만 내려옴! */}
                  {/* 1. 본인 김준혁 머리 위(X=320)로 드롭! */}
                  <line x1="320" y1="430" x2="320" y2="470" stroke="#1f2937" strokeWidth="2.5" />
                  <circle cx="320" cy="470" r="3.5" fill="#1f2937" />

                  {/* 2. 부인 정서연(X=570): 드롭선 없음! (0 라인) */}

                  {/* 3. 남동생 김민혁 머리 위(X=880)로 드롭! */}
                  <line x1="880" y1="430" x2="880" y2="470" stroke="#1f2937" strokeWidth="2.5" />
                  <circle cx="880" cy="470" r="3.5" fill="#1f2937" />

                  {/* 4. 여동생 김지우 머리 위(X=1130)로 드롭! */}
                  <line x1="1130" y1="430" x2="1130" y2="470" stroke="#1f2937" strokeWidth="2.5" />
                  <circle cx="1130" cy="470" r="3.5" fill="#1f2937" />

                  {/* ========================================================================= */}
                  {/* LINE 3: 본인과 부인의 중간 하부(X=445, Y=620) ➔ 4대 자녀 버스선(Y=665) */}
                  {/* ========================================================================= */}
                  <line x1="445" y1="620" x2="445" y2="665" stroke="#059669" strokeWidth="3" />
                  <circle cx="445" cy="620" r="4" fill="#059669" />

                  {/* 4대 자녀 수평 분배 버스선 (X=325 ~ X=565) */}
                  <line x1="325" y1="665" x2="565" y2="665" stroke="#059669" strokeWidth="2.5" />

                  {/* 1. 장남 김도윤 머리 위(X=325)로 드롭! */}
                  <line x1="325" y1="665" x2="325" y2="700" stroke="#059669" strokeWidth="2.5" />
                  <circle cx="325" cy="700" r="3.5" fill="#059669" />

                  {/* 2. 장녀 김하은 머리 위(X=565)로 드롭! */}
                  <line x1="565" y1="665" x2="565" y2="700" stroke="#059669" strokeWidth="2.5" />
                  <circle cx="565" cy="700" r="3.5" fill="#059669" />
                </svg>

                {/* ================= TIER 1: 1대 조부모 (Y = 10 ~ 175) ================= */}
                <View style={[styles.absPosition, { left: 360, top: 10 }]}>
                  <View style={styles.sectionHeaderBadge}>
                    <Text style={styles.sectionHeaderText}>🔴 1대 조부모 (부친의 부모)</Text>
                  </View>
                </View>

                {/* 친조부 김진호 (left=360, top=40) */}
                <View style={[styles.absPosition, { left: 360, top: 40 }]}>
                  {renderCard(pat1_1, '친할아버지 (조부)', 210, 135, '#dc2626')}
                </View>

                {/* 夫婦 결합선 (left=570, top=95) */}
                <View style={[styles.absPosition, { left: 570, top: 95, width: 50, alignItems: 'center' }]}>
                  <View style={styles.marriageLine} />
                  <View style={styles.marriagePill}>
                    <Text style={styles.marriagePillText}>夫婦</Text>
                  </View>
                  <View style={styles.marriageLine} />
                </View>

                {/* 친조모 박순자 (left=620, top=40) */}
                <View style={[styles.absPosition, { left: 620, top: 40 }]}>
                  {renderCard(pat1_2, '친할머니 (조모)', 210, 135, '#b91c1c')}
                </View>

                {/* 외조부모 (양가 모드일 때만 X=995~1205에 렌더링) */}
                {lineageMode === 'bilateral' && (
                  <>
                    <View style={[styles.absPosition, { left: 995, top: 10 }]}>
                      <View style={[styles.sectionHeaderBadge, { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
                        <Text style={[styles.sectionHeaderText, { color: '#1e40af' }]}>🔵 외가 1대 외조부모 (모친의 부모)</Text>
                      </View>
                    </View>
                    <View style={[styles.absPosition, { left: 995, top: 40 }]}>
                      {renderCard(mat1_1, '외할아버지 (외조부)', 200, 135, '#2563eb')}
                    </View>
                    <View style={[styles.absPosition, { left: 1195, top: 95, width: 40, alignItems: 'center' }]}>
                      <View style={styles.marriageLine} />
                      <View style={[styles.marriagePill, { borderColor: '#2563eb' }]}>
                        <Text style={[styles.marriagePillText, { color: '#2563eb' }]}>夫婦</Text>
                      </View>
                      <View style={styles.marriageLine} />
                    </View>
                    <View style={[styles.absPosition, { left: 1235, top: 40 }]}>
                      {renderCard(mat1_2, '외할머니 (외조모)', 200, 135, '#1d4ed8')}
                    </View>
                  </>
                )}

                {/* ================= TIER 2: 2대 부모 (Y = 205 ~ 380) ================= */}
                <View style={[styles.absPosition, { left: 590, top: 205 }]}>
                  <View style={[styles.sectionHeaderBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                    <Text style={[styles.sectionHeaderText, { color: '#b45309' }]}>
                      ★ 2대 직계 존속 부모 (아버지와 어머니) ★
                    </Text>
                  </View>
                </View>

                {/* 부친 김영수 (left=490, top=235, center=595) */}
                <View style={[styles.absPosition, { left: 490, top: 235 }]}>
                  {renderCard(pat2_2, '아버지 (부친 · 경주 김씨)', 210, 145, '#dc2626')}
                </View>

                {/* 夫婦 결합선 (left=700, top=295, center=725) */}
                <View style={[styles.absPosition, { left: 700, top: 295, width: 50, alignItems: 'center' }]}>
                  <View style={styles.marriageLine} />
                  <View style={styles.marriagePill}>
                    <Text style={styles.marriagePillText}>夫婦</Text>
                  </View>
                  <View style={styles.marriageLine} />
                </View>

                {/* 모친 이은경 (left=750, top=235, center=855) */}
                <View style={[styles.absPosition, { left: 750, top: 235 }]}>
                  {renderCard(mat2_1, '어머니 (모친 · 전주 이씨)', 210, 145, '#2563eb')}
                </View>

                {/* ================= TIER 3: 3대 본인 & 부인, 형제자매 (Y = 445 ~ 620) ================= */}
                {/* 본인 부부 헤더 */}
                <View style={[styles.absPosition, { left: 218, top: 445 }]}>
                  <View style={[styles.sectionHeaderBadge, { backgroundColor: '#ffedd5', borderColor: '#fed7aa' }]}>
                    <Text style={[styles.sectionHeaderText, { color: '#c2410c' }]}>
                      ★ 3대 가문 중심 부부 (본인과 배우자) ★
                    </Text>
                  </View>
                </View>

                {/* 동기 헤더 */}
                <View style={[styles.absPosition, { left: 778, top: 445 }]}>
                  <View style={[styles.sectionHeaderBadge, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
                    <Text style={[styles.sectionHeaderText, { color: '#475569' }]}>
                      동기 (형제·자매)
                    </Text>
                  </View>
                </View>

                {/* 1. 김준혁 본인 (left=218, top=470, center=320) */}
                <View style={[styles.absPosition, { left: 218, top: 470 }]}>
                  {renderCard(pat3_1, '본인 (경주 김씨 29세손)', 205, 150, '#b45309')}
                </View>

                {/* 2. 夫婦 결합선 (left=423, top=535, center=445) */}
                <View style={[styles.absPosition, { left: 423, top: 535, width: 44, alignItems: 'center' }]}>
                  <View style={styles.marriageLine} />
                  <View style={[styles.marriagePill, { borderColor: '#d97706' }]}>
                    <Text style={[styles.marriagePillText, { color: '#d97706' }]}>夫婦</Text>
                  </View>
                  <View style={styles.marriageLine} />
                </View>

                {/* 3. 정서연 부인 (left=467, top=470, center=570) - ⚠️ 위에서 내려오는 라인 없음! */}
                <View style={[styles.absPosition, { left: 467, top: 470 }]}>
                  {renderCard(inlaw3_1, '배우자 (아내 · 동래 정씨)', 205, 150, '#d97706')}
                </View>

                {/* 4. 김민혁 남동생 (left=778, top=470, center=880) */}
                <View style={[styles.absPosition, { left: 778, top: 470 }]}>
                  {renderCard(pat3_2, '남동생', 205, 150, '#78350f')}
                </View>

                {/* 5. 김지우 여동생 (left=1028, top=470, center=1130) */}
                <View style={[styles.absPosition, { left: 1028, top: 470 }]}>
                  {renderCard(pat3_3, '여동생', 205, 150, '#78350f')}
                </View>

                {/* ================= TIER 4: 4대 자녀들 (Y = 675 ~ 840) ================= */}
                {/* 자녀 헤더 */}
                <View style={[styles.absPosition, { left: 225, top: 675 }]}>
                  <View style={[styles.sectionHeaderBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                    <Text style={[styles.sectionHeaderText, { color: '#047857' }]}>
                      ▼ 4대 직계 자녀 (아버지와 어머니의 피를 물려받은 결실) ▼
                    </Text>
                  </View>
                </View>

                {/* 장남 김도윤 (left=225, top=700, center=325) */}
                <View style={[styles.absPosition, { left: 225, top: 700 }]}>
                  {renderCard(pat4_1, '장남 (아들 · 30대손)', 200, 140, '#059669')}
                </View>

                {/* 장녀 김하은 (left=465, top=700, center=565) */}
                <View style={[styles.absPosition, { left: 465, top: 700 }]}>
                  {renderCard(pat4_2, '장녀 (딸 · 30대손)', 200, 140, '#059669')}
                </View>
              </View>

              {/* ================= FOOTER: SEALS & MOTTO ================= */}
              <View style={styles.frameFooter}>
                <View style={styles.footerLeftNote}>
                  <Text style={styles.footerNoteText}>
                    ※ 본 가계도는 부계(경주 김씨)의 혈통 가통을 중심으로, 부부의 굳건한 결연을 통해
                  </Text>
                  <Text style={styles.footerNoteText}>
                    자녀에게 생명의 피가 고루 이어짐을 기리며, 가족 대대로 화목하기를 기원하여 봉안합니다.
                  </Text>
                </View>

                <View style={styles.footerCenterDate}>
                  <Text style={styles.footerDateHanja}>歲次 丙午年 仲秋 謹撰</Text>
                  <Text style={styles.footerDateSolar}>서기 2026년 9월 길일</Text>
                </View>

                <View style={styles.footerRightSeals}>
                  <View style={styles.royalSquareSeal}>
                    <Text style={styles.royalSquareSealText}>金李鄭門
和睦之印</Text>
                  </View>
                  <View style={styles.circleSeal}>
                    <Text style={styles.circleSealText}>家族
公認</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Print Options & Preview Guidance Modal */}
      <Modal visible={isPrintModalOpen} transparent animationType="fade" onRequestClose={() => setIsPrintModalOpen(false)}>
        <View style={styles.printModalOverlay}>
          <View style={styles.printModalCard}>
            <View style={styles.printModalHeader}>
              <View style={styles.printModalBadge}>
                <Text style={styles.printModalBadgeText}>거실 벽걸이 액자 인쇄 / PDF</Text>
              </View>
              <Text style={styles.printModalTitle}>🖨️ 액자 전용 1페이지 출력 설정</Text>
              <Text style={styles.printModalSubtitle}>
                주변 메뉴, 상단바, 시뮬레이터, 하단 탭바를 100% 자동 제외하고 가계도 액자만 고해상도로 출력합니다.
              </Text>
            </View>

            {/* Option 1: Orientation */}
            <View style={styles.printSection}>
              <Text style={styles.printSectionLabel}>용지 출력 방향 (기본: 가로형 권장)</Text>
              <View style={styles.orientationOptionRow}>
                <TouchableOpacity
                  style={[
                    styles.orientationBtn,
                    printOrientation === 'landscape' && styles.orientationBtnActive,
                  ]}
                  onPress={() => setPrintOrientation('landscape')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.orientationBtnIcon}>🖼️</Text>
                  <Text
                    style={[
                      styles.orientationBtnTitle,
                      printOrientation === 'landscape' && styles.orientationBtnTitleActive,
                    ]}
                  >
                    가로 방향 (Landscape)
                  </Text>
                  <Text style={styles.orientationBtnDesc}>
                    거실 벽걸이 16:9 와이드 규격 · 추천
                  </Text>
                  {printOrientation === 'landscape' && (
                    <View style={styles.orientationCheck}>
                      <Text style={styles.orientationCheckText}>✓ 기본 선택</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.orientationBtn,
                    printOrientation === 'portrait' && styles.orientationBtnActive,
                  ]}
                  onPress={() => setPrintOrientation('portrait')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.orientationBtnIcon}>📄</Text>
                  <Text
                    style={[
                      styles.orientationBtnTitle,
                      printOrientation === 'portrait' && styles.orientationBtnTitleActive,
                    ]}
                  >
                    세로 방향 (Portrait)
                  </Text>
                  <Text style={styles.orientationBtnDesc}>
                    상하 종서형 족보 배치 규격
                  </Text>
                  {printOrientation === 'portrait' && (
                    <View style={styles.orientationCheck}>
                      <Text style={styles.orientationCheckText}>✓ 선택됨</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Option 2: Framing Style */}
            <View style={styles.printSection}>
              <Text style={styles.printSectionLabel}>표구 테두리 옵션</Text>
              <View style={styles.framingOptionRow}>
                <TouchableOpacity
                  style={[
                    styles.framingBtn,
                    includeOuterFrame && styles.framingBtnActive,
                  ]}
                  onPress={() => setIncludeOuterFrame(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.framingBtnText,
                      includeOuterFrame && styles.framingBtnTextActive,
                    ]}
                  >
                    🪵 고급 원목 표구 테두리 포함 (거실 벽 부착용)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.framingBtn,
                    !includeOuterFrame && styles.framingBtnActive,
                  ]}
                  onPress={() => setIncludeOuterFrame(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.framingBtnText,
                      !includeOuterFrame && styles.framingBtnTextActive,
                    ]}
                  >
                    📜 내지(한지)만 깔끔하게 인쇄 (별도 액자 장착용)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.printNoticeBox}>
              <Text style={styles.printNoticeItem}>
                • 브라우저 인쇄 창의 <Text style={{ fontWeight: '800' }}>[대상]</Text> 항목에서 <Text style={{ fontWeight: '800', color: '#0284c7' }}>'PDF로 저장'</Text>을 선택하시면 고해상도 디지털 가계도 파일로 평생 보관할 수 있습니다.
              </Text>
              <Text style={styles.printNoticeItem}>
                • 브라우저 인쇄 창에서 레이아웃을 '가로 방향' 또는 '세로 방향'으로 자유롭게 전환하셔도 <Text style={{ fontWeight: '800' }}>1페이지 맞춤 비율</Text>이 자동으로 유지됩니다.
              </Text>
              <Text style={styles.printNoticeItem}>
                • 더 선명한 원목 질감을 위해 인쇄 창 <Text style={{ fontWeight: '800' }}>[설정 더보기 ➔ 배경 그래픽]</Text> 체크를 권장합니다.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.printModalBtnRow}>
              <TouchableOpacity
                style={styles.printExecuteBtn}
                onPress={() => {
                  setIsPrintModalOpen(false);
                  handlePrintMasterpiece(printOrientation, includeOuterFrame);
                }}
                disabled={isCapturing}
                activeOpacity={0.85}
              >
                <Text style={styles.printExecuteBtnText}>
                  🖨️ {printOrientation === 'landscape' ? '가로 방향' : '세로 방향'} 1장 인쇄 / PDF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDownloadBtn}
                onPress={() => {
                  setIsPrintModalOpen(false);
                  handleDownloadImage(includeOuterFrame);
                }}
                disabled={isCapturing}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDownloadBtnText}>
                  🖼️ 이미지(PNG) 저장
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printCancelBtn}
                onPress={() => setIsPrintModalOpen(false)}
              >
                <Text style={styles.printCancelBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clan Master Paid Verification Center Modal */}
      <MasterTrackingDashboardModal
        visible={isMasterDashboardVisible}
        onClose={() => setIsMasterDashboardVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917',
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#292524',
    borderBottomWidth: 1,
    borderBottomColor: '#44403c',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarLeft: {
    flex: 1,
    minWidth: 280,
  },
  masterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  masterBadge: {
    backgroundColor: '#78350f',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  masterBadgeText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '800',
  },
  verificationHeaderBadge: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verificationHeaderBadgeText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '800',
  },
  toolbarDesc: {
    color: '#d6d3d1',
    fontSize: 11,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#57534e',
    backgroundColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: '#b45309',
    borderColor: '#f59e0b',
  },
  modeBtnText: {
    color: '#a8a29e',
    fontSize: 11,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  masterCenterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#065f46',
    borderWidth: 1,
    borderColor: '#34d399',
  },
  masterCenterBtnText: {
    color: '#ecfdf5',
    fontSize: 11,
    fontWeight: '800',
  },
  returnMainBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#475569',
  },
  returnMainBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  printBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0284c7',
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  downloadImgBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#78350f',
    borderWidth: 1,
    borderColor: '#b45309',
  },
  downloadImgBtnText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '800',
  },
  printButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  printOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  printOptionBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  printModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  printModalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  printModalHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  printModalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  printModalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  printModalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  printModalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  printSection: {
    marginBottom: 14,
  },
  printSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  orientationOptionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  orientationBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  orientationBtnActive: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0284c7',
  },
  orientationBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  orientationBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  orientationBtnTitleActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  orientationBtnDesc: {
    fontSize: 10.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  orientationCheck: {
    marginTop: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orientationCheckText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  framingOptionRow: {
    gap: 8,
  },
  framingBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  framingBtnActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  framingBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  framingBtnTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  printNoticeBox: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    gap: 4,
  },
  printNoticeItem: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  printModalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  printExecuteBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  printExecuteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalDownloadBtn: {
    backgroundColor: '#78350f',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b45309',
  },
  modalDownloadBtnText: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
  },
  printCancelBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  printCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  canvasScrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  frameOuter: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: '#451a03',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  frameWoodMatting: {
    flex: 1,
    backgroundColor: '#78350f',
    borderRadius: 8,
    padding: 8,
  },
  canvasParchment: {
    flex: 1,
    backgroundColor: '#fdfbf7',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#a8a29e',
    padding: 18,
    position: 'relative',
    justifyContent: 'space-between',
  },
  calligraphyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#292524',
    paddingBottom: 10,
    marginBottom: 6,
  },
  headerDecoLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#a8a29e',
    marginHorizontal: 18,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerClanHanja: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350f',
    letterSpacing: 3,
    marginBottom: 2,
  },
  headerMainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'web' ? 'serif' : undefined,
  },
  headerMotto: {
    fontSize: 11,
    color: '#57534e',
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '600',
  },
  treeDiagramArea: {
    width: 1480,
    height: 860,
    position: 'relative',
  },
  absPosition: {
    position: 'absolute',
    zIndex: 2,
  },
  sectionHeaderBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#fca5a5',
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991b1b',
  },
  marriageLine: {
    height: 1,
    width: 12,
    backgroundColor: '#b45309',
  },
  marriagePill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  marriagePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'space-between',
  },
  emptyCardText: {
    fontSize: 11,
    color: '#a8a29e',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '800',
  },
  identityCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1c1917',
  },
  cardHanja: {
    fontSize: 11,
    color: '#57534e',
  },
  lifespanText: {
    fontSize: 10,
    color: '#78716c',
  },
  clanAndGenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 1,
  },
  clanText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dualGenBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#fde68a',
  },
  dualGenBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#b45309',
  },
  roleTitleText: {
    fontSize: 10,
    color: '#44403c',
    fontWeight: '600',
  },
  verificationBar: {
    backgroundColor: '#ecfdf5',
    borderWidth: 0.8,
    borderColor: '#a7f3d0',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginVertical: 2,
  },
  verificationBarText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#065f46',
  },
  bioBox: {
    borderTopWidth: 0.5,
    borderTopColor: '#f5f5f4',
    paddingTop: 4,
    marginTop: 4,
  },
  bioText: {
    fontSize: 9.5,
    color: '#57534e',
  },
  frameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#a8a29e',
    paddingTop: 10,
    marginTop: 6,
  },
  footerLeftNote: {
    flex: 1,
  },
  footerNoteText: {
    fontSize: 10.5,
    color: '#57534e',
    lineHeight: 14,
  },
  footerCenterDate: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  footerDateHanja: {
    fontSize: 13,
    fontWeight: '800',
    color: '#292524',
    letterSpacing: 2,
  },
  footerDateSolar: {
    fontSize: 10,
    color: '#78716c',
    marginTop: 2,
  },
  footerRightSeals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  royalSquareSeal: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: '#dc2626',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
  },
  royalSquareSealText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 11,
  },
  circleSeal: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
  },
  circleSealText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#dc2626',
    textAlign: 'center',
    lineHeight: 11,
  },
});
