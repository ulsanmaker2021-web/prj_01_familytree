import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { inkTheme } from '../theme/inkTheme';
import { getLifeStatus, getKinshipRelation } from '../utils/mockFamilyData';
import { getMemberAvatar } from '../utils/avatarGenerator';
import { verifyMemberLineage } from '../utils/genealogyVerification';
import { MasterTrackingDashboardModal } from './MasterTrackingDashboardModal';
import { getRequestsForMember } from '../utils/genealogyMasterData';

interface HorizontalMindmapViewProps {
  members: FamilyMember[];
  centerPerson: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  onSetCenterPerson: (memberId: string) => void;
  // Navigation & Menu return props
  currentViewMode?: 'radial' | 'generation' | 'framed' | 'mindmap';
  onSwitchViewMode?: (mode: 'radial' | 'generation' | 'framed' | 'mindmap') => void;
  ownerName?: string;
  onResetToOwner?: () => void;
  historyMembers?: FamilyMember[];
  onGoBack?: () => void;
  onNavigateToHistory?: (memberId: string) => void;
}

export const HorizontalMindmapView: React.FC<HorizontalMindmapViewProps> = ({
  members,
  centerPerson,
  onSelectMember,
  onSetCenterPerson,
  currentViewMode = 'mindmap',
  onSwitchViewMode,
  ownerName,
  onResetToOwner,
  historyMembers = [],
  onGoBack,
  onNavigateToHistory,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;

  // Visual Theme: 'dark' (Modern Mindmap) vs 'hanji' (Traditional Ink Parchment)
  const [themeMode, setThemeMode] = useState<'dark' | 'hanji'>('dark');

  // Track expanded nodes (Set of member IDs)
  // Initially only the center person is expanded; all others are compact mindmap capsules
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([centerPerson.id]));

  // Toggle extended kin (방계: 백부, 숙부, 고모, 외숙, 이모, 사촌 포함 여부)
  const [showExtendedKin, setShowExtendedKin] = useState<boolean>(true);
  const [isMasterDashboardVisible, setIsMasterDashboardVisible] = useState<boolean>(false);

  // Previous person in history if any
  const prevMember = useMemo(() => {
    if (historyMembers.length >= 2) {
      return historyMembers[historyMembers.length - 2];
    }
    return null;
  }, [historyMembers]);

  // Toggle individual node expansion
  const toggleNodeExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allIds = new Set(members.map((m) => m.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Find center person's spouse
  const spouse = useMemo(() => {
    if (!centerPerson.spouseId) return null;
    return members.find((m) => m.id === centerPerson.spouseId);
  }, [members, centerPerson]);

  // Parents of center person
  const parents = useMemo(() => {
    if (!centerPerson.parentIds || centerPerson.parentIds.length === 0) return [];
    return centerPerson.parentIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is FamilyMember => !!m);
  }, [members, centerPerson]);

  const father = parents.find((p) => p.gender === 'M');
  const mother = parents.find((p) => p.gender === 'F');

  // Paternal Grandparents (친조부모)
  const paternalGrandparents = useMemo(() => {
    if (!father || !father.parentIds) return [];
    return father.parentIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is FamilyMember => !!m);
  }, [members, father]);

  // Maternal Grandparents (외조부모)
  const maternalGrandparents = useMemo(() => {
    if (!mother || !mother.parentIds) return [];
    return mother.parentIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is FamilyMember => !!m);
  }, [members, mother]);

  // Paternal Extended Aunts & Uncles (친가 백부/숙부/고모)
  const paternalUnclesAunts = useMemo(() => {
    if (!father || !father.parentIds || father.parentIds.length === 0) return [];
    return members.filter(
      (m) =>
        m.id !== father.id &&
        m.parentIds &&
        m.parentIds.some((pId) => father.parentIds?.includes(pId))
    );
  }, [members, father]);

  // Maternal Extended Aunts & Uncles (외가 외삼촌/이모)
  const maternalUnclesAunts = useMemo(() => {
    if (!mother || !mother.parentIds || mother.parentIds.length === 0) return [];
    return members.filter(
      (m) =>
        m.id !== mother.id &&
        m.parentIds &&
        m.parentIds.some((pId) => mother.parentIds?.includes(pId))
    );
  }, [members, mother]);

  // Siblings of Center Person (동기: 형제·자매)
  const siblings = useMemo(() => {
    if (!centerPerson.parentIds || centerPerson.parentIds.length === 0) return [];
    return members.filter(
      (m) =>
        m.id !== centerPerson.id &&
        m.parentIds &&
        m.parentIds.some((pId) => centerPerson.parentIds?.includes(pId))
    );
  }, [members, centerPerson]);

  // Direct Children (직계 자녀)
  const children = useMemo(() => {
    return members.filter((m) => m.parentIds && m.parentIds.includes(centerPerson.id));
  }, [members, centerPerson]);

  // Grandchildren (직계 손자녀)
  const grandchildrenMap = useMemo(() => {
    const map: Record<string, FamilyMember[]> = {};
    children.forEach((child) => {
      const gcList = members.filter((m) => m.parentIds && m.parentIds.includes(child.id));
      map[child.id] = gcList;
    });
    return map;
  }, [members, children]);

  const allGrandchildren = useMemo(() => {
    const list: FamilyMember[] = [];
    Object.values(grandchildrenMap).forEach((gcs) => list.push(...gcs));
    return list;
  }, [grandchildrenMap]);

  // Theme palette
  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#0f172a' : '#fcfbf7';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e2e8f0';
  const centerCardBg = isDark ? '#1e1b4b' : '#eff6ff';
  const centerCardBorder = isDark ? '#6366f1' : '#3b82f6';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const branchLineColor = isDark ? '#475569' : '#cbd5e1';

  // Helper to determine relation tag
  const getDisplayRelationTag = (member: FamilyMember, defaultRole?: string) => {
    if (defaultRole) return defaultRole;
    if (member.id === centerPerson.id) return '본인(주인공)';
    if (member.id === centerPerson.spouseId) return '배우자';
    if (member.relationship) return member.relationship;
    const kinship = getKinshipRelation(centerPerson.id, member.id);
    return kinship.title || '친족';
  };

  // Render a compact Mindmap Node with optional on-demand expand drawer
  const renderMindmapNode = (
    member: FamilyMember,
    options: {
      isCenter?: boolean;
      roleTag?: string;
      lineageBadge?: string;
      lineageColor?: string;
    } = {}
  ) => {
    const { isCenter = false, roleTag, lineageBadge, lineageColor } = options;
    const isExpanded = expandedIds.has(member.id);
    const isMale = member.gender === 'M';
    const life = getLifeStatus(member);

    // Birth/Death years
    const birthYear = member.birthDate ? parseInt(member.birthDate.substring(0, 4), 10) : null;
    const deathYear = member.deathDate ? parseInt(member.deathDate.substring(0, 4), 10) : null;

    // Gender styling
    const genderColor = isMale ? '#38bdf8' : '#f472b6';
    const genderBg = isMale
      ? isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe'
      : isDark ? 'rgba(244, 114, 182, 0.15)' : '#fce7f3';

    // Accent line by lineage
    const accent = lineageColor || (member.lineage === 'maternal' ? '#3b82f6' : member.lineage === 'inlaw_paternal' || member.lineage === 'inlaw_maternal' ? '#d97706' : '#ef4444');

    const relationText = getDisplayRelationTag(member, roleTag);
    const verification = verifyMemberLineage(member);

    return (
      <View
        key={member.id}
        style={[
          styles.nodeWrapper,
          isCenter && styles.centerNodeWrapper,
        ]}
      >
        {/* Branch connector incoming dot */}
        <View style={[styles.connectorDotLeft, { backgroundColor: branchLineColor }]} />

        {/* The Node Capsule */}
        <View
          style={[
            styles.nodeCapsule,
            {
              backgroundColor: isCenter ? centerCardBg : cardBg,
              borderColor: isCenter ? centerCardBorder : isExpanded ? accent : cardBorder,
              borderLeftColor: accent,
              borderLeftWidth: 4,
            },
            isCenter && styles.nodeCapsuleCenter,
            isExpanded && styles.nodeCapsuleExpanded,
          ]}
        >
          {/* Main Compact Row (클릭 시 펼침/접힘 토글) */}
          <TouchableOpacity
            style={styles.compactRow}
            onPress={() => toggleNodeExpand(member.id)}
            activeOpacity={0.7}
          >
            {/* Avatar / Character Portrait */}
            <View style={[styles.genderBadge, { backgroundColor: genderBg, overflow: 'hidden' }]}>
              <Image
                source={{ uri: getMemberAvatar(member) }}
                style={styles.compactAvatarImg}
                resizeMode="cover"
              />
            </View>

            {/* Name + Hanja */}
            <View style={styles.nameContainer}>
              <Text
                style={[
                  styles.nodeName,
                  { color: isCenter ? (isDark ? '#a5b4fc' : '#1d4ed8') : textColor },
                  isCenter && styles.nodeNameCenter,
                ]}
                numberOfLines={1}
              >
                {member.name}
                {member.hanja ? (
                  <Text style={[styles.nodeHanja, { color: subtextColor }]}>
                    {' '}({member.hanja})
                  </Text>
                ) : null}
              </Text>
            </View>

            {/* Relation Tag Badge */}
            <View
              style={[
                styles.relationTag,
                {
                  backgroundColor: isCenter
                    ? (isDark ? '#4338ca' : '#dbeafe')
                    : (isDark ? '#334155' : '#f1f5f9'),
                },
              ]}
            >
              <Text
                style={[
                  styles.relationTagText,
                  {
                    color: isCenter
                      ? (isDark ? '#e0e7ff' : '#1e40af')
                      : (isDark ? '#cbd5e1' : '#475569'),
                  },
                ]}
              >
                {relationText}
              </Text>
            </View>

            {/* Lineage small badge if provided */}
            {lineageBadge && (
              <View style={[styles.lineageBadge, { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.lineageBadgeText, { color: accent }]}>{lineageBadge}</Text>
              </View>
            )}

            {/* Dual generation short badge */}
            <View style={[styles.lineageBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <Text style={[styles.lineageBadgeText, { color: '#b45309', fontWeight: '800' }]}>{verification.shortBadge}</Text>
            </View>

            {/* Life status dot */}
            <View
              style={[
                styles.lifeStatusDot,
                { backgroundColor: life.isAlive ? '#10b981' : '#64748b' },
              ]}
            />

            {/* Expand / Fold Button */}
            <TouchableOpacity
              style={[
                styles.expandToggleBtn,
                {
                  backgroundColor: isExpanded
                    ? (isDark ? '#475569' : '#e2e8f0')
                    : (isDark ? '#334155' : '#f8fafc'),
                  borderColor: isExpanded ? accent : (isDark ? '#64748b' : '#cbd5e1'),
                },
              ]}
              onPress={() => toggleNodeExpand(member.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.expandToggleBtnText,
                  { color: isExpanded ? accent : textColor },
                ]}
              >
                {isExpanded ? '−' : '+'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* ================================================================= */}
          {/* Expanded Detail Drawer (확장 버튼 클릭 시 나타나는 풍부한 정보 서랍) */}
          {/* ================================================================= */}
          {isExpanded && (
            <View
              style={[
                styles.expandedDrawer,
                {
                  borderTopColor: isDark ? '#334155' : '#f1f5f9',
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.8)',
                },
              ]}
            >
              {/* Lifespan & Age */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>생몰/연세:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {birthYear ? `${birthYear}년생` : '미상'}
                  {deathYear ? ` ~ ${deathYear}년 (${deathYear - (birthYear || 0)}세 별세)` : ''}
                  {life.fullDesc ? ` · ${life.fullDesc}` : ''}
                </Text>
              </View>

              {/* Clan */}
              {member.clan && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: subtextColor }]}>본관:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>
                    {member.clan}
                  </Text>
                </View>
              )}

              {/* Clan Genealogy Dual Generation & Hangnyeol */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>족보세손:</Text>
                <Text style={[styles.detailValue, { color: '#0284c7', fontWeight: '700' }]}>
                  {verification.dualGenerationText}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>항렬검증:</Text>
                <Text style={[styles.detailValue, { color: verification.isVerified ? '#10b981' : '#f59e0b', fontWeight: '700' }]}>
                  {verification.verificationBadgeText}
                </Text>
              </View>

              {/* Achievements / Bio */}
              {member.achievements && member.achievements.length > 0 ? (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: subtextColor }]}>주요이력:</Text>
                  <Text style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
                    {member.achievements.join(', ')}
                  </Text>
                </View>
              ) : null}

              {/* Elder Verification Badge */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: subtextColor }]}>가문공인:</Text>
                <Text style={[styles.detailValue, { color: '#10b981', fontWeight: '700' }]}>
                  🛡️ 윗대 생존 어르신 공인 완료
                </Text>
              </View>

              {/* Clan Master Verification Status if active */}
              {(() => {
                const reqs = getRequestsForMember(member.id);
                const activeReq = reqs[0];
                if (!activeReq) return null;
                const isApproved = activeReq.status === 'approved';
                return (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: subtextColor }]}>마스터실사:</Text>
                    <TouchableOpacity onPress={() => setIsMasterDashboardVisible(true)}>
                      <Text style={[styles.detailValue, { color: isApproved ? '#10b981' : '#f59e0b', fontWeight: '800' }]}>
                        {isApproved ? '🛡️ 마스터 최종공인 완료' : '⏳ 대동보 수기 실사중'} (확인 ➔)
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* Action Buttons in Drawer */}
              <View style={styles.drawerActionsRow}>
                {!isCenter && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnShift]}
                    onPress={() => onSetCenterPerson(member.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnShiftText}>
                      🎯 이 사람 중심으로 3대 펼치기
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Back to previous person */}
                {prevMember && isCenter && onGoBack && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnBackPrev]}
                    onPress={onGoBack}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnBackPrevText}>
                      ◀ 이전 ({prevMember.name})으로 복귀
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Return to All Menu (전체 메뉴 / 홈으로) */}
                {onSwitchViewMode && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnMainHome]}
                    onPress={() => onSwitchViewMode('radial')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnMainHomeText}>
                      🏠 전체 메뉴로
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnProfile, { borderColor: isDark ? '#64748b' : '#cbd5e1' }]}
                  onPress={() => onSelectMember(member)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnProfileText, { color: textColor }]}>
                    📋 전체 프로필 모달
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtnFold, { borderColor: isDark ? '#475569' : '#e2e8f0' }]}
                  onPress={() => toggleNodeExpand(member.id)}
                >
                  <Text style={[styles.actionBtnFoldText, { color: subtextColor }]}>▲ 접기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Branch connector outgoing dot */}
        <View style={[styles.connectorDotRight, { backgroundColor: branchLineColor }]} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* ===================================================================== */}
      {/* 0. Top Navigation & Menu Return Bar (세부 메뉴 ➔ 이전/전체 메뉴 복귀 내비게이션) */}
      {/* ===================================================================== */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: isDark ? '#0b1120' : '#ffffff',
            borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.navLeftGroup}>
          {/* 1. Back button (이전 메뉴 / 이전 인물) */}
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnBack]}
            onPress={onGoBack}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnBackText}>
              ◀ {prevMember ? `이전 (${prevMember.name})` : '이전 메뉴'}
            </Text>
          </TouchableOpacity>

          {/* 2. Full Menu / Home Button (전체 메뉴 / 메인 가계도) */}
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnHome]}
            onPress={() => onSwitchViewMode && onSwitchViewMode('radial')}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnHomeText}>
              🏠 전체 메뉴 (메인 가계도)
            </Text>
          </TouchableOpacity>

          {/* 3. Return to Device Owner (스마트폰 주인으로 복귀) */}
          {ownerName && onResetToOwner && (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnOwner]}
              onPress={onResetToOwner}
              activeOpacity={0.8}
            >
              <Text style={styles.navBtnOwnerText}>
                👤 {ownerName} (본인 복귀)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Mode Switcher Pills (다른 뷰로 즉시 전환) */}
        {onSwitchViewMode && (
          <View style={styles.viewModeSwitcher}>
            <Text style={[styles.viewModeLabel, { color: subtextColor }]}>전체 메뉴 바로가기:</Text>
            <TouchableOpacity
              style={[styles.modePill, currentViewMode === 'radial' && styles.modePillActive]}
              onPress={() => onSwitchViewMode('radial')}
            >
              <Text style={[styles.modePillText, currentViewMode === 'radial' && styles.modePillTextActive]}>
                🌐 옵시디언
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modePill, currentViewMode === 'generation' && styles.modePillActive]}
              onPress={() => onSwitchViewMode('generation')}
            >
              <Text style={[styles.modePillText, currentViewMode === 'generation' && styles.modePillTextActive]}>
                📜 세대별
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modePill, currentViewMode === 'framed' && [styles.modePillActive, { backgroundColor: '#854d0e', borderColor: '#b45309' }]]}
              onPress={() => onSwitchViewMode('framed')}
            >
              <Text style={[styles.modePillText, currentViewMode === 'framed' && styles.modePillTextActive]}>
                🖼️ 거실액자
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modePill, currentViewMode === 'mindmap' && styles.modePillActiveMindmap]}
              onPress={() => onSwitchViewMode('mindmap')}
            >
              <Text style={[styles.modePillText, currentViewMode === 'mindmap' && styles.modePillTextActiveMindmap]}>
                🧠 수평 마인드맵
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modePill, { backgroundColor: '#065f46', borderColor: '#34d399' }]}
              onPress={() => setIsMasterDashboardVisible(true)}
            >
              <Text style={[styles.modePillText, { color: '#ecfdf5', fontWeight: '800' }]}>
                🏛️ 족보 마스터 센터
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ===================================================================== */}
      {/* 0-B. Breadcrumb Navigation Trail (현재 탐색 경로 표시 및 원클릭 점프) */}
      {/* ===================================================================== */}
      {historyMembers && historyMembers.length > 0 && (
        <View
          style={[
            styles.breadcrumbBar,
            {
              backgroundColor: isDark ? '#111827' : '#f8fafc',
              borderBottomColor: isDark ? '#1f2937' : '#e2e8f0',
            },
          ]}
        >
          <Text style={[styles.breadcrumbLabel, { color: subtextColor }]}>🧭 이동 경로:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbScroll}>
            <TouchableOpacity onPress={() => onSwitchViewMode && onSwitchViewMode('radial')}>
              <Text style={[styles.breadcrumbLink, { color: '#0284c7' }]}>🏠 가계도 전체</Text>
            </TouchableOpacity>
            <Text style={[styles.breadcrumbSep, { color: subtextColor }]}> ❯ </Text>
            {historyMembers.map((m, idx) => {
              const isLast = idx === historyMembers.length - 1;
              return (
                <View key={m.id + '_' + idx} style={styles.breadcrumbItemWrap}>
                  {idx > 0 && <Text style={[styles.breadcrumbSep, { color: subtextColor }]}> ❯ </Text>}
                  <TouchableOpacity
                    onPress={() => !isLast && onNavigateToHistory && onNavigateToHistory(m.id)}
                    disabled={isLast}
                  >
                    <Text
                      style={[
                        isLast ? styles.breadcrumbCurrent : styles.breadcrumbLink,
                        { color: isLast ? (isDark ? '#38bdf8' : '#0369a1') : (isDark ? '#93c5fd' : '#0284c7') },
                      ]}
                    >
                      {m.name} ({m.relationship || '친족'})
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 1. Header Toolbar & Quick Controls */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.toolbarLeft}>
          <View style={styles.titleRow}>
            <View style={styles.mindmapBadge}>
              <Text style={styles.mindmapBadgeText}>🧠 수평 간략 마인드맵</Text>
            </View>
            <Text style={[styles.mainTitle, { color: textColor }]}>
              [ {centerPerson.name} {centerPerson.hanja ? `(${centerPerson.hanja})` : ''} ] 중심 3대 가계도
            </Text>
          </View>
          <Text style={[styles.subTitle, { color: subtextColor }]}>
            💡 마인드맵 노드의 [+] 버튼을 누르면 상세 정보와 [중심 변경] 메뉴가 펼쳐집니다.
          </Text>
        </View>

        <View style={styles.toolbarRight}>
          {/* Expand All / Collapse All */}
          <View style={styles.controlGroup}>
            <TouchableOpacity
              style={[styles.toolBtn, { borderColor: isDark ? '#475569' : '#cbd5e1' }]}
              onPress={expandAll}
            >
              <Text style={[styles.toolBtnText, { color: textColor }]}>➕ 전체 펼침</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, { borderColor: isDark ? '#475569' : '#cbd5e1' }]}
              onPress={collapseAll}
            >
              <Text style={[styles.toolBtnText, { color: textColor }]}>➖ 전체 간략</Text>
            </TouchableOpacity>
          </View>

          {/* Toggle Extended Kin (방계 포함 여부) */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              showExtendedKin && styles.toolBtnActive,
              { borderColor: showExtendedKin ? '#0284c7' : (isDark ? '#475569' : '#cbd5e1') },
            ]}
            onPress={() => setShowExtendedKin(!showExtendedKin)}
          >
            <Text
              style={[
                styles.toolBtnText,
                { color: showExtendedKin ? '#0284c7' : textColor, fontWeight: showExtendedKin ? '800' : '500' },
              ]}
            >
              {showExtendedKin ? '🌐 방계 포함됨' : '🌿 직계만 보기'}
            </Text>
          </TouchableOpacity>

          {/* Theme Toggle */}
          <TouchableOpacity
            style={[styles.toolBtn, { borderColor: isDark ? '#475569' : '#cbd5e1' }]}
            onPress={() => setThemeMode(isDark ? 'hanji' : 'dark')}
          >
            <Text style={[styles.toolBtnText, { color: isDark ? '#fde047' : '#0284c7' }]}>
              {isDark ? '☀️ 한지' : '🌙 다크'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Horizontal Scroll Canvas with Mindmap Branches */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.verticalScrollContent}
        >
          <View style={styles.mindmapTreeRow}>
            {/* ========================================================================= */}
            {/* COLUMN 1 (가장 좌측): 2단계 윗대 - 조부모 / 외조부모 (Grandparents) */}
            {/* ========================================================================= */}
            <View style={styles.treeColumn}>
              <View style={[styles.columnHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={[styles.columnHeaderBadge, { backgroundColor: '#475569' }]}>
                  <Text style={styles.columnHeaderBadgeText}>2단계 윗대</Text>
                </View>
                <Text style={[styles.columnTitle, { color: textColor }]}>조부모·외조부모</Text>
                <Text style={[styles.columnSub, { color: subtextColor }]}>친·외가 동등</Text>
              </View>

              <View style={styles.columnNodesContainer}>
                {/* Paternal Grandparents (친조부모) */}
                <View style={styles.subGroupBlock}>
                  <View style={styles.subGroupHeader}>
                    <View style={[styles.subGroupLine, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.subGroupTitle, { color: '#ef4444' }]}>🔴 친가 조부모</Text>
                  </View>
                  {paternalGrandparents.length > 0 ? (
                    paternalGrandparents.map((gp) =>
                      renderMindmapNode(gp, {
                        roleTag: gp.gender === 'M' ? '친조부' : '친조모',
                        lineageBadge: '친가',
                        lineageColor: '#ef4444',
                      })
                    )
                  ) : (
                    <Text style={[styles.emptyNotice, { color: subtextColor }]}>친조부모 정보 미등록</Text>
                  )}
                </View>

                {/* Branch vertical separator */}
                <View style={[styles.branchDivider, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />

                {/* Maternal Grandparents (외조부모) */}
                <View style={styles.subGroupBlock}>
                  <View style={styles.subGroupHeader}>
                    <View style={[styles.subGroupLine, { backgroundColor: '#3b82f6' }]} />
                    <Text style={[styles.subGroupTitle, { color: '#3b82f6' }]}>🔵 외가 외조부모</Text>
                  </View>
                  {maternalGrandparents.length > 0 ? (
                    maternalGrandparents.map((mgp) =>
                      renderMindmapNode(mgp, {
                        roleTag: mgp.gender === 'M' ? '외조부' : '외조모',
                        lineageBadge: '외가',
                        lineageColor: '#3b82f6',
                      })
                    )
                  ) : (
                    <Text style={[styles.emptyNotice, { color: subtextColor }]}>외조부모 정보 미등록</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Tree Branch Line (Col 1 ➔ Col 2) */}
            <View style={styles.branchBridge}>
              <View style={[styles.horizontalLine, { backgroundColor: branchLineColor }]} />
              <View style={[styles.arrowHeadLeft, { borderColor: branchLineColor }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 2 (좌측): 1단계 윗대 - 부모 세대 (Parents & Aunts/Uncles) */}
            {/* ========================================================================= */}
            <View style={styles.treeColumn}>
              <View style={[styles.columnHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={[styles.columnHeaderBadge, { backgroundColor: '#0284c7' }]}>
                  <Text style={styles.columnHeaderBadgeText}>1단계 윗대</Text>
                </View>
                <Text style={[styles.columnTitle, { color: textColor }]}>부모님 세대</Text>
                <Text style={[styles.columnSub, { color: subtextColor }]}>친부·친모</Text>
              </View>

              <View style={styles.columnNodesContainer}>
                {/* Direct Parents */}
                <View style={styles.subGroupBlock}>
                  <View style={styles.subGroupHeader}>
                    <Text style={[styles.subGroupTitle, { color: textColor }]}>직계 부모</Text>
                  </View>
                  {father &&
                    renderMindmapNode(father, {
                      roleTag: '친부(아버지)',
                      lineageBadge: '친가',
                      lineageColor: '#ef4444',
                    })}
                  {mother &&
                    renderMindmapNode(mother, {
                      roleTag: '친모(어머니)',
                      lineageBadge: '외가',
                      lineageColor: '#3b82f6',
                    })}
                  {!father && !mother && (
                    <Text style={[styles.emptyNotice, { color: subtextColor }]}>등록된 부모 정보 없음</Text>
                  )}
                </View>

                {/* Extended Kin: Paternal & Maternal Uncles/Aunts (백부, 숙부, 고모, 외숙, 이모) */}
                {showExtendedKin && (paternalUnclesAunts.length > 0 || maternalUnclesAunts.length > 0) && (
                  <>
                    <View style={[styles.branchDivider, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
                    <View style={styles.subGroupBlock}>
                      <View style={styles.subGroupHeader}>
                        <Text style={[styles.subGroupTitle, { color: subtextColor }]}>방계 어르신 (백부·숙부·외숙)</Text>
                      </View>
                      {paternalUnclesAunts.map((u) =>
                        renderMindmapNode(u, {
                          roleTag: u.relationship || (u.gender === 'M' ? '백부/숙부' : '고모'),
                          lineageBadge: '친가',
                          lineageColor: '#ef4444',
                        })
                      )}
                      {maternalUnclesAunts.map((u) =>
                        renderMindmapNode(u, {
                          roleTag: u.relationship || (u.gender === 'M' ? '외숙' : '이모'),
                          lineageBadge: '외가',
                          lineageColor: '#3b82f6',
                        })
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Tree Branch Line (Col 2 ➔ Col 3) */}
            <View style={styles.branchBridge}>
              <View style={[styles.horizontalLine, { backgroundColor: branchLineColor }]} />
              <View style={[styles.arrowHeadLeft, { borderColor: branchLineColor }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 3 (중앙): ★ 기준 인물 Hub (Center Person, Spouse, Siblings) */}
            {/* ========================================================================= */}
            <View style={[styles.treeColumn, styles.treeColumnCenter, { borderColor: centerCardBorder }]}>
              <View style={[styles.columnHeader, { borderBottomColor: isDark ? '#4338ca' : '#bfdbfe' }]}>
                <View style={[styles.columnHeaderBadge, { backgroundColor: '#6366f1' }]}>
                  <Text style={styles.columnHeaderBadgeText}>★ 기준 인물 Hub</Text>
                </View>
                <Text style={[styles.columnTitle, { color: isDark ? '#c7d2fe' : '#1e3a8a', fontWeight: '900' }]}>
                  {centerPerson.name} 중심 세대
                </Text>
                <Text style={[styles.columnSub, { color: subtextColor }]}>본인 · 배우자 · 형제</Text>
              </View>

              <View style={styles.columnNodesContainer}>
                {/* 1. Center Person (The Main Star) */}
                <View style={styles.subGroupBlock}>
                  <View style={styles.subGroupHeader}>
                    <Text style={[styles.subGroupTitle, { color: '#6366f1', fontWeight: '800' }]}>
                      ★ 주인공 (중심 기준 인물)
                    </Text>
                  </View>
                  {renderMindmapNode(centerPerson, {
                    isCenter: true,
                    roleTag: '★ 본인(주인공)',
                    lineageBadge: '중심',
                    lineageColor: '#6366f1',
                  })}
                </View>

                {/* 2. Spouse (배우자) */}
                {spouse ? (
                  <View style={styles.subGroupBlock}>
                    <View style={styles.subGroupHeader}>
                      <Text style={[styles.subGroupTitle, { color: '#d97706', fontWeight: '700' }]}>
                        💍 동반자 배우자
                      </Text>
                    </View>
                    {renderMindmapNode(spouse, {
                      roleTag: '배우자',
                      lineageBadge: '배우자',
                      lineageColor: '#d97706',
                    })}
                  </View>
                ) : (
                  <View style={styles.subGroupBlock}>
                    <Text style={[styles.emptyNotice, { color: subtextColor }]}>배우자 미등록</Text>
                  </View>
                )}

                {/* 3. Siblings (형제자매) */}
                {siblings.length > 0 && (
                  <View style={styles.subGroupBlock}>
                    <View style={[styles.branchDivider, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
                    <View style={styles.subGroupHeader}>
                      <Text style={[styles.subGroupTitle, { color: subtextColor }]}>동기 (형제·자매)</Text>
                    </View>
                    {siblings.map((sib) =>
                      renderMindmapNode(sib, {
                        roleTag: sib.gender === 'M' ? '형제' : '자매',
                        lineageBadge: '동기',
                        lineageColor: '#10b981',
                      })
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Tree Branch Line (Col 3 ➔ Col 4) */}
            <View style={styles.branchBridge}>
              <View style={[styles.horizontalLine, { backgroundColor: branchLineColor }]} />
              <View style={[styles.arrowHeadRight, { borderColor: branchLineColor }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 4 (우측): 1단계 아랫대 - 직계 자녀 (Children) */}
            {/* ========================================================================= */}
            <View style={styles.treeColumn}>
              <View style={[styles.columnHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={[styles.columnHeaderBadge, { backgroundColor: '#059669' }]}>
                  <Text style={styles.columnHeaderBadgeText}>1단계 아랫대</Text>
                </View>
                <Text style={[styles.columnTitle, { color: textColor }]}>직계 자녀</Text>
                <Text style={[styles.columnSub, { color: subtextColor }]}>아들 · 딸</Text>
              </View>

              <View style={styles.columnNodesContainer}>
                {children.length > 0 ? (
                  children.map((child, idx) =>
                    renderMindmapNode(child, {
                      roleTag: child.gender === 'M' ? (idx === 0 ? '장남' : '차남') : (idx === 0 ? '장녀' : '차녀'),
                      lineageBadge: '자녀',
                      lineageColor: '#059669',
                    })
                  )
                ) : (
                  <Text style={[styles.emptyNotice, { color: subtextColor }]}>등록된 자녀 정보 없음</Text>
                )}
              </View>
            </View>

            {/* Tree Branch Line (Col 4 ➔ Col 5) */}
            <View style={styles.branchBridge}>
              <View style={[styles.horizontalLine, { backgroundColor: branchLineColor }]} />
              <View style={[styles.arrowHeadRight, { borderColor: branchLineColor }]} />
            </View>

            {/* ========================================================================= */}
            {/* COLUMN 5 (가장 우측): 2단계 아랫대 - 손자녀 (Grandchildren) */}
            {/* ========================================================================= */}
            <View style={styles.treeColumn}>
              <View style={[styles.columnHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={[styles.columnHeaderBadge, { backgroundColor: '#7c3aed' }]}>
                  <Text style={styles.columnHeaderBadgeText}>2단계 아랫대</Text>
                </View>
                <Text style={[styles.columnTitle, { color: textColor }]}>손자녀 세대</Text>
                <Text style={[styles.columnSub, { color: subtextColor }]}>손자 · 손녀</Text>
              </View>

              <View style={styles.columnNodesContainer}>
                {allGrandchildren.length > 0 ? (
                  allGrandchildren.map((gc) =>
                    renderMindmapNode(gc, {
                      roleTag: gc.gender === 'M' ? '손자' : '손녀',
                      lineageBadge: '손주',
                      lineageColor: '#7c3aed',
                    })
                  )
                ) : (
                  <Text style={[styles.emptyNotice, { color: subtextColor }]}>손자녀 세대 미등록</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </ScrollView>

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
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  navLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navBtnBack: {
    backgroundColor: '#0284c7',
  },
  navBtnBackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  navBtnHome: {
    backgroundColor: '#475569',
  },
  navBtnHomeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  navBtnOwner: {
    backgroundColor: '#059669',
  },
  navBtnOwnerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  viewModeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  modePillActiveMindmap: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  modePillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  modePillTextActiveMindmap: {
    color: '#ffffff',
    fontWeight: '800',
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  breadcrumbLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  breadcrumbScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbItemWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbSep: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  breadcrumbLink: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    fontWeight: '800',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarLeft: {
    flex: 1,
    minWidth: 260,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  mindmapBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mindmapBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 12,
    marginTop: 4,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  toolBtnText: {
    fontSize: 12,
  },
  horizontalScrollContent: {
    padding: 16,
  },
  verticalScrollContent: {
    paddingVertical: 8,
  },
  mindmapTreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  treeColumn: {
    width: 250,
    minHeight: 480,
    backgroundColor: 'transparent',
  },
  treeColumnCenter: {
    width: 280,
    paddingHorizontal: 4,
  },
  columnHeader: {
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  columnHeaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  columnHeaderBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  columnSub: {
    fontSize: 11,
    marginTop: 2,
  },
  columnNodesContainer: {
    gap: 8,
  },
  subGroupBlock: {
    gap: 6,
    marginBottom: 4,
  },
  subGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  subGroupLine: {
    width: 3,
    height: 10,
    borderRadius: 2,
  },
  subGroupTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  branchDivider: {
    height: 1,
    marginVertical: 6,
  },
  emptyNotice: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  branchBridge: {
    width: 28,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  horizontalLine: {
    width: '100%',
    height: 2,
  },
  arrowHeadLeft: {
    position: 'absolute',
    right: 4,
    width: 6,
    height: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  arrowHeadRight: {
    position: 'absolute',
    right: 4,
    width: 6,
    height: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  nodeWrapper: {
    position: 'relative',
    marginVertical: 3,
  },
  centerNodeWrapper: {
    marginVertical: 6,
  },
  connectorDotLeft: {
    position: 'absolute',
    left: -6,
    top: 16,
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 2,
  },
  connectorDotRight: {
    position: 'absolute',
    right: -6,
    top: 16,
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 2,
  },
  nodeCapsule: {
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  nodeCapsuleCenter: {
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  nodeCapsuleExpanded: {
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 6,
    minHeight: 38,
  },
  genderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarImg: {
    width: '100%',
    height: '100%',
  },
  genderIconText: {
    fontSize: 11,
    fontWeight: '800',
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  nodeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  nodeNameCenter: {
    fontSize: 14,
    fontWeight: '800',
  },
  nodeHanja: {
    fontSize: 11,
    fontWeight: '400',
  },
  relationTag: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relationTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  lineageBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
  },
  lineageBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  lifeStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  expandToggleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  expandToggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  expandedDrawer: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 54,
  },
  detailValue: {
    fontSize: 11,
    flex: 1,
  },
  drawerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionBtnShift: {
    backgroundColor: '#0284c7',
  },
  actionBtnShiftText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtnBackPrev: {
    backgroundColor: '#0284c7',
  },
  actionBtnBackPrevText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtnMainHome: {
    backgroundColor: '#475569',
  },
  actionBtnMainHomeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtnProfile: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionBtnProfileText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionBtnFold: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 0.5,
    marginLeft: 'auto',
  },
  actionBtnFoldText: {
    fontSize: 10,
  },
});
