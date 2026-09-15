import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
} from 'react-native';
import { FamilyMember, RelationType, EstablishedLink, OperationMode } from '../types/family';
import {
  calculateKinshipBetween,
  findElderApproverFor,
  DESIGNATED_ELDERS,
  ElderApproverInfo,
  UNCONNECTED_TEST_MEMBERS,
} from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

interface RelationshipStudioModalProps {
  visible: boolean;
  onClose: () => void;
  allMembers: FamilyMember[];
  unconnectedMembers: FamilyMember[];
  establishedLinks: EstablishedLink[];
  pendingElderLinks: EstablishedLink[];
  approvedLinks: EstablishedLink[];
  operationMode: OperationMode;
  onSetOperationMode: (mode: OperationMode) => void;
  onConnect: (personAId: string, personBId: string, relationType: RelationType) => {
    success: boolean;
    message: string;
    chonText: string;
    titleAtoB: string;
    titleBtoA: string;
  };
  onRequestP2P: (
    personAId: string,
    personBId: string,
    relationType: RelationType,
    customElderId?: string
  ) => {
    success: boolean;
    linkId?: string;
    message: string;
    elder?: ElderApproverInfo;
    chonText: string;
    titleAtoB: string;
    titleBtoA: string;
  };
  onElderApprove: (linkId: string, comment?: string) => { success: boolean; message: string };
  onElderReject: (linkId: string, reason?: string) => { success: boolean; message: string };
  onDisconnect: (linkId: string) => void;
  onResetAll: () => void;
  initialPersonAId?: string;
}

