import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LINEAGES, getDaysSinceContact } from '../utils/mockFamilyData';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { MemberDetailModal } from '../components/MemberDetailModal';
import { FamilyMember, LineageType } from '../types/family';
import { inkTheme } from '../theme/inkTheme';

export default function PataScreen() {
  const { members, logContact } = useFamilyStore();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compute urgent care targets (alive, not me or spouse)
  const careTargets = members
    .filter((m) => m.isAlive && m.id !== 'pat-3-1' && m.id !== 'inlaw-pat-3-1')
    .map((m) => {
      const days = getDaysSinceContact(m.lastContactDate);
      const cycle = m.contactCycleDays || 30;
      return {
        ...m,
        daysPassed: days,
        isOverdue: days >= cycle,
        cycle,
      };
    })
    .sort((a, b) => b.daysPassed - a.daysPassed);

  const overdueCount = careTargets.filter((t) => t.isOverdue).length;

  const handleQuickContact = (member: FamilyMember) => {
    logContact(member.id);
    setToastMessage(`[${member.name}] ${member.relationship}께 안부를 챙겨드렸습니다.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculate lineage care scores
  const lineageScores = (Object.keys(LINEAGES) as LineageType[]).map((key) => {
    const targets = careTargets.filter((t) => t.lineage === key);
    if (targets.length === 0) return { key, score: 100, label: LINEAGES[key].shortLabel };
    const onTime = targets.filter((t) => !t.isOverdue).length;
    const score = Math.round((onTime / targets.length) * 100);
    return {
      key,
      label: LINEAGES[key].shortLabel,
      score,
      color: LINEAGES[key].badgeColor,
    };
  });

  return (
    <View style={styles.container}>
      {/* Toast Banner */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.badgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>打破 · 孝親</Text>
            </View>
            <Text style={styles.heroSubText}>무관심 타파 (無關心 打破) · 친족 안부 챙김</Text>
          </View>

          <Text style={styles.heroTitle}>
            소원해진 친족과의 인연을 잇습니다
          </Text>
          <Text style={styles.heroDesc}>
            바쁜 일상 속에 잊기 쉬운 양가 어르신과 친척분들의 안부를 잊지 않도록
            주기별 알림과 연락 현황을 분석합니다.
          </Text>

          <View style={styles.heroStatsBox}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>안부 요망 친족</Text>
              <Text style={[styles.heroStatVal, { color: inkTheme.seal }]}>
                {overdueCount}명
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>관리 대상 친족</Text>
              <Text style={styles.heroStatVal}>{careTargets.length}명</Text>
            </View>
          </View>
        </View>

        {/* Lineage Care Score Gauges */}
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>4대 계통별 안부 친밀도 지수</Text>
          <View style={styles.scoreRow}>
            {lineageScores.map((item) => (
              <View key={item.key} style={styles.scoreCard}>
                <View
                  style={[
                    styles.scoreRing,
                    { borderColor: item.color },
                  ]}
                >
                  <Text style={[styles.scoreNumber, { color: item.color }]}>
                    {item.score}%
                  </Text>
                </View>
                <Text style={styles.scoreLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Priority Care List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              안부 챙김 추천 목록 ({careTargets.length}명)
            </Text>
            <Text style={styles.sectionNotice}>연락 소원도 순</Text>
          </View>

          {careTargets.map((item) => {
            const lineage = LINEAGES[item.lineage];
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  item.isOverdue && styles.cardOverdue,
                ]}
              >
                <TouchableOpacity
                  style={styles.cardInfo}
                  onPress={() => setSelectedMember(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.name}>{item.name}</Text>
                      {item.hanja && (
                        <Text style={styles.hanja}>({item.hanja})</Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.lineagePill,
                        { backgroundColor: lineage.badgeColor },
                      ]}
                    >
                      <Text style={styles.lineagePillText}>
                        {lineage.shortLabel}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.relationship}>
                    호칭: <Text style={styles.boldText}>{item.relationship}</Text>
                  </Text>

                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.daysText,
                        item.isOverdue ? styles.overdueDays : styles.normalDays,
                      ]}
                    >
                      마지막 연락: {item.daysPassed}일 전 (권장 {item.cycle}일)
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    item.isOverdue && styles.actionBtnOverdue,
                  ]}
                  onPress={() => handleQuickContact(item)}
                >
                  <Text style={styles.actionBtnText}>
                    {item.isOverdue ? '⚠️ 안부 전하기' : '✓ 안부 완료'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
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
  toast: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 999,
    backgroundColor: inkTheme.accentPine,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: inkTheme.paperDark,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: inkTheme.seal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  heroBadgeText: {
    color: inkTheme.paper,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroSubText: {
    fontSize: 12,
    color: inkTheme.ink4,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: inkTheme.ink0,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: inkTheme.ink3,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroStatsBox: {
    flexDirection: 'row',
    backgroundColor: inkTheme.paper,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 11,
    color: inkTheme.ink4,
    marginBottom: 2,
  },
  heroStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: inkTheme.ink8,
  },
  scoreSection: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: inkTheme.ink0,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  scoreRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: inkTheme.ink2,
  },
  listSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionNotice: {
    fontSize: 11,
    color: inkTheme.ink5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardOverdue: {
    borderColor: inkTheme.seal,
    borderLeftWidth: 4,
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  hanja: {
    fontSize: 12,
    color: inkTheme.ink4,
  },
  lineagePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lineagePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  relationship: {
    fontSize: 12,
    color: inkTheme.ink3,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
    color: inkTheme.ink0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 11,
    fontWeight: '600',
  },
  overdueDays: {
    color: inkTheme.seal,
    fontWeight: '700',
  },
  normalDays: {
    color: inkTheme.accentPine,
  },
  actionBtn: {
    backgroundColor: inkTheme.paperDark,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionBtnOverdue: {
    backgroundColor: inkTheme.seal,
    borderColor: inkTheme.seal,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink1,
  },
});