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
import { inkTheme } from '../theme/inkTheme';

interface FramedMasterpieceViewProps {
  members: FamilyMember[];
  onSelectMember?: (member: FamilyMember) => void;
}

// Fixed canvas dimensions for high-resolution gallery framing (16:10 museum ratio)
const FRAME_WIDTH = 1360;
const FRAME_HEIGHT = 1000;

export const FramedMasterpieceView: React.FC<FramedMasterpieceViewProps> = ({
  members,
  onSelectMember,
}) => {
  // Lineage filter inside the frame: default 'paternal' for traditional ancestral agnatic lineage, or 'all'
  const [selectedBranch, setSelectedBranch] = useState<'paternal' | 'combined'>('paternal');

  // Trigger high quality browser print dialog
  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  // Paternal Lineage Members lookup
  const pat1_1 = members.find((m) => m.id === 'pat-1-1'); // 김진호 (조부)
  const pat1_2 = members.find((m) => m.id === 'pat-1-2'); // 박순자 (조모)

  const pat2_1 = members.find((m) => m.id === 'pat-2-1'); // 김영호 (백부/종손)
  const pat2_2 = members.find((m) => m.id === 'pat-2-2'); // 김영수 (부친)
  const mat2_1 = members.find((m) => m.id === 'mat-2-1'); // 이은경 (모친)
  const pat2_3 = members.find((m) => m.id === 'pat-2-3'); // 김영숙 (고모)

  const pat3_4 = members.find((m) => m.id === 'pat-3-4'); // 김태혁 (종형)
  const pat3_1 = members.find((m) => m.id === 'pat-3-1'); // 김준혁 (본인)
  const inlaw3_1 = members.find((m) => m.id === 'inlaw-pat-3-1'); // 정서연 (배우자)
  const pat3_2 = members.find((m) => m.id === 'pat-3-2'); // 김민혁 (남동생)
  const pat3_3 = members.find((m) => m.id === 'pat-3-3'); // 김지우 (여동생)

  const pat4_1 = members.find((m) => m.id === 'pat-4-1'); // 김도윤 (아들)
  const pat4_2 = members.find((m) => m.id === 'pat-4-2'); // 김하은 (딸)

  // Maternal Lineage Members lookup
  const mat1_1 = members.find((m) => m.id === 'mat-1-1'); // 이성한 (외조부)
  const mat1_2 = members.find((m) => m.id === 'mat-1-2'); // 권정자 (외조모)

  // Person Card Render Component matching user's reference image
  const renderBiographyCard = (
    member?: FamilyMember,
    spouse?: FamilyMember,
    customRoleTitle?: string,
    width: number = 340
  ) => {
    if (!member) return null;

    const birthYear = member.birthDate ? member.birthDate.split('-')[0] : '미상';
    const deathYear = member.deathDate ? member.deathDate.split('-')[0] : '';
    const yearsText = member.isAlive ? `${birthYear}~` : `${birthYear}~${deathYear}`;

    // Select classic portrait silhouette based on gender and age
    const isElder = member.generation <= 2;
    const isMale = member.gender === 'M';

    return (
      <TouchableOpacity
        style={[styles.bioCard, { width }]}
        activeOpacity={0.8}
        onPress={() => onSelectMember && onSelectMember(member)}
      >
        <View style={styles.cardHorizontalWrap}>
          {/* 1. Vintage Portrait Frame */}
          <View style={styles.photoContainer}>
            <View style={styles.photoInner}>
              <Text style={styles.photoIcon}>
                {isElder ? (isMale ? '👴' : '👵') : (isMale ? '👨' : '👩')}
              </Text>
              <View style={styles.photoVignette} />
            </View>
            <View style={styles.photoBorder} />
          </View>

          {/* 2. Textual Biography Record */}
          <View style={styles.bioTextContainer}>
            {/* Name, Hanja & Lifespan */}
            <View style={styles.nameHeaderRow}>
              <Text style={styles.nameText}>{member.name}</Text>
              {member.hanja && <Text style={styles.hanjaText}>[{member.hanja}]</Text>}
              <Text style={styles.yearsText}>[{yearsText}]</Text>
            </View>

            {/* Generation & Clan */}
            <Text style={styles.clanSubText}>
              {member.clan || '경주 김씨'} · {member.relationship}
            </Text>

            {/* Role & Achievements (가업/직함/약력 2~3줄) */}
            <View style={styles.achievementsBox}>
              {customRoleTitle ? (
                <Text style={styles.achievementRole}>{customRoleTitle}</Text>
              ) : null}
              {member.achievements && member.achievements.length > 0 ? (
                member.achievements.slice(0, 3).map((ach, idx) => (
                  <Text key={idx} style={styles.achievementItem}>
                    • {ach}
                  </Text>
                ))
              ) : (
                <Text style={styles.achievementItem}>
                  • {member.memo || '가문 계승 및 우애 도모'}
                </Text>
              )}
            </View>
          </View>

          {/* 3. Spouse Inline Connection (if present and rendered together) */}
          {spouse && (
            <View style={styles.spouseWrap}>
              <View style={styles.spouseHLine} />
              <View style={styles.spouseInfoBox}>
                <Text style={styles.spouseNameText}>{spouse.name}</Text>
                {spouse.hanja && <Text style={styles.spouseHanjaText}>[{spouse.hanja}]</Text>}
                <Text style={styles.spouseYearsText}>
                  [{spouse.birthDate ? spouse.birthDate.split('-')[0] : ''}~{spouse.deathDate ? spouse.deathDate.split('-')[0] : ''}]
                </Text>
                <Text style={styles.spouseClanText}>{spouse.clan || '배필(配匹)'}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.outerContainer}>
      {/* 1. Print & Export Action Toolbar */}
      <View style={styles.actionToolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.toolbarTitle}>🖼️ 거실 표구 액자형 가계도 (A3/A2 출력 에디션)</Text>
          <Text style={styles.toolbarSubtitle}>
            고해상도 벡터 라인과 인물 사진, 가문 약력(略傳)을 수록하여 거실에 바로 액자로 걸 수 있는 완성형 작품입니다.
          </Text>
        </View>

        <View style={styles.toolbarRight}>
          {/* Branch Filter */}
          <View style={styles.branchToggleGroup}>
            <TouchableOpacity
              style={[
                styles.branchBtn,
                selectedBranch === 'paternal' && styles.branchBtnActive,
              ]}
              onPress={() => setSelectedBranch('paternal')}
            >
              <Text
                style={[
                  styles.branchBtnText,
                  selectedBranch === 'paternal' && styles.branchBtnTextActive,
                ]}
              >
                친가 직계 약전보
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.branchBtn,
                selectedBranch === 'combined' && styles.branchBtnActive,
              ]}
              onPress={() => setSelectedBranch('combined')}
            >
              <Text
                style={[
                  styles.branchBtnText,
                  selectedBranch === 'combined' && styles.branchBtnTextActive,
                ]}
              >
                친·외가 통합보
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
              {/* ================= HEADER: TRADITIONAL CALLIGRAPHY TITLE ================= */}
              <View style={styles.calligraphyHeader}>
                <View style={styles.headerDecoLine} />
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.headerClanHanja}>慶州金氏 判圖判書公派</Text>
                  <Text style={styles.headerMainTitle}>가 계 도 (家 系 圖)</Text>
                  <Text style={styles.headerMotto}>
                    崇祖愛族 · 孝悌忠信 (조상을 숭배하고 겨레를 사랑하며, 효도와 우애로써 가통을 잇다)
                  </Text>
                </View>
                <View style={styles.headerDecoLine} />
              </View>

              {/* ================= VECTOR TREE & BIOGRAPHY CARDS ================= */}
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
                  {/* Generation 1 -> Generation 2 Connector */}
                  {/* Vertical stem down from 1st Gen */}
                  <line x1="640" y1="125" x2="640" y2="175" stroke="#1f2937" strokeWidth="2.5" />
                  {/* Horizontal distributor bar for Gen 2 (from pat-2-1 to pat-2-3) */}
                  <line x1="280" y1="175" x2="1000" y2="175" stroke="#1f2937" strokeWidth="2.5" />
                  {/* Down drops to Gen 2 brothers */}
                  <line x1="280" y1="175" x2="280" y2="225" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="640" y1="175" x2="640" y2="225" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="1000" y1="175" x2="1000" y2="225" stroke="#1f2937" strokeWidth="2.5" />

                  {/* Generation 2 (pat-2-1) -> Generation 3 (pat-3-4) */}
                  <line x1="280" y1="365" x2="280" y2="440" stroke="#1f2937" strokeWidth="2" />

                  {/* Generation 2 (pat-2-2) -> Generation 3 (pat-3-1, pat-3-2, pat-3-3) */}
                  <line x1="640" y1="365" x2="640" y2="405" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="520" y1="405" x2="880" y2="405" stroke="#1f2937" strokeWidth="2" />
                  <line x1="520" y1="405" x2="520" y2="440" stroke="#1f2937" strokeWidth="2" />
                  <line x1="700" y1="405" x2="700" y2="440" stroke="#1f2937" strokeWidth="2" />
                  <line x1="880" y1="405" x2="880" y2="440" stroke="#1f2937" strokeWidth="2" />

                  {/* Generation 3 (pat-3-1) -> Generation 4 (Children pat-4-1, pat-4-2) */}
                  <line x1="520" y1="585" x2="520" y2="630" stroke="#1f2937" strokeWidth="2.5" />
                  <line x1="430" y1="630" x2="610" y2="630" stroke="#1f2937" strokeWidth="2" />
                  <line x1="430" y1="630" x2="430" y2="665" stroke="#1f2937" strokeWidth="2" />
                  <line x1="610" y1="630" x2="610" y2="665" stroke="#1f2937" strokeWidth="2" />
                </svg>

                {/* ----------------- TIER 1: 조부모 세대 (Generation 1) ----------------- */}
                <View style={styles.tierRowGen1}>
                  {renderBiographyCard(
                    pat1_1,
                    pat1_2,
                    '창업주 since 1965 · 가문 1세대',
                    500
                  )}
                </View>

                {/* ----------------- TIER 2: 2대 형제·자매 (Generation 2) ----------------- */}
                <View style={styles.tierRowGen2}>
                  {/* 큰아버지 (종손) */}
                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat2_1, undefined, '現 가문 종손 · 1990년 가업 계승', 320)}
                  </View>

                  {/* 부친 & 모친 (중심 직계) */}
                  <View style={styles.nodeWrapperCenter}>
                    {renderBiographyCard(pat2_2, mat2_1, '직계 존속 부친 · 공학박사', 440)}
                  </View>

                  {/* 고모 */}
                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat2_3, undefined, '가문 장녀 · 화훼협회 이사', 300)}
                  </View>
                </View>

                {/* ----------------- TIER 3: 3대 사촌 및 형제 (Generation 3) ----------------- */}
                <View style={styles.tierRowGen3}>
                  {/* 사촌형 */}
                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat3_4, undefined, '종친회 2대 대표', 290)}
                  </View>

                  {/* 본인 & 배우자 */}
                  <View style={styles.nodeWrapperCenter}>
                    {renderBiographyCard(pat3_1, inlaw3_1, '가문 차세대 29대손 · 족보 앱 대표', 360)}
                  </View>

                  {/* 남동생 */}
                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat3_2, undefined, 'IT 시니어 엔지니어', 260)}
                  </View>

                  {/* 여동생 */}
                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat3_3, undefined, '브랜드 디자인 대표', 260)}
                  </View>
                </View>

                {/* ----------------- TIER 4: 4대 직계 자녀 (Generation 4) ----------------- */}
                <View style={styles.tierRowGen4}>
                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat4_1, undefined, '가문 30대손 장손', 240)}
                  </View>

                  <View style={styles.nodeWrapper}>
                    {renderBiographyCard(pat4_2, undefined, '가문 30대손 장녀', 240)}
                  </View>
                </View>
              </View>

              {/* ================= FOOTER: TRADITIONAL SEALS & DATE ================= */}
              <View style={styles.frameFooter}>
                <View style={styles.footerLeftNote}>
                  <Text style={styles.footerNoteText}>
                    ※ 본 가계도는 조선왕조 족보 편찬 규약 및 현대 디지털 분산 족보 공인 프로토콜에 의거하여
                  </Text>
                  <Text style={styles.footerNoteText}>
                    가문 생존 어르신의 엄정한 고증을 거쳐 가문 정통 계통으로 편찬·각인되었습니다.
                  </Text>
                </View>

                <View style={styles.footerCenterDate}>
                  <Text style={styles.footerDateHanja}>歲次 丙午年 仲秋 謹撰</Text>
                  <Text style={styles.footerDateSolar}>서기 2026년 9월 길일</Text>
                </View>

                <View style={styles.footerRightSeals}>
                  <View style={styles.royalSquareSeal}>
                    <Text style={styles.royalSquareSealText}>慶州金氏\n宗家之印</Text>
                  </View>
                  <View style={styles.circleSeal}>
                    <Text style={styles.circleSealText}>長孫\n公認</Text>
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
    backgroundColor: '#1e1b18',
    paddingBottom: 40,
  },
  actionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2722',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#453c35',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolbarLeft: {
    flex: 1,
    minWidth: 320,
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f5efe6',
    letterSpacing: 0.5,
  },
  toolbarSubtitle: {
    fontSize: 12,
    color: '#c4b5a5',
    marginTop: 3,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  branchToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#1a1815',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: '#453c35',
  },
  branchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  branchBtnActive: {
    backgroundColor: '#854d0e',
  },
  branchBtnText: {
    fontSize: 12,
    color: '#a89989',
    fontWeight: '600',
  },
  branchBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  printButton: {
    backgroundColor: '#b45309',
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
    backgroundColor: '#382212', // Rich walnut wood frame
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 20,
    borderWidth: 2,
    borderColor: '#54341b',
  },
  // Inset Cream Matting Border
  frameWoodMatting: {
    flex: 1,
    backgroundColor: '#eae5d8', // Silk cloth matting
    borderRadius: 8,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#c2b8a3',
  },
  // Premium Traditional Korean Hanji (韓紙) Parchment Canvas
  canvasParchment: {
    flex: 1,
    backgroundColor: '#faf7ee', // Hanji subtle ivory
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#78350f',
    padding: 24,
    position: 'relative',
    justifyContent: 'space-between',
  },

  // Classical Calligraphy Header
  calligraphyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#292524',
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerDecoLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#a8a29e',
    marginHorizontal: 20,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerClanHanja: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350f',
    letterSpacing: 4,
    marginBottom: 4,
  },
  headerMainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'web' ? 'serif' : undefined,
  },
  headerMotto: {
    fontSize: 11.5,
    color: '#57534e',
    letterSpacing: 1.5,
    marginTop: 6,
    fontWeight: '600',
  },

  // Tree Diagram Area
  treeDiagramArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },

  // Rows by Tier
  tierRowGen1: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tierRowGen2: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 20,
  },
  tierRowGen3: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 2,
    paddingHorizontal: 20,
  },
  tierRowGen4: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    zIndex: 2,
    paddingLeft: 30,
  },

  nodeWrapper: {
    alignItems: 'center',
  },
  nodeWrapperCenter: {
    alignItems: 'center',
  },

  // Clean Newspaper / Traditional Archival Biography Card
  bioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1.2,
    borderColor: '#a8a29e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHorizontalWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Vintage Monochrome / Sepia Portrait
  photoContainer: {
    width: 64,
    height: 78,
    backgroundColor: '#e7e5e4',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#78716c',
  },
  photoInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d6d3d1',
  },
  photoIcon: {
    fontSize: 34,
  },
  photoVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(68, 64, 60, 0.12)', // subtle antique tint
  },
  photoBorder: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 0.8,
    borderColor: '#a8a29e',
  },

  // Biography Text
  bioTextContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0c0a09',
    letterSpacing: 0.5,
  },
  hanjaText: {
    fontSize: 11,
    color: '#57534e',
    fontWeight: '700',
  },
  yearsText: {
    fontSize: 11,
    color: '#78716c',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  clanSubText: {
    fontSize: 10.5,
    color: '#854d0e',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 4,
  },
  achievementsBox: {
    gap: 2,
    borderTopWidth: 0.8,
    borderTopColor: '#e7e5e4',
    paddingTop: 3,
  },
  achievementRole: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: 0.2,
  },
  achievementItem: {
    fontSize: 10,
    color: '#44403c',
    lineHeight: 14,
  },

  // Spouse Connection Line and Box
  spouseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  spouseHLine: {
    width: 24,
    height: 1.5,
    backgroundColor: '#78716c',
  },
  spouseInfoBox: {
    backgroundColor: '#f5f5f4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    marginLeft: 6,
    alignItems: 'flex-start',
  },
  spouseNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1c1917',
  },
  spouseHanjaText: {
    fontSize: 10,
    color: '#57534e',
  },
  spouseYearsText: {
    fontSize: 9.5,
    color: '#78716c',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  spouseClanText: {
    fontSize: 9,
    color: '#b45309',
    fontWeight: '700',
  },

  // Footer Section
  frameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1.5,
    borderTopColor: '#292524',
    paddingTop: 12,
    marginTop: 10,
  },
  footerLeftNote: {
    flex: 1,
  },
  footerNoteText: {
    fontSize: 10,
    color: '#78716c',
    lineHeight: 15,
  },
  footerCenterDate: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerDateHanja: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: 2,
  },
  footerDateSolar: {
    fontSize: 10.5,
    color: '#78716c',
    marginTop: 2,
  },
  footerRightSeals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  royalSquareSeal: {
    width: 58,
    height: 58,
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
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: 1,
  },
  circleSeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.8,
    borderColor: '#b91c1c',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(185, 28, 28, 0.04)',
  },
  circleSealText: {
    color: '#b91c1c',
    fontWeight: '900',
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 12,
  },
});
