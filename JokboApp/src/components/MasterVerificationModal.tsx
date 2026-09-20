import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { FamilyMember } from '../types/family';
import {
  GenealogyMaster,
  MasterServiceTier,
  PaymentMethod,
  MasterVerificationRequest,
} from '../types/genealogyMaster';
import {
  GENEALOGY_MASTERS,
  SERVICE_TIER_OPTIONS,
  getMastersForClan,
  submitMasterRequest,
} from '../utils/genealogyMasterData';
import { getMemberAvatar } from '../utils/avatarGenerator';

interface MasterVerificationModalProps {
  visible: boolean;
  member: FamilyMember | null;
  onClose: () => void;
  onRequestSubmitted?: (newRequest: MasterVerificationRequest) => void;
  onOpenDashboard?: () => void;
}

export const MasterVerificationModal: React.FC<MasterVerificationModalProps> = ({
  visible,
  member,
  onClose,
  onRequestSubmitted,
  onOpenDashboard,
}) => {
  if (!member) return null;

  // Masters available for this member clan
  const availableMasters = getMastersForClan(member.clan, member.name.charAt(0));
  const [selectedMaster, setSelectedMaster] = useState<GenealogyMaster>(
    availableMasters[0] || GENEALOGY_MASTERS[0]
  );

  // Form State
  const [nonHangnyeolReason, setNonHangnyeolReason] = useState<
    'hangul_pure' | 'religious' | 'modern_custom' | 'other'
  >('hangul_pure');
  const [selectedTier, setSelectedTier] = useState<MasterServiceTier>('standard');
  const [applicantName, setApplicantName] = useState('김준혁');
  const [applicantPhone, setApplicantPhone] = useState('010-3847-1920');
  const [applicantEmail, setApplicantEmail] = useState('junhyuk.kim@jokbo.com');
  const [requestMemo, setRequestMemo] = useState(
    member.name + ' 님은 순우리말/현대식 성명으로 전통 항렬자가 성명에 들어가지 않았습니다. ' + (member.clan || '문중') + ' 대동보 원전을 실사하시어 공식 세수(世數)와 세손(世孫)을 확정해 주시기를 정중히 요청드립니다.'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Submit Result State
  const [submittedRequest, setSubmittedRequest] = useState<MasterVerificationRequest | null>(null);

  const currentTierOption =
    SERVICE_TIER_OPTIONS.find((t) => t.tier === selectedTier) || SERVICE_TIER_OPTIONS[1];

  const handlePayAndSubmit = () => {
    const requestId = 'REQ-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newReq: MasterVerificationRequest = {
      id: requestId,
      memberId: member.id,
      memberName: member.name,
      memberClan: member.clan || '본관 미상',
      memberGender: member.gender,
      memberBirthDate: member.birthDate,
      parentInfo: '부모 직계 혈통',
      grandParentInfo: '조부모 직계 혈맥',
      nonHangnyeolReason,
      masterId: selectedMaster.id,
      masterName: selectedMaster.name,
      masterOrganization: selectedMaster.organization,
      masterEmail: selectedMaster.email,
      serviceTier: selectedTier,
      serviceFee: currentTierOption.price,
      paymentMethod,
      paymentStatus: 'paid',
      paidAt: nowStr,
      applicantName,
      applicantPhone,
      applicantEmail,
      requestMemo,
      attachedDocsSummary: ['가족관계증명서', '제적등본'],
      status: 'reviewing',
      submittedAt: nowStr,
      updatedAt: nowStr,
      masterReviewNote: '【접수 안내】: ' + selectedMaster.name + ' 수석 마스터에게 고증 의뢰가 성공적으로 전달되었습니다. 24시간 이내에 1차 서류 검토 및 대동보 실사가 시작됩니다.',
    };

    submitMasterRequest(newReq);
    setSubmittedRequest(newReq);
    if (onRequestSubmitted) onRequestSubmitted(newReq);
  };

  const handleResetAndClose = () => {
    setSubmittedRequest(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleResetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerTag}>
                <Text style={styles.headerTagText}>유료 전문 서비스</Text>
              </View>
              <Text style={styles.headerTitle}>🏛️ 성씨별 족보 마스터 정밀 감정 의뢰</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleResetAndClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {submittedRequest ? (
              // ================= SUCCESS SCREEN =================
              <View style={styles.successContainer}>
                <View style={styles.successBadge}>
                  <Text style={styles.successBadgeText}>✓</Text>
                </View>
                <Text style={styles.successTitle}>고증 의뢰 및 결제가 완료되었습니다!</Text>
                <Text style={styles.successSubtitle}>
                  담당 족보 마스터에게 고증 요청 메모와 전자 접수증이 발송되었습니다.
                </Text>

                {/* Receipt Card */}
                <View style={styles.receiptCard}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>의뢰 접수번호</Text>
                    <Text style={styles.receiptValueBold}>{submittedRequest.id}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>대상 인물</Text>
                    <Text style={styles.receiptValue}>
                      {submittedRequest.memberName} ({submittedRequest.memberClan})
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>담당 족보 마스터</Text>
                    <Text style={styles.receiptValue}>
                      {submittedRequest.masterName} ({submittedRequest.masterOrganization})
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>선택 서비스 등급</Text>
                    <Text style={styles.receiptValue}>
                      {currentTierOption.title} ({currentTierOption.priceText})
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>결제 수단</Text>
                    <Text style={styles.receiptValue}>
                      {paymentMethod === 'card'
                        ? '신용/체크카드'
                        : paymentMethod === 'easy_pay'
                        ? '간편결제 (카카오페이/토스)'
                        : '가상계좌'} (결제완료)
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>마스터 전송 이메일</Text>
                    <Text style={styles.receiptValue}>{submittedRequest.masterEmail}</Text>
                  </View>
                </View>

                {/* Next Steps Guidance */}
                <View style={styles.nextStepsBox}>
                  <Text style={styles.nextStepsTitle}>🔍 향후 진행 절차</Text>
                  <Text style={styles.nextStepItem}>
                    1. 담당 마스터가 접수된 요청 메모 및 직계 제적등본을 1차 검토합니다.
                  </Text>
                  <Text style={styles.nextStepItem}>
                    2. 문중 보관 대동보(大同譜) 실물을 수기 실사하여 공식 세손을 판정합니다.
                  </Text>
                  <Text style={styles.nextStepItem}>
                    3. 심사 완료 시 족보 공인 번호 및 공식 고증서가 SMS/이메일로 교부됩니다.
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.successActionsRow}>
                  {onOpenDashboard && (
                    <TouchableOpacity
                      style={styles.openDashboardBtn}
                      onPress={() => {
                        handleResetAndClose();
                        onOpenDashboard();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.openDashboardBtnText}>
                        📊 실시간 감정 진행 대시보드 바로가기
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.confirmDoneBtn}
                    onPress={handleResetAndClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmDoneBtnText}>확인 및 닫기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // ================= APPLICATION FORM =================
              <>
                {/* 1. Target Person Profile Summary */}
                <View style={styles.targetPersonCard}>
                  <View style={styles.targetAvatarBox}>
                    <Image
                      source={{ uri: getMemberAvatar(member) }}
                      style={styles.targetAvatarImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.targetInfoCol}>
                    <View style={styles.targetNameRow}>
                      <Text style={styles.targetName}>{member.name}</Text>
                      {member.hanja && <Text style={styles.targetHanja}>({member.hanja})</Text>}
                      <View style={styles.targetClanBadge}>
                        <Text style={styles.targetClanBadgeText}>{member.clan || '본관'}</Text>
                      </View>
                    </View>
                    <Text style={styles.targetSubText}>
                      {member.relationship} · {member.birthDate ? member.birthDate + ' 출생' : '출생일 미상'}
                    </Text>
                    <Text style={styles.targetNotice}>
                      ⚠️ 본 인물은 순한글 또는 항렬 외 작명으로 가문 대동보 원전의 수기 실사가 권장됩니다.
                    </Text>
                  </View>
                </View>

                {/* 2. Reason for Non-Hangnyeol Naming */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>1. 항렬표 미적용 사유 선택</Text>
                  <View style={styles.reasonButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.reasonPill,
                        nonHangnyeolReason === 'hangul_pure' && styles.reasonPillActive,
                      ]}
                      onPress={() => setNonHangnyeolReason('hangul_pure')}
                    >
                      <Text
                        style={[
                          styles.reasonPillText,
                          nonHangnyeolReason === 'hangul_pure' && styles.reasonPillTextActive,
                        ]}
                      >
                        🌸 순우리말 한글 이름
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reasonPill,
                        nonHangnyeolReason === 'religious' && styles.reasonPillActive,
                      ]}
                      onPress={() => setNonHangnyeolReason('religious')}
                    >
                      <Text
                        style={[
                          styles.reasonPillText,
                          nonHangnyeolReason === 'religious' && styles.reasonPillTextActive,
                        ]}
                      >
                        ✝️ 종교적/기독교적 작명
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reasonPill,
                        nonHangnyeolReason === 'modern_custom' && styles.reasonPillActive,
                      ]}
                      onPress={() => setNonHangnyeolReason('modern_custom')}
                    >
                      <Text
                        style={[
                          styles.reasonPillText,
                          nonHangnyeolReason === 'modern_custom' && styles.reasonPillTextActive,
                        ]}
                      >
                        🖋️ 부모님 현대식 자유 작명
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reasonPill,
                        nonHangnyeolReason === 'other' && styles.reasonPillActive,
                      ]}
                      onPress={() => setNonHangnyeolReason('other')}
                    >
                      <Text
                        style={[
                          styles.reasonPillText,
                          nonHangnyeolReason === 'other' && styles.reasonPillTextActive,
                        ]}
                      >
                        📜 족보 오기재/누락 확인
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Designated Clan Master Selection */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>2. 성씨별 공인 족보 마스터 선택</Text>
                    <Text style={styles.masterMatchText}>
                      ✓ {member.clan || '본관'} 공식 추천
                    </Text>
                  </View>

                  {/* Selected Master Highlight Card */}
                  <View style={styles.masterHighlightCard}>
                    <View style={styles.masterHeaderRow}>
                      <View style={styles.masterBadgeIcon}>
                        <Text style={styles.masterBadgeIconText}>🏛️</Text>
                      </View>
                      <View style={styles.masterInfoCol}>
                        <View style={styles.masterNameRow}>
                          <Text style={styles.masterName}>{selectedMaster.name}</Text>
                          {selectedMaster.hanja && (
                            <Text style={styles.masterHanja}>({selectedMaster.hanja})</Text>
                          )}
                          <View style={styles.masterRatingBadge}>
                            <Text style={styles.masterRatingText}>★ {selectedMaster.rating}</Text>
                          </View>
                        </View>
                        <Text style={styles.masterOrg}>{selectedMaster.organization}</Text>
                        <Text style={styles.masterRole}>
                          {selectedMaster.roleTitle} · 경력 {selectedMaster.experienceYears}년
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.masterIntro}>{selectedMaster.intro}</Text>

                    <View style={styles.specialtiesRow}>
                      {selectedMaster.specialties.map((spec, i) => (
                        <View key={i} style={styles.specTag}>
                          <Text style={styles.specTagText}>• {spec}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.masterFooterRow}>
                      <Text style={styles.masterVerifiedCount}>
                        📜 누적 공인 완료 {selectedMaster.verifiedCount.toLocaleString()}건
                      </Text>
                      <Text style={styles.masterContactEmail}>✉️ {selectedMaster.email}</Text>
                    </View>
                  </View>

                  {/* Other Available Masters Picker */}
                  {availableMasters.length > 1 && (
                    <View style={styles.otherMastersRow}>
                      <Text style={styles.otherMastersLabel}>다른 족보 마스터로 변경:</Text>
                      {availableMasters.map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.otherMasterBtn,
                            selectedMaster.id === m.id && styles.otherMasterBtnActive,
                          ]}
                          onPress={() => setSelectedMaster(m)}
                        >
                          <Text
                            style={[
                              styles.otherMasterBtnText,
                              selectedMaster.id === m.id && styles.otherMasterBtnTextActive,
                            ]}
                          >
                            {m.name} ({m.clanName.split(' ')[0]})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* 4. Service Tier & Fee Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>3. 유료 감정 등급 및 수수료 선택</Text>
                  <View style={styles.tiersContainer}>
                    {SERVICE_TIER_OPTIONS.map((tierOpt) => {
                      const isSelected = selectedTier === tierOpt.tier;
                      return (
                        <TouchableOpacity
                          key={tierOpt.tier}
                          style={[styles.tierCard, isSelected && styles.tierCardActive]}
                          onPress={() => setSelectedTier(tierOpt.tier)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.tierHeader}>
                            <View style={styles.tierTitleCol}>
                              <Text
                                style={[styles.tierTitle, isSelected && styles.tierTitleActive]}
                              >
                                {tierOpt.title}
                              </Text>
                              <View style={styles.tierBadgePill}>
                                <Text style={styles.tierBadgePillText}>{tierOpt.badge}</Text>
                              </View>
                            </View>
                            <View style={styles.tierPriceBox}>
                              <Text
                                style={[styles.tierPriceText, isSelected && styles.tierPriceTextActive]}
                              >
                                {tierOpt.priceText}
                              </Text>
                              <Text style={styles.tierDurationText}>{tierOpt.durationText}</Text>
                            </View>
                          </View>

                          <Text style={styles.tierDesc}>{tierOpt.description}</Text>

                          <View style={styles.tierFeaturesBox}>
                            {tierOpt.features.map((feat, fi) => (
                              <Text key={fi} style={styles.tierFeatureItem}>
                                ✓ {feat}
                              </Text>
                            ))}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 5. Request Memo & Applicant Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>4. 족보 마스터에게 보낼 요청 메모</Text>
                  <TextInput
                    style={styles.memoInput}
                    multiline
                    numberOfLines={4}
                    value={requestMemo}
                    onChangeText={setRequestMemo}
                    placeholder="마스터님께 전달할 가족 배경, 조부모 성함, 특별 요청 사항을 적어주세요."
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                    5. 신청인 연락처 (진행 알림 및 전자 공인서 수신용)
                  </Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>신청인 성명</Text>
                      <TextInput
                        style={styles.textInput}
                        value={applicantName}
                        onChangeText={setApplicantName}
                        placeholder="홍길동"
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>휴대폰 번호</Text>
                      <TextInput
                        style={styles.textInput}
                        value={applicantPhone}
                        onChangeText={setApplicantPhone}
                        placeholder="010-0000-0000"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                  <View style={styles.inputFull}>
                    <Text style={styles.inputLabel}>이메일 주소 (결과서 및 고증서 수신)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={applicantEmail}
                      onChangeText={setApplicantEmail}
                      placeholder="user@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* 6. Payment Method Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>6. 결제 수단 선택</Text>
                  <View style={styles.paymentMethodsRow}>
                    <TouchableOpacity
                      style={[
                        styles.paymentPill,
                        paymentMethod === 'card' && styles.paymentPillActive,
                      ]}
                      onPress={() => setPaymentMethod('card')}
                    >
                      <Text
                        style={[
                          styles.paymentPillText,
                          paymentMethod === 'card' && styles.paymentPillTextActive,
                        ]}
                      >
                        💳 신용/체크카드
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentPill,
                        paymentMethod === 'easy_pay' && styles.paymentPillActive,
                      ]}
                      onPress={() => setPaymentMethod('easy_pay')}
                    >
                      <Text
                        style={[
                          styles.paymentPillText,
                          paymentMethod === 'easy_pay' && styles.paymentPillTextActive,
                        ]}
                      >
                        🟡 간편결제 (카카오/토스)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentPill,
                        paymentMethod === 'vbank' && styles.paymentPillActive,
                      ]}
                      onPress={() => setPaymentMethod('vbank')}
                    >
                      <Text
                        style={[
                          styles.paymentPillText,
                          paymentMethod === 'vbank' && styles.paymentPillTextActive,
                        ]}
                      >
                        🏦 가상계좌 무통장
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bottom Checkout Action Bar */}
                <View style={styles.checkoutBar}>
                  <View style={styles.checkoutFeeCol}>
                    <Text style={styles.checkoutFeeLabel}>최종 감정 수수료</Text>
                    <Text style={styles.checkoutFeeAmount}>{currentTierOption.priceText}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.submitPayBtn}
                    onPress={handlePayAndSubmit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitPayBtnText}>
                      결제 및 족보 마스터에게 고증 의뢰 전송 ➔
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
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
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    width: '100%',
    maxWidth: 720,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#fca5a5',
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991b1b',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  body: {
    padding: 20,
  },
  targetPersonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    gap: 14,
  },
  targetAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#d97706',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  targetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  targetInfoCol: {
    flex: 1,
  },
  targetNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
  },
  targetHanja: {
    fontSize: 14,
    color: '#64748b',
  },
  targetClanBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#fde68a',
  },
  targetClanBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  targetSubText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  targetNotice: {
    fontSize: 11.5,
    color: '#9a3412',
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  masterMatchText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  reasonButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  reasonPillActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  reasonPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  reasonPillTextActive: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  masterHighlightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    padding: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  masterHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  masterBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterBadgeIconText: {
    fontSize: 22,
  },
  masterInfoCol: {
    flex: 1,
  },
  masterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  masterHanja: {
    fontSize: 13,
    color: '#64748b',
  },
  masterRatingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  masterRatingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  masterOrg: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 1,
  },
  masterRole: {
    fontSize: 11.5,
    color: '#64748b',
  },
  masterIntro: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  specTag: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#bae6fd',
  },
  specTagText: {
    fontSize: 10.5,
    color: '#0369a1',
    fontWeight: '600',
  },
  masterFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
  },
  masterVerifiedCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  masterContactEmail: {
    fontSize: 11,
    color: '#64748b',
  },
  otherMastersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  otherMastersLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  otherMasterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  otherMasterBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: '#e0f2fe',
  },
  otherMasterBtnText: {
    fontSize: 11,
    color: '#475569',
  },
  otherMasterBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  tiersContainer: {
    gap: 10,
  },
  tierCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  tierCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tierTitleCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  tierTitleActive: {
    color: '#047857',
  },
  tierBadgePill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#a7f3d0',
  },
  tierBadgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  tierPriceBox: {
    alignItems: 'flex-end',
  },
  tierPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  tierPriceTextActive: {
    color: '#047857',
  },
  tierDurationText: {
    fontSize: 10.5,
    color: '#64748b',
  },
  tierDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 6,
  },
  tierFeaturesBox: {
    gap: 3,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  tierFeatureItem: {
    fontSize: 11,
    color: '#334155',
  },
  memoInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12.5,
    color: '#1e293b',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputFull: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#1e293b',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  paymentPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  paymentPillActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  paymentPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  paymentPillTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  checkoutBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  checkoutFeeCol: {},
  checkoutFeeLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  checkoutFeeAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38bdf8',
  },
  submitPayBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitPayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  // Success Screen
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successBadgeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  receiptValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '700',
  },
  receiptValueBold: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '800',
  },
  nextStepsBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  nextStepItem: {
    fontSize: 11.5,
    color: '#15803d',
    lineHeight: 16,
  },
  successActionsRow: {
    width: '100%',
    gap: 10,
  },
  openDashboardBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  openDashboardBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  confirmDoneBtn: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
