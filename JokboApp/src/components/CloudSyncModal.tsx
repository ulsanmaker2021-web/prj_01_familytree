import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { generateSyncPackage, importSyncPackage } from '../utils/deviceSyncHelper';
import {
  getCloudSyncStatus,
  saveAllToCloudDatabase,
  fetchAllFromCloudDatabase,
} from '../services/unifiedCloudSyncService';
import { formatPhoneNumber } from '../utils/securityAuth';

interface CloudSyncModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ visible, onClose }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  const { currentUser } = useAuthStore();
  const { members, establishedLinks } = useFamilyStore();

  const [syncUrl, setSyncUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrFallbackUrl, setQrFallbackUrl] = useState('');
  const [qrImageError, setQrImageError] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean; isSuccess?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && currentUser) {
      const res = generateSyncPackage(currentUser.id);
      if (res.success && res.syncUrl) {
        setSyncUrl(res.syncUrl);
        setQrCodeUrl(res.qrCodeUrl || '');
        setQrFallbackUrl(res.qrCodeFallbackUrl || '');
        setQrImageError(false);
      }
    }
  }, [visible, currentUser, members, establishedLinks]);

  const showToast = (text: string, isError = false, isSuccess = false) => {
    setStatusMsg({ text, isError, isSuccess });
    setTimeout(() => {
      setStatusMsg(null);
    }, 6000);
  };

  const handleCopyLink = () => {
    if (!syncUrl) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(syncUrl);
        setCopied(true);
        showToast('📋 스마트폰 전송용 동기화 링크가 복사되었습니다! 카카오톡이나 문자로 전송하세요.', false, true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        showToast('클립보드 복사 기능을 지원하지 않는 브라우저입니다.', true);
      }
    } catch (e) {
      showToast('링크 복사 중 오류가 발생했습니다.', true);
    }
  };

  // 강제 클라우드 DB 업로드 (무한대기 원천 차단: 최대 4.5초 긴급 해제 보장)
  const handleForceUpload = async () => {
    if (!currentUser) {
      showToast('로그인된 계정 정보가 없습니다.', true);
      return;
    }
    setIsLoading(true);
    const emergencyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4500);

    try {
      const res = await saveAllToCloudDatabase(currentUser, members, establishedLinks);
      clearTimeout(emergencyTimer);
      if (res.success) {
        showToast(`☁️ [업로드 성공] ${currentUser.name} 님의 가계도(${members.length}명)가 클라우드 DB에 동기화되었습니다!`, false, true);
        // 패키지 및 QR 코드 갱신
        const pkg = generateSyncPackage(currentUser.id);
        if (pkg.success && pkg.syncUrl) {
          setSyncUrl(pkg.syncUrl);
          setQrCodeUrl(pkg.qrCodeUrl || '');
          setQrFallbackUrl(pkg.qrCodeFallbackUrl || '');
          setQrImageError(false);
        }
      } else {
        showToast(res.message, true);
      }
    } catch (e: any) {
      clearTimeout(emergencyTimer);
      showToast('클라우드 DB 저장 지연: ' + (e?.message || '네트워크 응답 없음'), true);
    } finally {
      clearTimeout(emergencyTimer);
      setIsLoading(false);
    }
  };

  // 클라우드 DB에서 최신 데이터 내려받기 (무한대기 원천 차단: 최대 4.5초 긴급 해제 보장)
  const handleForceDownload = async () => {
    if (!currentUser || !currentUser.phone) {
      showToast('로그인된 전화번호가 없습니다.', true);
      return;
    }
    setIsLoading(true);
    const emergencyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4500);

    try {
      const res = await fetchAllFromCloudDatabase(currentUser.phone);
      clearTimeout(emergencyTimer);
      if (res.success && res.familyTree) {
        showToast(`☁️ [다운로드 성공] 클라우드 DB에서 최신 가계도(${res.familyTree.length}명)를 수신하여 동기화했습니다!`, false, true);
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location) {
            window.location.reload();
          }
        }, 1200);
      } else {
        showToast(res.message || '클라우드 DB에 저장된 데이터가 없습니다.', true);
      }
    } catch (e: any) {
      clearTimeout(emergencyTimer);
      showToast('클라우드 DB 다운로드 오류: ' + (e?.message || '연결 실패'), true);
    } finally {
      clearTimeout(emergencyTimer);
      setIsLoading(false);
    }
  };

  const cloudStatus = getCloudSyncStatus();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.titleIcon}>☁️</Text>
              <View>
                <Text style={styles.headerTitle}>가문 가계도 클라우드 DB 동기화</Text>
                <Text style={styles.headerSubtitle}>PC ↔ 스마트폰 실시간 데이터베이스 자동 동기화</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          {statusMsg && (
            <View
              style={[
                styles.toastBox,
                statusMsg.isError && styles.toastBoxError,
                statusMsg.isSuccess && styles.toastBoxSuccess,
              ]}
            >
              <Text
                style={[
                  styles.toastText,
                  statusMsg.isError && styles.toastTextError,
                  statusMsg.isSuccess && styles.toastTextSuccess,
                ]}
              >
                {statusMsg.text}
              </Text>
            </View>
          )}

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
            {/* Status Summary Banner */}
            <View style={styles.statusBanner}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>🌐 연결 상태:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {cloudStatus.isConfigured
                      ? `🟢 클라우드 DB 연동됨 (${cloudStatus.provider.toUpperCase()})`
                      : '🟡 로컬 브라우저 저장 모드'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>👤 등재 인물:</Text>
                <Text style={styles.statusValue}>
                  {currentUser?.name || '등록 회원'} (부: {currentUser?.fatherName || '최헌호'} · 모: {currentUser?.motherName || '김경순'})
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>🌳 현재 가계도:</Text>
                <Text style={styles.statusValue}>
                  총 <Text style={{ fontWeight: '800', color: '#0284c7' }}>{members.length}명</Text> (부모 결합선 1건 포함)
                </Text>
              </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>📱 스마트폰 즉시 동기화 QR 코드</Text>
              <Text style={styles.qrDesc}>
                스마트폰의 <Text style={{ fontWeight: '800', color: '#0f172a' }}>기본 카메라</Text>로 아래 QR 코드를 비추면,
                별도 타이핑 없이 <Text style={{ fontWeight: '800', color: '#0284c7' }}>부모님(최헌호·김경순)</Text> 정보가 스마트폰 화면에 즉시 나타납니다!
              </Text>

              {qrCodeUrl ? (
                <View style={styles.qrImageWrapper}>
                  <Image
                    source={{ uri: qrImageError && qrFallbackUrl ? qrFallbackUrl : qrCodeUrl }}
                    onError={() => {
                      if (!qrImageError && qrFallbackUrl) {
                        setQrImageError(true);
                      }
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrScanHint}>📷 스마트폰 기본 카메라로 비춰주세요 (1초 즉시 동기화)</Text>
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="small" color="#0284c7" />
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>QR 코드를 생성하는 중...</Text>
                </View>
              )}

              {/* Copy URL Button */}
              <TouchableOpacity
                style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Text style={styles.copyBtnText}>
                  {copied ? '✅ 동기화 주소 복사 완료!' : '📋 스마트폰 전송용 동기화 링크 복사'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Cloud Sync Action Buttons */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnUpload]}
                onPress={handleForceUpload}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.actionBtnText, { marginLeft: 8 }]}>클라우드 DB 동기화 확인 중...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.actionBtnIcon}>☁️</Text>
                    <Text style={styles.actionBtnText}>지금 즉시 클라우드 DB에 최신 가계도 저장</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDownload]}
                onPress={handleForceDownload}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0284c7" />
                ) : (
                  <>
                    <Text style={styles.actionBtnIcon}>🔄</Text>
                    <Text style={[styles.actionBtnText, { color: '#0f172a' }]}>클라우드 DB에서 최신 데이터 내려받기</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Explanation box */}
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>💡 왜 PC와 스마트폰 화면이 다른가요?</Text>
              <Text style={styles.guideText}>
                기존에는 웹 브라우저 자체 로컬 저장소(LocalStorage)에만 저장되어 PC와 스마트폰이 독립된 상태였습니다.{'\n'}
                위 <Text style={{ fontWeight: '800', color: '#0284c7' }}>[스마트폰 QR 스캔]</Text>이나 <Text style={{ fontWeight: '800', color: '#0284c7' }}>[동기화 링크 복사]</Text>를 이용하시면 스마트폰에 부모님과 가계도가 즉시 복제됩니다!
              </Text>

              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 4 }}>
                  🔧 클라우드 DB(Firebase Firestore) 영구 연동 방법:
                </Text>
                <Text style={{ fontSize: 11.5, color: '#64748b', lineHeight: 18 }}>
                  1. Firebase 콘솔(console.firebase.google.com)에서 <Text style={{ fontWeight: '700' }}>jokbo360</Text> 프로젝트 접속{'\n'}
                  2. 좌측 메뉴 [빌드] → [Firestore Database] 클릭 후 [데이터베이스 만들기] 완료{'\n'}
                  3. 생성 후 위 [지금 즉시 클라우드 DB에 최신 가계도 저장]을 누르면 영구 보관됩니다.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeModalBtnText}>닫기</Text>
            </TouchableOpacity>
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
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCardMobile: {
    maxWidth: '100%',
    maxHeight: '94%',
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '700',
  },
  toastBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toastBoxError: {
    backgroundColor: '#fef2f2',
    borderBottomColor: '#fecaca',
  },
  toastBoxSuccess: {
    backgroundColor: '#f0fdf4',
    borderBottomColor: '#bbf7d0',
  },
  toastText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },
  toastTextError: {
    color: '#991b1b',
    fontWeight: '700',
  },
  toastTextSuccess: {
    color: '#166534',
    fontWeight: '700',
  },
  bodyScroll: {
    flexGrow: 1,
  },
  bodyContent: {
    padding: 18,
    gap: 14,
  },
  statusBanner: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  qrSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    gap: 10,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  qrDesc: {
    fontSize: 11.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 17,
  },
  qrImageWrapper: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
    marginVertical: 4,
  },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: '#ffffff',
  },
  qrScanHint: {
    fontSize: 10.5,
    color: '#0284c7',
    fontWeight: '700',
    marginTop: 6,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  copyBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyBtnSuccess: {
    backgroundColor: '#16a34a',
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  actionButtonGroup: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
  },
  actionBtnUpload: {
    backgroundColor: '#059669',
  },
  actionBtnDownload: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  guideBox: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  guideTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  guideText: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  closeModalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  closeModalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
