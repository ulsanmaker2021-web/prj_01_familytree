import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  GenealogyMaster,
  MasterVerificationRequest,
  MasterRequestStatus,
} from '../types/genealogyMaster';
import {
  getAllMasters,
  getAllRequests,
  updateMasterRequestStatus,
} from '../utils/genealogyMasterData';

interface MasterTrackingDashboardModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMasterToRequest?: (master: GenealogyMaster) => void;
}

export const MasterTrackingDashboardModal: React.FC<MasterTrackingDashboardModalProps> = ({
  visible,
  onClose,
  onSelectMasterToRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'masters'>('requests');
  const [requests, setRequests] = useState<MasterVerificationRequest[]>(getAllRequests());
  const [masters, setMasters] = useState<GenealogyMaster[]>(getAllMasters());
  const [searchQuery, setSearchQuery] = useState('');

  // Reload requests when modal becomes visible or updated
  const refreshRequests = () => {
    setRequests(getAllRequests());
  };

  // Demo simulator to advance a request status
  const handleAdvanceStatus = (reqId: string, currentStatus: MasterRequestStatus) => {
    let nextStatus: MasterRequestStatus = 'document_verifying';
    let nextNote = '';

    if (currentStatus === 'submitted' || currentStatus === 'reviewing') {
      nextStatus = 'document_verifying';
      nextNote = '【마스터 2차 소견】: 제적등본 대조를 완료하고, 문중 대종회 소장 대동보(大同譜) 실물 수기 대조에 착수하였습니다.';
    } else if (currentStatus === 'document_verifying') {
      nextStatus = 'approved';
      nextNote = '【마스터 최종 공인 완료】: 대종회 대동보 원전 대조 결과, 부친 29세(赫) 직계 자녀로서 30세(29세손) 계보가 100% 명확히 입증되었습니다. 가문 공인 등재 번호가 정식 교부되었습니다.';
    }

    updateMasterRequestStatus(reqId, nextStatus, nextNote);
    refreshRequests();
  };

  const filteredMasters = masters.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.clanName.toLowerCase().includes(q) ||
      m.organization.toLowerCase().includes(q)
    );
  });

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

  const getTimelineSteps = (currentStatus: MasterRequestStatus) => {
    const steps = [
      { key: 'submitted', label: '1. 신청 접수' },
      { key: 'paid', label: '2. 결제 완료' },
      { key: 'reviewing', label: '3. 1차 서류 검토' },
      { key: 'document_verifying', label: '4. 대동보 원전 실사' },
      { key: 'approved', label: '5. 가문 공인 완료' },
    ];

    let activeIndex = 1;
    if (currentStatus === 'submitted') activeIndex = 1;
    else if (currentStatus === 'reviewing') activeIndex = 2;
    else if (currentStatus === 'document_verifying') activeIndex = 3;
    else if (currentStatus === 'approved') activeIndex = 4;

    return { steps, activeIndex };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>전문가 유료 서비스</Text>
              </View>
              <Text style={styles.headerTitle}>🏛️ 가문 족보 마스터 정밀 감정 센터</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
              onPress={() => {
                refreshRequests();
                setActiveTab('requests');
              }}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'requests' && styles.tabBtnTextActive]}
              >
                📋 나의 족보 감정 의뢰 현황 ({requests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'masters' && styles.tabBtnActive]}
              onPress={() => setActiveTab('masters')}
            >
              <Text
                style={[styles.tabBtnText, activeTab === 'masters' && styles.tabBtnTextActive]}
              >
                👥 전국 성씨별 족보 마스터 명부 ({masters.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {activeTab === 'requests' ? (
              // ================= TAB 1: MY REQUESTS =================
              <View style={styles.tabContent}>
                <View style={styles.noticeBanner}>
                  <Text style={styles.noticeBannerTitle}>
                    💡 순한글 성명 및 종교적 작명 인물의 수기 실사 진행 안내
                  </Text>
                  <Text style={styles.noticeBannerText}>
                    성명에 전통 항렬자(돌림자)가 없더라도, 성씨별 공인 족보 마스터가 문중 대동보(大同譜) 실물을 직접 대조하여 정통 세손을 확정하고 가문 공인 번호를 교부합니다.
                  </Text>
                </View>

                {requests.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>현재 접수된 족보 감정 의뢰가 없습니다.</Text>
                    <Text style={styles.emptySubText}>
                      가계도의 인물 상세 창에서 '족보 마스터 정밀 감정 의뢰'를 신청하실 수 있습니다.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.requestsList}>
                    {requests.map((req) => {
                      const statusInfo = getStatusBadge(req.status);
                      const { steps, activeIndex } = getTimelineSteps(req.status);

                      return (
                        <View key={req.id} style={styles.requestCard}>
                          {/* Top Row: ID, Person, Status */}
                          <View style={styles.requestTopRow}>
                            <View style={styles.requestMainInfo}>
                              <Text style={styles.requestIdText}>{req.id}</Text>
                              <Text style={styles.requestPersonName}>
                                {req.memberName} ({req.memberClan})
                              </Text>
                              <Text style={styles.requestServiceTier}>
                                {req.serviceTier === 'basic'
                                  ? '기본 제적 대조'
                                  : req.serviceTier === 'standard'
                                  ? '대동보 원전 수기 실사 (추천)'
                                  : '종중 공인 증서 발급'}{' '}
                                · {req.serviceFee.toLocaleString()}원 결제완료
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: statusInfo.bg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  { color: statusInfo.color },
                                ]}
                              >
                                {statusInfo.text}
                              </Text>
                            </View>
                          </View>

                          {/* Visual Progress Timeline */}
                          <View style={styles.timelineBox}>
                            <View style={styles.timelineStepsRow}>
                              {steps.map((step, idx) => {
                                const isDone = idx <= activeIndex;
                                const isCurrent = idx === activeIndex;

                                return (
                                  <View key={step.key} style={styles.timelineStepCol}>
                                    <View
                                      style={[
                                        styles.stepCircle,
                                        isDone && styles.stepCircleDone,
                                        isCurrent && styles.stepCircleCurrent,
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          styles.stepCircleText,
                                          isDone && styles.stepCircleTextDone,
                                        ]}
                                      >
                                        {isDone ? '✓' : idx + 1}
                                      </Text>
                                    </View>
                                    <Text
                                      style={[
                                        styles.stepLabel,
                                        isCurrent && styles.stepLabelCurrent,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {step.label}
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>
                          </View>

                          {/* Master Info & Contact */}
                          <View style={styles.masterContactBar}>
                            <Text style={styles.masterContactLabel}>담당 족보 마스터 :</Text>
                            <Text style={styles.masterContactValue}>
                              {req.masterName} 수석위원장 ({req.masterOrganization})
                            </Text>
                            <Text style={styles.masterEmailText}>✉️ {req.masterEmail}</Text>
                          </View>

                          {/* Master Review Note Box */}
                          {req.masterReviewNote ? (
                            <View style={styles.reviewNoteBox}>
                              <Text style={styles.reviewNoteTitle}>📝 족보 마스터 실시간 소견</Text>
                              <Text style={styles.reviewNoteContent}>{req.masterReviewNote}</Text>
                            </View>
                          ) : null}

                          {/* If Approved: Certificate Card */}
                          {req.status === 'approved' && req.issuedCertificateNo && (
                            <View style={styles.certSuccessBox}>
                              <View style={styles.certSuccessHeader}>
                                <Text style={styles.certSuccessTitle}>
                                  📜 가문 대동보 공식 등재 공인 증서 발급
                                </Text>
                                <Text style={styles.certNoText}>{req.issuedCertificateNo}</Text>
                              </View>
                              <Text style={styles.certDetailText}>
                                • 공인 확정 대수: {req.confirmedClanGen || 30}세(世) · 시조 기준{' '}
                                {req.confirmedDescendantOrder || 29}세손(孫)
                              </Text>
                              <Text style={styles.certDetailText}>
                                • 심의 의결: {req.masterOrganization} 전원 일치 공인
                              </Text>
                            </View>
                          )}

                          {/* Demo Simulator Action Button */}
                          {req.status !== 'approved' && (
                            <View style={styles.simulatorRow}>
                              <TouchableOpacity
                                style={styles.simulatorBtn}
                                onPress={() => handleAdvanceStatus(req.id, req.status)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.simulatorBtnText}>
                                  ⚡ [데모 시뮬레이션] 마스터 다음 단계 심사 진행 (실사 ➔ 공인완료)
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              // ================= TAB 2: MASTERS DIRECTORY =================
              <View style={styles.tabContent}>
                {/* Search Bar */}
                <View style={styles.searchBarBox}>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="성씨, 본관, 종친회 기관명 검색 (예: 경주 김씨, 전주 이씨, 안동)"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Masters List */}
                <View style={styles.mastersGrid}>
                  {filteredMasters.map((m) => (
                    <View key={m.id} style={styles.masterCard}>
                      <View style={styles.masterCardHeader}>
                        <View style={styles.masterCardAvatar}>
                          <Text style={styles.masterCardAvatarText}>🏛️</Text>
                        </View>
                        <View style={styles.masterCardInfoCol}>
                          <View style={styles.masterNameLine}>
                            <Text style={styles.masterCardName}>{m.name}</Text>
                            {m.hanja && <Text style={styles.masterCardHanja}>({m.hanja})</Text>}
                            <View style={styles.masterRatingPill}>
                              <Text style={styles.masterRatingPillText}>★ {m.rating}</Text>
                            </View>
                          </View>
                          <Text style={styles.masterCardOrg}>{m.organization}</Text>
                          <Text style={styles.masterCardRole}>
                            {m.roleTitle} · 전문 경력 {m.experienceYears}년
                          </Text>
                        </View>
                      </View>

                      <View style={styles.clanTagRow}>
                        <View style={styles.clanTag}>
                          <Text style={styles.clanTagText}>{m.clanName}</Text>
                        </View>
                        <Text style={styles.verifiedCountText}>
                          누적 공인 {m.verifiedCount.toLocaleString()}건
                        </Text>
                      </View>

                      <Text style={styles.masterCardIntro}>{m.intro}</Text>

                      <View style={styles.specialtiesBox}>
                        <Text style={styles.specialtiesLabel}>전문 고증 분야:</Text>
                        <View style={styles.specialtiesTagsRow}>
                          {m.specialties.map((spec, si) => (
                            <View key={si} style={styles.specialtyTag}>
                              <Text style={styles.specialtyTagText}>• {spec}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.masterCardFooter}>
                        <View style={styles.masterContactCol}>
                          <Text style={styles.masterPhone}>📞 {m.phone}</Text>
                          <Text style={styles.masterEmail}>✉️ {m.email}</Text>
                        </View>
                        {onSelectMasterToRequest && (
                          <TouchableOpacity
                            style={styles.requestDirectBtn}
                            onPress={() => {
                              onClose();
                              onSelectMasterToRequest(m);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.requestDirectBtnText}>이 마스터에게 의뢰 ➔</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
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
    maxWidth: 860,
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
  headerBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  tabBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  body: {
    padding: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  noticeBanner: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 4,
  },
  noticeBannerText: {
    fontSize: 11.5,
    color: '#075985',
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  requestsList: {
    gap: 14,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  requestMainInfo: {
    flex: 1,
  },
  requestIdText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  requestPersonName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  requestServiceTier: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  timelineBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timelineStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStepCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: '#059669',
  },
  stepCircleCurrent: {
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.15 }],
  },
  stepCircleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepCircleTextDone: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: '#0284c7',
    fontWeight: '800',
  },
  masterContactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  masterContactLabel: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  masterContactValue: {
    fontSize: 11.5,
    color: '#0f172a',
    fontWeight: '700',
  },
  masterEmailText: {
    fontSize: 11,
    color: '#64748b',
  },
  reviewNoteBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    marginBottom: 10,
  },
  reviewNoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    marginBottom: 4,
  },
  reviewNoteContent: {
    fontSize: 11.5,
    color: '#78350f',
    lineHeight: 16,
  },
  certSuccessBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 12,
    marginBottom: 10,
  },
  certSuccessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
    paddingBottom: 4,
  },
  certSuccessTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  certNoText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  certDetailText: {
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },
  simulatorRow: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  simulatorBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  simulatorBtnText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '700',
  },
  // Tab 2 Masters Directory Styles
  searchBarBox: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
  },
  mastersGrid: {
    gap: 14,
  },
  masterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  masterCardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  masterCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterCardAvatarText: {
    fontSize: 22,
  },
  masterCardInfoCol: {
    flex: 1,
  },
  masterNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  masterCardHanja: {
    fontSize: 13,
    color: '#64748b',
  },
  masterRatingPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  masterRatingPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  masterCardOrg: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 1,
  },
  masterCardRole: {
    fontSize: 11.5,
    color: '#64748b',
  },
  clanTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clanTag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#bbf7d0',
  },
  clanTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  verifiedCountText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  masterCardIntro: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginBottom: 10,
  },
  specialtiesBox: {
    marginBottom: 10,
  },
  specialtiesLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 4,
  },
  specialtiesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  specialtyTagText: {
    fontSize: 10.5,
    color: '#475569',
  },
  masterCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 4,
  },
  masterContactCol: {},
  masterPhone: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  masterEmail: {
    fontSize: 11,
    color: '#64748b',
  },
  requestDirectBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  requestDirectBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
