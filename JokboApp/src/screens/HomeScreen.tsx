import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FamilyMember, LineageType } from '../types/family';
import { LINEAGES } from '../utils/mockFamilyData';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { inkTheme } from '../theme/inkTheme';

type FilterTab = 'all' | LineageType;

export default function HomeScreen() {
  const { members, logContact } = useFamilyStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null
  );

  const filteredMembers =
    activeTab === 'all'
      ? members
      : members.filter((m) => m.lineage === activeTab);

  // Group by generation (1: 조부모, 2: 부모/사돈, 3: 본인/배우자, 4: 자녀)
  const generations = [1, 2, 3, 4];
  const generationLabels: Record<number, { title: string; subtitle: string }> = {
    1: { title: '1대 (一世)', subtitle: '조부모 및 사돈 어르신 세대' },
    2: { title: '2대 (二世)', subtitle: '부모 및 백숙부·외숙·사돈 세대' },
    3: { title: '3대 (三世)', subtitle: '본인 및 배우자·형제·처남 세대' },
    4: { title: '4대 (四世)', subtitle: '자녀 세대' },
  };

  return (
    <View style={styles.container}>
      {/* Top Lineage Filter Tabs */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'all' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.tabTextActive,
              ]}
            >
              전체 계보
            </Text>
          </TouchableOpacity>

          {(Object.keys(LINEAGES) as LineageType[]).map((key) => {
            const info = LINEAGES[key];
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(key)}
              >
                <View
                  style={[
                    styles.tabDot,
                    { backgroundColor: info.badgeColor },
                  ]}
                />
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {info.shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Info */}
        <View style={styles.banner}>
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerTitle}>
              {activeTab === 'all'
                ? '3대 4계통 통합 가계도'
                : LINEAGES[activeTab].label}
            </Text>
            <View style={styles.sealBadge}>
              <Text style={styles.sealBadgeText}>族譜</Text>
            </View>
          </View>
          <Text style={styles.bannerDesc}>
            {activeTab === 'all'
              ? '친가(부친) · 외가(모친) · 사돈댁 친가 · 사돈댁 외가의 계통과 뿌리'
              : `${LINEAGES[activeTab].clan} — ${LINEAGES[activeTab].description}`}
          </Text>
        </View>

        {/* Generational Tree Sections */}
        {generations.map((gen) => {
          const genMembers = filteredMembers.filter(
            (m) => m.generation === gen
          );
          if (genMembers.length === 0) return null;

          const genInfo = generationLabels[gen];

          return (
            <View key={gen} style={styles.generationSection}>
              {/* Generation Header */}
              <View style={styles.genHeader}>
                <View style={styles.genLine} />
                <View style={styles.genPill}>
                  <Text style={styles.genPillTitle}>{genInfo.title}</Text>
                  <Text style={styles.genPillSubtitle}>
                    {genInfo.subtitle}
                  </Text>
                </View>
                <View style={styles.genLine} />
              </View>

              {/* Member Cards Grid */}
              <View style={styles.cardsGrid}>
                {genMembers.map((member) => {
                  const lineage = LINEAGES[member.lineage];
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberCard,
                        !member.isAlive && styles.deceasedCard,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedMember(member)}
                    >
                      {/* Card Lineage Badge */}
                      <View style={styles.cardTopRow}>
                        <View
                          style={[
                            styles.cardLineageBadge,
                            { backgroundColor: lineage.badgeColor },
                          ]}
                        >
                          <Text style={styles.cardLineageText}>
                            {lineage.shortLabel}
                          </Text>
                        </View>
                        {!member.isAlive && (
                          <Text style={styles.deceasedText}>[作故]</Text>
                        )}
                      </View>

                      {/* Name & Hanja */}
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.hanja && (
                        <Text style={styles.memberHanja}>{member.hanja}</Text>
                      )}

                      {/* Relationship Pill */}
                      <View style={styles.relationshipBox}>
                        <Text style={styles.relationshipText} numberOfLines={1}>
                          {member.relationship}
                        </Text>
                      </View>

                      {/* Birth / Clan */}
                      <Text style={styles.cardSubText} numberOfLines={1}>
                        {member.clan || '본관 미상'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Tree Legend */}
        <View style={styles.legendBox}>
          <Text style={styles.legendTitle}>계통 구분 범례</Text>
          <View style={styles.legendItems}>
            {(Object.keys(LINEAGES) as LineageType[]).map((key) => {
              const info = LINEAGES[key];
              return (
                <View key={key} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: info.badgeColor },
                    ]}
                  />
                  <Text style={styles.legendText}>{info.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Member Detail Modal */}
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
  tabBarContainer: {
    backgroundColor: inkTheme.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: inkTheme.ink0,
    borderColor: inkTheme.ink0,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: inkTheme.ink3,
  },
  tabTextActive: {
    color: inkTheme.paper,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: inkTheme.paperDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  sealBadge: {
    backgroundColor: inkTheme.seal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sealBadgeText: {
    color: inkTheme.paper,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bannerDesc: {
    fontSize: 13,
    color: inkTheme.ink4,
    lineHeight: 18,
  },
  generationSection: {
    marginBottom: 24,
  },
  genHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  genLine: {
    flex: 1,
    height: 1,
    backgroundColor: inkTheme.ink7,
  },
  genPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: inkTheme.paperDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  genPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: inkTheme.ink1,
  },
  genPillSubtitle: {
    fontSize: 10,
    color: inkTheme.ink5,
    marginTop: 2,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  memberCard: {
    width: '47%',
    minWidth: 150,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  deceasedCard: {
    backgroundColor: inkTheme.paperDark,
    borderColor: inkTheme.ink8,
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLineageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardLineageText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  deceasedText: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink4,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '800',
    color: inkTheme.ink0,
    marginBottom: 2,
  },
  memberHanja: {
    fontSize: 12,
    color: inkTheme.ink4,
    marginBottom: 8,
  },
  relationshipBox: {
    backgroundColor: inkTheme.paperDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    alignItems: 'center',
  },
  relationshipText: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.seal,
  },
  cardSubText: {
    fontSize: 11,
    color: inkTheme.ink5,
  },
  legendBox: {
    marginTop: 10,
    padding: 16,
    backgroundColor: inkTheme.paperDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink3,
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: inkTheme.ink2,
  },
});