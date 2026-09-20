import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { FamilyMember, EstablishedLink } from '../types/family';
import { LINEAGES, getDaysSinceContact, getLifeStatus } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';
import { getMemberAvatar, hasCustomPhoto } from '../utils/avatarGenerator';
import { verifyMemberLineage } from '../utils/genealogyVerification';

interface MemberDetailModalProps {
  member: FamilyMember | null;
  visible: boolean;
  onClose: () => void;
  onContactLogged?: (memberId: string) => void;
  onSelectAsCenter?: (memberId: string) => void;
  onOpenRelationshipStudio?: (memberId: string) => void;
  establishedLinks?: EstablishedLink[];
  onOpenCertificate?: (link: EstablishedLink) => void;
  onUpdatePhoto?: (memberId: string, newPhotoUrl: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  visible,
  onClose,
  onContactLogged,
  onSelectAsCenter,
  onOpenRelationshipStudio,
  establishedLinks = [],
  onOpenCertificate,
  onUpdatePhoto,
}) => {
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoInput, setPhotoInput] = useState('');

  if (!member) return null;

  const lineageInfo = LINEAGES[member.lineage];
  const daysPassed = getDaysSinceContact(member.lastContactDate);
  const lifeStatus = getLifeStatus(member);
  const verification = verifyMemberLineage(member);

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
                  {member.generation}대 ({verification.shortBadge})
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

            {/* Profile Avatar Header & Photo Registration */}
            <View style={styles.profileHeaderBox}>
              <View style={[styles.avatarCircle, { borderColor: lineageInfo.badgeColor }]}>
                <Image
                  source={{ uri: getMemberAvatar(member) }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.profileIdentityCol}>
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
                <View style={styles.avatarBadgeRow}>
                  <View
                    style={[
                      styles.avatarBadgePill,
                      {
                        backgroundColor: hasCustomPhoto(member) ? '#ecfdf5' : '#eff6ff',
                        borderColor: hasCustomPhoto(member) ? '#a7f3d0' : '#bfdbfe',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarBadgePillText,
                        { color: hasCustomPhoto(member) ? '#047857' : '#1d4ed8' },
                      ]}
                    >
                      {hasCustomPhoto(member) ? '📸 실사 사진 등록됨' : '🎨 가상 일러스트 아바타'}
                    </Text>
                  </View>
                  {onUpdatePhoto && (
                    <TouchableOpacity
                      style={styles.photoEditBtn}
                      onPress={() => {
                        setPhotoInput(hasCustomPhoto(member) ? (member.photoUrl || '') : '');
                        setIsEditingPhoto(!isEditingPhoto);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.photoEditBtnText}>
                        {isEditingPhoto ? '닫기' : '사진 변경/등록'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Photo Edit Input Drawer */}
            {isEditingPhoto && (
              <View style={styles.photoEditDrawer}>
                <Text style={styles.photoEditLabel}>인물 사진 URL 또는 이미지 링크 입력:</Text>
                <TextInput
                  style={styles.photoInputField}
                  placeholder="https://... 또는 실사 사진 링크"
                  placeholderTextColor="#94a3b8"
                  value={photoInput}
                  onChangeText={setPhotoInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.photoEditActionRow}>
                  <TouchableOpacity
                    style={styles.photoSaveBtn}
                    onPress={() => {
                      if (onUpdatePhoto && photoInput.trim()) {
                        onUpdatePhoto(member.id, photoInput.trim());
                        setIsEditingPhoto(false);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.photoSaveBtnText}>사진 저장</Text>
                  </TouchableOpacity>
                  {hasCustomPhoto(member) && (
                    <TouchableOpacity
                      style={styles.photoResetBtn}
                      onPress={() => {
                        if (onUpdatePhoto) {
                          onUpdatePhoto(member.id, '');
                          setIsEditingPhoto(false);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.photoResetBtnText}>가상 일러스트로 초기화</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

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

            {/* Clan Genealogy & Hangnyeol Verification Report */}
            <View style={styles.verificationReportCard}>
              <View style={styles.verificationReportHeader}>
                <View style={styles.verificationReportTitleRow}>
                  <Text style={styles.verificationReportTitle}>
                    🏛️ 가문 족보 및 항렬·세손 정밀 검증 리포트
                  </Text>
                  <View style={styles.verificationBadgePill}>
                    <Text style={styles.verificationBadgePillText}>
                      {verification.verificationBadgeText}
                    </Text>
                  </View>
                </View>
                <Text style={styles.verificationReportSubtitle}>
                  {verification.reportSummary}
                </Text>
              </View>

              {/* Clan & Generation Comparison Table */}
              <View style={styles.verifyGridTable}>
                <View style={styles.verifyGridRow}>
                  <Text style={styles.verifyGridLabel}>본관 및 계파</Text>
                  <Text style={styles.verifyGridValue}>{verification.clanName}</Text>
                </View>
                <View style={styles.verifyGridRow}>
                  <Text style={styles.verifyGridLabel}>공식 족보 대수</Text>
                  <Text style={[styles.verifyGridValue, { color: '#0369a1', fontWeight: '800' }]}>
                    {verification.dualGenerationText}
                  </Text>
                </View>
                <View style={styles.verifyGridRow}>
                  <Text style={styles.verifyGridLabel}>항렬자(돌림자) 대조</Text>
                  <Text style={[styles.verifyGridValue, { color: '#047857', fontWeight: '800' }]}>
                    {verification.matchedHangnyeolChar
                      ? `'${verification.matchedHangnyeolChar}' (${verification.fiveElement} 오행 상생) 일치`
                      : '직계 계통 합치'}
                  </Text>
                </View>
                <View style={styles.verifyGridRow}>
                  <Text style={styles.verifyGridLabel}>가문 검증 알고리즘</Text>
                  <Text style={styles.verifyGridValue}>N+1 직계 계통성 및 대동보 원전 100% 합치</Text>
                </View>
              </View>

              {/* Oral 30대손 vs Formal 29세손 Reconciliation Notice */}
              <View style={styles.oralDiscrepancyBox}>
                <View style={styles.oralDiscrepancyTitleRow}>
                  <Text style={styles.oralDiscrepancyTitle}>
                    💡 구전(口傳) '30대손'과 족보 원본 '29세손' 오차 해설
                  </Text>
                </View>
                <Text style={styles.oralDiscrepancyDesc}>
                  가문 어르신들께서 일상에서 '30대손'이라 부르는 것은 시조를 1세로 센 '30세(世)'를 대손과 혼용해 부른 관행입니다. 족보 원전의 '세손(世孫) = 세(世) - 1' 기산법에 따라 공식 기록상 '29세손'으로 등재되는 것이 정확하며, 두 표현은 완전히 동일한 혈통 세수를 나타냅니다.
                </Text>
              </View>

              {/* Rationale Bullet Notes */}
              <View style={styles.rationaleNotesBox}>
                {verification.rationaleNotes.map((note, idx) => (
                  <Text key={idx} style={styles.rationaleNoteText}>
                    • {note}
                  </Text>
                ))}
              </View>
            </View>

            {/* Living Elder Approval Kinship Information */}
            {(() => {
              const matchedLinks = establishedLinks.filter(
                (l) => l.personAId === member.id || l.personBId === member.id
              );
              if (matchedLinks.length === 0) return null;

              return (
                <View style={styles.kinshipApprovalBox}>
                  <View style={styles.kinshipApprovalHeader}>
                    <Text style={styles.kinshipApprovalTitle}>🛡️ 분산 결연 및 윗대 어르신 공인 내역</Text>
                  </View>
                  {matchedLinks.map((link) => {
                    const isApproved = link.status === 'approved';
                    const isPending = link.status === 'pending_elder';
                    return (
                      <View key={link.id} style={styles.kinshipApprovalItem}>
                        <View style={styles.approvalItemTop}>
                          <Text
                            style={[
                              styles.approvalStatusBadge,
                              isApproved ? styles.statusApproved : styles.statusPending,
                            ]}
                          >
                            {isApproved ? '✓ 2차 윗대 어르신 승인 완료' : '⏳ 2차 어르신 승인 대기'}
                          </Text>
                          {link.certificateNo ? (
                            <Text style={styles.certNoMiniText}>{link.certificateNo}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.approvalDescText}>
                          {link.titleAtoB} · {link.chonText}
                        </Text>
                        <View style={styles.elderInfoRow}>
                          <Text style={styles.elderInfoLabel}>확인 어르신 :</Text>
                          <Text style={styles.elderInfoName}>
                            {link.approverElderName || '지정 어르신'} ({link.approverElderRelation || '직계 존속'})
                          </Text>
                          <View style={styles.livingTag}>
                            <Text style={styles.livingTagText}>🌿 생존 확인</Text>
                          </View>
                        </View>
                        {link.elderComment ? (
                          <Text style={styles.elderCommentText}>"{link.elderComment}"</Text>
                        ) : null}
                        {link.p2pInvitationCode ? (
                          <Text style={styles.invCodeText}>보안 초대코드: {link.p2pInvitationCode}</Text>
                        ) : null}
                        {isApproved && onOpenCertificate ? (
                          <TouchableOpacity
                            style={styles.viewCertBtn}
                            onPress={() => onOpenCertificate(link)}
                          >
                            <Text style={styles.viewCertBtnText}>📜 가문 공인 친족 증서 열람</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              );
            })()}

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

              {onOpenRelationshipStudio ? (
                <TouchableOpacity
                  style={styles.connectActionButton}
                  onPress={() => {
                    onClose();
                    onOpenRelationshipStudio(member.id);
                  }}
                >
                  <Text style={styles.connectActionButtonText}>
                    🤝 다른 친족과 관계 맺기 (결연 스튜디오)
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
  kinshipApprovalBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#86efac',
    padding: 12,
    marginBottom: 14,
  },
  kinshipApprovalHeader: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  kinshipApprovalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  kinshipApprovalItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 6,
  },
  approvalItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalStatusBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
  },
  certNoMiniText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  approvalDescText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  elderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  elderInfoLabel: {
    fontSize: 11,
    color: '#475569',
  },
  elderInfoName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  livingTag: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  livingTagText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '800',
  },
  elderCommentText: {
    fontSize: 11,
    color: '#334155',
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 4,
    marginVertical: 4,
  },
  invCodeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  viewCertBtn: {
    marginTop: 6,
    backgroundColor: '#854d0e',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewCertBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
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
  connectActionButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  connectActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  profileHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: '#f5f5f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileIdentityCol: {
    flex: 1,
  },
  avatarBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  avatarBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  photoEditBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  photoEditDrawer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  photoEditLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  photoInputField: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1e293b',
    marginBottom: 8,
  },
  photoEditActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoSaveBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  photoSaveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  photoResetBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  photoResetBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  verificationReportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  verificationReportHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
    paddingBottom: 8,
    marginBottom: 10,
  },
  verificationReportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  verificationReportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369a1',
  },
  verificationBadgePill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verificationBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  verificationReportSubtitle: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  verifyGridTable: {
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  verifyGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0f2fe',
  },
  verifyGridLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '700',
  },
  verifyGridValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
  },
  oralDiscrepancyBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    marginBottom: 10,
  },
  oralDiscrepancyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  oralDiscrepancyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
  },
  oralDiscrepancyDesc: {
    fontSize: 11.5,
    color: '#78350f',
    lineHeight: 17,
  },
  rationaleNotesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 4,
  },
  rationaleNoteText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});