export const RelationshipStudioModal: React.FC<RelationshipStudioModalProps> = ({
  visible,
  onClose,
  allMembers,
  unconnectedMembers,
  establishedLinks,
  pendingElderLinks,
  approvedLinks,
  operationMode,
  onSetOperationMode,
  onConnect,
  onRequestP2P,
  onElderApprove,
  onElderReject,
  onDisconnect,
  onResetAll,
  initialPersonAId,
}) => {
  // Navigation inside modal
  const [subTab, setSubTab] = useState<'p2p_flow' | 'presets' | 'elder_inbox' | 'central_custom' | 'central_manage'>('p2p_flow');

  // P2P Simulator Workflow State
  // Step 1: Request from Phone A -> Step 2: Accept on Phone B -> Step 3: Elder Phone C 2nd Verification
  const [p2pStep, setP2pStep] = useState<'step1_request' | 'step2_peer_agree' | 'step3_elder_verify' | 'completed'>('step1_request');
  const [p2pSenderId, setP2pSenderId] = useState<string>(
    unconnectedMembers.length > 0 ? unconnectedMembers[0].id : (initialPersonAId || 'pat-2-1')
  );
  const [p2pReceiverId, setP2pReceiverId] = useState<string>('pat-2-1'); // Default 백부 김영호
  const [p2pRelationType, setP2pRelationType] = useState<RelationType>('parent_child');
  const [p2pSelectedElderId, setP2pSelectedElderId] = useState<string>('pat-1-1'); // Default 김동길 조부
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  // Centralized Custom Linker State
  const [selectedPersonAId, setSelectedPersonAId] = useState<string>(initialPersonAId || 'pat-2-1');
  const [selectedPersonBId, setSelectedPersonBId] = useState<string>(
    unconnectedMembers.length > 0 ? unconnectedMembers[0].id : ''
  );
  const [selectedRelationType, setSelectedRelationType] = useState<RelationType>('parent_child');
  const [filterQueryA, setFilterQueryA] = useState('');
  const [filterQueryB, setFilterQueryB] = useState('');

  // Toast / Status banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'warning' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Helper Lookups
  const p2pSender = useMemo(
    () =>
      unconnectedMembers.find((m) => m.id === p2pSenderId) ||
      allMembers.find((m) => m.id === p2pSenderId),
    [unconnectedMembers, allMembers, p2pSenderId]
  );
  const p2pReceiver = useMemo(
    () =>
      allMembers.find((m) => m.id === p2pReceiverId) ||
      unconnectedMembers.find((m) => m.id === p2pReceiverId),
    [allMembers, unconnectedMembers, p2pReceiverId]
  );

  const recommendedElder = useMemo(() => {
    if (!p2pSenderId || !p2pReceiverId) return DESIGNATED_ELDERS[0];
    return findElderApproverFor(p2pSenderId, p2pReceiverId, allMembers);
  }, [p2pSenderId, p2pReceiverId, allMembers]);

  const activeElder = useMemo(() => {
    return DESIGNATED_ELDERS.find((e) => e.id === p2pSelectedElderId && e.isAlive) || recommendedElder;
  }, [p2pSelectedElderId, recommendedElder]);

  // Projected Kinship for P2P
  const p2pKinshipPreview = useMemo(() => {
    if (!p2pSender || !p2pReceiver) return null;
    return calculateKinshipBetween(p2pSender.id, p2pReceiver.id, allMembers);
  }, [p2pSender, p2pReceiver, allMembers]);

  // 1-Click Scenario Handler
  const handleRunPresetScenario = (scenarioIdx: number) => {
    if (scenarioIdx === 1) {
      // Scenario 1: 김태성(미등록) ↔ 백부 김영호 (P2P 부자) -> 2차 생존 친조모 박순자 여사 (88세, 생존)
      const res = onRequestP2P('unc-1', 'pat-2-1', 'parent_child', 'pat-1-2');
      if (res.success && res.linkId) {
        setActiveLinkId(res.linkId);
        setP2pSenderId('unc-1');
        setP2pReceiverId('pat-2-1');
        setP2pRelationType('parent_child');
        setP2pSelectedElderId('pat-1-2');
        setP2pStep('step3_elder_verify');
        showToast(
          '1단계 P2P 상호 서명 완료! [스마트폰 3: 생존 친조모 박순자 여사(88세)]에게 2차 승인 결재가 도착했습니다.',
          'warning'
        );
      }
    } else if (scenarioIdx === 2) {
      // Scenario 2: 예비신부 박지민 ↔ 남동생 김도윤 (P2P 부부) -> 2차 생존 부친 김영수 (64세, 생존)
      const res = onRequestP2P('unc-3', 'pat-3-2', 'spouse', 'pat-2-2');
      if (res.success && res.linkId) {
        setActiveLinkId(res.linkId);
        setP2pSenderId('unc-3');
        setP2pReceiverId('pat-3-2');
        setP2pRelationType('spouse');
        setP2pSelectedElderId('pat-2-2');
        setP2pStep('step3_elder_verify');
        showToast(
          '1단계 P2P 상호 서명 완료! [스마트폰 3: 생존 직계 부친 김영수(64세)]에게 2차 승인 결재가 도착했습니다.',
          'warning'
        );
      }
    } else if (scenarioIdx === 3) {
      // Scenario 3: [허위 결연 차단 실증] 가짜 인물 ↔ 큰이모 이정옥 -> 생존 외조모 권정자 (85세, 생존) 반려
      const res = onRequestP2P('unc-2', 'mat-2-3', 'parent_child', 'mat-1-2');
      if (res.success && res.linkId) {
        setActiveLinkId(res.linkId);
        setP2pSenderId('unc-2');
        setP2pReceiverId('mat-2-3');
        setP2pRelationType('parent_child');
        setP2pSelectedElderId('mat-1-2');
        setP2pStep('step3_elder_verify');
        showToast(
          '🚨 [허위 결연 차단 실증] 결연 신청 접수됨! 생존 외가 어르신(권정자 외조모) 결재 창에서 [❌ 허위 결연 반려]를 눌러 차단 기능을 테스트해보세요.',
          'warning'
        );
      }
    }
  };

  // P2P Step 1 Send Request
  const handleP2pSendRequest = () => {
    if (!p2pSenderId || !p2pReceiverId) {
      showToast('신청인과 상대방을 모두 선택해주세요.', 'error');
      return;
    }
    if (p2pSenderId === p2pReceiverId) {
      showToast('동일 인물 간에는 결연을 신청할 수 없습니다.', 'error');
      return;
    }

    setP2pStep('step2_peer_agree');
    showToast(
      `[스마트폰 A → 스마트폰 B] ${p2pSender?.name}님이 ${p2pReceiver?.name}님께 결연 요청을 전송하였습니다.`,
      'success'
    );
  };

  // P2P Step 2 Peer Acceptance
  const handleP2pPeerAgree = () => {
    const res = onRequestP2P(p2pSenderId, p2pReceiverId, p2pRelationType, p2pSelectedElderId);
    if (res.success && res.linkId) {
      setActiveLinkId(res.linkId);
      setP2pStep('step3_elder_verify');
      showToast(
        `[상호 동의 완료] 거짓 결연 방지를 위해 윗대 어르신(${res.elder?.name} ${res.elder?.relation})의 2차 승인이 필요합니다.`,
        'warning'
      );
    } else {
      showToast(res.message, 'error');
    }
  };

  // P2P Step 3 Elder Approval
  const handleElderApprove = (linkId?: string) => {
    const targetId = linkId || activeLinkId;
    if (!targetId) return;
    const res = onElderApprove(targetId);
    if (res.success) {
      setP2pStep('completed');
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // P2P Step 3 Elder Rejection
  const handleElderReject = (linkId?: string, reason?: string) => {
    const targetId = linkId || activeLinkId;
    if (!targetId) return;
    const res = onElderReject(targetId, reason || '친족 혈연 불일치 및 허위 기재 의심');
    if (res.success) {
      setP2pStep('step1_request');
      setActiveLinkId(null);
      showToast(res.message, 'error');
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.studioContainer}>
          {/* Top Title Bar */}
          <View style={styles.topHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.titleIcon}>🤝</Text>
              <View>
                <Text style={styles.mainTitle}>친족 결연 스튜디오 & 2중 운영 시스템</Text>
                <Text style={styles.subTitle}>
                  중앙 족보 편찬 모드 ↔ 스마트폰 분산 결연 및 2차 윗대 승인 체계
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>✕ 닫기</Text>
            </TouchableOpacity>
          </View>

          {/* 1. DUAL OPERATION MODE SWITCHER (2중 운영 체계 선택) */}
          <View style={styles.operatingModeContainer}>
            <View style={styles.modeSwitcherLabelRow}>
              <Text style={styles.modeSectionLabel}>⚙️ 가계도 운영 체계 선택 (Dual-Mode)</Text>
              <Text style={styles.activeModeIndicator}>
                현재 활성: {operationMode === 'decentralized' ? '📱 분산 결연형 (2중 승인)' : '🏛️ 중앙 편찬형'}
              </Text>
            </View>

            <View style={styles.modeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  operationMode === 'decentralized' && styles.modeButtonActiveDecentralized,
                ]}
                onPress={() => {
                  onSetOperationMode('decentralized');
                  setSubTab('p2p_flow');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modeButtonIcon}>📱</Text>
                <View style={styles.modeButtonTextWrap}>
                  <Text
                    style={[
                      styles.modeButtonTitle,
                      operationMode === 'decentralized' && styles.modeButtonTitleActive,
                    ]}
                  >
                    분산 결연형 (2중 윗대 승인) [추천]
                  </Text>
                  <Text style={styles.modeButtonSub}>
                    각자의 스마트폰 P2P 상호 결연 + 직계 존속(부모/조부) 2차 검증 공인
                  </Text>
                </View>
                {operationMode === 'decentralized' && (
                  <View style={styles.activeModePill}>
                    <Text style={styles.activeModePillText}>운영 중</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  operationMode === 'centralized' && styles.modeButtonActiveCentralized,
                ]}
                onPress={() => {
                  onSetOperationMode('centralized');
                  setSubTab('central_custom');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modeButtonIcon}>🏛️</Text>
                <View style={styles.modeButtonTextWrap}>
                  <Text
                    style={[
                      styles.modeButtonTitle,
                      operationMode === 'centralized' && styles.modeButtonTitleActive,
                    ]}
                  >
                    중앙 집중형 (관리자 직권 편찬)
                  </Text>
                  <Text style={styles.modeButtonSub}>
                    관리자 사이트에서 가계도 인물 간 관계를 일괄 생성 및 총괄 관리
                  </Text>
                </View>
                {operationMode === 'centralized' && (
                  <View style={styles.activeModePill}>
                    <Text style={styles.activeModePillText}>운영 중</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Toast / Notification Banner */}
          {toastMessage && (
            <View
              style={[
                styles.toastBanner,
                toastType === 'warning'
                  ? styles.toastWarning
                  : toastType === 'error'
                  ? styles.toastError
                  : styles.toastSuccess,
              ]}
            >
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* 2. SUB-TABS NAVIGATION */}
          <View style={styles.subTabBar}>
            {operationMode === 'decentralized' ? (
              <>
                <TouchableOpacity
                  style={[styles.subTabItem, subTab === 'p2p_flow' && styles.subTabItemActive]}
                  onPress={() => setSubTab('p2p_flow')}
                >
                  <Text
                    style={[styles.subTabText, subTab === 'p2p_flow' && styles.subTabTextActive]}
                  >
                    📱 2인 스마트폰 P2P & 윗대 승인 워크플로우
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabItem, subTab === 'presets' && styles.subTabItemActive]}
                  onPress={() => setSubTab('presets')}
                >
                  <Text
                    style={[styles.subTabText, subTab === 'presets' && styles.subTabTextActive]}
                  >
                    ⚡ 1초 퀵 검증 시나리오 (허위 차단 포함)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabItem, subTab === 'elder_inbox' && styles.subTabItemActive]}
                  onPress={() => setSubTab('elder_inbox')}
                >
                  <Text
                    style={[styles.subTabText, subTab === 'elder_inbox' && styles.subTabTextActive]}
                  >
                    🛡️ 어르신 결재함 ({pendingElderLinks.length}건 대기)
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.subTabItem, subTab === 'central_custom' && styles.subTabItemActive]}
                  onPress={() => setSubTab('central_custom')}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      subTab === 'central_custom' && styles.subTabTextActive,
                    ]}
                  >
                    ✏️ 중앙 자유 결연 링커
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabItem, subTab === 'central_manage' && styles.subTabItemActive]}
                  onPress={() => setSubTab('central_manage')}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      subTab === 'central_manage' && styles.subTabTextActive,
                    ]}
                  >
                    📋 형성된 결연 관리 ({establishedLinks.length}건)
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 3. MAIN CONTENT AREA */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* ========================================================================= */}
            {/* TAB: DECENTRALIZED P2P WORKFLOW (2인 스마트폰 접속 + 윗대 승인 시뮬레이터) */}
            {/* ========================================================================= */}
            {subTab === 'p2p_flow' && (
              <View style={styles.sectionBlock}>
                {/* Protocol Explanation Box */}
                <View style={styles.protocolExplainBox}>
                  <Text style={styles.protocolExplainTitle}>
                    🛡️ 거짓·허위 결연 방지를 위한 2단계 신뢰 프로토콜 (Two-Step Ancestor Protocol)
                  </Text>
                  <Text style={styles.protocolExplainDesc}>
                    친족 관계가 아닌 두 사람이 임의로 결연을 맺어 족보가 오염되는 것을 막기 위해,
                    [1단계: 두 사람의 스마트폰 상호 서명] 후 반드시 [2단계: 생존해 계신 직계 존속 윗대 어르신(부모·조부모)의 최종 확인 결재]를 거쳐야만 정식 가계도에 영구 편입됩니다.
                  </Text>
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 6, borderWidth: 1, borderColor: '#10b981' }}>
                    <Text style={{ fontSize: 11.5, color: '#34d399', fontWeight: '800' }}>
                      🌿 생존 어르신 공인 필수 원칙: 2차 확인자(부모님, 조부모님, 가문 어르신)는 반드시 현재 생존하고 계신 분(isAlive: true)만 승인 권한이 유효합니다. 작고하신 선조는 승인이 불가합니다.
                    </Text>
                  </View>
                </View>

                {/* 3-Step Phone Workflow Progress Bar */}
                <View style={styles.progressStepper}>
                  <View
                    style={[
                      styles.stepIndicator,
                      p2pStep === 'step1_request' && styles.stepIndicatorCurrent,
                      (p2pStep === 'step2_peer_agree' ||
                        p2pStep === 'step3_elder_verify' ||
                        p2pStep === 'completed') &&
                        styles.stepIndicatorDone,
                    ]}
                  >
                    <Text style={styles.stepIndicatorNum}>1</Text>
                    <Text style={styles.stepIndicatorLabel}>스마트폰 A
