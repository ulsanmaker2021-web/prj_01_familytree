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
import {
  extractSurname,
  getHanjaCandidates,
  getRecommendedClans,
} from '../utils/koreanHanjaHelper';
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
    registeredAccounts,
    customAccounts,
    registerNewMember,
    clearAllCustomAccounts,
    loginWithDemoAccount,
    loginWithCredentials,
    verify2FA,
    registerWithClanCode,
    closeLoginModal,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'demo' | 'credentials' | 'register' | 'clan_code'>('demo');
  const [phoneInput, setPhoneInput] = useState('010-1234-5678');
  const [passwordInput, setPasswordInput] = useState('password123!');
  const [otpInput, setOtpInput] = useState('');
  const [clanCodeInput, setClanCodeInput] = useState('KJ-KIM-2026-9872X');
  const [newUserName, setNewUserName] = useState('김동현');
  const [newUserPhone, setNewUserPhone] = useState('010-3344-9988');

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regHanja, setRegHanja] = useState('');
  const [regClan, setRegClan] = useState('경주 김씨 판도판서공파');
  const [regRoleType, setRegRoleType] = useState<'direct_family' | 'collateral'>('direct_family');
  const [regRoleLabel, setRegRoleLabel] = useState('가문 직계 자손');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regMotherName, setRegMotherName] = useState('');
  const [regAgreePolicy, setRegAgreePolicy] = useState(true);
  const [isPureHangulName, setIsPureHangulName] = useState(false);

  // Phone OTP Verification State for Registration
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpInput, setRegOtpInput] = useState('');
  const [regIsPhoneVerified, setRegIsPhoneVerified] = useState(false);
  const [unregisteredPhoneAlert, setUnregisteredPhoneAlert] = useState<string | null>(null);

  // Dynamic Surname & Clan Recommendations
  const currentSurname = extractSurname(regName);
  const recommendedClans = getRecommendedClans(currentSurname);

  // Auto-switch clan suggestion when surname changes
  useEffect(() => {
    if (currentSurname) {
      const recs = getRecommendedClans(currentSurname);
      if (recs.length > 0) {
        if (!regClan || (!regClan.includes(currentSurname) && regClan.startsWith('경주 김씨'))) {
          setRegClan(recs[0].value);
        }
      }
    }
  }, [currentSurname]);

  // One-click Hanja Auto Complete
  const handleAutoHanja = () => {
    if (isPureHangulName) {
      showToast('순수 한글/외국어/종교 이름 모드입니다. 한자 없이 등재됩니다.', true);
      return;
    }
    const chars = regName.trim().split('');
    if (chars.length === 0) {
      showToast('성명(한글)을 먼저 입력해주세요.', true);
      return;
    }
    let result = '';
    for (const c of chars) {
      const candidates = getHanjaCandidates(c);
      if (candidates.length > 0) {
        result += candidates[0].hanja;
      } else {
        result += c; // fallback: preserve character if pure Korean / unmapped
      }
    }
    setRegHanja(result);
    showToast(`'${result}' 한자가 추천 완성되었습니다!`, false, true);
  };

  // Specific syllable Hanja selection
  const handleSelectHanja = (charIdx: number, hanjaChar: string) => {
    if (isPureHangulName) return;
    const chars = regName.trim().split('');
    let currentChars = regHanja.split('');
    while (currentChars.length < chars.length) {
      currentChars.push(chars[currentChars.length]);
    }
    currentChars[charIdx] = hanjaChar;
    setRegHanja(currentChars.join(''));
  };

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
      if (res.isNotRegistered) {
        setUnregisteredPhoneAlert(phoneInput);
      } else {
        setUnregisteredPhoneAlert(null);
      }
      showToast(res.message, true);
    } else {
      setUnregisteredPhoneAlert(null);
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

  const handleSendRegOtp = () => {
    const clean = regPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      showToast('올바른 휴대전화 번호(10~11자리)를 먼저 입력해주세요.', true);
      return;
    }
    const allAccounts = registeredAccounts;
    const exists = allAccounts.some((a) => a.phone.replace(/[^0-9]/g, '') === clean);
    if (exists) {
      showToast('이미 등록된 번호입니다. [📱 휴대폰 로그인] 탭을 이용해주세요.', true);
      return;
    }

    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setRegOtpCode(generated);
    setRegOtpSent(true);
    setRegOtpInput(generated); // auto-fill for testing ease
    setRegIsPhoneVerified(false);
    showToast(`[${regPhone}] 번호로 6자리 SMS 가입 인증번호가 발송되었습니다.`, false, true);
  };

  const handleVerifyRegOtp = () => {
    if (!regOtpInput.trim() || regOtpInput.trim() !== regOtpCode) {
      showToast('SMS 인증번호가 일치하지 않습니다. 다시 확인해주세요.', true);
      return;
    }
    setRegIsPhoneVerified(true);
    showToast('✅ 휴대전화 본인 확인이 완료되었습니다!', false, true);
  };

  const handleRegisterSubmit = () => {
    if (!regName.trim()) {
      showToast('성명(실명)을 입력해주세요.', true);
      return;
    }
    const cleanPhone = regPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      showToast('올바른 휴대전화 번호(10~11자리)를 입력해주세요.', true);
      return;
    }
    if (!regIsPhoneVerified) {
      showToast('휴대전화 SMS 본인인증(OTP 확인)을 먼저 완료해주세요.', true);
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      showToast('비밀번호는 최소 4자리 이상으로 설정해주세요.', true);
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      showToast('비밀번호와 비밀번호 확인이 일치하지 않습니다.', true);
      return;
    }
    if (!regAgreePolicy) {
      showToast('개인정보 보호 및 가문 규약에 동의해주세요.', true);
      return;
    }

    const res = registerNewMember({
      name: regName.trim(),
      hanja: isPureHangulName ? undefined : (regHanja.trim() || undefined),
      clan: regClan.trim(),
      role: regRoleType,
      roleLabel: regRoleLabel,
      phone: regPhone.trim(),
      password: regPassword,
      birthDate: regBirthDate.trim() || undefined,
      fatherName: regFatherName.trim() || undefined,
      motherName: regMotherName.trim() || undefined,
    });

    if (res.success && res.user) {
      showToast(res.message, false, true);
      // Reset form
      setRegName('');
      setRegHanja('');
      setIsPureHangulName(false);
      setRegPhone('');
      setRegPassword('');
      setRegPasswordConfirm('');
      setRegBirthDate('');
      setRegFatherName('');
      setRegMotherName('');
      setRegOtpSent(false);
      setRegIsPhoneVerified(false);
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

          {/* 4 Nav Tabs */}
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
                🧪 [테스트] 빠른 전환
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
                📱 휴대폰 로그인
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'register' && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab('register')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'register' && styles.tabBtnTextActive,
                ]}
              >
                📝 신규 가입 (등재)
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
                🔑 가문 초대 코드
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
                    ※ 실제 상용 서비스 배포 시 본 탭은 완전히 제거되며, 오직 [📱 휴대폰 로그인]과 [📝 가문 신규 가입]을 거친 사용자만 접속할 수 있습니다.
                  </Text>
                </View>

                {/* Custom Accounts Registered by User */}
                {customAccounts && customAccounts.length > 0 && (
                  <View style={styles.customSectionBox}>
                    <View style={styles.customSectionHeader}>
                      <Text style={styles.customSectionTitle}>
                        ✨ 브라우저 DB에 직접 등록된 계정 ({customAccounts.length}명)
                      </Text>
                      <TouchableOpacity
                        style={styles.clearDbBtn}
                        onPress={() => {
                          clearAllCustomAccounts();
                          showToast('직접 등록한 계정이 초기화되었습니다.');
                        }}
                      >
                        <Text style={styles.clearDbBtnText}>🗑️ 등록 데이터 초기화</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.accountList}>
                      {customAccounts.map((acc) => {
                        const isSelected = currentUser.id === acc.id && isAuthenticated;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            style={[
                              styles.accountCard,
                              styles.customAccountCard,
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
                                <View style={[styles.roleBadge, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                                  <Text style={[styles.roleBadgeText, { color: '#b45309' }]}>
                                    {acc.roleLabel}
                                  </Text>
                                </View>
                                <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 10, color: '#0369a1', fontWeight: '800' }}>💾 LocalStorage DB 저장됨</Text>
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
                              {acc.birthDate && (
                                <Text style={styles.accountDetailItem}>
                                  🎂 생년월일: {acc.birthDate}
                                </Text>
                              )}
                              {acc.fatherName && (
                                <Text style={styles.accountDetailItem}>
                                  👨 부: {acc.fatherName}
                                </Text>
                              )}
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

                <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569', marginTop: 14, marginBottom: 8 }}>
                  👥 기본 제공 시뮬레이션 계정
                </Text>

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

                    {/* Unregistered Phone Alert Box */}
                    {unregisteredPhoneAlert && (
                      <View style={styles.notRegisteredAlertBox}>
                        <Text style={styles.notRegisteredAlertTitle}>
                          ⚠️ 가문에 등록되지 않은 휴대전화 번호입니다
                        </Text>
                        <Text style={styles.notRegisteredAlertDesc}>
                          [{unregisteredPhoneAlert}] 번호는 아직 가문 족보 시스템에 등록되어 있지 않습니다. 신규 가입을 통해 본인 정보를 등록해주세요.
                        </Text>
                        <TouchableOpacity
                          style={styles.notRegisteredAlertBtn}
                          onPress={() => {
                            setRegPhone(unregisteredPhoneAlert);
                            setUnregisteredPhoneAlert(null);
                            setActiveTab('register');
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.notRegisteredAlertBtnText}>
                            📝 [{unregisteredPhoneAlert}] 번호로 즉시 가입 신청 ➔
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Link to Registration */}
                    <View style={styles.registerPromptRow}>
                      <Text style={styles.registerPromptLabel}>
                        가문에 등록된 계정이 없으신가요?
                      </Text>
                      <TouchableOpacity
                        style={styles.registerPromptLinkBtn}
                        onPress={() => setActiveTab('register')}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registerPromptLinkText}>
                          📝 가문 신규 회원 등록 (족보 등재 신청) ➔
                        </Text>
                      </TouchableOpacity>
                    </View>
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

            {/* ================= TAB 3: REGISTER NEW MEMBER ================= */}
            {activeTab === 'register' && (
              <View style={styles.tabContent}>
                <View style={styles.formCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 20 }}>📝</Text>
                    <Text style={styles.formTitle}>가문 신규 회원 등록 (족보 등재 신청)</Text>
                  </View>
                  <Text style={styles.formDesc}>
                    스마트폰으로 본인 정보를 등록하여 가문 족보에 등재하고, 안전한 2단계 보안 로그인을 생성합니다.
                  </Text>

                  <View style={styles.infoBanner}>
                    <Text style={styles.infoBannerText}>
                      💾 <Text style={{ fontWeight: '800' }}>[로컬 데이터베이스 영구 저장]</Text> 등록하신 정보는 브라우저 보안 저장소(LocalStorage)에 영구 보존되며, 가입 즉시 등록된 휴대폰 번호와 비밀번호로 2FA 로그인이 가능합니다.
                    </Text>
                  </View>

                  {/* 실명 & 한자 성명 */}
                  <View style={styles.formRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>
                        성명 (실명) <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={regName}
                        onChangeText={setRegName}
                        placeholder="예: 최민호"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.fieldLabel}>한자 성명 (선택)</Text>
                        {!isPureHangulName && (
                          <TouchableOpacity onPress={handleAutoHanja} activeOpacity={0.7}>
                            <Text style={{ fontSize: 11, color: '#0284c7', fontWeight: '800' }}>⚡ 자동 변환</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          isPureHangulName && { backgroundColor: '#f1f5f9', color: '#64748b' },
                        ]}
                        value={isPureHangulName ? '한자 없음 (순수 한글/외국어)' : regHanja}
                        onChangeText={setRegHanja}
                        placeholder={isPureHangulName ? '한자 성명 미사용' : '예: 崔敏浩'}
                        placeholderTextColor="#94a3b8"
                        editable={!isPureHangulName}
                      />
                    </View>
                  </View>

                  {/* 순수 한글 / 종교적 / 외국어 성명 옵션 체크박스 */}
                  <TouchableOpacity
                    style={[
                      styles.pureNameToggleRow,
                      isPureHangulName && styles.pureNameToggleRowActive,
                    ]}
                    onPress={() => {
                      const next = !isPureHangulName;
                      setIsPureHangulName(next);
                      if (next) {
                        setRegHanja('');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 16 }}>{isPureHangulName ? '☑️' : '⬜'}</Text>
                    <Text style={[styles.pureNameToggleText, isPureHangulName && styles.pureNameToggleTextActive]}>
                      순수 한글 / 종교적 / 외국어 성명 (한자 없음 선택)
                    </Text>
                  </TouchableOpacity>

                  {/* 스마트폰 원클릭 한자 변환 도우미 */}
                  {regName.trim().length > 0 && (
                    isPureHangulName ? (
                      <View style={styles.pureNameNoticeBox}>
                        <Text style={styles.pureNameNoticeTitle}>
                          🌿 [순수 한글 / 외래어 / 종교 이름 모드]
                        </Text>
                        <Text style={styles.pureNameNoticeDesc}>
                          한자 없이 실명(한글) [{regName.trim()}](으)로 가문 족보에 그대로 등재됩니다. 한자 변환이 필요하지 않습니다.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.hanjaHelperBox}>
                        <View style={styles.hanjaHelperHeader}>
                          <Text style={styles.hanjaHelperTitle}>
                            🈳 스마트폰 간편 한자 변환 선택기 ({regName.trim().length}글자)
                          </Text>
                          <TouchableOpacity
                            style={styles.hanjaAutoBtn}
                            onPress={handleAutoHanja}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.hanjaAutoBtnText}>⚡ 전체 추천 한자 자동완성</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.hanjaHelperDesc}>
                          이름을 구성하는 각 음절별로 원하는 한자를 터치하시면 즉시 입력됩니다. (한자가 없는 음절은 한글로 유지됩니다)
                        </Text>
                        <View style={styles.hanjaSyllableContainer}>
                          {regName.trim().split('').map((char, charIdx) => {
                            const candidates = getHanjaCandidates(char);
                            return (
                              <View key={`${char}-${charIdx}`} style={styles.hanjaCharCol}>
                                <View style={styles.hanjaCharTitleRow}>
                                  <Text style={styles.hanjaCharTitle}>
                                    {charIdx + 1}번째 글자: [{char}]
                                  </Text>
                                  {candidates.length === 0 ? (
                                    <View style={styles.pureHangulTag}>
                                      <Text style={styles.pureHangulTagText}>순수 한글 / 한자 미등록</Text>
                                    </View>
                                  ) : (
                                    <Text style={styles.candidateCountText}>
                                      {candidates.length}개 한자 후보
                                    </Text>
                                  )}
                                </View>

                                {candidates.length > 0 ? (
                                  <View style={styles.hanjaChipRow}>
                                    {candidates.map((c) => (
                                      <TouchableOpacity
                                        key={c.hanja}
                                        style={styles.hanjaChip}
                                        onPress={() => handleSelectHanja(charIdx, c.hanja)}
                                        activeOpacity={0.7}
                                      >
                                        <Text style={styles.hanjaChipChar}>{c.hanja}</Text>
                                        <Text style={styles.hanjaChipDesc}>{c.meaning.split('/')[0]}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </View>
                                ) : (
                                  <View style={styles.noHanjaRow}>
                                    <Text style={styles.noHanjaText}>
                                      이 음절은 한자 없이 한글 '{char}'(으)로 유지됩니다.
                                    </Text>
                                    <TouchableOpacity
                                      style={styles.keepHangulChip}
                                      onPress={() => handleSelectHanja(charIdx, char)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.keepHangulChipText}>한글 [{char}] 유지</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )
                  )}

                  {/* 가문 / 본관 선택 (성씨 기준 동적 가이드) */}
                  <View style={styles.fieldGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.fieldLabel}>
                        가문 본관 및 파 <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                      {currentSurname ? (
                        <Text style={{ fontSize: 11, color: '#0369a1', fontWeight: '800' }}>
                          💡 [{currentSurname}씨] 추천 본관 및 분파
                        </Text>
                      ) : null}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={regClan}
                      onChangeText={setRegClan}
                      placeholder={currentSurname ? `예: 경주 ${currentSurname}씨` : '예: 경주 김씨 판도판서공파'}
                      placeholderTextColor="#94a3b8"
                    />
                    <View style={styles.codePillRow}>
                      {recommendedClans.map((c) => (
                        <TouchableOpacity
                          key={c.value}
                          style={[styles.codePill, regClan === c.value && { backgroundColor: '#e0f2fe', borderColor: '#0284c7' }]}
                          onPress={() => setRegClan(c.value)}
                        >
                          <Text style={[styles.codePillText, regClan === c.value && { color: '#0369a1', fontWeight: '800' }]}>
                            {c.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 가문 내 혈통 구분 */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      가문 내 관계 (권한 구분) <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                    <View style={styles.roleBtnRow}>
                      <TouchableOpacity
                        style={[
                          styles.roleSelectBtn,
                          regRoleType === 'direct_family' && regRoleLabel === '가문 직계 자손' && styles.roleSelectBtnActive,
                        ]}
                        onPress={() => {
                          setRegRoleType('direct_family');
                          setRegRoleLabel('가문 직계 자손');
                        }}
                      >
                        <Text style={[
                          styles.roleSelectBtnText,
                          regRoleType === 'direct_family' && regRoleLabel === '가문 직계 자손' && styles.roleSelectBtnTextActive,
                        ]}>
                          👑 직계 혈족 (자손)
                        </Text>
                        <Text style={styles.roleSelectBtnSub}>직계 상호 전체 열람</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleSelectBtn,
                          regRoleType === 'direct_family' && regRoleLabel === '직계 배우자' && styles.roleSelectBtnActive,
                        ]}
                        onPress={() => {
                          setRegRoleType('direct_family');
                          setRegRoleLabel('직계 배우자');
                        }}
                      >
                        <Text style={[
                          styles.roleSelectBtnText,
                          regRoleType === 'direct_family' && regRoleLabel === '직계 배우자' && styles.roleSelectBtnTextActive,
                        ]}>
                          💍 직계 배우자
                        </Text>
                        <Text style={styles.roleSelectBtnSub}>직계 상호 전체 열람</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleSelectBtn,
                          regRoleType === 'collateral' && styles.roleSelectBtnActive,
                        ]}
                        onPress={() => {
                          setRegRoleType('collateral');
                          setRegRoleLabel('방계 친족 (친척)');
                        }}
                      >
                        <Text style={[
                          styles.roleSelectBtnText,
                          regRoleType === 'collateral' && styles.roleSelectBtnTextActive,
                        ]}>
                          🌳 방계 친족
                        </Text>
                        <Text style={styles.roleSelectBtnSub}>연락처 보안 마스킹</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 휴대전화 번호 및 모바일 친화적 SMS 본인인증 */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      휴대전화 번호 (로그인 ID) <Text style={{ color: '#ef4444' }}>*</Text>
                    </Text>
                    
                    {/* Phone Input */}
                    <TextInput
                      style={[
                        styles.input,
                        regIsPhoneVerified && { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
                      ]}
                      value={regPhone}
                      onChangeText={(txt) => {
                        setRegPhone(txt);
                        setRegIsPhoneVerified(false);
                        setRegOtpSent(false);
                      }}
                      placeholder="010-0000-0000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      editable={!regIsPhoneVerified}
                    />

                    {/* Full-width, never cut off OTP Request Button */}
                    <TouchableOpacity
                      style={[
                        styles.otpRequestBtnFull,
                        regIsPhoneVerified && { backgroundColor: '#15803d' },
                      ]}
                      onPress={handleSendRegOtp}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.otpRequestBtnFullText}>
                        {regIsPhoneVerified
                          ? '✅ 휴대전화 본인인증 완료'
                          : regOtpSent
                          ? '📱 인증번호 재발송'
                          : '📱 6자리 SMS 가입 인증번호 발송'}
                      </Text>
                    </TouchableOpacity>

                    {/* Simulated SMS Alert Box for Registration */}
                    {regOtpSent && !regIsPhoneVerified && (
                      <View style={{ marginTop: 10 }}>
                        <View style={styles.smsSimBox}>
                          <Text style={styles.smsSimTitle}>
                            📬 [모의 SMS 수신] 가문 신규 가입 본인인증
                          </Text>
                          <Text style={styles.smsSimContent}>
                            인증번호는 [<Text style={styles.smsSimOtp}>{regOtpCode}</Text>] 입니다. 타인에게 노출하지 마십시오.
                          </Text>
                        </View>

                        <View style={{ marginTop: 8, gap: 8 }}>
                          <TextInput
                            style={[
                              styles.input,
                              styles.otpInput,
                              {
                                width: '100%',
                                textAlign: 'center',
                                fontSize: 18,
                                letterSpacing: 6,
                                fontWeight: '800',
                                backgroundColor: '#f8fafc',
                                borderColor: '#0284c7',
                                borderWidth: 2,
                                paddingVertical: 12,
                              },
                            ]}
                            value={regOtpInput}
                            onChangeText={setRegOtpInput}
                            placeholder="6자리 인증번호 입력"
                            placeholderTextColor="#94a3b8"
                            keyboardType="number-pad"
                            maxLength={6}
                          />
                          <TouchableOpacity
                            style={styles.verifyOtpFullBtn}
                            onPress={handleVerifyRegOtp}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.verifyOtpFullBtnText}>
                              🔐 6자리 인증번호 확인 및 본인인증 완료
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {regIsPhoneVerified ? (
                      <Text style={{ fontSize: 11.5, color: '#16a34a', fontWeight: '800', marginTop: 4 }}>
                        ✅ 휴대전화 본인 확인이 완료되었습니다. (로그인 ID로 지정됨)
                      </Text>
                    ) : (
                      <Text style={styles.fieldHint}>
                        휴대전화 번호를 입력 후 위 파란색 버튼을 눌러 SMS 인증번호를 확인해주세요.
                      </Text>
                    )}
                  </View>

                  {/* 비밀번호 & 비밀번호 확인 */}
                  <View style={styles.formRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>
                        접속 비밀번호 <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={regPassword}
                        onChangeText={setRegPassword}
                        placeholder="4자리 이상"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>
                        비밀번호 확인 <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={regPasswordConfirm}
                        onChangeText={setRegPasswordConfirm}
                        placeholder="동일 비밀번호 재입력"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                      />
                    </View>
                  </View>

                  {/* 생년월일 & 부모님 성함 */}
                  <View style={styles.formRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>생년월일 (선택)</Text>
                      <TextInput
                        style={styles.input}
                        value={regBirthDate}
                        onChangeText={setRegBirthDate}
                        placeholder="1995-08-15"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>부(아버지) 성함 (선택)</Text>
                      <TextInput
                        style={styles.input}
                        value={regFatherName}
                        onChangeText={setRegFatherName}
                        placeholder="예: 김영호"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  {/* 개인정보 규약 동의 */}
                  <TouchableOpacity
                    style={styles.policyRow}
                    onPress={() => setRegAgreePolicy(!regAgreePolicy)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 18 }}>{regAgreePolicy ? '☑️' : '⬜'}</Text>
                    <Text style={styles.policyText}>
                      [필수] 대한민국 개인정보보호법 및 가문 족보 보안 규약에 동의하며, 가문 구성원 정보 등록에 동의합니다.
                    </Text>
                  </TouchableOpacity>

                  {/* Submit button */}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleRegisterSubmit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitBtnText}>
                      📝 가문 데이터베이스 등록 및 즉시 로그인 ➔
                    </Text>
                  </TouchableOpacity>

                  {/* Link to login */}
                  <View style={{ alignItems: 'center', marginTop: 14 }}>
                    <TouchableOpacity onPress={() => setActiveTab('credentials')} activeOpacity={0.7}>
                      <Text style={{ fontSize: 12.5, color: '#0284c7', fontWeight: '700' }}>
                        이미 가문에 등록된 계정이 있으신가요? 📱 휴대폰 로그인 ➔
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ================= TAB 4: CLAN INVITE CODE ================= */}
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
  customSectionBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 10,
  },
  customSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  clearDbBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  clearDbBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b91c1c',
  },
  customAccountCard: {
    borderColor: '#f59e0b',
    backgroundColor: '#ffffff',
  },
  registerPromptRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    gap: 4,
  },
  registerPromptLabel: {
    fontSize: 11.5,
    color: '#64748b',
  },
  registerPromptLinkBtn: {
    paddingVertical: 4,
  },
  registerPromptLinkText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleBtnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  roleSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  roleSelectBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  roleSelectBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  roleSelectBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  roleSelectBtnSub: {
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  policyText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    lineHeight: 15,
  },
  notRegisteredAlertBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  notRegisteredAlertTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#b45309',
    marginBottom: 4,
  },
  notRegisteredAlertDesc: {
    fontSize: 11.5,
    color: '#78350f',
    lineHeight: 16,
    marginBottom: 8,
  },
  notRegisteredAlertBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  notRegisteredAlertBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  otpRequestBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  otpRequestBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  verifyOtpSmallBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  verifyOtpSmallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  otpRequestBtnFull: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
    width: '100%',
  },
  otpRequestBtnFullText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  hanjaHelperBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  hanjaHelperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hanjaHelperTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  hanjaAutoBtn: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  hanjaAutoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  hanjaHelperDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 15,
  },
  hanjaSyllableContainer: {
    gap: 8,
  },
  hanjaCharCol: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 8,
  },
  hanjaCharTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  hanjaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hanjaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hanjaChipChar: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  hanjaChipDesc: {
    fontSize: 10,
    color: '#475569',
  },
  pureNameToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  pureNameToggleRowActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  pureNameToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pureNameToggleTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  pureNameNoticeBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  pureNameNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  pureNameNoticeDesc: {
    fontSize: 11.5,
    color: '#15803d',
    lineHeight: 16,
  },
  hanjaCharTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pureHangulTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pureHangulTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  candidateCountText: {
    fontSize: 10.5,
    color: '#0284c7',
    fontWeight: '700',
  },
  noHanjaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
  },
  noHanjaText: {
    fontSize: 11.5,
    color: '#64748b',
    flex: 1,
  },
  keepHangulChip: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  keepHangulChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  verifyOtpFullBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyOtpFullBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
