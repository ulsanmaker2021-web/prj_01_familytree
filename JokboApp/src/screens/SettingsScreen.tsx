import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { LINEAGES } from '../utils/mockFamilyData';
import { LineageType } from '../types/family';
import { inkTheme } from '../theme/inkTheme';

export default function SettingsScreen() {
  const { members, resetData } = useFamilyStore();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleReset = () => {
    resetData();
    setStatusMsg('3대 4계통 가상 족보 데이터가 기본 상태로 복원되었습니다.');
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const totalCount = members.length;
  const aliveCount = members.filter((m) => m.isAlive).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Notification */}
      {statusMsg && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{statusMsg}</Text>
        </View>
      )}

      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.sealBadge}>
          <Text style={styles.sealBadgeText}>환경 설정</Text>
        </View>
        <Text style={styles.title}>족보 환경 및 데이터 관리</Text>
        <Text style={styles.subtitle}>
          가계 데이터 초기화, 수묵화 테마 구성 및 동기화 상태를 확인합니다.
        </Text>
      </View>

      {/* Family Tree Data Overview Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 가계 데이터 통계 요약</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>총 가계 구성원</Text>
            <Text style={styles.statVal}>{totalCount}명</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>생존 친족 / 작고 어르신</Text>
            <Text style={styles.statVal}>
              {aliveCount}명 / {totalCount - aliveCount}명
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statKey}>등록된 세대 범위</Text>
            <Text style={styles.statVal}>1대(조부모) ~ 4대(자녀)</Text>
          </View>

          <View style={styles.divider} />

          {/* Lineage Breakdown */}
          <Text style={styles.subTitle}>4대 계통별 등록 인원</Text>
          {(Object.keys(LINEAGES) as LineageType[]).map((key) => {
            const count = members.filter((m) => m.lineage === key).length;
            const info = LINEAGES[key];
            return (
              <View key={key} style={styles.lineageStatRow}>
                <View style={styles.lineageTag}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: info.badgeColor },
                    ]}
                  />
                  <Text style={styles.lineageLabel}>{info.label}</Text>
                </View>
                <Text style={styles.lineageCount}>{count}명</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Data Management Action Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛠️ 테스트 데이터 관리</Text>
        <View style={styles.actionCard}>
          <Text style={styles.actionDesc}>
            가상으로 생성된 3대 가족(친가·외가·사돈친가·사돈외가 22명)의 안부 기록을
            초기 상태로 되돌립니다.
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>
              🔄 3대 가상 족보 데이터 초기화
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Palette Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 전통 수묵화 테마 토큰</Text>
        <View style={styles.paletteCard}>
          <Text style={styles.paletteDesc}>
            조선 왕실 족보 및 전통 한지·먹빛 감성을 반영한 색상 팔레트가 적용되어 있습니다.
          </Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorChip, { backgroundColor: inkTheme.paper }]}>
              <Text style={styles.colorChipText}>한지(Paper)</Text>
            </View>
            <View style={[styles.colorChip, { backgroundColor: inkTheme.ink0 }]}>
              <Text style={[styles.colorChipText, { color: '#fff' }]}>먹빛(Ink)</Text>
            </View>
            <View style={[styles.colorChip, { backgroundColor: inkTheme.seal }]}>
              <Text style={[styles.colorChipText, { color: '#fff' }]}>낙관(Seal)</Text>
            </View>
            <View
              style={[styles.colorChip, { backgroundColor: inkTheme.accentPine }]}
            >
              <Text style={[styles.colorChipText, { color: '#fff' }]}>송죽(Pine)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Engine & Security Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 보안 및 데이터베이스 환경</Text>
        <View style={styles.techCard}>
          <View style={styles.techRow}>
            <Text style={styles.techKey}>로컬 DB (SQLCipher)</Text>
            <Text style={styles.techVal}>@op-engineering/op-sqlite</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techKey}>ORM 모델</Text>
            <Text style={styles.techVal}>Drizzle-ORM</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techKey}>키체인 보안</Text>
            <Text style={styles.techVal}>react-native-keychain</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techKey}>클라우드 저장소</Text>
            <Text style={styles.techVal}>@supabase/supabase-js</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: inkTheme.paper,
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  toast: {
    backgroundColor: inkTheme.accentPine,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 14,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  banner: {
    backgroundColor: inkTheme.paperDark,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
    alignItems: 'center',
  },
  sealBadge: {
    backgroundColor: inkTheme.ink2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 10,
  },
  sealBadgeText: {
    color: inkTheme.paper,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: inkTheme.ink0,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: inkTheme.ink4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: inkTheme.ink0,
    marginBottom: 10,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statKey: {
    fontSize: 13,
    color: inkTheme.ink3,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: inkTheme.ink0,
  },
  divider: {
    height: 1,
    backgroundColor: inkTheme.ink8,
    marginVertical: 10,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink4,
    marginBottom: 8,
  },
  lineageStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lineageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineageLabel: {
    fontSize: 13,
    color: inkTheme.ink2,
  },
  lineageCount: {
    fontSize: 13,
    fontWeight: '700',
    color: inkTheme.ink0,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
  },
  actionDesc: {
    fontSize: 13,
    color: inkTheme.ink3,
    lineHeight: 18,
    marginBottom: 14,
  },
  resetButton: {
    backgroundColor: inkTheme.seal,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  paletteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
  },
  paletteDesc: {
    fontSize: 12,
    color: inkTheme.ink4,
    marginBottom: 12,
    lineHeight: 18,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  colorChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: inkTheme.ink1,
  },
  techCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  techKey: {
    fontSize: 12,
    color: inkTheme.ink4,
  },
  techVal: {
    fontSize: 12,
    fontWeight: '600',
    color: inkTheme.ink1,
  },
});