import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
} from 'react-native';
import { FamilyMember } from '../types/family';
import {
  GenealogyMaster,
  MasterServiceTier,
  PaymentMethod,
  MasterVerificationRequest,
  MasterRequestStatus,
} from '../types/genealogyMaster';
import {
  GENEALOGY_MASTERS,
  SERVICE_TIER_OPTIONS,
  getAllMasters,
  getAllRequests,
  getMastersForClan,
  submitMasterRequest,
  updateMasterRequestStatus,
} from '../utils/genealogyMasterData';
import { getMemberAvatar } from '../utils/avatarGenerator';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { inkTheme } from '../theme/inkTheme';

type SubTab = 'request' | 'tracking' | 'masters';

export default function GenealogyMasterScreen() {
  const { members } = useFamilyStore();

  const [activeTab, setActiveTab] = useState<SubTab>('request');

  // Request Form State
  const [selectedMember, setSelectedMember] = useState<FamilyMember>(
    members.find((m) => m.id === 'pat-4-2') || members[0]
  );

  // Available masters for selected member
  const availableMasters = useMemo(() => {
    return getMastersForClan(selectedMember?.clan, selectedMember?.name.charAt(0));
  }, [selectedMember]);

  const [selectedMaster, setSelectedMaster] = useState<GenealogyMaster>(
    availableMasters[0] || GENEALOGY_MASTERS[0]
  );

  // Update selected master when member changes
  React.useEffect(() => {
    if (availableMasters.length > 0) {
      setSelectedMaster(availableMasters[0]);
    }
  }, [selectedMember, availableMasters]);

  const [nonHangnyeolReason, setNonHangnyeolReason] = useState<
    'hangul_pure' | 'religious' | 'modern_custom' | 'other'
  >('hangul_pure');
  const [selectedTier, setSelectedTier] = useState<MasterServiceTier>('standard');
  const [applicantName, setApplicantName] = useState('홍길동');
  const [applicantPhone, setApplicantPhone] = useState('010-3847-1920');
  const [applicantEmail, setApplicantEmail] = useState('gildong.hong@jokbo.com');
  const [requestMemo, setRequestMemo] = useState(
    (selectedMember ? selectedMember.name : '김하은') +
      ' 님은 순우리말 이름으로 전통 항렬자가 들어가지 않았습니다. 문중 대동보 원전을 수기 실사하시어 공식 세수(世數)와 세손(世孫)을 확정해 주시기를 요청드립니다.'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Master Change Picker Modal
  const [isMasterPickerOpen, setIsMasterPickerOpen] = useState(false);

  // Receipt Modal State
  const [receiptModalRequest, setReceiptModalRequest] = useState<MasterVerificationRequest | null>(null);

  // Tracking Dashboard State
  const [requestsList, setRequestsList] = useState<MasterVerificationRequest[]>(getAllRequests());
  const [masterSearchQuery, setMasterSearchQuery] = useState('');

  const refreshRequests = () => {
    setRequestsList(getAllRequests());
  };

  const currentTierOption =
    SERVICE_TIER_OPTIONS.find((t) => t.tier === selectedTier) || SERVICE_TIER_OPTIONS[1];

  // Handle Pay and Submit
  const handlePayAndSubmit = () => {
    const requestId = 'REQ-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newReq: MasterVerificationRequest = {
      id: requestId,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberClan: selectedMember.clan || '본관 미상',
      memberGender: selectedMember.gender,
      memberBirthDate: selectedMember.birthDate,
      parentInfo: '직계 부모 혈통 (부친 29세손)',
      grandParentInfo: '직계 조부모 혈맥 (28세손)',
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
      masterReviewNote:
        '【접수 안내】: ' +
        selectedMaster.name +
        ' 수석 마스터에게 고증 의뢰서가 전달되었습니다. 24시간 이내에 1차 서류 검토 및 대동보 원전 실사가 시작됩니다.',
    };

    submitMasterRequest(newReq);
    refreshRequests();
    setReceiptModalRequest(newReq);
  };

  // Advance Status Demo Simulator
  const handleAdvanceStatus = (reqId: string, currentStatus: MasterRequestStatus) => {
    let nextStatus: MasterRequestStatus = 'document_verifying';
    let nextNote = '';

    if (currentStatus === 'submitted' || currentStatus === 'reviewing') {
      nextStatus = 'document_verifying';
      nextNote =
        '【마스터 2차 소견】: 제적등본과 조부모 성함 확인을 완료하였으며, 문중 소장 한문 대동보(大同譜) 실물 수기 대조를 진행 중입니다.';
    } else if (currentStatus === 'document_verifying') {
      nextStatus = 'approved';
      nextNote =
        '【마스터 최종 공인 완료】: 대동보 원전 실사 결과, 부친 29세(赫) 직계 자녀로서 30세(29세손) 계보가 입증되었습니다. 가문 공인 등재 번호가 정식 교부되었습니다.';
    }

    updateMasterRequestStatus(reqId, nextStatus, nextNote);
    refreshRequests();
  };

  const getStatusBadge = (status: MasterRequestStatus) => {
    switch (status) {
      case 'submitted':
        return { text: '접수 완료', bg: '#fef3c7', color: '#b45309' };
      case 'reviewing':
        return { text: '서류 심사중', bg: '#e0f2fe', color: '#0369a1' };
      case 'document_verifying':
        return { text: '대동보 원전 실사중', bg: '#ede9fe', color: '#6d28d9' };
      case 'approved':
        return { text: '🛡️ 가문 족보 공인 완료', bg: '#ecfdf5', color: '#047857' };
      case 'rejected':
        return { text: '사료 보완 요청', bg: '#fee2e2', color: '#dc2626' };
      default:
        return { text: '진행중', bg: '#f1f5f9', color: '#475569' };
    }
  };

  const filteredMasters = getAllMasters().filter((m) => {
    if (!masterSearchQuery.trim()) return true;
    const q = masterSearchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.clanName.toLowerCase().includes(q) ||
      m.organization.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.topHeader}>
        <View style={styles.topTitleRow}>
          <Text style={styles.topHeaderTitle}>🏛️ 성씨별 족보 마스터 정밀 검증 센터</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>가문 공인 유료 서비스</Text>
          </View>
        </View>
        <Text style={styles.topHeaderSubtitle}>
          순한글 성명 · 종교적 작명 · 비항렬 현대식 작명의 대동보(大同譜) 원전 수기 실사 및 공식 세손 고증
        </Text>

        {/* 3 Sub Navigation Tabs */}
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabBtn, activeTab === 'request' && styles.subTabBtnActive]}
            onPress={() => setActiveTab('request')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.subTabBtnText,
                activeTab === 'request' && styles.subTabBtnTextActive,
              ]}
            >
              📝 검증 의뢰 신청
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTabBtn, activeTab === 'tracking' && styles.subTabBtnActive]}
            onPress={() => {
              refreshRequests();
              setActiveTab('tracking');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.tabBadgeRow}>
              <Text
                style={[
                  styles.subTabBtnText,
                  activeTab === 'tracking' && styles.subTabBtnTextActive,
                ]}
              >
                📊 실시간 진행 현황
              </Text>
              <View style={styles.tabCountPill}>
                <Text style={styles.tabCountPillText}>{requestsList.length}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTabBtn, activeTab === 'masters' && styles.subTabBtnActive]}
            onPress={() => setActiveTab('masters')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.subTabBtnText,
                activeTab === 'masters' && styles.subTabBtnTextActive,
              ]}
            >
              👥 전국 마스터 명부
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body */}
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
        {/* ============================================================ */}
        {/* TAB 1: 신규 검증 의뢰 신청 */}
        {/* ============================================================ */}
        {activeTab === 'request' && (
          <View style={styles.sectionCard}>
            {/* Step 1: 대상 가족 구성원 선택 */}
            <View style={styles.stepBlock}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>검증 대상 가족 선택</Text>
                <Text style={styles.stepSubtitle}>
                  (순한글·종교적 작명으로 항렬 대조가 필요한 가족)
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
                {members.map((m) => {
                  const isSelected = selectedMember?.id === m.id;
                  const isPureHangul = m.name === '김하은' || m.name === '김하늘';
                  const avatarUri = getMemberAvatar(m);

                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.memberSelectCard,
                        isSelected && styles.memberSelectCardActive,
                      ]}
                      onPress={() => {
                        setSelectedMember(m);
                        setRequestMemo(
                          m.name +
                            ' 님은 순우리말/현대식 성명으로 전통 항렬자가 성명에 들어가지 않았습니다. ' +
                            (m.clan || '문중') +
                            ' 대동보 원전을 실사하시어 공식 세수(世數)와 세손(世孫)을 확정해 주시기를 정중히 요청드립니다.'
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: avatarUri }} style={styles.memberAvatarMini} />
                      <Text style={styles.memberSelectName}>{m.name}</Text>
                      <Text style={styles.memberSelectRel}>{m.relationship}</Text>
                      {isPureHangul && (
                        <View style={styles.recommendTag}>
                          <Text style={styles.recommendTagText}>✨ 고증 권장</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkCircleText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 2: 성씨·본관 자동 분석 및 족보 마스터 자동 매칭 */}
            <View style={styles.stepBlock}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>성씨·본관 자동 매칭 공인 족보 마스터</Text>
              </View>

              <View style={styles.matchedMasterBox}>
                <View style={styles.matchedMasterHeader}>
                  <View style={styles.masterSealIcon}>
                    <Text style={styles.masterSealIconText}>印</Text>
                  </View>
                  <View style={styles.matchedMasterInfo}>
                    <View style={styles.masterNameRow}>
                      <Text style={styles.matchedMasterName}>{selectedMaster.name}</Text>
                      <Text style={styles.matchedMasterHanja}>({selectedMaster.hanja})</Text>
                      <View style={styles.trustBadge}>
                        <Text style={styles.trustBadgeText}>대종회 공인</Text>
                      </View>
                    </View>
                    <Text style={styles.matchedMasterOrg}>{selectedMaster.organization}</Text>
                    <Text style={styles.matchedMasterTitle}>{selectedMaster.roleTitle}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeMasterBtn}
                    onPress={() => setIsMasterPickerOpen(true)}
                  >
                    <Text style={styles.changeMasterBtnText}>마스터 변경 ▾</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.masterStatsRow}>
                  <Text style={styles.masterStatText}>
                    경력: <Text style={styles.statHighlight}>{selectedMaster.experienceYears}년</Text>
                  </Text>
                  <Text style={styles.masterStatDivider}>|</Text>
                  <Text style={styles.masterStatText}>
                    누적 고증: <Text style={styles.statHighlight}>{selectedMaster.verifiedCount}건</Text>
                  </Text>
                  <Text style={styles.masterStatDivider}>|</Text>
                  <Text style={styles.masterStatText}>
                    신뢰도: <Text style={styles.statHighlight}>★ {selectedMaster.rating}</Text>
                  </Text>
                </View>

                <View style={styles.masterIntroBox}>
                  <Text style={styles.masterIntroText}>"{selectedMaster.intro}"</Text>
                </View>
              </View>
            </View>

            {/* Step 3: 유료 감정 등급 선택 */}
            <View style={styles.stepBlock}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>감정 서비스 등급 및 수수료 선택</Text>
              </View>

              <View style={styles.tiersContainer}>
                {SERVICE_TIER_OPTIONS.map((t) => {
                  const isSelected = selectedTier === t.tier;
                  return (
                    <TouchableOpacity
                      key={t.tier}
                      style={[styles.tierCard, isSelected && styles.tierCardSelected]}
                      onPress={() => setSelectedTier(t.tier)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.tierTopRow}>
                        <View style={[styles.tierBadgePill, isSelected && styles.tierBadgePillActive]}>
                          <Text
                            style={[
                              styles.tierBadgeText,
                              isSelected && styles.tierBadgeTextActive,
                            ]}
                          >
                            {t.badge}
                          </Text>
                        </View>
                        <Text style={styles.tierDurationText}>{t.durationText}</Text>
                      </View>
                      <Text style={styles.tierTitle}>{t.title}</Text>
                      <Text style={styles.tierPrice}>{t.priceText}</Text>
                      <Text style={styles.tierDesc}>{t.description}</Text>

                      <View style={styles.tierFeaturesBox}>
                        {t.features.map((feat, idx) => (
                          <Text key={idx} style={styles.tierFeatureText}>
                            ✓ {feat}
                          </Text>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 4: 작명 사유 및 요청 상세 작성 */}
            <View style={styles.stepBlock}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepTitle}>비항렬(非行列) 작명 사유 및 요청 메모</Text>
              </View>

              <Text style={styles.fieldLabel}>작명 사유 선택</Text>
              <View style={styles.reasonRow}>
                {[
                  { key: 'hangul_pure', label: '🌸 순우리말 한글 이름' },
                  { key: 'religious', label: '✝️ 종교적 작명/세례명' },
                  { key: 'modern_custom', label: '✨ 현대식 자유 작명' },
                  { key: 'other', label: '📜 구전 대수 불일치' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.reasonBtn,
                      nonHangnyeolReason === r.key && styles.reasonBtnActive,
                    ]}
                    onPress={() => setNonHangnyeolReason(r.key as any)}
                  >
                    <Text
                      style={[
                        styles.reasonBtnText,
                        nonHangnyeolReason === r.key && styles.reasonBtnTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>족보 마스터 전달 요청 메모</Text>
              <TextInput
                style={styles.memoInput}
                multiline
                numberOfLines={3}
                value={requestMemo}
                onChangeText={setRequestMemo}
                placeholder="마스터에게 확인받고자 하는 구체적인 내용을 기재해주세요..."
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.applicantInfoRow}>
                <View style={styles.applicantCol}>
                  <Text style={styles.fieldLabel}>신청인 성명</Text>
                  <TextInput
                    style={styles.applicantInput}
                    value={applicantName}
                    onChangeText={setApplicantName}
                  />
                </View>
                <View style={styles.applicantCol}>
                  <Text style={styles.fieldLabel}>신청인 연락처</Text>
                  <TextInput
                    style={styles.applicantInput}
                    value={applicantPhone}
                    onChangeText={setApplicantPhone}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>결과 통지 이메일 (전자 접수증 및 고증서 수신)</Text>
              <TextInput
                style={styles.applicantInput}
                value={applicantEmail}
                onChangeText={setApplicantEmail}
              />
            </View>

            {/* Step 5: 결제 수단 및 의뢰 접수 버튼 */}
            <View style={styles.stepBlock}>
              <View style={styles.stepTitleRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <Text style={styles.stepTitle}>결제 수단 및 의뢰 접수</Text>
              </View>

              <View style={styles.paymentMethodRow}>
                {[
                  { key: 'card', label: '💳 신용/체크카드' },
                  { key: 'pay', label: '🟢 카카오/네이버페이' },
                  { key: 'bank', label: '🏦 가상계좌 무통장' },
                ].map((pm) => (
                  <TouchableOpacity
                    key={pm.key}
                    style={[
                      styles.paymentMethodBtn,
                      paymentMethod === pm.key && styles.paymentMethodBtnActive,
                    ]}
                    onPress={() => setPaymentMethod(pm.key as PaymentMethod)}
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        paymentMethod === pm.key && styles.paymentMethodTextActive,
                      ]}
                    >
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.finalPaySummary}>
                <View style={styles.finalPayRow}>
                  <Text style={styles.finalPayLabel}>감정 의뢰 대상 :</Text>
                  <Text style={styles.finalPayVal}>
                    {selectedMember.name} ({selectedMember.clan})
                  </Text>
                </View>
                <View style={styles.finalPayRow}>
                  <Text style={styles.finalPayLabel}>담당 족보 마스터 :</Text>
                  <Text style={styles.finalPayVal}>
                    {selectedMaster.name} 위원장 ({selectedMaster.organization})
                  </Text>
                </View>
                <View style={styles.finalPayRow}>
                  <Text style={styles.finalPayLabel}>최종 감정 수수료 :</Text>
                  <Text style={styles.finalPayPrice}>{currentTierOption.priceText}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitPayBtn}
                onPress={handlePayAndSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.submitPayBtnText}>
                  💳 {currentTierOption.priceText} 결제 및 족보 마스터 고증 의뢰하기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 2: 실시간 진행 현황 (대시보드) */}
        {/* ============================================================ */}
        {activeTab === 'tracking' && (
          <View style={styles.sectionCard}>
            <View style={styles.dashHeaderRow}>
              <Text style={styles.dashHeaderTitle}>📊 족보 마스터 실시간 심사 현황</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={refreshRequests}>
                <Text style={styles.refreshBtnText}>🔄 새로고침</Text>
              </TouchableOpacity>
            </View>

            {requestsList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>현재 진행 중인 족보 마스터 감정 내역이 없습니다.</Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setActiveTab('request')}
                >
                  <Text style={styles.emptyActionBtnText}>신규 검증 의뢰 작성하기 ➔</Text>
                </TouchableOpacity>
              </View>
            ) : (
              requestsList.map((req) => {
                const badge = getStatusBadge(req.status);
                const steps = [
                  { key: 'submitted', label: '1. 신청접수' },
                  { key: 'paid', label: '2. 결제완료' },
                  { key: 'reviewing', label: '3. 1차서류검토' },
                  { key: 'document_verifying', label: '4. 대동보실사' },
                  { key: 'approved', label: '5. 공인완료' },
                ];

                let activeStepIdx = 1;
                if (req.status === 'submitted') activeStepIdx = 1;
                else if (req.status === 'reviewing') activeStepIdx = 2;
                else if (req.status === 'document_verifying') activeStepIdx = 3;
                else if (req.status === 'approved') activeStepIdx = 4;

                return (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestCardTop}>
                      <View style={styles.reqIdCol}>
                        <Text style={styles.reqIdText}>{req.id}</Text>
                        <Text style={styles.reqDateText}>접수: {req.submittedAt}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                          {badge.text}
                        </Text>
                      </View>
                    </View>

                    {/* Member & Master Details */}
                    <View style={styles.reqInfoGrid}>
                      <View style={styles.reqInfoItem}>
                        <Text style={styles.reqInfoLabel}>대상 인물</Text>
                        <Text style={styles.reqInfoVal}>
                          {req.memberName} ({req.memberClan})
                        </Text>
                      </View>
                      <View style={styles.reqInfoItem}>
                        <Text style={styles.reqInfoLabel}>담당 마스터</Text>
                        <Text style={styles.reqInfoVal}>
                          {req.masterName} ({req.masterOrganization})
                        </Text>
                      </View>
                      <View style={styles.reqInfoItem}>
                        <Text style={styles.reqInfoLabel}>서비스 등급</Text>
                        <Text style={styles.reqInfoVal}>
                          {req.serviceTier.toUpperCase()} ({req.serviceFee.toLocaleString()}원)
                        </Text>
                      </View>
                      <View style={styles.reqInfoItem}>
                        <Text style={styles.reqInfoLabel}>신청인</Text>
                        <Text style={styles.reqInfoVal}>
                          {req.applicantName} ({req.applicantPhone})
                        </Text>
                      </View>
                    </View>

                    {/* Interactive 5-Step Timeline */}
                    <View style={styles.timelineContainer}>
                      <View style={styles.timelineStepsRow}>
                        {steps.map((st, sIdx) => {
                          const isDone = sIdx <= activeStepIdx;
                          const isCurrent = sIdx === activeStepIdx;
                          return (
                            <View key={st.key} style={styles.timelineStepCol}>
                              <View
                                style={[
                                  styles.stepDot,
                                  isDone && styles.stepDotDone,
                                  isCurrent && styles.stepDotCurrent,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.stepDotText,
                                    isDone && styles.stepDotTextDone,
                                  ]}
                                >
                                  {isDone ? '✓' : String(sIdx + 1)}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.stepTimelineLabel,
                                  isCurrent && styles.stepTimelineLabelCurrent,
                                ]}
                              >
                                {st.label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Master Note Callout */}
                    {req.masterReviewNote ? (
                      <View style={styles.reviewNoteBox}>
                        <Text style={styles.reviewNoteTitle}>💬 마스터 실시간 소견</Text>
                        <Text style={styles.reviewNoteDesc}>{req.masterReviewNote}</Text>
                      </View>
                    ) : null}

                    {/* Approved Certificate Pill */}
                    {req.status === 'approved' && req.issuedCertificateNo ? (
                      <View style={styles.certPill}>
                        <Text style={styles.certPillText}>
                          📜 가문 공인 등록 번호: {req.issuedCertificateNo}
                        </Text>
                      </View>
                    ) : null}

                    {/* Demo Simulator Action */}
                    {req.status !== 'approved' && (
                      <TouchableOpacity
                        style={styles.advanceStatusBtn}
                        onPress={() => handleAdvanceStatus(req.id, req.status)}
                      >
                        <Text style={styles.advanceStatusBtnText}>
                          ⚡ [데모 시뮬레이터] 다음 심사 단계로 진행
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 3: 전국 성씨별 공인 마스터 명부 */}
        {/* ============================================================ */}
        {activeTab === 'masters' && (
          <View style={styles.sectionCard}>
            <Text style={styles.mastersHeaderTitle}>
              전국 성씨·본관별 문중 공인 족보 편찬위원장 명부
            </Text>
            <Text style={styles.mastersHeaderSubtitle}>
              대종회 및 대동종약원에서 최소 25년 이상 대동보를 직접 편찬·감수한 권위 있는 족보 마스터들입니다.
            </Text>

            {/* Search Box */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="성씨, 본관, 마스터 성함, 대종회 검색..."
                placeholderTextColor="#94a3b8"
                value={masterSearchQuery}
                onChangeText={setMasterSearchQuery}
              />
              {masterSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setMasterSearchQuery('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Masters Cards */}
            <View style={styles.mastersList}>
              {filteredMasters.map((m) => (
                <View key={m.id} style={styles.masterDetailCard}>
                  <View style={styles.masterDetailHeader}>
                    <View style={styles.masterLargeSeal}>
                      <Text style={styles.masterLargeSealText}>宗</Text>
                    </View>
                    <View style={styles.masterDetailTitleGroup}>
                      <View style={styles.masterNameHanjaRow}>
                        <Text style={styles.masterDetailName}>{m.name}</Text>
                        <Text style={styles.masterDetailHanja}>({m.hanja})</Text>
                        <View style={styles.masterExpTag}>
                          <Text style={styles.masterExpTagText}>경력 {m.experienceYears}년</Text>
                        </View>
                      </View>
                      <Text style={styles.masterClanName}>{m.clanName}</Text>
                      <Text style={styles.masterOrgRole}>
                        {m.organization} · {m.roleTitle}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.masterDetailIntro}>{m.intro}</Text>

                  {/* Specialties Chips */}
                  <View style={styles.specialtyContainer}>
                    {m.specialties.map((spec, sIdx) => (
                      <View key={sIdx} style={styles.specialtyChip}>
                        <Text style={styles.specialtyChipText}>✓ {spec}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.masterCardFooter}>
                    <Text style={styles.masterFooterStat}>
                      누적 고증 {m.verifiedCount}건 · 평점 ★ {m.rating}
                    </Text>
                    <TouchableOpacity
                      style={styles.directRequestBtn}
                      onPress={() => {
                        setSelectedMaster(m);
                        setActiveTab('request');
                      }}
                    >
                      <Text style={styles.directRequestBtnText}>이 마스터에게 의뢰 ➔</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Master Picker Modal */}
      <Modal visible={isMasterPickerOpen} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>공인 족보 마스터 선택</Text>
              <TouchableOpacity onPress={() => setIsMasterPickerOpen(false)}>
                <Text style={styles.pickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {getAllMasters().map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.pickerItem,
                    selectedMaster.id === m.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedMaster(m);
                    setIsMasterPickerOpen(false);
                  }}
                >
                  <View style={styles.pickerItemInfo}>
                    <Text style={styles.pickerItemName}>
                      {m.name} ({m.hanja}) · {m.clanName}
                    </Text>
                    <Text style={styles.pickerItemOrg}>{m.organization}</Text>
                  </View>
                  {selectedMaster.id === m.id && <Text style={styles.pickerCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Electronic Receipt Modal */}
      <Modal visible={receiptModalRequest !== null} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderBadge}>🏛️ 전자 접수 완료</Text>
              <Text style={styles.receiptTitle}>족보 마스터 정밀 고증 접수증</Text>
              <Text style={styles.receiptIdText}>접수번호: {receiptModalRequest?.id}</Text>
            </View>

            <View style={styles.receiptBody}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>고증 대상자</Text>
                <Text style={styles.receiptVal}>
                  {receiptModalRequest?.memberName} ({receiptModalRequest?.memberClan})
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>담당 족보 마스터</Text>
                <Text style={styles.receiptVal}>
                  {receiptModalRequest?.masterName} 위원장 ({receiptModalRequest?.masterOrganization})
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>감정 서비스 등급</Text>
                <Text style={styles.receiptVal}>
                  {receiptModalRequest?.serviceTier.toUpperCase()}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>결제 금액</Text>
                <Text style={styles.receiptPrice}>
                  {receiptModalRequest?.serviceFee.toLocaleString()}원 (결제 완료)
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>결과 통지 이메일</Text>
                <Text style={styles.receiptVal}>{receiptModalRequest?.applicantEmail}</Text>
              </View>
            </View>

            <View style={styles.receiptNoticeBox}>
              <Text style={styles.receiptNoticeText}>
                💡 고증 의뢰서가 마스터에게 실시간 전송되었습니다. 24시간 이내에 1차 서류 대조가 진행되며, 실시간 진행 현황 탭에서 단계별 심사 상태를 확인하실 수 있습니다.
              </Text>
            </View>

            <View style={styles.receiptBtnRow}>
              <TouchableOpacity
                style={styles.receiptConfirmBtn}
                onPress={() => {
                  setReceiptModalRequest(null);
                  setActiveTab('tracking');
                }}
              >
                <Text style={styles.receiptConfirmBtnText}>📊 실시간 진행 현황 확인하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    backgroundColor: inkTheme.paper,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  proBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  topHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 16,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  subTabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
  subTabBtnTextActive: {
    fontWeight: '800',
    color: '#0f172a',
  },
  tabBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabCountPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabCountPillText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '800',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  stepBlock: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  stepSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
  },
  memberScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  memberSelectCard: {
    width: 100,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginRight: 10,
  },
  memberSelectCardActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  memberAvatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  memberSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  memberSelectRel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  recommendTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  recommendTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#b45309',
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  matchedMasterBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
  },
  matchedMasterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterSealIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterSealIconText: {
    color: '#b91c1c',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: inkTheme.fontSerif,
  },
  matchedMasterInfo: {
    flex: 1,
  },
  masterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchedMasterName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  matchedMasterHanja: {
    fontSize: 12,
    color: '#64748b',
  },
  trustBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#10b981',
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  matchedMasterOrg: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  matchedMasterTitle: {
    fontSize: 11.5,
    color: '#64748b',
  },
  changeMasterBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  changeMasterBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  masterStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  masterStatText: {
    fontSize: 11.5,
    color: '#64748b',
  },
  statHighlight: {
    fontWeight: '700',
    color: '#0f172a',
  },
  masterStatDivider: {
    color: '#cbd5e1',
  },
  masterIntroBox: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  masterIntroText: {
    fontSize: 11.5,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  tiersContainer: {
    gap: 12,
  },
  tierCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  tierCardSelected: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  tierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tierBadgePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierBadgePillActive: {
    backgroundColor: '#0284c7',
  },
  tierBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  tierBadgeTextActive: {
    color: '#ffffff',
  },
  tierDurationText: {
    fontSize: 11,
    color: '#64748b',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  tierPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284c7',
    marginVertical: 3,
  },
  tierDesc: {
    fontSize: 11.5,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 16,
  },
  tierFeaturesBox: {
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
    gap: 3,
  },
  tierFeatureText: {
    fontSize: 11,
    color: '#334155',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  reasonBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reasonBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  reasonBtnText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  reasonBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  memoInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    fontSize: 12.5,
    color: '#1e293b',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  applicantInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  applicantCol: {
    flex: 1,
  },
  applicantInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12.5,
    color: '#1e293b',
    marginBottom: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  paymentMethodBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
  },
  paymentMethodBtnActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  paymentMethodText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  paymentMethodTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  finalPaySummary: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    gap: 4,
  },
  finalPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalPayLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  finalPayVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  finalPayPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284c7',
  },
  submitPayBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitPayBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  dashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dashHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  refreshBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  refreshBtnText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  emptyActionBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
  },
  requestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reqIdCol: {},
  reqIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  reqDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reqInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  reqInfoItem: {
    width: '48%',
  },
  reqInfoLabel: {
    fontSize: 10.5,
    color: '#64748b',
  },
  reqInfoVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 1,
  },
  timelineContainer: {
    marginVertical: 10,
  },
  timelineStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStepCol: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: '#10b981',
  },
  stepDotCurrent: {
    backgroundColor: '#0284c7',
  },
  stepDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  stepDotTextDone: {
    color: '#ffffff',
  },
  stepTimelineLabel: {
    fontSize: 9.5,
    color: '#64748b',
    textAlign: 'center',
  },
  stepTimelineLabelCurrent: {
    color: '#0284c7',
    fontWeight: '800',
  },
  reviewNoteBox: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  reviewNoteTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 4,
  },
  reviewNoteDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  certPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  certPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  advanceStatusBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  advanceStatusBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  mastersHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  mastersHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#1e293b',
  },
  clearIcon: {
    fontSize: 12,
    color: '#94a3b8',
    padding: 4,
  },
  mastersList: {
    gap: 12,
  },
  masterDetailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  masterDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  masterLargeSeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterLargeSealText: {
    color: '#b91c1c',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: inkTheme.fontSerif,
  },
  masterDetailTitleGroup: {
    flex: 1,
  },
  masterNameHanjaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterDetailName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  masterDetailHanja: {
    fontSize: 12.5,
    color: '#64748b',
  },
  masterExpTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  masterExpTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  masterClanName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 2,
  },
  masterOrgRole: {
    fontSize: 11.5,
    color: '#475569',
  },
  masterDetailIntro: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 8,
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  specialtyChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  specialtyChipText: {
    fontSize: 10.5,
    color: '#334155',
    fontWeight: '600',
  },
  masterCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  masterFooterStat: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  directRequestBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  directRequestBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  pickerCloseText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#f0f9ff',
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  pickerItemOrg: {
    fontSize: 11.5,
    color: '#64748b',
  },
  pickerCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
  },
  receiptCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  receiptHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  receiptHeaderBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  receiptIdText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  receiptBody: {
    gap: 8,
    marginBottom: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f8fafc',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  receiptVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  receiptPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0284c7',
  },
  receiptNoticeBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  receiptNoticeText: {
    fontSize: 11.5,
    color: '#0369a1',
    lineHeight: 16,
  },
  receiptBtnRow: {
    alignItems: 'center',
  },
  receiptConfirmBtn: {
    backgroundColor: '#0284c7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  receiptConfirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