(신청인 요청)</Text>
                  </View>

                  <View style={styles.stepConnectorLine} />

                  <View
                    style={[
                      styles.stepIndicator,
                      p2pStep === 'step2_peer_agree' && styles.stepIndicatorCurrent,
                      (p2pStep === 'step3_elder_verify' || p2pStep === 'completed') &&
                        styles.stepIndicatorDone,
                    ]}
                  >
                    <Text style={styles.stepIndicatorNum}>2</Text>
                    <Text style={styles.stepIndicatorLabel}>스마트폰 B
(상대방 1차 동의)</Text>
                  </View>

                  <View style={styles.stepConnectorLine} />

                  <View
                    style={[
                      styles.stepIndicator,
                      p2pStep === 'step3_elder_verify' && styles.stepIndicatorCurrent,
                      p2pStep === 'completed' && styles.stepIndicatorDone,
                    ]}
                  >
                    <Text style={styles.stepIndicatorNum}>3</Text>
                    <Text style={styles.stepIndicatorLabel}>스마트폰 C
(윗대 어르신 2차 승인)</Text>
                  </View>
                </View>

                {/* ------------------------------------------------------------- */}
                {/* STEP 1: PHONE A (신청인 스마트폰 뷰) */}
                {/* ------------------------------------------------------------- */}
                {p2pStep === 'step1_request' && (
                  <View style={styles.phoneScreenCard}>
                    <View style={styles.phoneTopSpeaker} />
                    <View style={styles.phoneHeader}>
                      <Text style={styles.phoneDeviceTag}>📱 스마트폰 1: 결연 신청자 화면</Text>
                      <Text style={styles.phoneStatusText}>P2P 연결 대기 중</Text>
                    </View>

                    <Text style={styles.phoneScreenTitle}>새로운 친족과의 결연 신청</Text>
                    <Text style={styles.phoneScreenDesc}>
                      자신의 스마트폰에서 결연을 맺을 상대방을 선택하고 관계를 지정하십시오.
                    </Text>

                    {/* Sender Selector */}
                    <Text style={styles.fieldLabel}>1. 본인(신청자) 프로필 선택</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {unconnectedMembers.map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.personChip,
                            p2pSenderId === m.id && styles.personChipActive,
                          ]}
                          onPress={() => setP2pSenderId(m.id)}
                        >
                          <Text style={styles.personChipBadge}>미등록 후보</Text>
                          <Text style={styles.personChipName}>{m.name} ({m.relationship})</Text>
                        </TouchableOpacity>
                      ))}
                      {allMembers.slice(0, 6).map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.personChip,
                            p2pSenderId === m.id && styles.personChipActive,
                          ]}
                          onPress={() => setP2pSenderId(m.id)}
                        >
                          <Text style={styles.personChipName}>{m.name} ({m.relationship})</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Receiver Selector */}
                    <Text style={styles.fieldLabel}>2. 결연을 맺을 상대방 선택</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {allMembers.filter((m) => m.id !== p2pSenderId).slice(0, 8).map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.personChip,
                            p2pReceiverId === m.id && styles.personChipActive,
                          ]}
                          onPress={() => setP2pReceiverId(m.id)}
                        >
                          <Text style={styles.personChipName}>{m.name} ({m.relationship})</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Relationship Type */}
                    <Text style={styles.fieldLabel}>3. 맺을 친족 관계 선택</Text>
                    <View style={styles.relationTypeGrid}>
                      {[
                        { key: 'parent_child', label: '부모-자녀 (1촌)', desc: '신청자가 상대방의 자녀/부모로 등록' },
                        { key: 'spouse', label: '부부 (0촌)', desc: '혼인을 통한 인척/배우자 결연' },
                        { key: 'sibling', label: '형제자매 (2촌)', desc: '부모를 공유하는 동기간 결연' },
                      ].map((item) => (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.relationTypeCard,
                            p2pRelationType === item.key && styles.relationTypeCardActive,
                          ]}
                          onPress={() => setP2pRelationType(item.key as RelationType)}
                        >
                          <Text
                            style={[
                              styles.relationTypeTitle,
                              p2pRelationType === item.key && styles.relationTypeTitleActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text style={styles.relationTypeDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* 4. Verifying Living Elder Selector */}
                    <Text style={styles.fieldLabel}>4. 2차 승인 담당 윗대 어르신 선택 (🌿 생존자만 승인 가능)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {DESIGNATED_ELDERS.map((elder) => {
                        const isSelected = (p2pSelectedElderId || recommendedElder.id) === elder.id;
                        return (
                          <TouchableOpacity
                            key={elder.id}
                            style={[
                              styles.personChip,
                              isSelected && styles.personChipActive,
                            ]}
                            onPress={() => setP2pSelectedElderId(elder.id)}
                          >
                            <Text style={[styles.personChipBadge, { color: '#34d399' }]}>🌿 생존 (승인 가능)</Text>
                            <Text style={styles.personChipName}>{elder.name} ({elder.relation})</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* 2nd Elder Approver Preview */}
                    <View style={styles.elderPreviewBox}>
                      <Text style={styles.elderPreviewTitle}>
                        🛡️ 2차 승인 담당 윗대 어르신: {activeElder.name} ({activeElder.relation}) · {activeElder.badge}
                      </Text>
                      <Text style={styles.elderPreviewDesc}>{activeElder.reason}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleP2pSendRequest}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.primaryActionText}>
                        📲 스마트폰 결연 요청 발송 (1단계 시작)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: PHONE B (수락자 스마트폰 뷰) */}
                {/* ------------------------------------------------------------- */}
                {p2pStep === 'step2_peer_agree' && (
                  <View style={styles.phoneScreenCard}>
                    <View style={styles.phoneTopSpeaker} />
                    <View style={styles.phoneHeader}>
                      <Text style={styles.phoneDeviceTag}>📱 스마트폰 2: 수신인({p2pReceiver?.name}) 화면</Text>
                      <Text style={styles.phoneStatusText}>알림 도착 (🔔 1건)</Text>
                    </View>

                    <View style={styles.requestAlertCard}>
                      <Text style={styles.requestAlertBadge}>새로운 결연 신청서 도착</Text>
                      <Text style={styles.requestAlertHeading}>
                        {p2pSender?.name}님이 회원님과의 결연을 요청했습니다
                      </Text>

                      <View style={styles.requestDetailTable}>
                        <View style={styles.requestDetailRow}>
                          <Text style={styles.requestDetailLabel}>신청인</Text>
                          <Text style={styles.requestDetailValue}>{p2pSender?.name} ({p2pSender?.gender === 'M' ? '남' : '여'}, {p2pSender?.relationship})</Text>
                        </View>
                        <View style={styles.requestDetailRow}>
                          <Text style={styles.requestDetailLabel}>신청 관계</Text>
                          <Text style={styles.requestDetailValue}>
                            {p2pRelationType === 'parent_child' ? '부모-자녀 (1촌)' : p2pRelationType === 'spouse' ? '부부 (0촌)' : '형제자매 (2촌)'}
                          </Text>
                        </View>
                        <View style={styles.requestDetailRow}>
                          <Text style={styles.requestDetailLabel}>산출 촌수</Text>
                          <Text style={styles.requestDetailValue}>
                            {p2pKinshipPreview ? p2pKinshipPreview.chonText : '산출 중'}
                          </Text>
                        </View>
                        <View style={styles.requestDetailRow}>
                          <Text style={styles.requestDetailLabel}>2차 승인자</Text>
                          <Text style={styles.requestDetailValue}>{activeElder.name} {activeElder.relation}</Text>
                        </View>
                      </View>

                      <Text style={styles.twoStepWarningNotice}>
                        ⚠️ [2중 확인 규정] 본인이 동의하면 가계도에 임시 등록(승인 대기)되며, 허위 방지를 위해 윗대 어르신({activeElder.name} {activeElder.relation})의 2차 승인이 진행됩니다.
                      </Text>

                      <View style={styles.phoneButtonsRow}>
                        <TouchableOpacity
                          style={styles.peerAgreeButton}
                          onPress={handleP2pPeerAgree}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.peerAgreeText}>🤝 상호 결연 1차 동의 서명</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.peerCancelButton}
                          onPress={() => setP2pStep('step1_request')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.peerCancelText}>거절/뒤로</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: ELDER APPROVAL SCREEN (스마트폰 3: 윗대 부모/조부 결재 화면) */}
                {/* ------------------------------------------------------------- */}
                {p2pStep === 'step3_elder_verify' && (
                  <View style={[styles.phoneScreenCard, styles.elderScreenCard]}>
                    <View style={styles.phoneTopSpeaker} />
                    <View style={styles.phoneHeader}>
                      <Text style={styles.elderDeviceTag}>
                        🛡️ 스마트폰 3: 윗대 어르신({activeElder.name} {activeElder.relation}) 공인 화면
                      </Text>
                      <Text style={styles.elderStatusTag}>2차 결재 대기 중</Text>
                    </View>

                    <View style={styles.elderVerificationBox}>
                      <Text style={styles.elderBoxTitle}>가문 직계 존속 친족 확인서</Text>
                      <Text style={styles.elderBoxSubtitle}>
                        허위·부정 결연을 방지하기 위해 윗대의 엄정한 확인이 필요합니다.
                      </Text>

                      <View style={styles.elderAuditCard}>
                        <Text style={styles.elderAuditRow}>
                          • 결연 신청: <Text style={styles.boldWhite}>{p2pSender?.name}</Text> ↔ <Text style={styles.boldWhite}>{p2pReceiver?.name}</Text>
                        </Text>
                        <Text style={styles.elderAuditRow}>
                          • 결연 유형: <Text style={styles.boldWhite}>{p2pRelationType === 'parent_child' ? '부자/모녀 (1촌)' : p2pRelationType === 'spouse' ? '부부 (0촌)' : '동기간 (2촌)'}</Text>
                        </Text>
                        <Text style={styles.elderAuditRow}>
                          • 상태: <Text style={styles.amberBadge}>1차 스마트폰 상호 동의 완료 (어르신 2차 승인 대기)</Text>
                        </Text>
                        <Text style={styles.elderNoticeQuote}>
                          "본 가문의 직계 윗대 어르신으로서, 신청인들이 실제 혈통 친족 또는 적법한 혼인 인척이 맞는지 확인 후 승인 결재하십시오."
                        </Text>
                      </View>

                      {/* Approval or Rejection Action Buttons */}
                      <View style={styles.elderActionsRow}>
                        <TouchableOpacity
                          style={styles.elderApproveButton}
                          onPress={() => handleElderApprove()}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.elderApproveText}>
                            🛡️ 직계 어르신 정식 공인 승인 (족보 영구 등재)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.elderRejectButton}
                          onPress={() => handleElderReject(undefined, '어르신 확인 결과 친족 혈통 불일치 (허위 결연 차단)')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.elderRejectText}>
                            ❌ 허위 결연 의심 반려 (가계도 왜곡 차단)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* ------------------------------------------------------------- */}
                {/* COMPLETED: DECENTRALIZED EXPANSION (연쇄 결연 안내) */}
                {/* ------------------------------------------------------------- */}
                {p2pStep === 'completed' && (
                  <View style={styles.completedCard}>
                    <Text style={styles.completedIcon}>🎉</Text>
                    <Text style={styles.completedTitle}>
                      2중 확인 완료: 정식 친족 족보 편입 성공!
                    </Text>
                    <Text style={styles.completedDesc}>
                      윗대 어르신의 공인으로 {p2pSender?.name}님과 {p2pReceiver?.name}님의 관계가 가계도에 영구 반영되었습니다.
                      옵시디언 그래프 뷰에서 선명한 에메랄드 그린 실선과 [🛡️ 어르신 공인] 배지를 확인하실 수 있습니다.
                    </Text>

                    {/* Decentralized Chain Expansion Button */}
                    <View style={styles.chainExpansionBox}>
                      <Text style={styles.chainExpansionTitle}>
                        🔗 분산 결연의 핵심: 연쇄 결연 확장 (Decentralized Propagation)
                      </Text>
                      <Text style={styles.chainExpansionDesc}>
                        이제 공식 편입된 {p2pSender?.name}님이 자신의 스마트폰을 열고, 또 다른 제3자(자녀 또는 배우자)와 계속해서 P2P 결연을 맺어 나갈 수 있습니다!
                      </Text>
                      <TouchableOpacity
                        style={styles.chainExpandButton}
                        onPress={() => {
                          setP2pStep('step1_request');
                          setP2pSenderId(p2pSender?.id || 'pat-2-1');
                          showToast(`${p2pSender?.name}님의 스마트폰에서 다음 친족 결연을 진행합니다.`, 'success');
                        }}
                      >
                        <Text style={styles.chainExpandText}>
                          ➕ {p2pSender?.name}님의 스마트폰에서 또 다른 친족과 결연 맺기
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.closeViewGraphButton}
                      onPress={onClose}
                    >
                      <Text style={styles.closeViewGraphText}>🌐 가계도 옵시디언 그래프 확인하러 가기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB: PRESET SCENARIOS (1초 퀵 검증 시나리오 - 정상 2건 + 허위 차단 1건) */}
            {/* ========================================================================= */}
            {subTab === 'presets' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>⚡ 1초 퀵 분산 결연 & 보안 검증 시나리오</Text>
                <Text style={styles.sectionSubHeading}>
                  클릭 한 번으로 2인 P2P 신청부터 직계 존속 어르신 승인 및 허위 결연 차단까지 즉시 테스트할 수 있습니다.
                </Text>

                {/* Scenario 1: 친가 방계 부자 결연 */}
                <View style={styles.presetCard}>
                  <View style={styles.presetHeaderRow}>
                    <Text style={styles.presetTagPaternal}>시나리오 1: 친가 방계 결연</Text>
                    <Text style={styles.presetStatusApproved}>정상 혈통 승인</Text>
                  </View>
                  <Text style={styles.presetTitle}>
                    백부(김영호, 62세) ↔ 미등록 종친(김태성, 34세) 부자(父子) 결연
                  </Text>
                  <Text style={styles.presetDesc}>
                    • 1단계: 김태성이 스마트폰으로 백부 김영호에게 '부자(1촌)' 관계 P2P 결연 신청 및 상호 동의

                    • 2단계: 가문 생존 최고령 어르신 친조모 박순자 여사(88세)가 친족 확인 후 [정식 공인 승인] (※ 조부 김태호 작고로 인하여 생존 직계 어르신 승인)

                    • 결과: 친가 붉은 계보 및 본인(김준혁)과 4촌 사촌 형제 관계로 가계도 실시간 확장
                  </Text>
                  <TouchableOpacity
                    style={styles.presetRunButton}
                    onPress={() => handleRunPresetScenario(1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetRunButtonText}>⚡ 시나리오 1 P2P 결연 실행</Text>
                  </TouchableOpacity>
                </View>

                {/* Scenario 2: 인척 혼인 결연 */}
                <View style={styles.presetCard}>
                  <View style={styles.presetHeaderRow}>
                    <Text style={styles.presetTagInlaw}>시나리오 2: 인척 혼인 결연</Text>
                    <Text style={styles.presetStatusApproved}>정상 혼인 승인</Text>
                  </View>
                  <Text style={styles.presetTitle}>
                    남동생(김도윤, 31세) ↔ 예비 신부(박지민, 29세) 부부(夫婦) 결연
                  </Text>
                  <Text style={styles.presetDesc}>
                    • 1단계: 박지민과 김도윤이 각자 스마트폰으로 부부(0촌) 결연 상호 서명

                    • 2단계: 생존 직계 부친 김영수(64세)가 혼인 성립 확인 후 [정식 승인]

                    • 결과: 본인(김준혁)과 '제수씨' 인척 관계로 에메랄드 발광선 편입
                  </Text>
                  <TouchableOpacity
                    style={styles.presetRunButton}
                    onPress={() => handleRunPresetScenario(2)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetRunButtonText}>⚡ 시나리오 2 P2P 결연 실행</Text>
                  </TouchableOpacity>
                </View>

                {/* Scenario 3: 허위/부정 결연 차단 실증 */}
                <View style={[styles.presetCard, styles.presetCardFraud]}>
                  <View style={styles.presetHeaderRow}>
                    <Text style={styles.presetTagFraud}>🚨 시나리오 3: 보안 검증 실증</Text>
                    <Text style={styles.presetStatusReject}>허위 결연 차단</Text>
                  </View>
                  <Text style={styles.presetTitle}>
                    정체불명 미확인 인물 ↔ 큰이모(이정옥) 모녀 결연 시도 차단
                  </Text>
                  <Text style={styles.presetDesc}>
                    • 문제 상황: 실제 친족이 아닌 두 사람이 거짓으로 결연을 시도하는 경우

                    • 2차 방어선: 생존 외가 최고 어르신 외조모(권정자, 85세)가 신원 불일치로 [❌ 허위 결연 반려] 클릭

                    • 결과: 족보 오염이 사전에 100% 차단되며 가계도 훼손 방지
                  </Text>
                  <TouchableOpacity
                    style={styles.presetRunButtonFraud}
                    onPress={() => handleRunPresetScenario(3)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetRunButtonFraudText}>🚨 허위 결연 차단 프로세스 실증</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB: ELDER INBOX (어르신 결재함 & 대기 목록) */}
            {/* ========================================================================= */}
            {subTab === 'elder_inbox' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>🛡️ 윗대 직계 존속 어르신 결재함</Text>
                <Text style={styles.sectionSubHeading}>
                  1차 스마트폰 P2P 상호 서명이 완료되어 어르신의 2차 친족 확인을 기다리는 목록입니다.
                </Text>

                {pendingElderLinks.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>✅</Text>
                    <Text style={styles.emptyText}>현재 대기 중인 어르신 승인 건이 없습니다.</Text>
                    <Text style={styles.emptySubText}>
                      P2P 결연을 신청하거나 퀵 시나리오를 실행하면 이곳에 결재 건이 표시됩니다.
                    </Text>
                  </View>
                ) : (
                  pendingElderLinks.map((link) => {
                    const pA = allMembers.find((m) => m.id === link.personAId);
                    const pB = allMembers.find((m) => m.id === link.personBId) || unconnectedMembers.find((m) => m.id === link.personBId);

                    return (
                      <View key={link.id} style={styles.pendingCard}>
                        <View style={styles.pendingCardHeader}>
                          <Text style={styles.pendingStatusBadge}>⏳ 윗대 2차 승인 대기 중</Text>
                          <Text style={styles.pendingElderTarget}>담당 어르신: {link.approverElderName} ({link.approverElderRelation})</Text>
                        </View>

                        <Text style={styles.pendingTitle}>
                          {pA?.name} ↔ {pB?.name} ({link.relationType === 'parent_child' ? '부자/모녀 (1촌)' : link.relationType === 'spouse' ? '부부 (0촌)' : '동기간 (2촌)'})
                        </Text>
                        <Text style={styles.pendingNote}>{link.note}</Text>

                        <View style={styles.pendingButtonsRow}>
                          <TouchableOpacity
                            style={styles.pendingApproveBtn}
                            onPress={() => handleElderApprove(link.id)}
                          >
                            <Text style={styles.pendingApproveText}>🛡️ 어르신 공인 승인</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.pendingRejectBtn}
                            onPress={() => handleElderReject(link.id, '친족 혈통 불일치 (허위 결연 차단)')}
                          >
                            <Text style={styles.pendingRejectText}>❌ 허위 의심 반려</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* Approved Links History */}
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>
                    📜 최근 어르신 공인 완료된 친족 결연 ({approvedLinks.length}건)
                  </Text>
                  {approvedLinks.map((link) => {
                    const pA = allMembers.find((m) => m.id === link.personAId);
                    const pB = allMembers.find((m) => m.id === link.personBId);
                    return (
                      <View key={link.id} style={styles.historyRow}>
                        <View>
                          <Text style={styles.historyName}>
                            {pA?.name} ↔ {pB?.name} ({link.relationType})
                          </Text>
                          <Text style={styles.historyMeta}>
                            공인 어르신: {link.approverElderName || '직계 존속'} · 일자: {link.establishedDate}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.disconnectMiniBtn}
                          onPress={() => onDisconnect(link.id)}
                        >
                          <Text style={styles.disconnectMiniText}>결연 해제</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB: CENTRALIZED CUSTOM LINKER (중앙 집중 편찬 모드) */}
            {/* ========================================================================= */}
            {subTab === 'central_custom' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>🏛️ 중앙 족보 편찬 관리자 직권 결연</Text>
                <Text style={styles.sectionSubHeading}>
                  관리자 권한으로 가계도 인물 간의 관계를 즉시 맺고 족보에 직권 편찬합니다.
                </Text>

                {/* Person A */}
                <Text style={styles.fieldLabel}>기준 인물 (A)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {allMembers.slice(0, 10).map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.personChip,
                        selectedPersonAId === m.id && styles.personChipActive,
                      ]}
                      onPress={() => setSelectedPersonAId(m.id)}
                    >
                      <Text style={styles.personChipName}>{m.name} ({m.relationship})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Person B */}
                <Text style={styles.fieldLabel}>결연 대상 인물 (B)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {unconnectedMembers.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.personChip,
                        selectedPersonBId === m.id && styles.personChipActive,
                      ]}
                      onPress={() => setSelectedPersonBId(m.id)}
                    >
                      <Text style={styles.personChipBadge}>미등록</Text>
                      <Text style={styles.personChipName}>{m.name} ({m.relationship})</Text>
                    </TouchableOpacity>
                  ))}
                  {allMembers.filter((m) => m.id !== selectedPersonAId).slice(0, 6).map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.personChip,
                        selectedPersonBId === m.id && styles.personChipActive,
                      ]}
                      onPress={() => setSelectedPersonBId(m.id)}
                    >
                      <Text style={styles.personChipName}>{m.name} ({m.relationship})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Relation Type */}
                <Text style={styles.fieldLabel}>편찬 관계 유형</Text>
                <View style={styles.relationTypeGrid}>
                  {[
                    { key: 'parent_child', label: '부모-자녀 (1촌)' },
                    { key: 'spouse', label: '부부 (0촌)' },
                    { key: 'sibling', label: '형제자매 (2촌)' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.relationTypeCard,
                        selectedRelationType === item.key && styles.relationTypeCardActive,
                      ]}
                      onPress={() => setSelectedRelationType(item.key as RelationType)}
                    >
                      <Text
                        style={[
                          styles.relationTypeTitle,
                          selectedRelationType === item.key && styles.relationTypeTitleActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    const res = onConnect(selectedPersonAId, selectedPersonBId, selectedRelationType);
                    showToast(res.message, res.success ? 'success' : 'error');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>⚡ 중앙 직권 결연 편찬 완료</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB: CENTRALIZED MANAGE (중앙 편찬 관리) */}
            {/* ========================================================================= */}
            {subTab === 'central_manage' && (
              <View style={styles.sectionBlock}>
                <View style={styles.manageHeaderRow}>
                  <Text style={styles.sectionHeading}>
                    총 형성된 결연 ({establishedLinks.length}건)
                  </Text>
                  <TouchableOpacity style={styles.resetAllBtn} onPress={onResetAll}>
                    <Text style={styles.resetAllBtnText}>⚠️ 전체 결연 초기화</Text>
                  </TouchableOpacity>
                </View>

                {establishedLinks.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>현재 등록된 결연이 없습니다.</Text>
                  </View>
                ) : (
                  establishedLinks.map((link) => {
                    const pA = allMembers.find((m) => m.id === link.personAId);
                    const pB = allMembers.find((m) => m.id === link.personBId);
                    return (
                      <View key={link.id} style={styles.manageLinkCard}>
                        <View>
                          <Text style={styles.manageLinkNames}>
                            {pA?.name} ↔ {pB?.name}
                          </Text>
                          <Text style={styles.manageLinkMeta}>
                            형태: {link.formationMode === 'decentralized_p2p' ? '📱 분산 P2P' : '🏛️ 중앙 편찬'} · 상태: {link.status || '승인'} · {link.establishedDate}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.disconnectBtn}
                          onPress={() => onDisconnect(link.id)}
                        >
                          <Text style={styles.disconnectBtnText}>해제</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  studioContainer: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '92%',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    fontSize: 26,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  closeButtonText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '700',
  },

  // Operating Mode Switcher
  operatingModeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modeSwitcherLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  activeModeIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  modeButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    gap: 10,
  },
  modeButtonActiveDecentralized: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  modeButtonActiveCentralized: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  modeButtonIcon: {
    fontSize: 22,
  },
  modeButtonTextWrap: {
    flex: 1,
  },
  modeButtonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  modeButtonTitleActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  modeButtonSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  activeModePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  activeModePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
  },

  // Toast
  toastBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 8,
  },
  toastSuccess: {
    backgroundColor: '#065f46',
  },
  toastWarning: {
    backgroundColor: '#854d0e',
  },
  toastError: {
    backgroundColor: '#991b1b',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },

  // Sub Tab Bar
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 16,
    gap: 6,
  },
  subTabItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#10b981',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  subTabTextActive: {
    color: '#10b981',
    fontWeight: '800',
  },

  // Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  sectionSubHeading: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Protocol Explain Box
  protocolExplainBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  protocolExplainTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 4,
  },
  protocolExplainDesc: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 17,
  },

  // Stepper
  progressStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  stepIndicator: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepIndicatorNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 13,
    fontWeight: '800',
  },
  stepIndicatorCurrent: {
    opacity: 1,
  },
  stepIndicatorDone: {
    opacity: 1,
  },
  stepIndicatorLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
  stepConnectorLine: {
    width: 30,
    height: 2,
    backgroundColor: '#334155',
    marginBottom: 16,
  },

  // Phone Screen Card
  phoneScreenCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  phoneTopSpeaker: {
    width: 50,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 6,
  },
  phoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  phoneDeviceTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  phoneStatusText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  phoneScreenTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  phoneScreenDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginTop: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  personChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
    alignItems: 'center',
  },
  personChipActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  personChipBadge: {
    fontSize: 9,
    color: '#f59e0b',
    fontWeight: '800',
    marginBottom: 2,
  },
  personChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  relationTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  relationTypeCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  relationTypeCardActive: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  relationTypeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  relationTypeTitleActive: {
    color: '#34d399',
  },
  relationTypeDesc: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  elderPreviewBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginTop: 4,
  },
  elderPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
  },
  elderPreviewDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
  primaryActionButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Phone B Alert Card
  requestAlertCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#38bdf8',
    gap: 10,
  },
  requestAlertBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
  },
  requestAlertHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  requestDetailTable: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  requestDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestDetailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  requestDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  twoStepWarningNotice: {
    fontSize: 11.5,
    color: '#fbbf24',
    lineHeight: 16,
  },
  phoneButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  peerAgreeButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  peerAgreeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  peerCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  peerCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },

  // Elder Screen Card
  elderScreenCard: {
    borderColor: '#f59e0b',
  },
  elderDeviceTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
  },
  elderStatusTag: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '700',
  },
  elderVerificationBox: {
    gap: 10,
  },
  elderBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  elderBoxSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
  },
  elderAuditCard: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 6,
  },
  elderAuditRow: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  boldWhite: {
    fontWeight: '800',
    color: '#ffffff',
  },
  amberBadge: {
    color: '#f59e0b',
    fontWeight: '800',
  },
  elderNoticeQuote: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 6,
  },
  elderActionsRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  elderApproveButton: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  elderApproveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  elderRejectButton: {
    backgroundColor: '#991b1b',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  elderRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fecaca',
  },

  // Completed Card
  completedCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    gap: 12,
  },
  completedIcon: {
    fontSize: 36,
  },
  completedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  completedDesc: {
    fontSize: 12,
    color: '#a7f3d0',
    textAlign: 'center',
    lineHeight: 18,
  },
  chainExpansionBox: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  chainExpansionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },
  chainExpansionDesc: {
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  chainExpandButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  chainExpandText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeViewGraphButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeViewGraphText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Preset Card
  presetCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  presetCardFraud: {
    borderColor: '#ef4444',
    backgroundColor: '#1c1917',
  },
  presetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetTagPaternal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  presetTagInlaw: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
  },
  presetTagFraud: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  presetStatusApproved: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: '700',
  },
  presetStatusReject: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '800',
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  presetDesc: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 17,
  },
  presetRunButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  presetRunButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  presetRunButtonFraud: {
    backgroundColor: '#991b1b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  presetRunButtonFraudText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Elder Inbox
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    gap: 8,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pendingStatusBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
  },
  pendingElderTarget: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  pendingNote: {
    fontSize: 11,
    color: '#94a3b8',
  },
  pendingButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  pendingApproveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  pendingApproveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  pendingRejectBtn: {
    paddingHorizontal: 14,
    backgroundColor: '#991b1b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  pendingRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  // History
  historySection: {
    marginTop: 14,
    gap: 8,
  },
  historySectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 8,
  },
  historyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  historyMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  disconnectMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  disconnectMiniText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
  },

  // Centralized Manage
  manageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#7f1d1d',
    borderRadius: 6,
  },
  resetAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fecaca',
  },
  manageLinkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manageLinkNames: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  manageLinkMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#dc2626',
    borderRadius: 6,
  },
  disconnectBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});
