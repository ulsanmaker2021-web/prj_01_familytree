import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { LINEAGES, getDaysSinceContact, getLifeStatus } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

interface MemberDetailModalProps {
  member: FamilyMember | null;
  visible: boolean;
  onClose: () => void;
  onContactLogged?: (memberId: string) => void;
  onSelectAsCenter?: (memberId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  visible,
  onClose,
  onContactLogged,
  onSelectAsCenter,
}) => {
  if (!member) return null;

  const lineageInfo = LINEAGES[member.lineage];
  const daysPassed = getDaysSinceContact(member.lastContactDate);
  const lifeStatus = getLifeStatus(member);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.lineageBadge,
                  { backgroundColor: lineageInfo.badgeColor },
                ]}
              >
                <Text style={styles.lineageBadgeText}>
                  {lineageInfo.shortLabel}
                </Text>
              </View>
              <View style={styles.generationBadge}>
                <Text style={styles.generationBadgeText}>
                  {member.generation}대
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Prominent Life Status Banner */}
            <View
              style={[
                styles.lifeStatusBanner,
                { backgroundColor: lifeStatus.badgeBg },
              ]}
            >
              <Text
                style={[
                  styles.lifeStatusText,
                  { color: lifeStatus.badgeTextColor },
                ]}
              >
                {lifeStatus.fullDesc}
              </Text>
            </View>

            {/* Name Section */}
            <View style={styles.titleSection}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{member.name}</Text>
                {member.hanja ? (
                  <Text style={styles.hanja}>({member.hanja})</Text>
                ) : null}
              </View>
              <Text style={styles.relationship}>{member.relationship}</Text>
              {member.clan ? (
                <Text style={styles.clan}>{member.clan}</Text>
              ) : null}
            </View>

            {/* Info Grid */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>생존 / 작고</Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      fontWeight: '800',
                      color: member.isAlive ? inkTheme.accentPine : inkTheme.ink3,
                    },
                  ]}
                >
                  {member.isAlive ? `생존 (${lifeStatus.ageText})` : `작고 (${lifeStatus.ageText})`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>가계 계통</Text>
                <Text style={styles.infoValue}>{lineageInfo.label}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>생년월일</Text>
                <Text style={styles.infoValue}>
                  {member.birthDate || '미상'}
                  {member.deathDate ? ` ~ ${member.deathDate}` : ''}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>성별</Text>
                <Text style={styles.infoValue}>
                  {member.gender === 'M' ? '남성 (男)' : '여성 (女)'}
                </Text>
              </View>
              {member.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>연락처</Text>
                  <Text style={[styles.infoValue, styles.phoneText]}>
                    {member.phone}
                  </Text>
                </View>
              ) : null}
              {member.lastContactDate ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>최근 안부</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      daysPassed > 30 ? styles.alertText : null,
                    ]}
                  >
                    {member.lastContactDate} ({daysPassed}일 전)
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Memo Section */}
            {member.memo ? (
              <View style={styles.memoSection}>
                <Text style={styles.memoLabel}>기록 및 비고</Text>
                <Text style={styles.memoContent}>{member.memo}</Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {onSelectAsCenter ? (
                <TouchableOpacity
                  style={styles.centerActionButton}
                  onPress={() => {
                    onSelectAsCenter(member.id);
                    onClose();
                  }}
                >
                  <Text style={styles.centerActionButtonText}>
                    🎯 이 사람을 중심으로 가계도 재배치
                  </Text>
                </TouchableOpacity>
              ) : null}

              {member.isAlive && member.phone ? (
                <TouchableOpacity
                  style={styles.contactActionButton}
                  onPress={() => {
                    if (onContactLogged) {
                      onContactLogged(member.id);
                    }
                    onClose();
                  }}
                >
                  <Text style={styles.contactActionButtonText}>
                    🌿 오늘 안부 챙김 완료 기록
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 13, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: inkTheme.paper,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    backgroundColor: inkTheme.paperDark,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lineageBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  generationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: inkTheme.ink7,
  },
  generationBadgeText: {
    color: inkTheme.ink1,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: inkTheme.ink8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: inkTheme.ink3,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  lifeStatusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  lifeStatusText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleSection: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  hanja: {
    fontSize: 16,
    color: inkTheme.ink4,
    fontWeight: '500',
  },
  relationship: {
    fontSize: 15,
    fontWeight: '700',
    color: inkTheme.seal,
    marginBottom: 4,
  },
  clan: {
    fontSize: 13,
    color: inkTheme.ink5,
  },
  infoSection: {
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: inkTheme.ink4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: inkTheme.ink1,
    fontWeight: '600',
  },
  phoneText: {
    color: inkTheme.accentPine,
  },
  alertText: {
    color: inkTheme.seal,
    fontWeight: '700',
  },
  memoSection: {
    paddingVertical: 14,
  },
  memoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink4,
    marginBottom: 6,
  },
  memoContent: {
    fontSize: 13,
    color: inkTheme.ink2,
    lineHeight: 20,
    backgroundColor: inkTheme.paperDark,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 10,
    gap: 8,
  },
  centerActionButton: {
    backgroundColor: inkTheme.ink1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkTheme.ink3,
  },
  centerActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  contactActionButton: {
    backgroundColor: inkTheme.accentPine,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});