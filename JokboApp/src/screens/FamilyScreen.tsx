import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FamilyMember, LineageType } from '../types/family';
import { LINEAGES, getLifeStatus } from '../utils/mockFamilyData';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { inkTheme } from '../theme/inkTheme';

export default function FamilyScreen() {
  const { members, logContact } = useFamilyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineage, setSelectedLineage] = useState<LineageType | 'all'>('all');
  const [aliveOnly, setAliveOnly] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedLineage !== 'all' && m.lineage !== selectedLineage) {
        return false;
      }
      if (aliveOnly && !m.isAlive) {
        return false;
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
  }, [members, selectedLineage, aliveOnly, searchQuery]);

  const totalCount = members.length;
  const aliveCount = members.filter((m) => m.isAlive).length;

  return (
    <View style={styles.container}>
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

      {/* Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        visible={selectedMember !== null}
        onClose={() => setSelectedMember(null)}
        onContactLogged={logContact}
      />
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
});