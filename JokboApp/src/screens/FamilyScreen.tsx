import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { FamilyMember, LineageType, EstablishedLink } from '../types/family';
import { LINEAGES, getLifeStatus } from '../utils/mockFamilyData';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { inkTheme } from '../theme/inkTheme';

export default function FamilyScreen() {
  const { members, establishedLinks, logContact } = useFamilyStore();
  const { currentUser, openLoginModal } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineage, setSelectedLineage] = useState<LineageType | 'all'>('all');
  const [aliveOnly, setAliveOnly] = useState(false);
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [viewingCertLink, setViewingCertLink] = useState<EstablishedLink | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedLineage !== 'all' && m.lineage !== selectedLineage) {
        return false;
      }
      if (aliveOnly && !m.isAlive) {
        return false;
      }
      if (approvedOnly) {
        const hasApprovedLink = establishedLinks.some(
          (l) => (l.personAId === m.id || l.personBId === m.id) && l.status === 'approved'
        );
        if (!hasApprovedLink) return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchName = m.name.toLowerCase().includes(query);
        const matchHanja = m.hanja?.toLowerCase().includes(query);
        const matchRel = m.relationship.toLowerCase().includes(query);
        const matchClan = m.clan?.toLowerCase().includes(query);
        return matchName || matchHanja || matchRel || matchClan;
      }
      return true;
    });
  }, [members, establishedLinks, selectedLineage, aliveOnly, approvedOnly, searchQuery]);

  const totalCount = members.length;
  const aliveCount = members.filter((m) => m.isAlive).length;
  const approvedCount = members.filter((m) =>
    establishedLinks.some(
      (l) => (l.personAId === m.id || l.personBId === m.id) && l.status === 'approved'
    )
  ).length;

  return (
    <View style={styles.container}>
      {/* Security & Access Tier Banner */}
      <View style={styles.securityHeaderBanner}>
        <View style={styles.securityHeaderLeft}>
          <Text style={styles.securityHeaderRoleBadge}>
            {currentUser.role === 'admin'
              ? '👑 가문 종손 (관리자)'
              : currentUser.role === 'direct_family'
              ? '🛡️ 직계 정회원'
              : '👥 방계 친족 (보호모드)'}
          </Text>
          <Text style={styles.securityHeaderUser}>
            {currentUser.name} 님 열람 중 ({currentUser.role === 'collateral' ? '🔒 연락처 마스킹 활성' : '🔓 전체 정보 열람 가능'})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.securitySwitchBtn}
          onPress={openLoginModal}
          activeOpacity={0.8}
        >
          <Text style={styles.securitySwitchBtnText}>🔐 계정 전환</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Header */}
      <View style={styles.headerArea}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="이름, 한자, 호칭, 본관 검색..."
            placeholderTextColor={inkTheme.ink5}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Summary Card */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>총 등록 인원</Text>
            <Text style={styles.statValue}>{totalCount}명</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>생존 구성원</Text>
            <Text style={[styles.statValue, { color: inkTheme.accentPine }]}>
              {aliveCount}명
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>작고 어르신</Text>
            <Text style={[styles.statValue, { color: inkTheme.ink3 }]}>
              {totalCount - aliveCount}명
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedLineage === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedLineage('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedLineage === 'all' && styles.filterPillTextActive,
              ]}
            >
              전체 ({totalCount})
            </Text>
          </TouchableOpacity>

          {(Object.keys(LINEAGES) as LineageType[]).map((key) => {
            const info = LINEAGES[key];
            const count = members.filter((m) => m.lineage === key).length;
            const isActive = selectedLineage === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setSelectedLineage(key)}
              >
                <View
                  style={[
                    styles.lineageDot,
                    { backgroundColor: info.badgeColor },
                  ]}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {info.shortLabel} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.filterPill,
              aliveOnly && styles.filterPillActiveAlive,
            ]}
            onPress={() => setAliveOnly(!aliveOnly)}
          >
            <Text
              style={[
                styles.filterPillText,
                aliveOnly && styles.filterPillTextActive,
              ]}
            >
              {aliveOnly ? '✓ 생존자만' : '생존자만'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              approvedOnly && styles.filterPillActiveApproved,
            ]}
            onPress={() => setApprovedOnly(!approvedOnly)}
          >
            <Text
              style={[
                styles.filterPillText,
                approvedOnly && styles.filterPillTextActive,
              ]}
            >
              {approvedOnly ? `✓ 🛡️ 공인 친족 (${approvedCount})` : `🛡️ 공인 친족 (${approvedCount})`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Member List */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredMembers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>검색 조건에 맞는 가족 구성원이 없습니다.</Text>
          </View>
        ) : (
          filteredMembers.map((member) => {
            const lineage = LINEAGES[member.lineage];
            const life = getLifeStatus(member);

            return (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.card,
                  !member.isAlive && styles.cardDeceased,
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedMember(member)}
              >
                {/* Left Lineage Indicator Bar */}
                <View
                  style={[
                    styles.sideBar,
                    { backgroundColor: lineage.badgeColor },
                  ]}
                />

                <View style={styles.cardMain}>
                  {/* Row 1: Badges & Name */}
                  <View style={styles.cardRow1}>
                    <View style={styles.nameGroup}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.hanja && (
                        <Text style={styles.memberHanja}>({member.hanja})</Text>
                      )}
                      {/* Prominent Life Status Pill */}
                      <View
                        style={[
                          styles.lifePill,
                          { backgroundColor: life.badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.lifePillText,
                            { color: life.badgeTextColor },
                          ]}
                        >
                          {member.isAlive ? `🌿 생존 (${life.ageText})` : `🕯️ 작고 (${life.ageText})`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.badgeGroup}>
                      <View style={styles.genBadge}>
                        <Text style={styles.genBadgeText}>
                          {member.generation}대
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.lineageBadge,
                          { backgroundColor: lineage.badgeColor },
                        ]}
                      >
                        <Text style={styles.lineageBadgeText}>
                          {lineage.shortLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Row 2: Relationship & Clan */}
                  <View style={styles.cardRow2}>
                    <Text style={styles.relationship}>
                      호칭: <Text style={styles.boldText}>{member.relationship}</Text>
                    </Text>
                    {member.clan && (
                      <Text style={styles.clanText}>{member.clan}</Text>
                    )}
                  </View>

                  {/* Kinship Elder Approval Banner on Card if approved */}
                  {(() => {
                    const matchedLink = establishedLinks.find(
                      (l) => (l.personAId === member.id || l.personBId === member.id) && l.status === 'approved'
                    );
                    if (!matchedLink) return null;

                    return (
                      <View style={styles.cardApprovedBanner}>
                        <View style={styles.cardApprovedLeft}>
                          <Text style={styles.cardApprovedBadge}>🛡️ 윗대 어르신 공인</Text>
                          <Text style={styles.cardElderNameText}>
                            확인: {matchedLink.approverElderName || '어르신'} (🌿 생존)
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.cardCertBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setViewingCertLink(matchedLink);
                          }}
                        >
                          <Text style={styles.cardCertBtnText}>📜 증서</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}

                  {/* Row 3: Phone & Birth info */}
                  <View style={styles.cardRow3}>
                    <Text style={styles.infoText}>
                      생년월일: {member.birthDate || '미상'}
                      {member.deathDate ? ` ~ ${member.deathDate}` : ''}
                    </Text>
                    {member.phone ? (
                      <Text style={styles.phoneText}>📞 {member.phone}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Detail Modal with Kinship Links */}
      <MemberDetailModal
        member={selectedMember}
        visible={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        onContactLogged={logContact}
        establishedLinks={establishedLinks}
        onOpenCertificate={(link) => setViewingCertLink(link)}
      />

      {/* Digital Kinship Certificate Modal (家門公認親族證書) */}
      {viewingCertLink && (
        <Modal
          visible={!!viewingCertLink}
          transparent
          animationType="fade"
          onRequestClose={() => setViewingCertLink(null)}
        >
          <View style={styles.certOverlay}>
            <View style={styles.certCard}>
              <View style={styles.certBorderDecoration}>
                <Text style={styles.certHeaderHanja}>家門公認親族證書</Text>
                <Text style={styles.certHeaderKorean}>가문 공인 친족 증서 (윗대 2차 승인 필)</Text>

                <Text style={styles.certNoText}>
                  증서 번호: {viewingCertLink.certificateNo || '족보공인 제 2026-88192호'}
                </Text>

                <View style={styles.certBodyBox}>
                  {(() => {
                    const personA = members.find((m) => m.id === viewingCertLink.personAId);
                    const personB = members.find((m) => m.id === viewingCertLink.personBId);
                    return (
                      <>
                        <View style={styles.certFieldRow}>
                          <Text style={styles.certFieldKey}>등재 친족 :</Text>
                          <Text style={styles.certFieldVal}>{personB?.name || '친족'} ({personB?.hanja || '金氏'})</Text>
                        </View>
                        <View style={styles.certFieldRow}>
                          <Text style={styles.certFieldKey}>결연 상대 :</Text>
                          <Text style={styles.certFieldVal}>{personA?.name || '신청자'} ({personA?.relationship || '친족'})</Text>
                        </View>
                        <View style={styles.certFieldRow}>
                          <Text style={styles.certFieldKey}>결연 관계 :</Text>
                          <Text style={styles.certFieldVal}>
                            {viewingCertLink.relationType === 'parent_child'
                              ? '1촌 부자(父子) / 모녀(母女)'
                              : viewingCertLink.relationType === 'spouse'
                              ? '0촌 부부(夫婦)'
                              : '2촌 동기간(兄弟)'}
                          </Text>
                        </View>
                        <View style={styles.certFieldRow}>
                          <Text style={styles.certFieldKey}>공인 어르신 :</Text>
                          <Text style={[styles.certFieldVal, { color: '#065f46', fontWeight: '900' }]}>
                            {viewingCertLink.approverElderName || '어르신'} (직계 존속, 🌿 생존)
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>

                <Text style={styles.certStatement}>
                  위 사람은 전통 족보 편찬 규약 및 분산 결연 신뢰 프로토콜에 따라,
                  가문 생존 직계 존속 윗대 어르신의 엄정한 신원 확인을 거쳐
                  가문 정식 친족으로 족보에 등재되었음을 공인합니다.
                </Text>

                <View style={styles.certFooterRow}>
                  <Text style={styles.certDateText}>
                    서기 {viewingCertLink.elderApprovedAt || '2026-09-16'}
                  </Text>
                  <View style={styles.certStampBox}>
                    <Text style={styles.certStampText}>宗家{'\n'}公認之印</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.certCloseBtn}
                  onPress={() => setViewingCertLink(null)}
                >
                  <Text style={styles.certCloseBtnText}>확인 및 닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: inkTheme.paper,
  },
  headerArea: {
    backgroundColor: inkTheme.paperDark,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: inkTheme.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: inkTheme.ink0,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: inkTheme.ink4,
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: inkTheme.paper,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: inkTheme.ink4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: inkTheme.ink8,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: inkTheme.ink0,
    borderColor: inkTheme.ink0,
  },
  filterPillActiveAlive: {
    backgroundColor: inkTheme.accentPine,
    borderColor: inkTheme.accentPine,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: inkTheme.ink3,
  },
  filterPillTextActive: {
    color: inkTheme.paper,
  },
  lineageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDeceased: {
    backgroundColor: inkTheme.paperDark,
    opacity: 0.85,
  },
  sideBar: {
    width: 5,
  },
  cardMain: {
    flex: 1,
    padding: 12,
  },
  cardRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 17,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  memberHanja: {
    fontSize: 13,
    color: inkTheme.ink4,
  },
  lifePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lifePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  genBadge: {
    backgroundColor: inkTheme.ink8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: inkTheme.ink2,
  },
  lineageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lineageBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  relationship: {
    fontSize: 13,
    color: inkTheme.ink3,
  },
  boldText: {
    fontWeight: '700',
    color: inkTheme.seal,
  },
  clanText: {
    fontSize: 12,
    color: inkTheme.ink5,
  },
  cardRow3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: inkTheme.ink9,
    paddingTop: 6,
  },
  infoText: {
    fontSize: 11,
    color: inkTheme.ink4,
  },
  phoneText: {
    fontSize: 11,
    color: inkTheme.accentPine,
    fontWeight: '600',
  },
  filterPillActiveApproved: {
    backgroundColor: '#065f46',
    borderColor: '#059669',
  },
  cardApprovedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 6,
  },
  cardApprovedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardApprovedBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardElderNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  cardCertBtn: {
    backgroundColor: '#854d0e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cardCertBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: inkTheme.ink4,
  },

  // Digital Kinship Certificate Modal Styles
  certOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  certCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#faf7ee',
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    borderColor: '#854d0e',
    boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
  },
  certBorderDecoration: {
    borderWidth: 1.5,
    borderColor: '#b45309',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  certHeaderHanja: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: 4,
  },
  certHeaderKorean: {
    fontSize: 12,
    color: '#78350f',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  certNoText: {
    fontSize: 11,
    color: '#78716c',
    marginBottom: 12,
    fontWeight: '600',
  },
  certBodyBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    gap: 6,
  },
  certFieldRow: {
    flexDirection: 'row',
  },
  certFieldKey: {
    width: 90,
    fontSize: 12,
    fontWeight: '700',
    color: '#57534e',
  },
  certFieldVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#1c1917',
  },
  certStatement: {
    fontSize: 11.5,
    color: '#292524',
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 14,
    paddingHorizontal: 8,
  },
  certFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  certDateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#44403c',
  },
  certStampBox: {
    width: 72,
    height: 72,
    borderWidth: 2.5,
    borderColor: '#dc2626',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  certStampText: {
    color: '#dc2626',
    fontWeight: '900',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  certCloseBtn: {
    marginTop: 16,
    backgroundColor: '#78350f',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  certCloseBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  securityHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  securityHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  securityHeaderRoleBadge: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  securityHeaderUser: {
    color: '#cbd5e1',
    fontSize: 11.5,
  },
  securitySwitchBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securitySwitchBtnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
});