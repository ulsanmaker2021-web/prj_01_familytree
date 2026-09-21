import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { FamilyMember, LineageType, SmartKinshipRequest } from '../types/family';
import { LINEAGES, getLifeStatus, getKinshipRelation } from '../utils/mockFamilyData';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { DeviceSimulatorBar } from '../components/DeviceSimulatorBar';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { SmartKinshipInspectionModal } from '../components/SmartKinshipInspectionModal';
import { ObsidianGraphView } from '../components/ObsidianGraphView';
import { RelationshipStudioModal } from '../components/RelationshipStudioModal';
import { FramedMasterpieceView } from '../components/FramedMasterpieceView';
import { HorizontalMindmapView } from '../components/HorizontalMindmapView';
import { formatPhoneNumber } from '../utils/securityAuth';
import { inkTheme } from '../theme/inkTheme';

// Scope filter by kinship degree
type KinshipScope = 'direct' | 'cousin4' | 'extended6';
// Lineage focus mode
type FocusLineage = 'all' | 'paternal' | 'maternal' | 'inlaw';
// View mode
type ViewMode = 'radial' | 'generation' | 'framed' | 'mindmap';

export default function HomeScreen() {
  const { currentUser } = useAuthStore();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const {
    members,
    allMembers,
    unconnectedMembers,
    establishedLinks,
    pendingElderLinks,
    approvedLinks,
    operationMode,
    setOperatingMode,
    connectMembers,
    requestP2PKinship,
    elderApproveKinship,
    elderRejectKinship,
    disconnectLink,
    resetEstablishedLinks,
    addCustomUnconnectedMember,
    currentDevice,
    centerPersonId,
    setCenterPerson,
    resetCenterToOwner,
    logContact,
    syncProgress,
    updateMemberPhoto,
    isCustomUserMode,
    isViewingDemo,
    toggleDemoView,
    addCustomFamilyMember,
    smartRequests,
    pendingSmartRequests,
    sendSmartKinshipRequest,
    approveSmartKinshipRequest,
    rejectSmartKinshipRequest,
    updateMember,
  } = useFamilyStore();

  const [kinshipScope, setKinshipScope] = useState<KinshipScope>('cousin4');
  const [focusLineage, setFocusLineage] = useState<FocusLineage>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('radial');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [studioVisible, setStudioVisible] = useState(false);
  const [studioPreselectedPersonAId, setStudioPreselectedPersonAId] = useState<string | undefined>(undefined);
  const [inspectingRequest, setInspectingRequest] = useState<SmartKinshipRequest | null>(null);

  // Responsive & Sticky Navigation States
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const isLandscape = windowWidth > windowHeight;
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Navigation history of explored center persons
  const [centerHistory, setCenterHistory] = useState<string[]>([currentDevice.ownerId]);

  // When device changes, reset center history to new device owner
  React.useEffect(() => {
    setCenterHistory([currentDevice.ownerId]);
  }, [currentDevice.ownerId]);

  const handleSetCenterPerson = (memberId: string) => {
    if (memberId !== centerPersonId) {
      setCenterHistory((prev) => [...prev, memberId]);
      setCenterPerson(memberId);
    }
  };

  const handleGoBack = () => {
    if (centerHistory.length > 1) {
      const nextHistory = [...centerHistory];
      nextHistory.pop(); // Remove current person
      const prevPersonId = nextHistory[nextHistory.length - 1];
      setCenterHistory(nextHistory);
      setCenterPerson(prevPersonId);
    } else {
      // If already at initial person, switch view mode back to main 'radial'
      setViewMode('radial');
    }
  };

  const handleNavigateToHistory = (memberId: string) => {
    const idx = centerHistory.lastIndexOf(memberId);
    if (idx !== -1) {
      setCenterHistory((prev) => prev.slice(0, idx + 1));
      setCenterPerson(memberId);
    } else {
      handleSetCenterPerson(memberId);
    }
  };

  const handleResetToOwner = () => {
    resetCenterToOwner();
    setCenterHistory([currentDevice.ownerId]);
  };

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

    // 2. Kinship Scope filter (직계 / 4촌 이내 / 5·6촌 방계)
    const cousin4Ids = [
      'pat-3-4',
      'mat-3-1',
      'mat-3-2',
      'mat-3-3',
      'mat-3-4',
      'mat-2-5',
      'mat-2-6',
    ];
    const distant5Ids = ['pat-2-4', 'mat-2-4', 'mat-4-1', 'mat-4-2'];

    if (kinshipScope === 'direct') {
      if (cousin4Ids.includes(m.id) || distant5Ids.includes(m.id)) {
        return false;
      }
    } else if (kinshipScope === 'cousin4') {
      if (distant5Ids.includes(m.id)) {
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

    // 부계는 붉은 계열 테두리, 모계는 푸른 계열 테두리, 사돈/처가는 황금 앰버 테두리
    const isPaternal = member.lineage === 'paternal';
    const isMaternal = member.lineage === 'maternal';
    const lineageBorderColor = isPaternal
      ? (isCenter ? '#b91c1c' : '#ef4444')
      : isMaternal
      ? (isCenter ? '#1d4ed8' : '#3b82f6')
      : (isCenter ? '#b45309' : '#f59e0b');

    return (
      <TouchableOpacity
        key={member.id}
        style={[
          styles.nodeCard,
          {
            borderColor: lineageBorderColor,
            borderWidth: isCenter ? 2.5 : 1.5,
          },
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
              {
                backgroundColor: isPaternal ? '#fee2e2' : isMaternal ? '#dbeafe' : '#fef3c7',
                borderColor: lineageBorderColor,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.lineageBadgeTextSmall,
                { color: isPaternal ? '#b91c1c' : isMaternal ? '#1e40af' : '#92400e', fontWeight: '800' },
              ]}
            >
              {isPaternal ? '부계 (친가)' : isMaternal ? '모계 (외가)' : (lineage?.shortLabel || '배우자')}
            </Text>
          </View>
        </View>

        {/* Center Name and Hanja - Strictly BLACK ink, NEVER red! */}
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
      {/* ========================================================================= */}
      {/* 1. STICKY TOP CONTROLS & NAVIGATION HEADER (스크롤 내려도 항상 상단 고정!) */}
      {/* ========================================================================= */}
      <View style={styles.stickyHeader}>
        {/* Row 1: 4대 뷰 모드 전환 탭 (스크롤 가능 탭 바) */}
        <View style={styles.stickyModeTabsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.viewModeScroll}
          >
            <TouchableOpacity
              style={[
                styles.stickyModeBtn,
                viewMode === 'radial' && styles.stickyModeBtnActive,
              ]}
              onPress={() => setViewMode('radial')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.stickyModeBtnText,
                  viewMode === 'radial' && styles.stickyModeBtnTextActive,
                ]}
              >
                🌐 옵시디언 방사형
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stickyModeBtn,
                viewMode === 'generation' && styles.stickyModeBtnActive,
              ]}
              onPress={() => setViewMode('generation')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.stickyModeBtnText,
                  viewMode === 'generation' && styles.stickyModeBtnTextActive,
                ]}
              >
                📜 세대별 계통
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stickyModeBtn,
                viewMode === 'framed' && [styles.stickyModeBtnActive, { backgroundColor: '#854d0e', borderColor: '#b45309' }],
              ]}
              onPress={() => setViewMode('framed')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.stickyModeBtnText,
                  viewMode === 'framed' && { color: '#ffffff', fontWeight: '800' },
                ]}
              >
                🖼️ 거실 표구 액자형
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stickyModeBtn,
                viewMode === 'mindmap' && [styles.stickyModeBtnActive, { backgroundColor: '#0369a1', borderColor: '#0ea5e9' }],
              ]}
              onPress={() => setViewMode('mindmap')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.stickyModeBtnText,
                  viewMode === 'mindmap' && { color: '#ffffff', fontWeight: '800' },
                ]}
              >
                🧠 수평 마인드맵 (3대)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Row 2: 가계도 중심 인물 요약 + 접이식 필터 토글 버튼 + 빠른 가족추가 버튼 */}
        <View style={styles.stickySubBar}>
          <View style={styles.stickyCenterWrap}>
            <Text style={styles.stickyCenterLabel}>가계도 중심:</Text>
            <Text style={styles.stickyCenterName} numberOfLines={1}>
              {centerPerson ? centerPerson.name : '선택 없음'}
            </Text>
            {isOwnerCentered ? (
              <View style={styles.ownerBadgeMini}>
                <Text style={styles.ownerBadgeMiniText}>본인</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.resetCenterBtnMini}
                onPress={resetCenterToOwner}
                activeOpacity={0.8}
              >
                <Text style={styles.resetCenterBtnMiniText}>
                  ↩ {currentDevice.ownerName} 중심으로 복귀
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.stickyRightActions}>
            <TouchableOpacity
              style={[styles.filterAccordionBtn, isFilterExpanded && styles.filterAccordionBtnActive]}
              onPress={() => setIsFilterExpanded(!isFilterExpanded)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterAccordionBtnText, isFilterExpanded && styles.filterAccordionBtnTextActive]}>
                ⚙️ 필터 ({kinshipScope === 'direct' ? '직계' : kinshipScope === 'cousin4' ? '4촌' : '5·6촌'} · {focusLineage === 'all' ? '전체' : focusLineage === 'paternal' ? '친가' : focusLineage === 'maternal' ? '외가' : '처가'}) {isFilterExpanded ? '▴' : '▾'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stickyAddBtn}
              onPress={() => setIsAddMemberModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.stickyAddBtnText}>➕ 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 3 (Collapsible Accordion): Filter Controls */}
        {isFilterExpanded && (
          <View style={styles.stickyFilterDropdown}>
            {/* Kinship Scope */}
            <View style={styles.filterRowCompact}>
              <Text style={styles.filterLabelCompact}>표시 범위:</Text>
              <View style={styles.buttonGroupCompact}>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, kinshipScope === 'direct' && styles.filterBtnCompactActive]}
                  onPress={() => setKinshipScope('direct')}
                >
                  <Text style={[styles.filterBtnTextCompact, kinshipScope === 'direct' && styles.filterBtnTextCompactActive]}>
                    직계 (2~3촌)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, kinshipScope === 'cousin4' && styles.filterBtnCompactActive]}
                  onPress={() => setKinshipScope('cousin4')}
                >
                  <Text style={[styles.filterBtnTextCompact, kinshipScope === 'cousin4' && styles.filterBtnTextCompactActive]}>
                    4촌 사촌 포함
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, kinshipScope === 'extended6' && styles.filterBtnCompactActive]}
                  onPress={() => setKinshipScope('extended6')}
                >
                  <Text style={[styles.filterBtnTextCompact, kinshipScope === 'extended6' && styles.filterBtnTextCompactActive]}>
                    5·6촌 종친 포함
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lineage Focus */}
            <View style={styles.filterRowCompact}>
              <Text style={styles.filterLabelCompact}>계통 집중:</Text>
              <View style={styles.buttonGroupCompact}>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, focusLineage === 'all' && styles.filterBtnCompactActive]}
                  onPress={() => setFocusLineage('all')}
                >
                  <Text style={[styles.filterBtnTextCompact, focusLineage === 'all' && styles.filterBtnTextCompactActive]}>
                    🌿 전체 균형
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, focusLineage === 'paternal' && [styles.filterBtnCompactActive, { borderColor: inkTheme.accentRed }]]}
                  onPress={() => setFocusLineage('paternal')}
                >
                  <Text style={[styles.filterBtnTextCompact, focusLineage === 'paternal' && { color: inkTheme.accentRed, fontWeight: '800' }]}>
                    🔴 친가 확장
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, focusLineage === 'maternal' && [styles.filterBtnCompactActive, { borderColor: inkTheme.accentPine }]]}
                  onPress={() => setFocusLineage('maternal')}
                >
                  <Text style={[styles.filterBtnTextCompact, focusLineage === 'maternal' && { color: inkTheme.accentPine, fontWeight: '800' }]}>
                    🟢 외가 확장
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterBtnCompact, focusLineage === 'inlaw' && [styles.filterBtnCompactActive, { borderColor: inkTheme.accentGold }]]}
                  onPress={() => setFocusLineage('inlaw')}
                >
                  <Text style={[styles.filterBtnTextCompact, focusLineage === 'inlaw' && { color: inkTheme.accentGold, fontWeight: '800' }]}>
                    🟡 처가 확장
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Member Count & Sync Status */}
            <View style={styles.filterCountLine}>
              <Text style={styles.countNoticeText}>
                화면 표시 친족: <Text style={styles.boldText}>{filteredMembers.length}명</Text>
                {syncProgress < 100 ? (
                  <Text style={styles.syncNoticeText}>
                    {' '}(📱 {syncProgress}% 연동 상태)
                  </Text>
                ) : (
                  <Text style={styles.syncFullText}>
                    {' '}(✨ 100% 완전 연동 상태)
                  </Text>
                )}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE FAMILY TREE CONTENT AREA */}
      {/* ========================================================================= */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* Real Registered Member Banner vs Simulation Bar */}
        {isCustomUserMode && !isViewingDemo ? (
          <View style={styles.realMemberBanner}>
            <View style={styles.realMemberBannerLeft}>
              <View style={styles.realMemberBadge}>
                <Text style={styles.realMemberBadgeText}>
                  🏛️ {currentUser.clan || '가문'} 족보 등재 회원
                </Text>
              </View>
              <Text style={styles.realMemberTitle}>
                {currentUser.name} 님의 가문 가계도 (실제 등재 족보)
              </Text>
              <Text style={styles.realMemberSub}>
                🛡️ 2단계 본인확인 완료 ({formatPhoneNumber(currentUser.phone)}) · {currentUser.roleLabel || '가문 정회원'}
              </Text>
            </View>
            <View style={styles.realMemberBtnRow}>
              <TouchableOpacity
                style={styles.addMemberHeaderBtn}
                onPress={() => setIsAddMemberModalOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addMemberHeaderBtnText}>➕ 가족 구성원 추가</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoSwitchHeaderBtn}
                onPress={() => toggleDemoView(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.demoSwitchHeaderBtnText}>🧪 모의 시뮬레이션 둘러보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {isViewingDemo && (
              <View style={styles.demoActiveBanner}>
                <Text style={styles.demoActiveBannerText}>
                  🧪 <Text style={{ fontWeight: '800' }}>[김씨 가문 30인 모의 시뮬레이션 둘러보기 중]</Text> 4대 가상 스마트폰 연동 체험 모드입니다.
                </Text>
                <TouchableOpacity
                  style={styles.returnMyJokboBtn}
                  onPress={() => toggleDemoView(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.returnMyJokboBtnText}>
                    ➔ 내 가문({currentUser.name}) 가계도로 복귀
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <DeviceSimulatorBar />
          </>
        )}

        {/* 🔔 스마트 형제·친족 결연 신청 알람 배너 (도착 시 최우선 표시) */}
        {pendingSmartRequests.length > 0 && (
          <View style={styles.smartAlertBanner}>
            <View style={styles.smartAlertLeft}>
              <View style={styles.smartAlertIconCircle}>
                <Text style={styles.smartAlertIcon}>🔔</Text>
              </View>
              <View style={styles.smartAlertTextWrap}>
                <View style={styles.smartAlertBadgeRow}>
                  <Text style={styles.smartAlertBadge}>형제 결연 신청 도착</Text>
                  <Text style={styles.smartAlertTime}>실시간 알림</Text>
                </View>
                <Text style={styles.smartAlertTitle}>
                  {pendingSmartRequests[0].senderName}님께서 친형제 결연 및 가계도 통합을 신청하셨습니다!
                </Text>
                <Text style={styles.smartAlertSubtitle}>
                  신청인이 등록한 부모(부: {pendingSmartRequests[0].senderFatherName || '미입력'}, 모: {pendingSmartRequests[0].senderMotherName || '미입력'})와 내 부모 정보를 1:1 대조하고 승인하세요.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.smartAlertBtn}
              onPress={() => setInspectingRequest(pendingSmartRequests[0])}
              activeOpacity={0.8}
            >
              <Text style={styles.smartAlertBtnText}>부모 정보 대조 및 승인 ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dual Operating System Mode & Kinship Studio Banner */}
        <View style={styles.studioLauncherBanner}>
          <View style={styles.studioLauncherLeft}>
            <View style={styles.studioBadgeRow}>
              <Text style={styles.studioBadge}>
                {operationMode === 'decentralized' ? '📱 분산 결연형 (2중 윗대 승인)' : '🏛️ 중앙 집중 편찬형'}
              </Text>
              {pendingElderLinks.length > 0 && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#78350f',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                  onPress={() => setStudioVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '800' }}>
                    🔔 윗대 승인 대기 {pendingElderLinks.length}건
                  </Text>
                </TouchableOpacity>
              )}
              {approvedLinks.length > 0 && (
                <Text style={styles.establishedBadge}>
                  🛡️ 어르신 공인 {approvedLinks.length}건
                </Text>
              )}
              {unconnectedMembers.length > 0 && (
                <Text style={styles.unconnectedBadge}>
                  미등록 친족 {unconnectedMembers.length}명 대기
                </Text>
              )}
            </View>
            <Text style={styles.studioBannerTitle}>
              {operationMode === 'decentralized'
                ? '스마트폰 P2P 결연 & 직계 존속(부모/조부) 2차 승인 체계'
                : '중앙 족보 편찬 관리자 시스템'}
            </Text>
            <Text style={styles.studioBannerDesc}>
              {operationMode === 'decentralized'
                ? '두 사람이 각자의 스마트폰으로 결연을 맺고, 윗대 부모·조부가 2차 확인 승인하여 허위 결연을 원천 차단합니다.'
                : '중앙 관리자 사이트에서 가계도 인물 간의 관계를 직접 지정하고 즉시 족보에 편찬합니다.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.studioOpenBtn,
              operationMode === 'decentralized'
                ? { backgroundColor: '#059669' }
                : { backgroundColor: '#0284c7' },
            ]}
            onPress={() => {
              setStudioPreselectedPersonAId(undefined);
              setStudioVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.studioOpenBtnText}>
              {operationMode === 'decentralized'
                ? '📱 분산 결연 & 어르신 승인 스튜디오 열기'
                : '🏛️ 중앙 편찬 스튜디오 열기'}
            </Text>
          </TouchableOpacity>
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
              establishedLinks={establishedLinks}
              onOpenRelationshipStudio={() => {
                setStudioPreselectedPersonAId(undefined);
                setStudioVisible(true);
              }}
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
                  {grandparents.map((m) => renderNodeCard(m, false, isMobile ? Math.floor((windowWidth - 44) / 2) : 150))}
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
                  {parents.map((m) => renderNodeCard(m, false, isMobile ? Math.floor((windowWidth - 44) / 2) : 150))}
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
                {centerPerson && renderNodeCard(centerPerson, true, isMobile ? Math.min(260, windowWidth - 48) : 190)}

                {/* Spouse if present */}
                {spouse && renderNodeCard(spouse, false, isMobile ? Math.min(220, windowWidth - 48) : 160)}
              </View>

              {/* Siblings & Cousins horizontally around the center */}
              {siblingsAndCousins.length > 0 && (
                <View style={styles.peersSection}>
                  <Text style={styles.subTierTitle}>동일 세대 (형제·자매 · 4촌 사촌)</Text>
                  <View style={styles.nodesRowWrap}>
                    {siblingsAndCousins.map((m) => renderNodeCard(m, false, isMobile ? Math.floor((windowWidth - 44) / 2) : 145))}
                  </View>
                </View>
              )}

              {/* Only registered user with no other members yet guidance */}
              {isCustomUserMode && !isViewingDemo && members.length === 1 && (
                <View style={styles.singleMemberGuideCard}>
                  <Text style={styles.singleMemberGuideTitle}>🌱 [가문 족보의 첫 출발점]</Text>
                  <Text style={styles.singleMemberGuideDesc}>
                    현재 {currentUser.name} 님이 가문의 기준 인물로 등재되었습니다.{'\n'}
                    상단의 [➕ 가족 구성원 추가] 버튼을 눌러 부모님, 배우자, 자녀를 등록하시면 나만의 가계도가 완성됩니다.
                  </Text>
                  <TouchableOpacity
                    style={styles.singleMemberAddBtn}
                    onPress={() => setIsAddMemberModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.singleMemberAddBtnText}>➕ 가족 구성원 (부모·배우자·자녀) 등록하기 ➔</Text>
                  </TouchableOpacity>
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
                  {descendants.map((m) => renderNodeCard(m, false, isMobile ? Math.floor((windowWidth - 44) / 2) : 155))}
                </View>
              </View>
            )}
          </View>
        ) : viewMode === 'mindmap' ? (
          /* ================== HORIZONTAL MINDMAP VIEW (수평 3대 펼침 마인드맵) ================== */
          centerPerson ? (
            <HorizontalMindmapView
              members={allMembers && allMembers.length > 0 ? allMembers : members}
              centerPerson={centerPerson}
              onSelectMember={setSelectedMember}
              onSetCenterPerson={handleSetCenterPerson}
              currentViewMode={viewMode}
              onSwitchViewMode={setViewMode}
              ownerName={currentDevice.ownerName}
              onResetToOwner={handleResetToOwner}
              historyMembers={centerHistory
                .map((id) => allMembers.find((m) => m.id === id) || members.find((m) => m.id === id))
                .filter((m): m is FamilyMember => !!m)}
              onGoBack={handleGoBack}
              onNavigateToHistory={handleNavigateToHistory}
            />
          ) : null
        ) : viewMode === 'framed' ? (
          /* ================== FRAMED MASTERPIECE VIEW (거실 표구 액자형 가계도) ================== */
          <FramedMasterpieceView
            members={allMembers && allMembers.length > 0 ? allMembers : members}
            onSelectMember={setSelectedMember}
            onReturnToMain={() => setViewMode('radial')}
          />
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
                      renderNodeCard(m, m.id === centerPerson?.id, isMobile ? Math.floor((windowWidth - 44) / 2) : 150)
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Scroll-to-Top Button (스크롤 내렸을 때 표시) */}
      {scrollY > 150 && (
        <TouchableOpacity
          style={styles.floatingTopBtn}
          onPress={scrollToTop}
          activeOpacity={0.85}
        >
          <Text style={styles.floatingTopBtnText}>▲ 맨 위로</Text>
        </TouchableOpacity>
      )}

      {/* Member Detail & Center Re-Focus Modal */}
      <MemberDetailModal
        member={selectedMember}
        visible={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onContactLogged={logContact}
        onSelectAsCenter={(memberId) => {
          setCenterPerson(memberId);
        }}
        onOpenRelationshipStudio={(memberId) => {
          setStudioPreselectedPersonAId(memberId);
          setStudioVisible(true);
        }}
        onUpdatePhoto={(memberId, newPhotoUrl) => {
          updateMemberPhoto(memberId, newPhotoUrl);
          setSelectedMember((prev) => (prev && prev.id === memberId ? { ...prev, photoUrl: newPhotoUrl } : prev));
        }}
        onUpdateMember={(updatedMember) => {
          updateMember(updatedMember);
          setSelectedMember(updatedMember);
        }}
      />

      {/* Relationship Linkage Studio Modal (Dual Operating Mode & 2-Step Verification) */}
      <RelationshipStudioModal
        visible={studioVisible}
        onClose={() => setStudioVisible(false)}
        allMembers={allMembers}
        unconnectedMembers={unconnectedMembers}
        establishedLinks={establishedLinks}
        pendingElderLinks={pendingElderLinks}
        approvedLinks={approvedLinks}
        smartRequests={smartRequests}
        operationMode={operationMode}
        onSetOperationMode={setOperatingMode}
        onSendSmartKinship={sendSmartKinshipRequest}
        onApproveSmartKinship={approveSmartKinshipRequest}
        onRejectSmartKinship={rejectSmartKinshipRequest}
        onOpenSmartInspection={(req) => setInspectingRequest(req)}
        onConnect={connectMembers}
        onRequestP2P={requestP2PKinship}
        onElderApprove={elderApproveKinship}
        onElderReject={elderRejectKinship}
        onDisconnect={disconnectLink}
        onResetAll={resetEstablishedLinks}
        onAddCustomMember={addCustomUnconnectedMember}
        initialPersonAId={studioPreselectedPersonAId}
      />

      {/* Smart Kinship Inspection & Parent Comparison Modal */}
      <SmartKinshipInspectionModal
        visible={!!inspectingRequest}
        request={inspectingRequest}
        myFatherName={
          members.find(
            (m) =>
              centerPerson?.parentIds?.includes(m.id) &&
              (m.gender === 'M' || m.relationship.includes('부') || m.relationship.includes('아버지'))
          )?.name || currentUser.fatherName
        }
        myMotherName={
          members.find(
            (m) =>
              centerPerson?.parentIds?.includes(m.id) &&
              (m.gender === 'F' || m.relationship.includes('모') || m.relationship.includes('어머니'))
          )?.name || currentUser.motherName
        }
        myClan={currentUser.clan || centerPerson?.clan}
        onClose={() => setInspectingRequest(null)}
        onApprove={approveSmartKinshipRequest}
        onReject={rejectSmartKinshipRequest}
      />

      {/* Modal for adding custom family member */}
      <AddFamilyMemberModal
        visible={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={(newMem) => {
          addCustomFamilyMember(newMem);
        }}
        currentUserClan={currentUser.clan}
        selfMemberId={currentUser.memberId || centerPersonId}
        selfParents={centerPerson?.parentIds}
        selfSpouseId={centerPerson?.spouseId}
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

  // Sticky Top Controls & Navigation Header
  stickyHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: inkTheme.ink8,
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  stickyModeTabsRow: {
    backgroundColor: inkTheme.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  viewModeScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickyModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
  },
  stickyModeBtnActive: {
    backgroundColor: inkTheme.ink1,
    borderColor: inkTheme.ink0,
  },
  stickyModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  stickyModeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  stickySubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  stickyCenterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  stickyCenterLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: inkTheme.ink4,
  },
  stickyCenterName: {
    fontSize: 13,
    fontWeight: '900',
    color: inkTheme.ink0,
  },
  ownerBadgeMini: {
    backgroundColor: inkTheme.seal,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerBadgeMiniText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  resetCenterBtnMini: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resetCenterBtnMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  stickyRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterAccordionBtn: {
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterAccordionBtnActive: {
    backgroundColor: inkTheme.ink1,
    borderColor: inkTheme.ink0,
  },
  filterAccordionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink2,
  },
  filterAccordionBtnTextActive: {
    color: '#ffffff',
  },
  stickyAddBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stickyAddBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  stickyFilterDropdown: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterLabelCompact: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink3,
    width: 65,
  },
  buttonGroupCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  filterBtnCompact: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  filterBtnCompactActive: {
    backgroundColor: inkTheme.ink1,
    borderColor: inkTheme.ink1,
  },
  filterBtnTextCompact: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterBtnTextCompactActive: {
    color: '#ffffff',
  },
  filterCountLine: {
    marginTop: 2,
  },
  floatingTopBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    zIndex: 999,
  },
  floatingTopBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    color: '#0d0d0d', // Strictly deep black
  },
  centerName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0d0d0d', // Strictly deep black, never red!
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
    color: '#b45309', // Warm dark gold for relation title
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
  studioLauncherBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  studioLauncherLeft: {
    flex: 1,
    minWidth: 240,
  },
  studioBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  studioBadge: {
    backgroundColor: '#059669',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  establishedBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unconnectedBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  studioBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  studioBannerDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  studioOpenBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  studioOpenBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  realMemberBanner: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  realMemberBannerLeft: {
    flex: 1,
    minWidth: 240,
  },
  realMemberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  realMemberBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  realMemberTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  realMemberSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  realMemberBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addMemberHeaderBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addMemberHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  demoSwitchHeaderBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
  },
  demoSwitchHeaderBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  demoActiveBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoActiveBannerText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
    minWidth: 220,
  },
  returnMyJokboBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  returnMyJokboBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  singleMemberGuideCard: {
    marginTop: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  singleMemberGuideTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#15803d',
    marginBottom: 6,
  },
  singleMemberGuideDesc: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  singleMemberAddBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  singleMemberAddBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  smartAlertBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#60a5fa',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  smartAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  smartAlertIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  smartAlertIcon: {
    fontSize: 22,
  },
  smartAlertTextWrap: {
    flex: 1,
  },
  smartAlertBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  smartAlertBadge: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smartAlertTime: {
    fontSize: 10.5,
    color: '#3b82f6',
    fontWeight: '600',
  },
  smartAlertTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1e3a8a',
    lineHeight: 18,
  },
  smartAlertSubtitle: {
    fontSize: 11.5,
    color: '#1d4ed8',
    marginTop: 2,
    lineHeight: 16,
  },
  smartAlertBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  smartAlertBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});