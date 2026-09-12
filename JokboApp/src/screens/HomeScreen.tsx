import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FamilyMember, LineageType } from '../types/family';
import { LINEAGES, getLifeStatus, getKinshipRelation } from '../utils/mockFamilyData';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { DeviceSimulatorBar } from '../components/DeviceSimulatorBar';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { ObsidianGraphView } from '../components/ObsidianGraphView';
import { inkTheme } from '../theme/inkTheme';

// Scope filter by kinship degree
type KinshipScope = 'direct' | 'cousin4' | 'extended6';
// Lineage focus mode
type FocusLineage = 'all' | 'paternal' | 'maternal' | 'inlaw';
// View mode
type ViewMode = 'radial' | 'generation';

export default function HomeScreen() {
  const {
    members,
    allMembers,
    currentDevice,
    centerPersonId,
    setCenterPerson,
    resetCenterToOwner,
    logContact,
    syncProgress,
  } = useFamilyStore();

  const [kinshipScope, setKinshipScope] = useState<KinshipScope>('cousin4');
  const [focusLineage, setFocusLineage] = useState<FocusLineage>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('radial');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Get central person (fallback to current device owner or first member)
  const centerPerson =
    members.find((m) => m.id === centerPersonId) ||
    allMembers.find((m) => m.id === centerPersonId) ||
    members[0] ||
    allMembers[0];

  const isOwnerCentered = centerPerson?.id === currentDevice.ownerId;

  // Filter members based on:
  // 1. Lineage focus
  // 2. Kinship scope (direct vs 4촌 vs 5·6촌)
  const filteredMembers = members.filter((m) => {
    // 1. Lineage Focus filter
    if (focusLineage === 'paternal') {
      if (m.lineage !== 'paternal' && m.id !== centerPerson?.id) return false;
    } else if (focusLineage === 'maternal') {
      if (m.lineage !== 'maternal' && m.id !== centerPerson?.id) return false;
    } else if (focusLineage === 'inlaw') {
      if (
        m.lineage !== 'inlaw_paternal' &&
        m.lineage !== 'inlaw_maternal' &&
        m.id !== centerPerson?.id
      )
        return false;
    }

    // 2. Kinship Scope filter
    if (kinshipScope === 'direct') {
      if (m.id === 'pat-3-4' || m.id === 'mat-3-1' || m.id === 'pat-2-4' || m.id === 'mat-2-4') {
        return false;
      }
    } else if (kinshipScope === 'cousin4') {
      if (m.id === 'pat-2-4' || m.id === 'mat-2-4') {
        return false;
      }
    }
    return true;
  });

  // Categorize members relative to the centerPerson's generation
  const centerGen = centerPerson ? centerPerson.generation : 3;

  // Ancestors: Gen < centerGen (Parents, Grandparents)
  const ancestors = filteredMembers.filter(
    (m) => m.generation < centerGen && m.id !== centerPerson?.id
  );
  // Descendants: Gen > centerGen (Children, Grandchildren)
  const descendants = filteredMembers.filter(
    (m) => m.generation > centerGen && m.id !== centerPerson?.id
  );
  // Peers: Gen === centerGen (Spouse, Siblings, Cousins)
  const peers = filteredMembers.filter(
    (m) => m.generation === centerGen && m.id !== centerPerson?.id
  );

  // Group ancestors into Parents (centerGen - 1) and Grandparents (centerGen - 2)
  const parents = ancestors.filter((m) => m.generation === centerGen - 1);
  const grandparents = ancestors.filter((m) => m.generation <= centerGen - 2);

  // Group peers into Spouse, Siblings, and Cousins
  const spouse = peers.find(
    (m) =>
      (centerPerson?.id === 'pat-3-1' && m.id === 'inlaw-pat-3-1') ||
      (centerPerson?.id === 'inlaw-pat-3-1' && m.id === 'pat-3-1')
  );
  const siblingsAndCousins = peers.filter((m) => m.id !== spouse?.id);

  // Render a Member Node Card with 생존/작고 badge
  const renderNodeCard = (
    member: FamilyMember,
    isCenter = false,
    cardWidth?: number
  ) => {
    const lineage = LINEAGES[member.lineage];
    const life = getLifeStatus(member);
    const relInfo = centerPerson ? getKinshipRelation(centerPerson.id, member.id) : null;

    return (
      <TouchableOpacity
        key={member.id}
        style={[
          styles.nodeCard,
          isCenter && styles.centerNodeCard,
          !member.isAlive && styles.deceasedNodeCard,
          cardWidth ? { width: cardWidth } : null,
        ]}
        activeOpacity={0.75}
        onPress={() => setSelectedMember(member)}
      >
        {/* Top Status Header: Alive/Deceased badge + Lineage badge */}
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.lifeBadge,
              { backgroundColor: life.badgeBg },
            ]}
          >
            <Text
              style={[
                styles.lifeBadgeText,
                { color: life.badgeTextColor },
              ]}
              numberOfLines={1}
            >
              {member.isAlive ? `🌿 생존 (${life.ageText})` : `🕯️ 작고 (${life.ageText})`}
            </Text>
          </View>
          <View
            style={[
              styles.lineageBadgeSmall,
              { backgroundColor: lineage?.badgeColor || inkTheme.ink3 },
            ]}
          >
            <Text style={styles.lineageBadgeTextSmall}>
              {lineage?.shortLabel || '친족'}
            </Text>
          </View>
        </View>

        {/* Center Name and Hanja */}
        <View style={styles.nameRow}>
          <Text style={[styles.nodeName, isCenter && styles.centerName]}>
            {member.name}
          </Text>
          {member.hanja ? (
            <Text style={styles.nodeHanja}>({member.hanja})</Text>
          ) : null}
        </View>

        {/* Relative Kinship & Generation Title */}
        <View style={styles.relBox}>
          <Text style={[styles.relText, isCenter && styles.centerRelText]} numberOfLines={1}>
            {isCenter ? '🎯 [중심 기준 인물]' : relInfo?.title || member.relationship}
          </Text>
          {!isCenter && relInfo?.chonText ? (
            <Text style={styles.chonBadgeText}>{relInfo.chonText}</Text>
          ) : null}
        </View>

        {/* Clan & Generation */}
        <View style={styles.clanRow}>
          <Text style={styles.clanText} numberOfLines={1}>
            {member.clan ? member.clan.split('(')[0].trim() : ''} · {member.generation}대
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Virtual 4-Device Simulator Bar */}
      <DeviceSimulatorBar />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* 2. Control Toolbar */}
        <View style={styles.toolbar}>
          {/* Top Row: Focus Center Indicator & Reset Button */}
          <View style={styles.centerIndicatorRow}>
            <View style={styles.centerIndicatorLeft}>
              <Text style={styles.centerLabel}>가계도 중심:</Text>
              <Text style={styles.centerTargetName}>
                {centerPerson ? `${centerPerson.name} (${centerPerson.relationship})` : '선택 없음'}
              </Text>
              {isOwnerCentered ? (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>스마트폰 주인</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.resetCenterBtn}
                  onPress={resetCenterToOwner}
                >
                  <Text style={styles.resetCenterBtnText}>
                    ↩ {currentDevice.ownerName} 중심으로 복귀
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* View Mode Toggle (Obsidian Radial vs Generation) */}
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  viewMode === 'radial' && styles.modeBtnActive,
                ]}
                onPress={() => setViewMode('radial')}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    viewMode === 'radial' && styles.modeBtnTextActive,
                  ]}
                >
                  🌐 옵시디언 방사형
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  viewMode === 'generation' && styles.modeBtnActive,
                ]}
                onPress={() => setViewMode('generation')}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    viewMode === 'generation' && styles.modeBtnTextActive,
                  ]}
                >
                  📜 세대별 계통
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Kinship Scope Range Filter */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>표시 범위 (촌수):</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  kinshipScope === 'direct' && styles.filterBtnActive,
                ]}
                onPress={() => setKinshipScope('direct')}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    kinshipScope === 'direct' && styles.filterBtnTextActive,
                  ]}
                >
                  직계 (2~3촌)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  kinshipScope === 'cousin4' && styles.filterBtnActive,
                ]}
                onPress={() => setKinshipScope('cousin4')}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    kinshipScope === 'cousin4' && styles.filterBtnTextActive,
                  ]}
                >
                  4촌 사촌 포함
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  kinshipScope === 'extended6' && styles.filterBtnActive,
                ]}
                onPress={() => setKinshipScope('extended6')}
              >
                <Text
                  style={[
                    styles.filterBtnText,
                    kinshipScope === 'extended6' && styles.filterBtnTextActive,
                  ]}
                >
                  5·6촌 종친 포함
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 3: Lineage Focus Filter (친가 vs 외가 집중 확장) */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>계통 집중:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.lineageFocusBtn,
                  focusLineage === 'all' && styles.lineageFocusBtnActive,
                ]}
                onPress={() => setFocusLineage('all')}
              >
                <Text
                  style={[
                    styles.lineageFocusText,
                    focusLineage === 'all' && styles.lineageFocusTextActive,
                  ]}
                >
                  🌿 전체 균형
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.lineageFocusBtn,
                  focusLineage === 'paternal' && [
                    styles.lineageFocusBtnActive,
                    { borderColor: inkTheme.accentRed },
                  ],
                ]}
                onPress={() => setFocusLineage('paternal')}
              >
                <Text
                  style={[
                    styles.lineageFocusText,
                    focusLineage === 'paternal' && { color: inkTheme.accentRed, fontWeight: '800' },
                  ]}
                >
                  🔴 부친쪽(친가) 확장
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.lineageFocusBtn,
                  focusLineage === 'maternal' && [
                    styles.lineageFocusBtnActive,
                    { borderColor: inkTheme.accentPine },
                  ],
                ]}
                onPress={() => setFocusLineage('maternal')}
              >
                <Text
                  style={[
                    styles.lineageFocusText,
                    focusLineage === 'maternal' && { color: inkTheme.accentPine, fontWeight: '800' },
                  ]}
                >
                  🟢 모친쪽(외가) 확장
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.lineageFocusBtn,
                  focusLineage === 'inlaw' && [
                    styles.lineageFocusBtnActive,
                    { borderColor: inkTheme.accentGold },
                  ],
                ]}
                onPress={() => setFocusLineage('inlaw')}
              >
                <Text
                  style={[
                    styles.lineageFocusText,
                    focusLineage === 'inlaw' && { color: inkTheme.accentGold, fontWeight: '800' },
                  ]}
                >
                  🟡 사돈댁(처가) 확장
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sync & Count Notice Bar */}
          <View style={styles.countNoticeBar}>
            <Text style={styles.countNoticeText}>
              화면 표시 친족: <Text style={styles.boldText}>{filteredMembers.length}명</Text>
              {syncProgress < 100 ? (
                <Text style={styles.syncNoticeText}>
                  {' '}(📱 {syncProgress}% 연동 상태 · 상단 [🔗 족보 연동] 클릭 시 확장 가능)
                </Text>
              ) : (
                <Text style={styles.syncFullText}>
                  {' '}(✨ 4대 기기 100% 완전 연동 상태)
                </Text>
              )}
            </Text>
          </View>
        </View>

        {/* 3. Main Tree Presentation */}
        {viewMode === 'radial' ? (
          /* ================== RADIAL VIEW (옵시디언 방사형 뷰) ================== */
          <View style={styles.radialContainer}>
            {/* 1. Obsidian-Style Interactive Graph Network */}
            <ObsidianGraphView
              members={filteredMembers}
              centerPerson={centerPerson}
              onSelectMember={setSelectedMember}
            />

            {/* Upper Tier: Grandparents (조부모 세대) */}
            {grandparents.length > 0 && (
              <View style={styles.tierSection}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierLine} />
                  <Text style={styles.tierTitle}>▲ 윗대 1~2대 조부모·종친</Text>
                  <View style={styles.tierLine} />
                </View>
                <View style={styles.nodesRowWrap}>
                  {grandparents.map((m) => renderNodeCard(m, false, 150))}
                </View>
                <View style={styles.connectorLineVertical} />
              </View>
            )}

            {/* Upper Middle Tier: Parents & Uncles/Aunts (부모 및 부모 세대 방계) */}
            {parents.length > 0 && (
              <View style={styles.tierSection}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierLine} />
                  <Text style={styles.tierTitle}>▲ 부모 및 백부·외숙·이모</Text>
                  <View style={styles.tierLine} />
                </View>
                <View style={styles.nodesRowWrap}>
                  {parents.map((m) => renderNodeCard(m, false, 150))}
                </View>
                <View style={styles.connectorLineVertical} />
              </View>
            )}

            {/* Central Orbit Tier: The Center Person, Spouse & Siblings/Cousins */}
            <View style={styles.centerTierSection}>
              <View style={styles.tierHeader}>
                <View style={styles.tierLineGold} />
                <Text style={styles.centerTierTitle}>
                  ★ 방사형 중심 [나/주인공 세대] ★
                </Text>
                <View style={styles.tierLineGold} />
              </View>

              {/* Central Core Cards */}
              <View style={styles.centerCoreRow}>
                {/* Center Node */}
                {centerPerson && renderNodeCard(centerPerson, true, 190)}

                {/* Spouse if present */}
                {spouse && renderNodeCard(spouse, false, 160)}
              </View>

              {/* Siblings & Cousins horizontally around the center */}
              {siblingsAndCousins.length > 0 && (
                <View style={styles.peersSection}>
                  <Text style={styles.subTierTitle}>동일 세대 (형제·자매 · 4촌 사촌)</Text>
                  <View style={styles.nodesRowWrap}>
                    {siblingsAndCousins.map((m) => renderNodeCard(m, false, 145))}
                  </View>
                </View>
              )}
            </View>

            {/* Lower Tier: Children & Descendants (자녀 및 아랫대) */}
            {descendants.length > 0 && (
              <View style={styles.tierSection}>
                <View style={styles.connectorLineVertical} />
                <View style={styles.tierHeader}>
                  <View style={styles.tierLine} />
                  <Text style={styles.tierTitle}>▼ 아랫대 직계 자녀</Text>
                  <View style={styles.tierLine} />
                </View>
                <View style={styles.nodesRowWrap}>
                  {descendants.map((m) => renderNodeCard(m, false, 155))}
                </View>
              </View>
            )}
          </View>
        ) : (
          /* ================== GENERATION VIEW (계통별 세대 뷰) ================== */
          <View style={styles.genContainer}>
            {[1, 2, 3, 4].map((gen) => {
              const genMembers = filteredMembers.filter((m) => m.generation === gen);
              if (genMembers.length === 0) return null;

              const genTitle =
                gen === 1
                  ? '1대 (조부모 세대)'
                  : gen === 2
                  ? '2대 (부모·백부·외숙 세대)'
                  : gen === 3
                  ? '3대 (본인·배우자·사촌 세대)'
                  : '4대 (자녀 세대)';

              return (
                <View key={gen} style={styles.generationBlock}>
                  <View style={styles.genHeader}>
                    <View style={styles.genBadge}>
                      <Text style={styles.genBadgeText}>{gen}대</Text>
                    </View>
                    <Text style={styles.genTitleText}>{genTitle}</Text>
                    <Text style={styles.genCountText}>({genMembers.length}명)</Text>
                  </View>
                  <View style={styles.nodesRowWrap}>
                    {genMembers.map((m) =>
                      renderNodeCard(m, m.id === centerPerson?.id, 150)
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Member Detail & Center Re-Focus Modal */}
      <MemberDetailModal
        member={selectedMember}
        visible={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onContactLogged={logContact}
        onSelectAsCenter={(memberId) => {
          setCenterPerson(memberId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: inkTheme.paper,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  toolbar: {
    backgroundColor: inkTheme.paperDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    gap: 10,
  },
  centerIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  centerIndicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  centerTargetName: {
    fontSize: 13,
    fontWeight: '900',
    color: inkTheme.ink0,
  },
  ownerBadge: {
    backgroundColor: inkTheme.seal,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  resetCenterBtn: {
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  resetCenterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.accentPine,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: inkTheme.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBtnActive: {
    backgroundColor: inkTheme.ink1,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  modeBtnTextActive: {
    color: '#ffffff',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink3,
    width: 90,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  filterBtn: {
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  filterBtnActive: {
    backgroundColor: inkTheme.ink1,
    borderColor: inkTheme.ink1,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  lineageFocusBtn: {
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  lineageFocusBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: inkTheme.ink1,
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lineageFocusText: {
    fontSize: 11,
    fontWeight: '600',
    color: inkTheme.ink3,
  },
  lineageFocusTextActive: {
    color: inkTheme.ink0,
    fontWeight: '800',
  },
  countNoticeBar: {
    marginTop: 2,
  },
  countNoticeText: {
    fontSize: 11,
    color: inkTheme.ink3,
  },
  boldText: {
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  syncNoticeText: {
    color: inkTheme.accentRed,
    fontWeight: '700',
  },
  syncFullText: {
    color: inkTheme.accentPine,
    fontWeight: '700',
  },

  // Tree & Radial Layouts
  radialContainer: {
    paddingHorizontal: 12,
    paddingTop: 16,
    alignItems: 'center',
  },
  tierSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 6,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
    gap: 8,
  },
  tierLine: {
    flex: 1,
    height: 1,
    backgroundColor: inkTheme.ink8,
  },
  tierLineGold: {
    flex: 1,
    height: 2,
    backgroundColor: inkTheme.accentGold,
  },
  tierTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink4,
    letterSpacing: 0.3,
  },
  connectorLineVertical: {
    width: 2,
    height: 16,
    backgroundColor: inkTheme.ink7,
    marginVertical: 4,
  },
  centerTierSection: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: inkTheme.accentGold,
    padding: 14,
    marginVertical: 10,
    shadowColor: inkTheme.accentGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  centerTierTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: inkTheme.accentGold,
    letterSpacing: 0.5,
  },
  centerCoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  peersSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: inkTheme.ink8,
    paddingTop: 10,
  },
  subTierTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink3,
    marginBottom: 8,
  },
  nodesRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },

  // Node Card Styles
  nodeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: inkTheme.ink7,
    padding: 10,
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  centerNodeCard: {
    backgroundColor: '#fffdf8',
    borderColor: inkTheme.seal,
    borderWidth: 2.5,
    shadowColor: inkTheme.seal,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  deceasedNodeCard: {
    backgroundColor: '#f6f6f4',
    borderColor: inkTheme.ink6,
    opacity: 0.9,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  lifeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flex: 1,
  },
  lifeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  lineageBadgeSmall: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lineageBadgeTextSmall: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  centerName: {
    fontSize: 16,
    color: inkTheme.seal,
  },
  nodeHanja: {
    fontSize: 11,
    color: inkTheme.ink4,
    fontWeight: '500',
  },
  relBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: inkTheme.paperDark,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 4,
  },
  relText: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink1,
    flex: 1,
  },
  centerRelText: {
    color: inkTheme.seal,
    fontWeight: '900',
  },
  chonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: inkTheme.accentPine,
    marginLeft: 4,
  },
  clanRow: {
    marginTop: 2,
  },
  clanText: {
    fontSize: 9.5,
    color: inkTheme.ink4,
    fontWeight: '600',
  },

  // Generation View
  genContainer: {
    padding: 16,
    gap: 16,
  },
  generationBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  genHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    paddingBottom: 8,
  },
  genBadge: {
    backgroundColor: inkTheme.ink1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  genTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  genCountText: {
    fontSize: 11,
    color: inkTheme.ink4,
  },
});