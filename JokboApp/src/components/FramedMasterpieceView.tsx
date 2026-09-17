import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { FamilyMember } from '../types/family';

interface FramedMasterpieceViewProps {
  members: FamilyMember[];
  onSelectMember?: (member: FamilyMember) => void;
}

// Fixed canvas dimensions for high-resolution bilateral gallery framing (16:9 / 16:10 museum ratio)
const FRAME_WIDTH = 1560;
const FRAME_HEIGHT = 1080;

export const FramedMasterpieceView: React.FC<FramedMasterpieceViewProps> = ({
  members,
  onSelectMember,
}) => {
  // Lineage balance mode:
  // 'bilateral' (default: 친가·외가·처가 남녀동등 양계 가계도)
  // 'paternal' (친가 직계 중심)
  // 'maternal' (외가 직계 중심)
  const [viewScope, setViewScope] = useState<'bilateral' | 'paternal' | 'maternal'>('bilateral');

  // Trigger high quality browser print dialog
  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  // Paternal Lineage (친가)
  const pat1_1 = members.find((m) => m.id === 'pat-1-1'); // 김진호 (친조부)
  const pat1_2 = members.find((m) => m.id === 'pat-1-2'); // 박순자 (친조모)
  const pat2_1 = members.find((m) => m.id === 'pat-2-1'); // 김영호 (백부/종손)
  const pat2_2 = members.find((m) => m.id === 'pat-2-2'); // 김영수 (부친)
  const pat2_3 = members.find((m) => m.id === 'pat-2-3'); // 김영숙 (고모)
  const pat3_4 = members.find((m) => m.id === 'pat-3-4'); // 김태혁 (사촌형)

  // Maternal Lineage (외가 - 어머니 계통)
  const mat1_1 = members.find((m) => m.id === 'mat-1-1'); // 이성한 (외조부)
  const mat1_2 = members.find((m) => m.id === 'mat-1-2'); // 권정자 (외조모)
  const mat2_1 = members.find((m) => m.id === 'mat-2-1'); // 이은경 (모친)
  const mat2_2 = members.find((m) => m.id === 'mat-2-2'); // 이은철 (외숙)

  // Central Couple & Generation 3 (본인, 아내, 형제자매)
  const pat3_1 = members.find((m) => m.id === 'pat-3-1'); // 김준혁 (본인)
  const inlaw3_1 = members.find((m) => m.id === 'inlaw-pat-3-1'); // 정서연 (배우자/아내)
  const inlaw2_1 = members.find((m) => m.id === 'inlaw-pat-2-1'); // 정우진 (장인어른)
  const inlaw_mat2_1 = members.find((m) => m.id === 'inlaw-mat-2-1'); // 장모
  const pat3_2 = members.find((m) => m.id === 'pat-3-2'); // 김민혁 (남동생)
  const pat3_3 = members.find((m) => m.id === 'pat-3-3'); // 김지우 (여동생)

  // Generation 4 (직계 자녀)
  const pat4_1 = members.find((m) => m.id === 'pat-4-1'); // 김도윤 (아들)
  const pat4_2 = members.find((m) => m.id === 'pat-4-2'); // 김하은 (딸)

  // Equal Dignity Person Card Render Component:
  // 남녀, 부계, 모계 차별 없이 동일한 규격, 동일한 크기의 사진, 동일한 약력을 1:1 대칭으로 렌더링
  const renderDignifiedCard = (
    member?: FamilyMember,
    customTitle?: string,
    width: number = 240,
    accentColor: string = '#78350f'
  ) => {
    if (!member) return null;

    const birthYear = member.birthDate ? member.birthDate.split('-')[0] : '미상';
    const deathYear = member.deathDate ? member.deathDate.split('-')[0] : '';
    const yearsText = member.isAlive ? `${birthYear}~` : `${birthYear}~${deathYear}`;

    const isElder = member.generation <= 2;
    const isMale = member.gender === 'M';

    return (
      <TouchableOpacity
        style={[
          styles.dignifiedCard,
          { width, borderTopColor: accentColor },
        ]}
        activeOpacity={0.8}
        onPress={() => onSelectMember && onSelectMember(member)}
      >
        <View style={styles.cardHeader}>
          {/* 1. Vintage Portrait Frame */}
          <View style={[styles.photoFrame, { borderColor: accentColor }]}>
            <View style={styles.photoInner}>
              <Text style={styles.photoAvatarIcon}>
                {isElder ? (isMale ? '👴' : '👵') : (isMale ? '👨' : '👩')}
              </Text>
              <View style={styles.photoSepiaFilter} />
            </View>
          </View>

          {/* 2. Primary Identifiers */}
          <View style={styles.cardMainIdentity}>
            <View style={styles.nameHanjaRow}>
              <Text style={styles.personName}>{member.name}</Text>
              {member.hanja && <Text style={styles.personHanja}>({member.hanja})</Text>}
            </View>
            <Text style={styles.lifespanText}>[{yearsText}]</Text>
            <Text style={[styles.clanBadgeText, { color: accentColor }]}>
              {member.clan || '본관'}
            </Text>
            <Text style={styles.relationshipRoleText}>
              {customTitle || member.relationship}
            </Text>
          </View>
        </View>

        {/* 3. Achievements & Biographical Record */}
        <View style={styles.biographySection}>
          {member.achievements && member.achievements.length > 0 ? (
            member.achievements.slice(0, 2).map((ach, idx) => (
              <Text key={idx} style={styles.biographyLine} numberOfLines={1}>
                • {ach}
              </Text>
            ))
          ) : (
            <Text style={styles.biographyLine} numberOfLines={1}>
              • {member.memo || '가문 화합 및 우애 계승'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Equal Dignity Couple Block:
  // 남편과 아내가 각각 완벽한 독립된 카드로 대등하게 배치되고, 가운데 수평 결연선으로 연결
  const renderEqualCouple = (
    husband?: FamilyMember,
    wife?: FamilyMember,
    husbandTitle?: string,
    wifeTitle?: string,
    cardWidth: number = 230,
    husbandAccent: string = '#dc2626',
    wifeAccent: string = '#2563eb'
  ) => {
    return (
      <View style={styles.coupleContainer}>
        {renderDignifiedCard(husband, husbandTitle, cardWidth, husbandAccent)}
        
        {/* Horizontal Marriage Link Line with Heart / Ring Symbol */}
        <View style={styles.coupleMarriageBridge}>
          <View style={styles.coupleMarriageLine} />
          <View style={styles.coupleRingBadge}>
            <Text style={styles.coupleRingText}>夫婦</Text>
          </View>
          <View style={styles.coupleMarriageLine} />
        </View>

        {renderDignifiedCard(wife, wifeTitle, cardWidth, wifeAccent)}
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      {/* 1. Action & Mode Selector Toolbar */}
      <View style={styles.actionToolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.toolbarTitle}>🖼️ 거실 표구 액자형 가계도 (부계·모계·배우자 동등 통합 에디션)</Text>
          <Text style={styles.toolbarSubtitle}>
            가족 모두가 함께 보는 액자로서 부계와 모계, 아내(처가)가 1:1 동등한 비중과 위상으로 완벽히 대칭을 이루도록 구성되었습니다.
          </Text>
        </View>

        <View style={styles.toolbarRight}>
          {/* Scope Selector */}
          <View style={styles.scopeToggleGroup}>
            <TouchableOpacity
              style={[
                styles.scopeBtn,
                viewScope === 'bilateral' && styles.scopeBtnActive,
              ]}
              onPress={() => setViewScope('bilateral')}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  viewScope === 'bilateral' && styles.scopeBtnTextActive,
                ]}
              >
                ⚖️ 친가·외가·아내 동등 통합보 (권장)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scopeBtn,
                viewScope === 'paternal' && styles.scopeBtnActive,
              ]}
              onPress={() => setViewScope('paternal')}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  viewScope === 'paternal' && styles.scopeBtnTextActive,
                ]}
              >
                친가 직계 중심
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.scopeBtn,
                viewScope === 'maternal' && styles.scopeBtnActive,
              ]}
              onPress={() => setViewScope('maternal')}
            >
              <Text
                style={[
                  styles.scopeBtnText,
                  viewScope === 'maternal' && styles.scopeBtnTextActive,
                ]}
              >
                외가 직계 중심
              </Text>
            </TouchableOpacity>
          </View>

          {/* Print Button */}
          <TouchableOpacity style={styles.printButton} onPress={handlePrint} activeOpacity={0.85}>
            <Text style={styles.printButtonText}>🖨️ 액자용 고화질 인쇄 / PDF 저장</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Scrollable Canvas Frame */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.canvasScrollContent}
      >
        <View style={styles.frameOuterBorder}>
          <View style={styles.frameWoodMatting}>
            <View style={styles.canvasParchment}>
              {/* ================= HEADER: BILATERAL CALLIGRAPHY TITLE ================= */}
              <View style={styles.calligraphyHeader}>
                <View style={styles.headerDecoLine} />
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.headerClanHanja}>慶州金氏 · 全州李氏 · 東萊鄭氏</Text>
                  <Text style={styles.headerMainTitle}>가 족 가 계 도 (家 族 家 系 圖)</Text>
                  <Text style={styles.headerMotto}>
                    崇祖愛族 · 孝悌忠信 · 內外和睦 (부계와 모계, 배우자가 상호 존중과 효애로써 가통을 이루다)
                  </Text>
                </View>
                <View style={styles.headerDecoLine} />
              </View>

              {/* ================= BILATERAL TREE DIAGRAM AREA ================= */}
              <View style={styles.treeDiagramArea}>
                {/* SVG Connecting Vector Lines Layer */}
                {/* @ts-ignore: React Native Web supports native svg element */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: FRAME_WIDTH - 80,
                    height: FRAME_HEIGHT - 220,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  {/* Generation 1 -> Generation 2 Connectors */}
                  {/* Left (Paternal 1st Gen) down stem to father (pat-2-2) */}
                  <line x1="390" y1="135" x2="390" y2="185" stroke="#dc2626" strokeWidth="2.5" />
                  <line x1="240" y1="185" x2="620" y2="185" stroke="#dc2626" strokeWidth="2.5" />
                  <line x1="240" y1="185" x2="240" y2="235" stroke="#dc2626" strokeWidth="2.5" />
                  <line x1="620" y1="185" x2="620" y2="235" stroke="#dc2626" strokeWidth="2.5" />

                  {/* Right (Maternal 1st Gen) down stem to mother (mat-2-1) */}
                  <line x1="1130" y1="135" x2="1130" y2="185" stroke="#2563eb" strokeWidth="2.5" />
                  <line x1="860" y1="185" x2="1280" y2="185" stroke="#2563eb" strokeWidth="2.5" />
                  <line x1="860" y1="185" x2="860" y2="235" stroke="#2563eb" strokeWidth="2.5" />
                  <line x1="1280" y1="185" x2="1280" y2="235" stroke="#2563eb" strokeWidth="2.5" />

                  {/* Generation 2 Parents Couple -> Generation 3 (Children Kim Jun-hyuk, Min-hyuk, Ji-woo) */}
                  {/* Central Parents Couple junction point: x = 740, y = 375 */}
                  <line x1="740" y1="365" x2="740" y2="415" stroke="#1f2937" strokeWidth="3" />
                  {/* Horizontal line across Gen 3: from 본인 부부(510) to 남동생(1050) to 여동생(1320) */}
                  <line x1="510" y1="415" x2="1320" y2="415" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="510" y1="415" x2="510" y2="445" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="1050" y1="415" x2="1050" y2="445" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="1320" y1="415" x2="1320" y2="445" stroke="#1f2937" strokeWidth="2.5" />

                  {/* Paternal Cousin branch: pat-2-1 -> pat-3-4 */}
                  <line x1="240" y1="365" x2="240" y2="445" stroke="#dc2626" strokeWidth="2" />

                  {/* Generation 3 (본인 & 아내 부부 중심) -> Generation 4 (자녀 Kim Do-yoon, Kim Ha-eun) */}
                  <line x1="510" y1="585" x2="510" y2="635" stroke="#1f2937" strokeWidth="3" />
                  <line x1="390" y1="635" x2="630" y2="635" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="390" y1="635" x2="390" y2="675" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="630" y1="635" x2="630" y2="675" stroke="#1f2937" strokeWidth="2.5" />
                </svg>

                {/* ----------------- TIER 1: 1대 조부모 & 외조부모 (양가 완전 대등 배치) ----------------- */}
                <View style={styles.tierRowGen1}>
                  {/* Left: 친조부모 (경주 김씨 · 밀양 박씨) */}
                  <View style={styles.grandBranchBox}>
                    <View style={styles.branchHeaderPillPaternal}>
                      <Text style={styles.branchHeaderText}>🔴 친가 1대 조부모 (부친의 부모)</Text>
                    </View>
                    {renderEqualCouple(
                      pat1_1,
                      pat1_2,
                      '친할아버지 (조부)',
                      '친할머니 (조모)',
                      215,
                      '#dc2626',
                      '#b91c1c'
                    )}
                  </View>

                  <View style={styles.centerPillarDivider}>
                    <Text style={styles.centerPillarText}>同等</Text>
                  </View>

                  {/* Right: 외조부모 (전주 이씨 · 안동 권씨) */}
                  <View style={styles.grandBranchBox}>
                    <View style={styles.branchHeaderPillMaternal}>
                      <Text style={styles.branchHeaderText}>🔵 외가 1대 외조부모 (모친의 부모)</Text>
                    </View>
                    {renderEqualCouple(
                      mat1_1,
                      mat1_2,
                      '외할아버지 (외조부)',
                      '외할머니 (외조모)',
                      215,
                      '#2563eb',
                      '#1d4ed8'
                    )}
                  </View>
                </View>

                {/* ----------------- TIER 2: 2대 부모 및 백부·외숙 (부모 중심 대등 결합) ----------------- */}
                <View style={styles.tierRowGen2}>
                  {/* 큰아버지 (친가 종손) */}
                  <View style={styles.sideFamilyBox}>
                    {renderDignifiedCard(pat2_1, '큰아버지 (백부/종손)', 200, '#dc2626')}
                  </View>

                  {/* CENTER: 아버지 & 어머니 (1:1 동등한 독립 카드 및 부부 브릿지) */}
                  <View style={styles.centerParentsMasterBox}>
                    <View style={styles.parentsHeaderPill}>
                      <Text style={styles.parentsHeaderText}>★ 2대 직계 존속 부모 (아버지와 어머니의 동등한 결합) ★</Text>
                    </View>
                    {renderEqualCouple(
                      pat2_2,
                      mat2_1,
                      '아버지 (부친 · 경주 김씨)',
                      '어머니 (모친 · 전주 이씨)',
                      235,
                      '#dc2626',
                      '#2563eb'
                    )}
                  </View>

                  {/* 외삼촌 (외숙) */}
                  <View style={styles.sideFamilyBox}>
                    {renderDignifiedCard(mat2_2, '외삼촌 (외숙 · 전주 이씨)', 200, '#2563eb')}
                  </View>
                </View>

                {/* ----------------- TIER 3: 3대 본인 & 아내(대등한 중심 부부) + 형제자매 ----------------- */}
                <View style={styles.tierRowGen3}>
                  {/* 친가 사촌형 */}
                  <View style={styles.sideFamilyBox}>
                    {renderDignifiedCard(pat3_4, '사촌형 (4촌 종형)', 180, '#dc2626')}
                  </View>

                  {/* CENTER: 본인 & 아내 (1:1 대등한 크기, 사진, 직함) */}
                  <View style={styles.centerSelfWifeMasterBox}>
                    <View style={styles.selfWifeHeaderPill}>
                      <Text style={styles.selfWifeHeaderText}>★ 3대 가문 중심 부부 (본인과 아내의 동등한 동반) ★</Text>
                    </View>
                    {renderEqualCouple(
                      pat3_1,
                      inlaw3_1,
                      '본인 (경주 김씨 29세손)',
                      '배우자 (아내 · 동래 정씨)',
                      225,
                      '#b45309',
                      '#d97706'
                    )}
                  </View>

                  {/* 남동생 */}
                  <View style={styles.siblingBox}>
                    {renderDignifiedCard(pat3_2, '남동생', 190, '#78350f')}
                  </View>

                  {/* 여동생 */}
                  <View style={styles.siblingBox}>
                    {renderDignifiedCard(pat3_3, '여동생', 190, '#78350f')}
                  </View>
                </View>

                {/* ----------------- TIER 4: 4대 직계 자녀 (아들과 딸의 동등한 계승) ----------------- */}
                <View style={styles.tierRowGen4}>
                  <View style={styles.childrenHeaderPill}>
                    <Text style={styles.childrenHeaderText}>▼ 4대 미래 자녀 (아버지와 어머니의 피를 고루 물려받은 사랑스러운 결실)</Text>
                  </View>
                  <View style={styles.childrenCardsRow}>
                    {renderDignifiedCard(pat4_1, '장남 (아들 · 30대손)', 230, '#059669')}
                    {renderDignifiedCard(pat4_2, '장녀 (딸 · 30대손)', 230, '#059669')}
                  </View>
                </View>
              </View>

              {/* ================= FOOTER: EQUAL DIGNITY SEALS & MOTTO ================= */}
              <View style={styles.frameFooter}>
                <View style={styles.footerLeftNote}>
                  <Text style={styles.footerNoteText}>
                    ※ 본 가계도는 부계(경주 김씨)와 모계(전주 이씨), 그리고 아내(동래 정씨)의 모든 가통이
                  </Text>
                  <Text style={styles.footerNoteText}>
                    상호 동등한 존엄과 사랑으로 결합되었음을 기리며, 가족 모두가 대대로 화목하기를 기원하여 봉안합니다.
                  </Text>
                </View>

                <View style={styles.footerCenterDate}>
                  <Text style={styles.footerDateHanja}>歲次 丙午年 仲秋 謹撰</Text>
                  <Text style={styles.footerDateSolar}>서기 2026년 9월 길일</Text>
                </View>

                <View style={styles.footerRightSeals}>
                  <View style={styles.royalSquareSeal}>
                    <Text style={styles.royalSquareSealText}>金李鄭門\n和睦之印</Text>
                  </View>
                  <View style={styles.circleSeal}>
                    <Text style={styles.circleSealText}>家族\n公認</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#1c1917',
    paddingBottom: 40,
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#292524',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#44403c',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolbarLeft: {
    flex: 1,
    minWidth: 340,
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fafaf9',
    letterSpacing: 0.5,
  },
  toolbarSubtitle: {
    fontSize: 12,
    color: '#d6d3d1',
    marginTop: 3,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  scopeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#1c1917',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  scopeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  scopeBtnActive: {
    backgroundColor: '#b45309',
  },
  scopeBtnText: {
    fontSize: 12,
    color: '#a8a29e',
    fontWeight: '600',
  },
  scopeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  printButton: {
    backgroundColor: '#047857',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  printButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  canvasScrollContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Museum-Grade Deep Dark Walnut Wooden Frame
  frameOuterBorder: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: '#27170c', // Deep rich walnut wood
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
    borderWidth: 2,
    borderColor: '#422413',
  },
  frameWoodMatting: {
    flex: 1,
    backgroundColor: '#ebe6db', // Fine silk matting
    borderRadius: 8,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#c7beaf',
  },
  canvasParchment: {
    flex: 1,
    backgroundColor: '#faf7ee', // Hanji subtle ivory
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#78350f',
    padding: 20,
    position: 'relative',
    justifyContent: 'space-between',
  },

  // Calligraphy Header
  calligraphyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#292524',
    paddingBottom: 14,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
    letterSpacing: 3,
    marginBottom: 3,
  },
  headerMainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'web' ? 'serif' : undefined,
  },
  headerMotto: {
    fontSize: 11.5,
    color: '#57534e',
    letterSpacing: 1.2,
    marginTop: 4,
    fontWeight: '600',
  },

  // Tree Diagram Area
  treeDiagramArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },

  // Row 1: 1대 조부모 & 외조부모
  tierRowGen1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 20,
  },
  grandBranchBox: {
    backgroundColor: '#f5f5f4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    alignItems: 'center',
  },
  branchHeaderPillPaternal: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 0.8,
    borderColor: '#fca5a5',
  },
  branchHeaderPillMaternal: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 0.8,
    borderColor: '#bfdbfe',
  },
  branchHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1c1917',
  },
  centerPillarDivider: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#d97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPillarText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#b45309',
  },

  // Row 2: 2대 부모 중심 결합
  tierRowGen2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 10,
  },
  centerParentsMasterBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#78350f',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  parentsHeaderPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  parentsHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350f',
  },
  sideFamilyBox: {
    alignItems: 'center',
  },

  // Row 3: 3대 본인 & 아내 중심
  tierRowGen3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 10,
  },
  centerSelfWifeMasterBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#b45309',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  selfWifeHeaderPill: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  selfWifeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9a3412',
  },
  siblingBox: {
    alignItems: 'center',
  },

  // Row 4: 4대 자녀들
  tierRowGen4: {
    alignItems: 'center',
    zIndex: 2,
    marginTop: 4,
  },
  childrenHeaderPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 0.8,
    borderColor: '#6ee7b7',
  },
  childrenHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  childrenCardsRow: {
    flexDirection: 'row',
    gap: 30,
    justifyContent: 'center',
  },

  // Couple Container & Marriage Bridge
  coupleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coupleMarriageBridge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  coupleMarriageLine: {
    width: 22,
    height: 2,
    backgroundColor: '#78350f',
  },
  coupleRingBadge: {
    backgroundColor: '#78350f',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coupleRingText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Dignified Person Card (동등한 품격의 카드 레이아웃)
  dignifiedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderTopWidth: 3.5, // Colored lineage identifier at top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photoFrame: {
    width: 54,
    height: 66,
    backgroundColor: '#e7e5e4',
    borderRadius: 4,
    borderWidth: 1.2,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
  },
  photoInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d6d3d1',
  },
  photoAvatarIcon: {
    fontSize: 30,
  },
  photoSepiaFilter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(68, 64, 60, 0.1)',
  },
  cardMainIdentity: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameHanjaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
  },
  personName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0c0a09',
  },
  personHanja: {
    fontSize: 10.5,
    color: '#57534e',
    fontWeight: '700',
  },
  lifespanText: {
    fontSize: 10,
    color: '#78716c',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    marginTop: 1,
  },
  clanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  relationshipRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#44403c',
    marginTop: 1,
  },
  biographySection: {
    borderTopWidth: 0.8,
    borderTopColor: '#f5f5f4',
    marginTop: 6,
    paddingTop: 4,
  },
  biographyLine: {
    fontSize: 9.5,
    color: '#57534e',
    lineHeight: 13,
  },

  // Footer Section
  frameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1.5,
    borderTopColor: '#292524',
    paddingTop: 10,
    marginTop: 8,
  },
  footerLeftNote: {
    flex: 1,
  },
  footerNoteText: {
    fontSize: 9.5,
    color: '#78716c',
    lineHeight: 14,
  },
  footerCenterDate: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerDateHanja: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1c1917',
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
    gap: 8,
  },
  royalSquareSeal: {
    width: 54,
    height: 54,
    borderWidth: 2,
    borderColor: '#b91c1c',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(185, 28, 28, 0.04)',
  },
  royalSquareSealText: {
    color: '#b91c1c',
    fontWeight: '900',
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 13,
    letterSpacing: 1,
  },
  circleSeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.8,
    borderColor: '#b91c1c',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(185, 28, 28, 0.04)',
  },
  circleSealText: {
    color: '#b91c1c',
    fontWeight: '900',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 11,
  },
});
