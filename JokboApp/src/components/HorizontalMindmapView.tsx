import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { inkTheme } from '../theme/inkTheme';
import { getLifeStatus } from '../utils/mockFamilyData';

interface HorizontalMindmapViewProps {
  members: FamilyMember[];
  centerPerson: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  onSetCenterPerson: (memberId: string) => void;
}

export const HorizontalMindmapView: React.FC<HorizontalMindmapViewProps> = ({
  members,
  centerPerson,
  onSelectMember,
  onSetCenterPerson,
}) => {
  // Mobile check
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;

  // Visual Theme: 'dark' (Mindmap modern dark slate) vs 'hanji' (Traditional soft parchment)
  const [themeMode, setThemeMode] = useState<'dark' | 'hanji'>('dark');

  // Find center person's spouse if any
  const spouse = useMemo(() => {
    if (!centerPerson.spouseId) return null;
    return members.find((m) => m.id === centerPerson.spouseId);
  }, [members, centerPerson]);

  // LEVEL 1 LEFT: Direct Parents (부모)
  const parents = useMemo(() => {
    if (!centerPerson.parentIds || centerPerson.parentIds.length === 0) return [];
    return centerPerson.parentIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is FamilyMember => !!m);
  }, [members, centerPerson]);

  // LEVEL 2 LEFT: Grandparents (조부모 및 외조부모)
  const grandparentsMap = useMemo(() => {
    const map: Record<string, FamilyMember[]> = {};
    parents.forEach((parent) => {
      if (parent.parentIds && parent.parentIds.length > 0) {
        const gpList = parent.parentIds
          .map((id) => members.find((m) => m.id === id))
          .filter((m): m is FamilyMember => !!m);
        map[parent.id] = gpList;
      } else {
        map[parent.id] = [];
      }
    });
    return map;
  }, [members, parents]);

  // LEVEL 1 RIGHT: Direct Children (자녀)
  const children = useMemo(() => {
    return members.filter((m) => m.parentIds && m.parentIds.includes(centerPerson.id));
  }, [members, centerPerson]);

  // LEVEL 2 RIGHT: Grandchildren (손자녀)
  const grandchildrenMap = useMemo(() => {
    const map: Record<string, FamilyMember[]> = {};
    children.forEach((child) => {
      const gcList = members.filter((m) => m.parentIds && m.parentIds.includes(child.id));
      map[child.id] = gcList;
    });
    return map;
  }, [members, children]);

  // Siblings of Center Person (형제자매)
  const siblings = useMemo(() => {
    if (!centerPerson.parentIds || centerPerson.parentIds.length === 0) return [];
    return members.filter(
      (m) =>
        m.id !== centerPerson.id &&
        m.parentIds &&
        m.parentIds.some((pId) => centerPerson.parentIds?.includes(pId))
    );
  }, [members, centerPerson]);

  // Colors based on theme
  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#14171f' : '#f8f6f0';
  const cardBg = isDark ? '#1f2430' : '#ffffff';
  const cardBorder = isDark ? '#333b4f' : '#e2dcce';
  const centerCardBg = isDark ? '#2a2218' : '#fffbeb';
  const centerCardBorder = isDark ? '#f59e0b' : '#d97706';
  const textColor = isDark ? '#f1f5f9' : '#1c1917';
  const subtextColor = isDark ? '#94a3b8' : '#78716c';
  const lineColor = isDark ? '#4b5563' : '#a8a29e';

  // Render an individual Node Card
  const renderNodeCard = (
    member: FamilyMember,
    isCenter: boolean = false,
    roleLabel?: string,
    accentColor?: string
  ) => {
    const life = getLifeStatus(member);
    const isMale = member.gender === 'M';
    const borderTopColor = accentColor || (member.lineage === 'maternal' ? '#3b82f6' : '#ef4444');

    return (
      <View
        key={member.id}
        style={[
          styles.nodeCard,
          {
            backgroundColor: isCenter ? centerCardBg : cardBg,
            borderColor: isCenter ? centerCardBorder : cardBorder,
            borderTopColor: isCenter ? '#f59e0b' : borderTopColor,
            borderTopWidth: 3.5,
          },
          isCenter && styles.centerNodeGlow,
        ]}
      >
        <TouchableOpacity
          style={styles.cardClickable}
          activeOpacity={0.75}
          onPress={() => onSelectMember(member)}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            {/* Avatar Pill */}
            <View
              style={[
                styles.avatarPill,
                {
                  backgroundColor: member.lineage === 'maternal' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                },
              ]}
            >
              <Text style={styles.avatarIcon}>
                {member.generation <= 2 ? (isMale ? '👴' : '👵') : (isMale ? '👨' : '👩')}
              </Text>
            </View>

            {/* Name & Hanja */}
            <View style={styles.nameWrap}>
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, { color: textColor }]}>{member.name}</Text>
                {member.hanja && <Text style={styles.hanjaText}>({member.hanja})</Text>}
              </View>
              <Text style={[styles.roleBadgeText, { color: isCenter ? '#f59e0b' : subtextColor }]}>
                {roleLabel || member.relationship}
              </Text>
            </View>

            {/* Alive / Deceased Pill */}
            <View
              style={[
                styles.lifeStatusPill,
                { backgroundColor: member.isAlive ? '#065f46' : '#475569' },
              ]}
            >
              <Text style={styles.lifeStatusText}>
                {member.isAlive ? `🌿 ${life.ageText}` : `🕯️ 작고`}
              </Text>
            </View>
          </View>

          {/* Profile & Biography Excerpt */}
          <View style={styles.cardBody}>
            <View style={styles.metaRow}>
              <Text style={[styles.clanText, { color: subtextColor }]} numberOfLines={1}>
                {member.clan || '본관 미상'}
              </Text>
              <Text style={[styles.genText, { color: subtextColor }]}>
                {member.generation}대
              </Text>
            </View>

            {member.achievements && member.achievements.length > 0 ? (
              <Text style={[styles.achievementExcerpt, { color: isDark ? '#cbd5e1' : '#44403c' }]} numberOfLines={2}>
                • {member.achievements[0]}
              </Text>
            ) : member.memo ? (
              <Text style={[styles.achievementExcerpt, { color: isDark ? '#94a3b8' : '#78716c' }]} numberOfLines={1}>
                • {member.memo}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Center Shift Button (마인드맵 중심 기준 재배치) */}
        {!isCenter && (
          <TouchableOpacity
            style={styles.shiftCenterBtn}
            onPress={() => onSetCenterPerson(member.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.shiftCenterBtnText}>🎯 이 사람을 중심으로 3대 펼치기</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* 1. Header Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: isDark ? '#1a202c' : '#ffffff', borderColor: isDark ? '#2d3748' : '#e2e8f0' }]}>
        <View style={styles.toolbarLeft}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText}>수평 마인드맵 (좌:윗대 / 우:아랫대)</Text>
          </View>
          <Text style={[styles.mainTitle, { color: textColor }]}>
            [ {centerPerson.name} ] 중심 3대 가계 계통도
          </Text>
          <Text style={[styles.subTitle, { color: subtextColor }]}>
            화면 어디서나 인물을 탭하면 해당 인물을 중심으로 앞뒤 3대가 즉시 화면에 맞게 재정렬됩니다.
          </Text>
        </View>

        <View style={styles.toolbarRight}>
          <TouchableOpacity
            style={[styles.themeBtn, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]}
            onPress={() => setThemeMode(isDark ? 'hanji' : 'dark')}
          >
            <Text style={[styles.themeBtnText, { color: isDark ? '#fde047' : '#0284c7' }]}>
              {isDark ? '☀️ 라이트 한지 모드' : '🌙 다크 마인드맵 모드'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Horizontal 3-Tier Mindmap Tree Canvas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollCanvasContent}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.verticalScrollContent}
        >
          <View style={styles.mindmapRowLayout}>
            {/* ========================================================================= */}
            {/* COLUMN 1 (가장 좌측): 2단계 윗대 - 조부모 / 외조부모 (Grandparents) */}
            {/* ========================================================================= */}
            <View style={styles.columnSection}>
              <View style={[styles.columnHeaderPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.columnHeaderText, { color: isDark ? '#94a3b8' : '#475569' }]}>
                  ◀ 2단계 윗대 (조부모 / 외조부모)
                </Text>
              </View>

              <View style={styles.cardsColumnStack}>
                {parents.length === 0 ? (
                  <View style={[styles.emptyBox, { borderColor: cardBorder }]}>
                    <Text style={[styles.emptyText, { color: subtextColor }]}>등록된 조부모 정보 없음</Text>
                  </View>
                ) : (
                  parents.map((parent) => {
                    const gpList = grandparentsMap[parent.id] || [];
                    return (
                      <View key={parent.id} style={styles.gpSubCluster}>
                        <View style={styles.clusterSubHeader}>
                          <Text style={[styles.clusterSubHeaderText, { color: parent.lineage === 'maternal' ? '#3b82f6' : '#ef4444' }]}>
                            {parent.name}({parent.relationship})의 부모님:
                          </Text>
                        </View>
                        {gpList.length > 0 ? (
                          gpList.map((gp) =>
                            renderNodeCard(
                              gp,
                              false,
                              parent.lineage === 'maternal' ? '외조부모' : '친조부모',
                              parent.lineage === 'maternal' ? '#3b82f6' : '#ef4444'
                            )
                          )
                        ) : (
                          <View style={[styles.emptyBoxMini, { borderColor: cardBorder }]}>
                            <Text style={[styles.emptyTextMini, { color: subtextColor }]}>
                              {parent.name}의 부모 미등록
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            {/* Connecting Fork Lines (Grandparents -> Parents) */}
            <View style={styles.connectingForkArea}>
              <View style={[styles.horizontalStemLine, { backgroundColor: lineColor }]} />
              <View style={[styles.forkBullet, { backgroundColor: lineColor }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 2 (좌측 중앙): 1단계 윗대 - 부모 (Parents) */}
            {/* ========================================================================= */}
            <View style={styles.columnSection}>
              <View style={[styles.columnHeaderPill, { backgroundColor: isDark ? '#2e1065' : '#f3e8ff' }]}>
                <Text style={[styles.columnHeaderText, { color: isDark ? '#c084fc' : '#7e22ce' }]}>
                  ◀ 1단계 윗대 (직계 부모님)
                </Text>
              </View>

              <View style={styles.cardsColumnStack}>
                {parents.length > 0 ? (
                  parents.map((p) =>
                    renderNodeCard(
                      p,
                      false,
                      p.gender === 'M' ? '아버지 (부친)' : '어머니 (모친)',
                      p.gender === 'M' ? '#ef4444' : '#3b82f6'
                    )
                  )
                ) : (
                  <View style={[styles.emptyBox, { borderColor: cardBorder }]}>
                    <Text style={[styles.emptyText, { color: subtextColor }]}>직계 부모 미등록</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Connecting Fork Lines (Parents -> Center Person) */}
            <View style={styles.connectingForkArea}>
              <View style={[styles.horizontalStemLine, { backgroundColor: lineColor }]} />
              <View style={[styles.forkBullet, { backgroundColor: '#f59e0b' }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 3 (중앙): ★ 선택된 기준 인물 (Center Person & Spouse & Siblings) */}
            {/* ========================================================================= */}
            <View style={[styles.columnSection, styles.centerColumnHighlight]}>
              <View style={styles.centerHeaderPill}>
                <Text style={styles.centerHeaderText}>
                  ★ 기준 인물 (나 / 선택된 주인공) ★
                </Text>
              </View>

              <View style={styles.cardsColumnStack}>
                {/* Center Person Card */}
                {renderNodeCard(centerPerson, true, '중심 기준 인물', '#f59e0b')}

                {/* Spouse Card if present */}
                {spouse && (
                  <View style={styles.spouseBlock}>
                    <View style={styles.spouseConnectLine}>
                      <Text style={styles.spouseConnectText}>── 夫婦 (배우자) ──</Text>
                    </View>
                    {renderNodeCard(spouse, false, '배우자 (아내/남편)', '#ec4899')}
                  </View>
                )}

                {/* Siblings Collapsible / Inline */}
                {siblings.length > 0 && (
                  <View style={styles.siblingsGroup}>
                    <Text style={[styles.siblingsTitle, { color: subtextColor }]}>
                      동일 세대 형제·자매 ({siblings.length}명)
                    </Text>
                    {siblings.map((sib) =>
                      renderNodeCard(
                        sib,
                        false,
                        sib.gender === 'M' ? '형제/남동생' : '자매/여동생',
                        '#64748b'
                      )
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Connecting Fork Lines (Center Person -> Children) */}
            <View style={styles.connectingForkArea}>
              <View style={[styles.horizontalStemLine, { backgroundColor: lineColor }]} />
              <View style={[styles.forkBullet, { backgroundColor: '#10b981' }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 4 (우측 중앙): 1단계 아랫대 - 직계 자녀 (Children) */}
            {/* ========================================================================= */}
            <View style={styles.columnSection}>
              <View style={[styles.columnHeaderPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                <Text style={[styles.columnHeaderText, { color: isDark ? '#34d399' : '#047857' }]}>
                  ▶ 1단계 아랫대 (직계 자녀)
                </Text>
              </View>

              <View style={styles.cardsColumnStack}>
                {children.length > 0 ? (
                  children.map((child) =>
                    renderNodeCard(
                      child,
                      false,
                      child.gender === 'M' ? '장남/아들' : '장녀/딸',
                      '#10b981'
                    )
                  )
                ) : (
                  <View style={[styles.emptyBox, { borderColor: cardBorder }]}>
                    <Text style={[styles.emptyText, { color: subtextColor }]}>등록된 직계 자녀 없음</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Connecting Fork Lines (Children -> Grandchildren) */}
            {children.length > 0 && (
              <View style={styles.connectingForkArea}>
                <View style={[styles.horizontalStemLine, { backgroundColor: lineColor }]} />
                <View style={[styles.forkBullet, { backgroundColor: lineColor }]} />
              </View>
            )}

            {/* ========================================================================= */}
            {/* COLUMN 5 (가장 우측): 2단계 아랫대 - 손자녀 (Grandchildren) */}
            {/* ========================================================================= */}
            {children.length > 0 && (
              <View style={styles.columnSection}>
                <View style={[styles.columnHeaderPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.columnHeaderText, { color: isDark ? '#94a3b8' : '#475569' }]}>
                    ▶ 2단계 아랫대 (손자·손녀)
                  </Text>
                </View>

                <View style={styles.cardsColumnStack}>
                  {children.map((child) => {
                    const gcList = grandchildrenMap[child.id] || [];
                    if (gcList.length === 0) return null;
                    return (
                      <View key={child.id} style={styles.gpSubCluster}>
                        <View style={styles.clusterSubHeader}>
                          <Text style={[styles.clusterSubHeaderText, { color: '#10b981' }]}>
                            {child.name}의 자녀(손자녀):
                          </Text>
                        </View>
                        {gcList.map((gc) =>
                          renderNodeCard(gc, false, '손자/손녀', '#059669')
                        )}
                      </View>
                    );
                  })}
                  {Object.values(grandchildrenMap).every((arr) => arr.length === 0) && (
                    <View style={[styles.emptyBox, { borderColor: cardBorder }]}>
                      <Text style={[styles.emptyText, { color: subtextColor }]}>
                        등록된 2단계 손자녀 없음
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  toolbarLeft: {
    flex: 1,
    minWidth: 300,
  },
  titleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  titleBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  scrollCanvasContent: {
    padding: 16,
    minWidth: '100%',
  },
  verticalScrollContent: {
    paddingVertical: 10,
  },
  mindmapRowLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Column Section
  columnSection: {
    width: 270,
    marginHorizontal: 8,
  },
  centerColumnHighlight: {
    width: 300,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  columnHeaderPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  columnHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerHeaderPill: {
    backgroundColor: '#d97706',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  centerHeaderText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardsColumnStack: {
    gap: 14,
  },

  // Sub Cluster for Grandparents & Grandchildren
  gpSubCluster: {
    marginBottom: 10,
    gap: 8,
  },
  clusterSubHeader: {
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  clusterSubHeaderText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Node Card
  nodeCard: {
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  centerNodeGlow: {
    borderWidth: 2,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardClickable: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarIcon: {
    fontSize: 20,
  },
  nameWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '900',
  },
  hanjaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  lifeStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lifeStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  cardBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
    paddingTop: 6,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clanText: {
    fontSize: 11,
    fontWeight: '700',
  },
  genText: {
    fontSize: 10,
    fontWeight: '800',
  },
  achievementExcerpt: {
    fontSize: 11,
    lineHeight: 15,
  },

  // Center Shift Button
  shiftCenterBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  shiftCenterBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  // Spouse Block
  spouseBlock: {
    marginTop: 6,
  },
  spouseConnectLine: {
    alignItems: 'center',
    marginVertical: 4,
  },
  spouseConnectText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ec4899',
  },

  // Siblings Group
  siblingsGroup: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
    gap: 10,
  },
  siblingsTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },

  // Connecting Fork
  connectingForkArea: {
    width: 32,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  horizontalStemLine: {
    width: 32,
    height: 2,
  },
  forkBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },

  // Empty State
  emptyBox: {
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  emptyBoxMini: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyTextMini: {
    fontSize: 10,
  },
});
