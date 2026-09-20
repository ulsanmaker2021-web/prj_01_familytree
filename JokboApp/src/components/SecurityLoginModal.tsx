import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import { DEMO_SECURITY_ACCOUNTS, VALID_CLAN_INVITE_TOKENS } from '../utils/securityAuth';
import { inkTheme } from '../theme/inkTheme';

interface SecurityLoginModalProps {
  visible: boolean;
  onClose?: () => void;
}

export const SecurityLoginModal: React.FC<SecurityLoginModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    currentUser,
    isAuthenticated,
    pending2FA,
    bruteForce,
    loginWithDemoAccount,
    loginWithCredentials,
    verify2FA,
    registerWithClanCode,
    closeLoginModal,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'demo' | 'credentials' | 'clan_code'>('demo');
  const [phoneInput, setPhoneInput] = useState('010-1234-5678');
  const [passwordInput, setPasswordInput] = useState('password123!');
  const [otpInput, setOtpInput] = useState('');
  const [clanCodeInput, setClanCodeInput] = useState('KJ-KIM-2026-9872X');
  const [newUserName, setNewUserName] = useState('김동현');
  const [newUserPhone, setNewUserPhone] = useState('010-3344-9988');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    isError?: boolean;
    isSuccess?: boolean;
  } | null>(null);

  // Auto-fill OTP when simulated
  useEffect(() => {
    if (pending2FA) {
      setOtpInput(pending2FA.expectedOtp);
    }
  }, [pending2FA]);

  const showToast = (text: string, isError = false, isSuccess = false) => {
    setStatusMessage({ text, isError, isSuccess });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleDemoLogin = (accountId: string) => {
    const res = loginWithDemoAccount(accountId);
    if (res.success) {
      showToast(res.message, false, true);
    } else {
      showToast(res.message, true);
    }
  };

  const handleCredentialsSubmit = () => {
    const res = loginWithCredentials(phoneInput, passwordInput);
    if (!res.success) {
      showToast(res.message, true);
    } else {
      showToast(res.message, false, true);
      if (res.otpCode) {
        setOtpInput(res.otpCode);
      }
    }
  };

  const handle2FASubmit = () => {
    const res = verify2FA(otpInput);
    if (res.success) {
      showToast(res.message, false, true);
    } else {
      showToast(res.message, true);
    }
  };

  const handleClanCodeSubmit = () => {
    const res = registerWithClanCode(clanCodeInput, newUserName, newUserPhone);
    if (res.success) {
      showToast(res.message, false, true);
    } else {
      showToast(res.message, true);
    }
  };

  const handleClose = () => {
    if (!isAuthenticated) {
      showToast('⚠️ 가문 가계도를 열람하려면 먼저 보안 인증 로그인이 필요합니다.', true);
      return;
    }
    closeLoginModal();
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.shieldBadge}>
                <Text style={styles.shieldBadgeText}>🛡️ 4중 보안 인증</Text>
              </View>
              <Text style={styles.headerTitle}>가문 디지털 족보 보안 로그인</Text>
              <Text style={styles.headerSubtitle}>
                친족의 실명·연락처·생년월일 보호를 위한 혈족 전용 게이트웨이
              </Text>
            </View>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Toast Message */}
          {statusMessage && (
            <View
              style={[
                styles.toastBox,
                statusMessage.isError && styles.toastBoxError,
                statusMessage.isSuccess && styles.toastBoxSuccess,
              ]}
            >
              <Text
                style={[
                  styles.toastText,
                  statusMessage.isError && styles.toastTextError,
                  statusMessage.isSuccess && styles.toastTextSuccess,
                ]}
              >
                {statusMessage.text}
              </Text>
            </View>
          )}

          {/* Brute-Force Lock Warning */}
          {bruteForce.isLocked && (
            <View style={styles.lockoutBox}>
              <Text style={styles.lockoutIcon}>⛔</Text>
              <View style={styles.lockoutTextWrap}>
                <Text style={styles.lockoutTitle}>
                  무차별 대입 공격 방어로 로그인이 일시 차단되었습니다
                </Text>
                <Text style={styles.lockoutDesc}>
                  연속 5회 이상 로그인 실패로 계정이 보호 모드로 전환되었습니다. 남은 대기 시간:{' '}
                  <Text style={{ fontWeight: '800', color: '#b91c1c' }}>
                    {bruteForce.lockoutSecondsRemaining}초
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {/* 3 Nav Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'demo' && styles.tabBtnActive]}
              onPress={() => setActiveTab('demo')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'demo' && styles.tabBtnTextActive,
                ]}
              >
                🧪 [테스트] 빠른 계정 전환
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'credentials' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('credentials')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'credentials' && styles.tabBtnTextActive,
                ]}
              >
                📱 휴대폰 & 2단계 인증 (실제 로그인)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'clan_code' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('clan_code')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'clan_code' && styles.tabBtnTextActive,
                ]}
              >
                🔑 가문 초대 코드 등록
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ================= TAB 1: DEMO QUICK ACCOUNTS ================= */}
            {activeTab === 'demo' && (
              <View style={styles.tabContent}>
                <View style={styles.infoBanner}>
                  <Text style={styles.infoBannerText}>
                    🧪 <Text style={{ fontWeight: '800' }}>[시뮬레이션 테스트 전용]</Text> 현재는 개발 및 개인정보 마스킹 검증 단계이므로, 권한별(직계 vs 방계 vs 종손) 열람 차이를 원클릭으로 비교할 수 있는 모의 계정입니다.
                  </Text>
                  <Text style={[styles.infoBannerText, { marginTop: 4, color: '#991b1b', fontWeight: '700' }]}>
                    ※ 실제 상용 서비스 배포 시 본 탭은 완전히 제거되며, 오직 [📱 휴대폰 & 2단계 인증]과 [🔑 가문 초대 코드]를 거친 본인만 로그인할 수 있습니다.
                  </Text>
                </View>

                <View style={styles.accountList}>
                  {DEMO_SECURITY_ACCOUNTS.map((acc) => {
                    const isSelected = currentUser.id === acc.id && isAuthenticated;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          styles.accountCard,
                          isSelected && styles.accountCardSelected,
                        ]}
                        onPress={() => handleDemoLogin(acc.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.accountCardTop}>
                          <View style={styles.accountCardTitleGroup}>
                            <Text style={styles.accountName}>
                              {acc.name} {acc.hanja && `(${acc.hanja})`}
                            </Text>
                            <View
                              style={[
                                styles.roleBadge,
                                acc.role === 'admin' && styles.roleBadgeAdmin,
                                acc.role === 'collateral' && styles.roleBadgeCollateral,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleBadgeText,
                                  acc.role === 'admin' && styles.roleBadgeTextAdmin,
                                  acc.role === 'collateral' && styles.roleBadgeTextCollateral,
                                ]}
                              >
                                {acc.roleLabel}
                              </Text>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={styles.activeCheckBadge}>
                              <Text style={styles.activeCheckText}>✓ 현재 로그인됨</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.accountClan}>{acc.clan}</Text>

                        <View style={styles.accountDetails}>
                          <Text style={styles.accountDetailItem}>
                            📱 연락처: {acc.phone}
                          </Text>
                          <Text style={styles.accountDetailItem}>
                            🛡️ 권한: {acc.role === 'admin' ? '가문 전체 열람 및 승인' : acc.role === 'direct_family' ? '직계 상호 연락처 열람' : '생존 친족 연락처 마스킹(010-****)'}
                          </Text>
                        </View>

                        <View style={styles.cardActionRow}>
                          <Text style={styles.cardActionHint}>
                            {isSelected ? '✓ 현재 선택된 계정입니다' : '🧪 [테스트] 이 계정으로 전환 ➔'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ================= TAB 2: CREDENTIALS & 2FA SMS OTP ================= */}
            {activeTab === 'credentials' && (
              <View style={styles.tabContent}>
                {!pending2FA ? (
                  <View style={styles.formCard}>
                    <Text style={styles.formTitle}>📱 1차 계정 확인</Text>
                    <Text style={styles.formDesc}>
                      등록된 휴대전화 번호와 비밀번호를 입력해주세요.
                    </Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>휴대전화 번호</Text>
                      <TextInput
                        style={styles.input}
                        value={phoneInput}
                        onChangeText={setPhoneInput}
                        placeholder="010-1234-5678"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                      />
                      <Text style={styles.fieldHint}>
                        테스트용: 010-1234-5678 (김준혁) 또는 010-9182-4411 (김영호)
                      </Text>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>비밀번호</Text>
                      <TextInput
                        style={styles.input}
                        value={passwordInput}
                        onChangeText={setPasswordInput}
                        placeholder="비밀번호 입력"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                      />
                      <Text style={styles.fieldHint}>
                        기본 비밀번호: password123!
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        bruteForce.isLocked && styles.submitBtnDisabled,
                      ]}
                      onPress={handleCredentialsSubmit}
                      disabled={bruteForce.isLocked}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.submitBtnText}>
                        {bruteForce.isLocked
                          ? '⛔ 5분 잠금 해제 대기 중'
                          : '📱 1차 확인 및 6자리 2FA 보안 OTP 발송'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <View style={styles.otpHeader}>
                      <Text style={styles.otpIcon}>💬</Text>
                      <View>
                        <Text style={styles.formTitle}>2단계 본인 확인 (2FA OTP)</Text>
                        <Text style={styles.formDesc}>
                          [{pending2FA.phone}] 번호로 일회용 보안 코드가 발송되었습니다.
                        </Text>
                      </View>
                    </View>

                    {/* Simulated SMS Alert Box */}
                    <View style={styles.smsSimBox}>
                      <Text style={styles.smsSimTitle}>
                        📬 [모의 SMS 수신] 가문 디지털 족보 보안 인증
                      </Text>
                      <Text style={styles.smsSimContent}>
                        인증번호는 [<Text style={styles.smsSimOtp}>{pending2FA.expectedOtp}</Text>] 입니다. 타인에게 절대 노출하지 마십시오.
                      </Text>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>6자리 보안 OTP 번호</Text>
                      <TextInput
                        style={[styles.input, styles.otpInput]}
                        value={otpInput}
                        onChangeText={setOtpInput}
                        placeholder="6자리 숫자"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>

                    <View style={styles.otpActionRow}>
                      <TouchableOpacity
                        style={styles.verifyOtpBtn}
                        onPress={handle2FASubmit}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.verifyOtpBtnText}>
                          🔐 2FA 보안 검증 및 로그인 완료
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ================= TAB 3: CLAN INVITE CODE ================= */}
            {activeTab === 'clan_code' && (
              <View style={styles.tabContent}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>🔑 가문 폐쇄형 보안 초대 코드 등록</Text>
                  <Text style={styles.formDesc}>
                    디지털 족보는 아무나 열람할 수 없는 가문 고유의 소중한 자산입니다. 가문 어르신이나 종손께 전달받은 16자리 암호화 초대 코드를 등록하십시오.
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>가문 보안 초대 코드 (16자리)</Text>
                    <TextInput
                      style={styles.input}
                      value={clanCodeInput}
                      onChangeText={setClanCodeInput}
                      placeholder="예: KJ-KIM-2026-9872X"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="characters"
                    />
                    {/* Quick Code Buttons */}
                    <View style={styles.codePillRow}>
                      {Object.keys(VALID_CLAN_INVITE_TOKENS).map((k) => (
                        <TouchableOpacity
                          key={k}
                          style={styles.codePill}
                          onPress={() => setClanCodeInput(k)}
                        >
                          <Text style={styles.codePillText}>
                            {VALID_CLAN_INVITE_TOKENS[k].clanName.split(' ')[0]} 코드
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>본인 성명 (실명)</Text>
                    <TextInput
                      style={styles.input}
                      value={newUserName}
                      onChangeText={setNewUserName}
                      placeholder="성명 입력"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>휴대전화 번호</Text>
                    <TextInput
                      style={styles.input}
                      value={newUserPhone}
                      onChangeText={setNewUserPhone}
                      placeholder="010-0000-0000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleClanCodeSubmit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitBtnText}>
                      🏛️ 가문 코드 검증 및 참여 승인
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Privacy Legal Notice */}
            <View style={styles.privacyNoticeBox}>
              <Text style={styles.privacyNoticeTitle}>
                📜 대한민국 개인정보보호법 및 가문 정보 보안 준수
              </Text>
              <Text style={styles.privacyNoticeText}>
                • 본 가계도 시스템은 생존 친족의 사생활 및 개인정보 유출을 방지하기 위해 가문 공인 초대 토큰 및 2단계 인증(2FA)을 의무화하고 있습니다.
              </Text>
              <Text style={styles.privacyNoticeText}>
                • 직계 혈족이 아닌 방계 친족으로 로그인 시, 생존 가족의 전화번호 및 상세 생년월일은 보안 마스킹(010-****-5678) 처리됩니다.
              </Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#0f172a',
  },
  headerLeft: {
    flex: 1,
  },
  shieldBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  shieldBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 3,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  closeBtnText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
  },
  toastBox: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  toastBoxError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  toastBoxSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  toastTextError: {
    color: '#b91c1c',
  },
  toastTextSuccess: {
    color: '#15803d',
  },
  lockoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#f43f5e',
    gap: 10,
  },
  lockoutIcon: {
    fontSize: 24,
  },
  lockoutTextWrap: {
    flex: 1,
  },
  lockoutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9f1239',
  },
  lockoutDesc: {
    fontSize: 11.5,
    color: '#4c0519',
    marginTop: 2,
    lineHeight: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  tabContent: {
    marginBottom: 16,
  },
  infoBanner: {
    backgroundColor: '#f0fdfa',
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 11.5,
    color: '#134e4a',
    lineHeight: 16,
  },
  accountList: {
    gap: 10,
  },
  accountCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
  },
  accountCardSelected: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  accountCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeAdmin: {
    backgroundColor: '#fef3c7',
  },
  roleBadgeCollateral: {
    backgroundColor: '#f1f5f9',
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  roleBadgeTextAdmin: {
    color: '#92400e',
  },
  roleBadgeTextCollateral: {
    color: '#475569',
  },
  activeCheckBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  activeCheckText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  accountClan: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  accountDetails: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  accountDetailItem: {
    fontSize: 11,
    color: '#334155',
  },
  cardActionRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  cardActionHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  formCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  formDesc: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    color: '#0284c7',
  },
  fieldHint: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  otpIcon: {
    fontSize: 28,
  },
  smsSimBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  smsSimTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 4,
  },
  smsSimContent: {
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },
  smsSimOtp: {
    fontWeight: '900',
    fontSize: 14,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 4,
  },
  otpActionRow: {
    marginTop: 6,
  },
  verifyOtpBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyOtpBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  codePillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  codePill: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369a1',
  },
  privacyNoticeBox: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  privacyNoticeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#44403c',
    marginBottom: 2,
  },
  privacyNoticeText: {
    fontSize: 10.5,
    color: '#78716c',
    lineHeight: 15,
  },
});
