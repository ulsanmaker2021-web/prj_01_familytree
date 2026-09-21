import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SmartKinshipRequest } from '../types/family';
import { inkTheme } from '../theme/inkTheme';
import { formatPhoneNumber } from '../utils/securityAuth';

interface SmartKinshipInspectionModalProps {
  visible: boolean;
  request: SmartKinshipRequest | null;
  myFatherName?: string;
  myMotherName?: string;
  myClan?: string;
  onClose: () => void;
  onApprove: (requestId: string) => { success: boolean; message: string; certificateNo?: string };
  onReject: (requestId: string, reason?: string) => { success: boolean; message: string };
}

export const SmartKinshipInspectionModal: React.FC<SmartKinshipInspectionModalProps> = ({
  visible,
  request,
  myFatherName,
  myMotherName,
  myClan,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; isSuccess: boolean } | null>(null);

  if (!request) return null;

  const reqFather = request.senderFatherName || '미입력';
  const reqMother = request.senderMotherName || '미입력';
  const currentFather = myFatherName || '미입력';
  const currentMother = myMotherName || '미입력';

  const fatherMatches =
    Boolean(request.senderFatherName) &&
    Boolean(myFatherName) &&
    request.senderFatherName?.trim() === myFatherName?.trim();

  const motherMatches =
    Boolean(request.senderMotherName) &&
    Boolean(myMotherName) &&
    request.senderMotherName?.trim() === myMotherName?.trim();

  const isFullMatch = fatherMatches && motherMatches;
  const isPartialMatch = (fatherMatches && !motherMatches) || (!fatherMatches && motherMatches);

  const handleApprove = () => {
    const res = onApprove(request.id);
    if (res.success) {
      setActionNotice({ message: res.message, isSuccess: true });
      setTimeout(() => {
        setActionNotice(null);
        onClose();
      }, 1800);
    }
  };

  const handleReject = () => {
    const res = onReject(request.id, '친족 정보 불일치');
    if (res.success) {
      setActionNotice({ message: res.message, isSuccess: false });
      setTimeout(() => {
        setActionNotice(null);
        setRejectMode(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerBadgeRow}>
                <View style={styles.reqBadge}>
                  <Text style={styles.reqBadgeText}>🔔 형제 결연 신청 도착</Text>
                </View>
                <Text style={styles.dateText}>{request.createdAt}</Text>
              </View>
              <Text style={styles.headerTitle}>
                {request.senderName}님의 친형제 결연 및 가계도 통합 신청
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Action Notice Alert */}
          {actionNotice && (
            <View
              style={[
                styles.noticeBanner,
                actionNotice.isSuccess ? styles.noticeSuccess : styles.noticeError,
              ]}
            >
              <Text
                style={[
                  styles.noticeText,
                  actionNotice.isSuccess ? styles.noticeTextSuccess : styles.noticeTextError,
                ]}
              >
                {actionNotice.message}
              </Text>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. 신청인 기본 정보 카드 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>👤 결연 신청인 프로필</Text>
              <View style={styles.gridTable}>
                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>성명 (이름)</Text>
                  <Text style={styles.gridValBold}>{request.senderName}</Text>
                </View>
                <View style={styles.gridRow}>
                  <Text style={styles.gridLabel}>휴대전화 번호</Text>
                  <Text style={styles.gridVal}>{formatPhoneNumber(request.senderPhone)}</Text>
                </View>
                {request.senderBirthDate ? (
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>생년월일</Text>
                    <Text style={styles.gridVal}>{request.senderBirthDate}</Text>
                  </View>
                ) : null}
                {request.senderClan ? (
                  <View style={styles.gridRow}>
                    <Text style={styles.gridLabel}>가문 본관</Text>
                    <Text style={styles.gridVal}>{request.senderClan}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 2. 스마트 부모 정보 1:1 대조 및 일치 검증 리포트 */}
            <View style={styles.sectionCard}>
              <View style={styles.comparisonHeaderRow}>
                <Text style={styles.sectionTitle}>🧬 부모 정보 1:1 정밀 대조 리포트</Text>
                <View
                  style={[
                    styles.matchScoreBadge,
                    isFullMatch
                      ? styles.scoreFull
                      : isPartialMatch
                      ? styles.scorePartial
                      : styles.scoreReview,
                  ]}
                >
                  <Text
                    style={[
                      styles.matchScoreText,
                      isFullMatch
                        ? styles.scoreTextFull
                        : isPartialMatch
                        ? styles.scoreTextPartial
                        : styles.scoreTextReview,
                    ]}
                  >
                    {isFullMatch
                      ? '✓ 부모 100% 일치'
                      : isPartialMatch
                      ? '⚡ 부모 부분 일치'
                      : '🔍 확인 후 승인'}
                  </Text>
                </View>
              </View>

              <View style={styles.tableBox}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.colHeader, { flex: 1.1 }]}>구분</Text>
                  <Text style={[styles.colHeader, { flex: 2 }]}>신청인이 등록한 정보</Text>
                  <Text style={[styles.colHeader, { flex: 2 }]}>내 가계도 부모 정보</Text>
                  <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>일치 여부</Text>
                </View>

                {/* 아버지 대조 */}
                <View style={styles.tableRow}>
                  <Text style={[styles.rowLabel, { flex: 1.1 }]}>부 (아버지)</Text>
                  <Text style={[styles.rowVal, { flex: 2 }]}>{reqFather}</Text>
                  <Text style={[styles.rowVal, { flex: 2 }]}>{currentFather}</Text>
                  <View style={[styles.matchStatusWrap, { flex: 1.2 }]}>
                    {fatherMatches ? (
                      <Text style={styles.matchTagSuccess}>🟢 100% 일치</Text>
                    ) : (
                      <Text style={styles.matchTagMismatch}>⚠️ 상이 / 확인요망</Text>
                    )}
                  </View>
                </View>

                {/* 어머니 대조 */}
                <View style={styles.tableRow}>
                  <Text style={[styles.rowLabel, { flex: 1.1 }]}>모 (어머니)</Text>
                  <Text style={[styles.rowVal, { flex: 2 }]}>{reqMother}</Text>
                  <Text style={[styles.rowVal, { flex: 2 }]}>{currentMother}</Text>
                  <View style={[styles.matchStatusWrap, { flex: 1.2 }]}>
                    {motherMatches ? (
                      <Text style={styles.matchTagSuccess}>🟢 100% 일치</Text>
                    ) : (
                      <Text style={styles.matchTagMismatch}>⚠️ 상이 / 확인요망</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* 검증 결과 종합 판정 박스 */}
              <View
                style={[
                  styles.verdictBox,
                  isFullMatch
                    ? styles.verdictFull
                    : isPartialMatch
                    ? styles.verdictPartial
                    : styles.verdictReview,
                ]}
              >
                <Text style={styles.verdictTitle}>
                  {isFullMatch
                    ? '🛡️ [자동 검증 통과] 직계 동복(同腹) 친형제 관계 입증'
                    : isPartialMatch
                    ? '💡 [부분 일치] 부모 한 분의 성함이 일치합니다.'
                    : '📋 [본인 확인 필요] 입력된 부모 정보를 확인하고 결연을 승인하세요.'}
                </Text>
                <Text style={styles.verdictDesc}>
                  {isFullMatch
                    ? '양측이 등록한 아버지와 어머니 성함이 완벽히 일치합니다. 승인 시 두 사람의 부모 노드가 하나로 단일화(Merge)되며, 서로의 가계도에 친형제(2촌)로 나란히 편입됩니다.'
                    : '등록된 정보가 실제 가족 관계가 맞는지 검토 후 승인해주세요. 승인하시면 부모 노드가 통합되고 형제로 가계도가 확장됩니다.'}
                </Text>
              </View>
            </View>

            {/* 3. 승인 시 가계도 변경 안내 */}
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>🌟 승인 시 가계도 자동 반영 안내</Text>
              <Text style={styles.guideBullet}>
                • 중복 등록되었던 부모 노드가 하나로 자동 통합(단일화)됩니다.
              </Text>
              <Text style={styles.guideBullet}>
                • {request.senderName}님이 본인의 형제 노드로 나란히 배치되어 동일한 부모 라인을 공유합니다.
              </Text>
              <Text style={styles.guideBullet}>
                • 공인 친족 증서(제2026-B호)가 발행되어 양측 스마트폰에 동시 보관됩니다.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {!rejectMode ? (
              <View style={styles.footerActionRow}>
                <TouchableOpacity
                  style={styles.rejectTriggerBtn}
                  onPress={() => setRejectMode(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rejectTriggerBtnText}>반려 (불일치)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={handleApprove}
                  activeOpacity={0.8}
                >
                  <Text style={styles.approveBtnText}>
                    🤝 친형제 결연 승인 및 가계도 통합
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rejectConfirmRow}>
                <Text style={styles.rejectNoticeText}>
                  정말 본 결연 신청을 반려하시겠습니까?
                </Text>
                <View style={styles.rejectBtnGroup}>
                  <TouchableOpacity
                    style={styles.rejectCancelBtn}
                    onPress={() => setRejectMode(false)}
                  >
                    <Text style={styles.rejectCancelBtnText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectConfirmBtn}
                    onPress={handleReject}
                  >
                    <Text style={styles.rejectConfirmBtnText}>반려 확정</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  container: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: inkTheme.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reqBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reqBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  dateText: {
    fontSize: 11,
    color: inkTheme.ink4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: inkTheme.ink1,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  noticeBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  noticeSuccess: {
    backgroundColor: '#ecfdf5',
    borderBottomColor: '#a7f3d0',
  },
  noticeError: {
    backgroundColor: '#fef2f2',
    borderBottomColor: '#fecaca',
  },
  noticeText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  noticeTextSuccess: {
    color: '#065f46',
  },
  noticeTextError: {
    color: '#991b1b',
  },
  body: {
    padding: 18,
  },
  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: inkTheme.ink1,
    marginBottom: 10,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreFull: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  scorePartial: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde047',
  },
  scoreReview: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scoreTextFull: {
    color: '#15803d',
  },
  scoreTextPartial: {
    color: '#a16207',
  },
  scoreTextReview: {
    color: '#475569',
  },
  gridTable: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  gridLabel: {
    width: 110,
    fontSize: 12.5,
    color: inkTheme.ink3,
    fontWeight: '600',
  },
  gridVal: {
    flex: 1,
    fontSize: 12.5,
    color: inkTheme.ink1,
  },
  gridValBold: {
    flex: 1,
    fontSize: 13,
    color: inkTheme.ink1,
    fontWeight: '800',
  },
  tableBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink2,
  },
  rowVal: {
    fontSize: 12,
    color: inkTheme.ink1,
    fontWeight: '600',
  },
  matchStatusWrap: {
    alignItems: 'center',
  },
  matchTagSuccess: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  matchTagMismatch: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  verdictBox: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  verdictFull: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  verdictPartial: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
  },
  verdictReview: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  verdictTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#14532d',
    marginBottom: 4,
  },
  verdictDesc: {
    fontSize: 11.5,
    color: '#166534',
    lineHeight: 16,
  },
  guideBox: {
    backgroundColor: '#fafaf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
    padding: 12,
    marginBottom: 10,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: inkTheme.ink2,
    marginBottom: 6,
  },
  guideBullet: {
    fontSize: 11,
    color: inkTheme.ink3,
    lineHeight: 16,
    marginBottom: 2,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: inkTheme.paperDark,
    borderTopWidth: 1,
    borderTopColor: inkTheme.ink8,
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectTriggerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectTriggerBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b91c1c',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  rejectConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rejectNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  rejectBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  rejectCancelBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  rejectConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  rejectConfirmBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
  },
});
