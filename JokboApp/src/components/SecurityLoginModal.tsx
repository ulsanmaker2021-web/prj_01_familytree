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
  useWindowDimensions,
} from 'react-native';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  DEMO_SECURITY_ACCOUNTS,
  VALID_CLAN_INVITE_TOKENS,
  formatPhoneNumber,
  stripPhoneNumber,
} from '../utils/securityAuth';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
  JokboFirebaseConfig,
  DEFAULT_FIREBASE_PLACEHOLDER,
} from '../config/firebaseConfig';
import {
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  ensureRecaptchaContainer,
  toE164Format,
} from '../services/firebaseAuthService';
import {
  extractSurname,
  getHanjaCandidates,
  getRecommendedClans,
} from '../utils/koreanHanjaHelper';
import {
  generateSyncPackage,
  importSyncPackage,
} from '../utils/deviceSyncHelper';
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
    logout,
    applySyncCode,
  } = useAuthStore();

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < 640;

  const [activeTab, setActiveTab] = useState<'demo' | 'credentials' | 'register' | 'clan_code' | 'sync'>('credentials');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [clanCodeInput, setClanCodeInput] = useState('KJ-KIM-2026-9872X');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [copiedSyncUrl, setCopiedSyncUrl] = useState('');
  const [syncQrCodeUrl, setSyncQrCodeUrl] = useState('');

  // Firebase Phone Auth State
  const [isFirebaseConfiguredState, setIsFirebaseConfiguredState] = useState(isFirebaseConfigured());
  const [isFirebaseMode, setIsFirebaseMode] = useState(isFirebaseConfigured());
  const [isFirebaseConfigModalOpen, setIsFirebaseConfigModalOpen] = useState(false);
  const [fbConfigInput, setFbConfigInput] = useState<JokboFirebaseConfig>(
    getSavedFirebaseConfig() || DEFAULT_FIREBASE_PLACEHOLDER
  );
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);

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

  // Ensure reCAPTCHA container DOM element is ready
  useEffect(() => {
    ensureRecaptchaContainer();
  }, []);

  // Auto-fill OTP when simulated
  useEffect(() => {
    if (pending2FA && !pending2FA.isFirebase) {
      setOtpInput(pending2FA.expectedOtp);
    } else if (pending2FA && pending2FA.isFirebase) {
      setOtpInput(''); // Wait for user to enter SMS code
    }
  }, [pending2FA]);

  const showToast = (text: string, isError = false, isSuccess = false) => {
    setStatusMessage({ text, isError, isSuccess });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Firebase Config Save
  const handleSaveFirebaseConfig = () => {
    if (!fbConfigInput.apiKey.trim() || !fbConfigInput.projectId.trim()) {
      showToast('Firebase API Key와 Project ID는 필수입니다.', true);
      return;
    }
    const cleanConfig: JokboFirebaseConfig = {
      apiKey: fbConfigInput.apiKey.trim(),
      authDomain: fbConfigInput.authDomain.trim() || `${fbConfigInput.projectId.trim()}.firebaseapp.com`,
      projectId: fbConfigInput.projectId.trim(),
      storageBucket: fbConfigInput.storageBucket?.trim() || `${fbConfigInput.projectId.trim()}.appspot.com`,
      messagingSenderId: fbConfigInput.messagingSenderId?.trim() || '',
      appId: fbConfigInput.appId.trim(),
    };
    const ok = saveFirebaseConfig(cleanConfig);
    if (ok) {
      setIsFirebaseConfiguredState(true);
      setIsFirebaseMode(true);
      setIsFirebaseConfigModalOpen(false);
      showToast('🔥 Firebase 연동 설정이 저장되었습니다! 이제 실제 스마트폰 SMS가 발송됩니다.', false, true);
    } else {
      showToast('설정 저장 중 오류가 발생했습니다.', true);
    }
  };

  const handleClearFirebaseConfig = () => {
    clearFirebaseConfig();
    setFbConfigInput(DEFAULT_FIREBASE_PLACEHOLDER);
    setIsFirebaseConfiguredState(false);
    setIsFirebaseMode(false);
    setIsFirebaseConfigModalOpen(false);
    showToast('Firebase 설정이 초기화되었습니다. 모의 시뮬레이션 모드로 전환되었습니다.');
  };

  useEffect(() => {
    if (activeTab === 'sync') {
      const res = generateSyncPackage(currentUser?.id);
      if (res.success && res.syncUrl) {
        setCopiedSyncUrl(res.syncUrl);
        setSyncQrCodeUrl(res.qrCodeUrl || '');
      }
    }
  }, [activeTab, currentUser]);

  const handleCopySyncLink = () => {
    const res = generateSyncPackage(currentUser?.id);
    if (!res.success || !res.syncUrl) {
      showToast(res.message || '동기화 데이터를 생성하지 못했습니다. 먼저 회원 등록을 진행해주세요.', true);
      return;
    }
    setCopiedSyncUrl(res.syncUrl);
    setSyncQrCodeUrl(res.qrCodeUrl || '');

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(res.syncUrl).then(() => {
        showToast(
          `📲 스마트폰 원클릭 연동 링크가 복사되었습니다!\n카카오톡(나와의 채팅) 등에 붙여넣고 스마트폰에서 누르면 자동 로그인됩니다.`,
          false,
          true
        );
      }).catch(() => {
        showToast('동기화 링크가 생성되었습니다. 아래 링크를 복사하여 스마트폰 브라우저에서 열어주세요.', false, true);
      });
    } else {
      showToast('동기화 링크가 생성되었습니다. 스마트폰 브라우저에서 열어주세요.', false, true);
    }
  };

  const handleApplySyncCode = () => {
    if (!syncCodeInput.trim()) {
      showToast('복원할 동기화 코드를 입력해주세요.', true);
      return;
    }
    const res = applySyncCode(syncCodeInput.trim());
    if (res.success) {
      showToast(res.message, false, true);
      setSyncCodeInput('');
      if (onClose) onClose();
    } else {
      showToast(res.message || '동기화 복원에 실패했습니다. 코드를 다시 확인해주세요.', true);
    }
  };

  const handleDemoLogin = (accountId: string) => {
    const res = loginWithDemoAccount(accountId);
    if (res.success) {
      showToast(res.message, false, true);
    } else {
      showToast(res.message, true);
    }
  };

  const handleCredentialsSubmit = async () => {
    setIsFirebaseLoading(true);
    const res = await loginWithCredentials(stripPhoneNumber(phoneInput), passwordInput, {
      useFirebase: isFirebaseMode && isFirebaseConfiguredState,
    });
    setIsFirebaseLoading(false);
    if (!res.success) {
      if (res.isNotRegistered) {
        setUnregisteredPhoneAlert(formatPhoneNumber(phoneInput));
      } else {
        setUnregisteredPhoneAlert(null);
      }
      showToast(res.message, true);
    } else {
      setUnregisteredPhoneAlert(null);
      showToast(res.message, false, true);
      if (res.otpCode) {
        setOtpInput(res.otpCode);
      } else {
        setOtpInput('');
      }
    }
  };

  const handle2FASubmit = async () => {
    setIsFirebaseLoading(true);
    const res = await verify2FA(otpInput);
    setIsFirebaseLoading(false);
    if (res.success) {
      showToast(res.message, false, true);
    } else {
      showToast(res.message, true);
    }
  };

  const handleClanCodeSubmit = () => {
    const res = registerWithClanCode(clanCodeInput, newUserName, stripPhoneNumber(newUserPhone));
    if (res.success) {
      showToast(res.message, false, true);
    } else {
      showToast(res.message, true);
    }
  };

  const handleSendRegOtp = async () => {
    const clean = stripPhoneNumber(regPhone);
    if (clean.length < 10) {
      showToast('올바른 휴대전화 번호(10~11자리)를 먼저 입력해주세요.', true);
      return;
    }
    const allAccounts = registeredAccounts;
    const exists = allAccounts.some((a) => stripPhoneNumber(a.phone) === clean);
    if (exists) {
      showToast('이미 등록된 번호입니다. [📱 휴대폰 로그인] 탭을 이용해주세요.', true);
      return;
    }

    if (isFirebaseMode && isFirebaseConfiguredState) {
      setIsFirebaseLoading(true);
      const fbRes = await sendFirebasePhoneOtp(clean);
      setIsFirebaseLoading(false);
      if (fbRes.success) {
        setRegOtpCode('FIREBASE_ACTIVE');
        setRegOtpSent(true);
        setRegOtpInput('');
        setRegIsPhoneVerified(false);
        showToast(`🔥 [Firebase SMS] ${fbRes.e164Phone} 번호로 실제 6자리 인증 문자가 발송되었습니다!`, false, true);
      } else {
        showToast(fbRes.message, true);
      }
      return;
    }

    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setRegOtpCode(generated);
    setRegOtpSent(true);
    setRegOtpInput(generated); // auto-fill for testing ease
    setRegIsPhoneVerified(false);
    showToast(`[${formatPhoneNumber(regPhone)}] 번호로 6자리 SMS 가입 인증번호가 발송되었습니다.`, false, true);
  };

  const handleVerifyRegOtp = async () => {
    if (!regOtpInput.trim()) {
      showToast('6자리 인증번호를 입력해주세요.', true);
      return;
    }

    if (isFirebaseMode && regOtpCode === 'FIREBASE_ACTIVE') {
      setIsFirebaseLoading(true);
      const verifyRes = await verifyFirebasePhoneOtp(regOtpInput);
      setIsFirebaseLoading(false);
      if (verifyRes.success) {
        setRegIsPhoneVerified(true);
        showToast(`✅ [Firebase 공인인증 완료] ${verifyRes.message}`, false, true);
      } else {
        showToast(verifyRes.message, true);
      }
      return;
    }

    if (regOtpInput.trim() !== regOtpCode) {
      showToast('SMS 인증번호가 일치하지 않습니다. 다시 확인해주세요.', true);
      return;
    }
    setRegIsPhoneVerified(true);
    showToast('✅ 휴대전화 본인 확인이 완료되었습니다!', false, true);
  };

  const handleRegisterSubmit = async () => {
    if (!regName.trim()) {
      showToast('성명(실명)을 입력해주세요.', true);
      return;
    }
    const cleanPhone = stripPhoneNumber(regPhone);
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

    const res = await registerNewMember({
      name: regName.trim(),
      hanja: isPureHangulName ? undefined : (regHanja.trim() || undefined),
      clan: regClan.trim(),
      role: regRoleType,
      roleLabel: regRoleLabel,
      phone: cleanPhone, // DB에는 '-' 하이픈 없이 숫자만 저장
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
      <View style={[styles.overlay, isMobile && styles.overlayMobile]}>
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          {/* Header - Dynamic for Smartphone vs PC */}
          {isMobile ? (
            <View style={styles.headerMobile}>
              <View style={styles.headerLeftMobile}>
                <Text style={styles.headerTitleMobile} numberOfLines={1}>🛡️ 가문 보안 로그인</Text>
                <View style={styles.shieldBadgeMobile}>
                  <Text style={styles.shieldBadgeTextMobile}>4중보안</Text>
                </View>
              </View>
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.closeBtnMobile}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
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
          )}

          {/* Current Logged-in Account Banner */}
          {isAuthenticated && (
            <View
              style={{
                marginHorizontal: isMobile ? 8 : 16,
                marginTop: isMobile ? 6 : 10,
                marginBottom: isMobile ? 4 : 8,
                padding: isMobile ? 8 : 12,
                backgroundColor: '#f0fdf4',
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: '#86efac',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: isMobile ? 6 : 0,
              }}
            >
              <View style={{ flex: isMobile ? undefined : 1, marginRight: isMobile ? 0 : 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ fontSize: isMobile ? 12 : 13, fontWeight: '800', color: '#166534' }}>
                    🛡️ 현재 로그인 계정
                  </Text>
                  <View
                    style={{
                      marginLeft: 6,
                      backgroundColor: '#22c55e',
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#ffffff' }}>인증됨</Text>
                  </View>
                </View>
                <Text style={{ fontSize: isMobile ? 12 : 13, fontWeight: '700', color: '#1e293b' }}>
                  {currentUser.name} ({currentUser.clan || '가문 정회원'})
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }}>
                  {currentUser.roleLabel || '직계 자손'} · {currentUser.phone || '연락처 등록됨'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                <TouchableOpacity
                  onPress={handleCopySyncLink}
                  style={{
                    backgroundColor: '#0284c7',
                    paddingHorizontal: isMobile ? 8 : 10,
                    paddingVertical: isMobile ? 5 : 8,
                    borderRadius: 6,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#ffffff', fontSize: isMobile ? 11 : 12, fontWeight: '800' }}>
                    📲 폰 연동 복사
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    logout();
                    showToast('안전하게 로그아웃되었습니다.', false, true);
                  }}
                  style={{
                    backgroundColor: '#dc2626',
                    paddingHorizontal: isMobile ? 8 : 10,
                    paddingVertical: isMobile ? 5 : 8,
                    borderRadius: 6,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#ffffff', fontSize: isMobile ? 11 : 12, fontWeight: '800' }}>
                    🚪 로그아웃
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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

          {/* Firebase Phone Auth Engine Bar - Dynamic for Mobile vs PC */}
          {isMobile ? (
            <View style={styles.firebaseBarMobile}>
              <View style={styles.firebaseBarLeftMobile}>
                <View style={[
                  styles.firebaseBadgeMobile,
                  isFirebaseConfiguredState ? styles.firebaseBadgeActive : styles.firebaseBadgeReady
                ]}>
                  <Text style={styles.firebaseBadgeTextMobile}>
                    {isFirebaseConfiguredState ? '🔥 SMS 연동' : '🔥 SMS 준비'}
                  </Text>
                </View>
                <Text style={styles.firebaseBarTitleMobile} numberOfLines={1}>
                  {isFirebaseMode && isFirebaseConfiguredState
                    ? '실제 6자리 SMS 발송'
                    : '모의 테스트 모드'}
                </Text>
              </View>

              <View style={styles.firebaseBarActionsMobile}>
                <TouchableOpacity
                  style={[
                    styles.firebaseModeSwitchBtnMobile,
                    isFirebaseMode && isFirebaseConfiguredState
                      ? styles.firebaseModeSwitchActive
                      : styles.firebaseModeSwitchSim,
                  ]}
                  onPress={() => {
                    if (!isFirebaseConfiguredState) {
                      setIsFirebaseConfigModalOpen(true);
                    } else {
                      const nextMode = !isFirebaseMode;
                      setIsFirebaseMode(nextMode);
                      showToast(
                        nextMode
                          ? '🔥 실제 Firebase SMS 발송 모드로 전환되었습니다.'
                          : '🧪 모의 시뮬레이션 모드로 전환되었습니다.'
                      );
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.firebaseModeSwitchTextMobile,
                      isFirebaseMode && isFirebaseConfiguredState && styles.firebaseModeSwitchTextActive,
                    ]}
                  >
                    {isFirebaseMode && isFirebaseConfiguredState
                      ? '🔥실제ON'
                      : isFirebaseConfiguredState
                      ? '🧪모의'
                      : '⚡SMS설정'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.firebaseSettingBtnMobile}
                  onPress={() => setIsFirebaseConfigModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13 }}>⚙️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.firebaseBar}>
              <View style={styles.firebaseBarLeft}>
                <View style={[
                  styles.firebaseBadge,
                  isFirebaseConfiguredState ? styles.firebaseBadgeActive : styles.firebaseBadgeReady
                ]}>
                  <Text style={styles.firebaseBadgeText}>
                    {isFirebaseConfiguredState ? '🔥 Firebase Auth 연동됨' : '🔥 Firebase Auth 준비됨'}
                  </Text>
                </View>
                <Text style={styles.firebaseBarTitle}>
                  {isFirebaseMode && isFirebaseConfiguredState
                    ? '실제 6자리 SMS OTP 발송 모드 (Firebase)'
                    : '모의 6자리 OTP 시뮬레이션 모드 (테스트용)'}
                </Text>
                <Text style={styles.firebaseBarDesc}>
                  {isFirebaseConfiguredState
                    ? `프로젝트: ${fbConfigInput.projectId || '등록됨'} · 월 10,000건 무료 티어 적용`
                    : '구글 Firebase 키를 등록하면 실제 스마트폰으로 6자리 인증 문자가 전송됩니다.'}
                </Text>
              </View>

              <View style={styles.firebaseBarActions}>
                <TouchableOpacity
                  style={[
                    styles.firebaseModeSwitchBtn,
                    isFirebaseMode && isFirebaseConfiguredState
                      ? styles.firebaseModeSwitchActive
                      : styles.firebaseModeSwitchSim,
                  ]}
                  onPress={() => {
                    if (!isFirebaseConfiguredState) {
                      setIsFirebaseConfigModalOpen(true);
                    } else {
                      const nextMode = !isFirebaseMode;
                      setIsFirebaseMode(nextMode);
                      showToast(
                        nextMode
                          ? '🔥 실제 Firebase SMS 발송 모드로 전환되었습니다.'
                          : '🧪 모의 시뮬레이션 모드로 전환되었습니다.'
                      );
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.firebaseModeSwitchText,
                      isFirebaseMode && isFirebaseConfiguredState && styles.firebaseModeSwitchTextActive,
                    ]}
                  >
                    {isFirebaseMode && isFirebaseConfiguredState
                      ? '🔥 실제 SMS 발송 (ON)'
                      : isFirebaseConfiguredState
                      ? '🧪 모의 테스트 (OFF)'
                      : '⚡ 실제 SMS 켜기'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.firebaseSettingBtn}
                  onPress={() => setIsFirebaseConfigModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.firebaseSettingBtnText}>⚙️ Firebase 설정</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Nav Tabs - Horizontal Scroll on Mobile, Full Grid on PC */}
          {isMobile ? (
            <View style={styles.tabBarScrollWrapperMobile}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBarScrollMobile}
                contentContainerStyle={styles.tabBarMobile}
              >
                <TouchableOpacity
                  style={[styles.tabBtnMobile, activeTab === 'credentials' && styles.tabBtnActiveMobile]}
                  onPress={() => setActiveTab('credentials')}
                  activeOpacity={0.8}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.tabBtnTextMobile, activeTab === 'credentials' && styles.tabBtnTextActiveMobile]}
                  >
                    📱 휴대폰 로그인
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtnMobile, activeTab === 'register' && styles.tabBtnActiveMobile]}
                  onPress={() => setActiveTab('register')}
                  activeOpacity={0.8}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.tabBtnTextMobile, activeTab === 'register' && styles.tabBtnTextActiveMobile]}
                  >
                    📝 신규가입
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtnMobile, activeTab === 'clan_code' && styles.tabBtnActiveMobile]}
                  onPress={() => setActiveTab('clan_code')}
                  activeOpacity={0.8}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.tabBtnTextMobile, activeTab === 'clan_code' && styles.tabBtnTextActiveMobile]}
                  >
                    🔑 초대코드
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtnMobile, activeTab === 'demo' && styles.tabBtnActiveMobile]}
                  onPress={() => setActiveTab('demo')}
                  activeOpacity={0.8}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.tabBtnTextMobile, activeTab === 'demo' && styles.tabBtnTextActiveMobile]}
                  >
                    🧪 빠른전환
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtnMobile, activeTab === 'sync' && styles.tabBtnActiveMobile]}
                  onPress={() => setActiveTab('sync')}
                  activeOpacity={0.8}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.tabBtnTextMobile, activeTab === 'sync' && styles.tabBtnTextActiveMobile]}
                  >
                    📲 기기연동
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
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
                  🔑 초대 코드
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === 'sync' && styles.tabBtnActive,
                ]}
                onPress={() => setActiveTab('sync')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'sync' && styles.tabBtnTextActive,
                  ]}
                >
                  📲 기기 연동 (PC↔폰)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Body Content */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={[styles.bodyContent, isMobile && styles.bodyContentMobile]}
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
                                📱 연락처: {formatPhoneNumber(acc.phone)}
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
                              {acc.motherName && (
                                <Text style={styles.accountDetailItem}>
                                  👩 모: {acc.motherName}
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
                            📱 연락처: {formatPhoneNumber(acc.phone)}
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
                  <View style={[styles.formCard, isMobile && { padding: 12 }]}>
                    <Text style={[styles.formTitle, isMobile && { fontSize: 14, marginBottom: 2 }]}>📱 1차 계정 확인</Text>
                    {!isMobile && (
                      <Text style={styles.formDesc}>
                        등록된 휴대전화 번호와 비밀번호를 입력해주세요.
                      </Text>
                    )}

                    <View style={[styles.fieldGroup, isMobile && { marginBottom: 10 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={styles.fieldLabel}>휴대전화 번호</Text>
                        {phoneInput.length > 0 && (
                          <TouchableOpacity onPress={() => setPhoneInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '700' }}>지우기 ✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TextInput
                        style={styles.input}
                        value={phoneInput}
                        onChangeText={(txt) => setPhoneInput(formatPhoneNumber(txt))}
                        placeholder="하이픈 없이 숫자만 입력 (예: 01012345678)"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                      />
                      <Text style={[styles.phoneInputNotice, isMobile && { fontSize: 10.5, marginTop: 2 }]}>
                        {isMobile ? '💡 숫자만 입력 시 자동 정렬됩니다' : '💡 하이픈(-) 없이 숫자만 입력하세요. (입력 시 자동으로 - 이 정렬됩니다)'}
                      </Text>
                      {/* 빠른 테스트용 번호 입력 */}
                      <View style={[styles.quickFillRow, isMobile && { marginTop: 4, gap: 4 }]}>
                        <Text style={[styles.quickFillLabel, isMobile && { fontSize: 10 }]}>
                          {isMobile ? '예시:' : '예시 번호 자동입력:'}
                        </Text>
                        <TouchableOpacity
                          style={[styles.quickFillChip, isMobile && { paddingVertical: 2, paddingHorizontal: 6 }]}
                          onPress={() => {
                            setPhoneInput('010-1234-5678');
                            setPasswordInput('password123!');
                          }}
                        >
                          <Text style={[styles.quickFillChipText, isMobile && { fontSize: 10.5 }]}>
                            {isMobile ? '홍길동' : '홍길동 (010-1234-5678)'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quickFillChip, isMobile && { paddingVertical: 2, paddingHorizontal: 6 }]}
                          onPress={() => {
                            setPhoneInput('010-9182-4411');
                            setPasswordInput('password123!');
                          }}
                        >
                          <Text style={[styles.quickFillChipText, isMobile && { fontSize: 10.5 }]}>
                            {isMobile ? '전우치' : '전우치 (010-9182-4411)'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.fieldGroup, isMobile && { marginBottom: 10 }]}>
                      <Text style={styles.fieldLabel}>비밀번호</Text>
                      <TextInput
                        style={styles.input}
                        value={passwordInput}
                        onChangeText={setPasswordInput}
                        placeholder="비밀번호 입력"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                      />
                      <Text style={[styles.fieldHint, isMobile && { fontSize: 10.5, marginTop: 2 }]}>
                        기본 비밀번호: password123!
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        isMobile && { paddingVertical: 11 },
                        bruteForce.isLocked && styles.submitBtnDisabled,
                      ]}
                      onPress={handleCredentialsSubmit}
                      disabled={bruteForce.isLocked}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.submitBtnText, isMobile && { fontSize: 13.5 }]}>
                        {bruteForce.isLocked
                          ? '⛔ 5분 잠금 해제 대기 중'
                          : isMobile
                          ? '📱 6자리 2FA 보안 OTP 발송'
                          : '📱 1차 확인 및 6자리 2FA 보안 OTP 발송'}
                      </Text>
                    </TouchableOpacity>

                    {/* Unregistered Phone Alert Box */}
                    {unregisteredPhoneAlert && (
                      <View style={styles.notRegisteredAlertBox}>
                        <Text style={styles.notRegisteredAlertTitle}>
                          ⚠️ 이 기기(브라우저)에 등록되지 않은 번호입니다
                        </Text>
                        <Text style={styles.notRegisteredAlertDesc}>
                          [{unregisteredPhoneAlert}] 번호는 현재 기기의 저장소에서 찾을 수 없습니다.
                        </Text>

                        {/* PC에서 이미 가입한 사용자를 위한 스마트폰 연동 가이드 */}
                        <View style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: 8, marginVertical: 8, borderWidth: 1, borderColor: '#fca5a5' }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#991b1b', marginBottom: 2 }}>
                            💡 PC에서 이미 회원 가입을 하셨나요?
                          </Text>
                          <Text style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 16 }}>
                            개인정보 보안을 위해 PC 브라우저와 스마트폰은 데이터가 분리되어 있습니다. PC에서 [📲 기기 연동] 링크를 복사하여 스마트폰으로 접속하거나 동기화 코드를 적용하면 즉시 로그인됩니다.
                          </Text>
                          <TouchableOpacity
                            style={{
                              marginTop: 8,
                              backgroundColor: '#0284c7',
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 6,
                              alignItems: 'center',
                            }}
                            onPress={() => {
                              setUnregisteredPhoneAlert(null);
                              setActiveTab('sync');
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>
                              📲 PC ↔ 스마트폰 데이터 연동하기 ➔
                            </Text>
                          </TouchableOpacity>
                        </View>

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
                            📝 [{unregisteredPhoneAlert}] 번호로 새로 가입 신청 ➔
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
                          [{formatPhoneNumber(pending2FA.phone)}] 번호로 일회용 보안 코드가 발송되었습니다.
                        </Text>
                      </View>
                    </View>

                    {/* SMS Alert Box (Firebase 실제 SMS vs 모의 SMS) */}
                    {pending2FA.isFirebase ? (
                      <View style={[styles.smsSimBox, { backgroundColor: '#fef2f2', borderColor: '#f87171' }]}>
                        <Text style={[styles.smsSimTitle, { color: '#991b1b' }]}>
                          🔥 [Firebase 실제 SMS 발송 완료]
                        </Text>
                        <Text style={[styles.smsSimContent, { color: '#7f1d1d' }]}>
                          스마트폰으로 전송된 6자리 인증 문자를 확인하고 아래에 입력해주세요. (국제발신 규격: {toE164Format(pending2FA.phone)})
                        </Text>
                        <Text style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>
                          ※ Firebase 콘솔의 무료 테스트 번호인 경우 지정한 테스트 인증번호(예: 123456)를 입력하시면 됩니다.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.smsSimBox}>
                        <Text style={styles.smsSimTitle}>
                          📬 [모의 SMS 수신] 가문 디지털 족보 보안 인증
                        </Text>
                        <Text style={styles.smsSimContent}>
                          인증번호는 [<Text style={styles.smsSimOtp}>{pending2FA.expectedOtp}</Text>] 입니다. 타인에게 절대 노출하지 마십시오.
                        </Text>
                      </View>
                    )}

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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.fieldLabel}>
                        휴대전화 번호 (로그인 ID) <Text style={{ color: '#ef4444' }}>*</Text>
                      </Text>
                      {regPhone.length > 0 && !regIsPhoneVerified && (
                        <TouchableOpacity onPress={() => setRegPhone('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '700' }}>지우기 ✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Phone Input */}
                    <TextInput
                      style={[
                        styles.input,
                        regIsPhoneVerified && { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
                      ]}
                      value={regPhone}
                      onChangeText={(txt) => {
                        setRegPhone(formatPhoneNumber(txt));
                        setRegIsPhoneVerified(false);
                        setRegOtpSent(false);
                      }}
                      placeholder="하이픈 없이 숫자만 입력 (예: 01012345678)"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      editable={!regIsPhoneVerified}
                    />
                    <Text style={styles.phoneInputNotice}>
                      💡 하이픈(-) 없이 숫자만 입력하세요. (입력 시 자동으로 - 이 정렬됩니다)
                    </Text>

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

                    {/* SMS Alert Box for Registration (Firebase vs Simulated) */}
                    {regOtpSent && !regIsPhoneVerified && (
                      <View style={{ marginTop: 10 }}>
                        {regOtpCode === 'FIREBASE_ACTIVE' ? (
                          <View style={[styles.smsSimBox, { backgroundColor: '#fef2f2', borderColor: '#f87171' }]}>
                            <Text style={[styles.smsSimTitle, { color: '#991b1b' }]}>
                              🔥 [Firebase 가입 인증 SMS 발송 완료]
                            </Text>
                            <Text style={[styles.smsSimContent, { color: '#7f1d1d' }]}>
                              [{formatPhoneNumber(regPhone)}] ({toE164Format(regPhone)}) 번호로 전송된 6자리 인증 문자를 확인하고 아래에 입력해주세요.
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.smsSimBox}>
                            <Text style={styles.smsSimTitle}>
                              📬 [모의 SMS 수신] 가문 신규 가입 본인인증
                            </Text>
                            <Text style={styles.smsSimContent}>
                              인증번호는 [<Text style={styles.smsSimOtp}>{regOtpCode}</Text>] 입니다. 타인에게 노출하지 마십시오.
                            </Text>
                          </View>
                        )}

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

                  {/* 생년월일 */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>생년월일 (선택)</Text>
                    <TextInput
                      style={styles.input}
                      value={regBirthDate}
                      onChangeText={setRegBirthDate}
                      placeholder="예: 1995-08-15"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  {/* 부모님 성함 (부친 & 모친) */}
                  <View style={styles.formRow}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>부(아버지) 성함 (선택)</Text>
                      <TextInput
                        style={styles.input}
                        value={regFatherName}
                        onChangeText={setRegFatherName}
                        placeholder={currentSurname ? `예: ${currentSurname}진우` : '예: 최진우'}
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>모(어머니) 성함 (선택)</Text>
                      <TextInput
                        style={styles.input}
                        value={regMotherName}
                        onChangeText={setRegMotherName}
                        placeholder="예: 이정옥"
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
                      onChangeText={(txt) => setNewUserPhone(formatPhoneNumber(txt))}
                      placeholder="010-1234-5678"
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

            {/* ================= TAB 5: DEVICE SYNC (PC ↔ SMARTPHONE) ================= */}
            {activeTab === 'sync' && (
              <View style={styles.tabContent}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>📲 PC ↔ 스마트폰 족보 데이터 원클릭 연동</Text>
                  <Text style={styles.formDesc}>
                    현재 족보 웹은 개인정보 보안을 위해 각 기기의 브라우저 로컬 저장소에 암호화 보관됩니다. PC에서 등록하신 본인 계정 및 부모님 가계도 정보를 스마트폰으로 손쉽게 보내거나 불러올 수 있습니다.
                  </Text>

                  {/* 1. PC -> Phone: Copy Sync Link */}
                  <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534', marginBottom: 4 }}>
                      1️⃣ [PC에서 진행] 스마트폰으로 내 계정·족보 보내기
                    </Text>
                    <Text style={{ fontSize: 11.5, color: '#15803d', marginBottom: 10, lineHeight: 16 }}>
                      아래 버튼을 누르면 본인 계정과 부모님 가계도가 포함된 원클릭 동기화 링크가 복사됩니다. 카카오톡 '나와의 채팅'이나 문자로 본인 스마트폰에 보낸 뒤 클릭하세요.
                    </Text>

                    <TouchableOpacity
                      style={{
                        backgroundColor: '#16a34a',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                      }}
                      onPress={handleCopySyncLink}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>
                        🔗 스마트폰 연동 원클릭 링크 복사하기
                      </Text>
                    </TouchableOpacity>

                    {syncQrCodeUrl ? (
                      <View style={{ alignItems: 'center', marginTop: 12, backgroundColor: '#ffffff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#86efac' }}>
                        <Image
                          source={{ uri: syncQrCodeUrl }}
                          style={{ width: 170, height: 170 }}
                          resizeMode="contain"
                        />
                        <Text style={{ fontSize: 11, color: '#166534', fontWeight: '800', marginTop: 6, textAlign: 'center' }}>
                          📷 스마트폰 기본 카메라로 비추면 1초 만에 스마트폰 화면에 부모님과 가계도가 동일하게 나타납니다!
                        </Text>
                      </View>
                    ) : null}

                    {copiedSyncUrl ? (
                      <View style={{ marginTop: 10, backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#86efac' }}>
                        <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '700' }}>복사된 링크 미리보기:</Text>
                        <Text numberOfLines={2} style={{ fontSize: 10.5, color: '#475569', marginTop: 2, fontFamily: 'monospace' }}>
                          {copiedSyncUrl}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* 2. Phone / PC: Paste Code */}
                  <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 4 }}>
                      2️⃣ [스마트폰에서 진행] 동기화 코드로 직접 복원하기
                    </Text>
                    <Text style={{ fontSize: 11.5, color: '#64748b', marginBottom: 10, lineHeight: 16 }}>
                      PC에서 전달받은 동기화 텍스트 코드가 있으신가요? 아래에 붙여넣고 복원 버튼을 누르면 즉시 동기화 및 자동 로그인이 완료됩니다.
                    </Text>

                    <TextInput
                      style={[styles.input, { height: 70, textAlignVertical: 'top', fontSize: 11, fontFamily: 'monospace' }]}
                      value={syncCodeInput}
                      onChangeText={setSyncCodeInput}
                      placeholder="전달받은 동기화 코드를 여기에 붙여넣으세요..."
                      placeholderTextColor="#94a3b8"
                      multiline
                    />

                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: '#0284c7', marginTop: 8 }]}
                      onPress={handleApplySyncCode}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.submitBtnText}>
                        📥 족보 및 계정 즉시 복원하기
                      </Text>
                    </TouchableOpacity>
                  </View>
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

      {/* ================= FIREBASE CONFIG MODAL ================= */}
      <Modal
        visible={isFirebaseConfigModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFirebaseConfigModalOpen(false)}
      >
        <View style={styles.fbOverlay}>
          <View style={styles.fbCard}>
            <View style={styles.fbHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Text style={{ fontSize: 24 }}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fbTitle}>Firebase Phone Auth 프로젝트 설정</Text>
                  <Text style={styles.fbSub}>
                    Google Firebase 콘솔의 웹 앱 설정 키를 등록하여 무료 6자리 SMS OTP를 활성화합니다.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsFirebaseConfigModalOpen(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.fbScroll} showsVerticalScrollIndicator={false}>
              {/* Step by step guide */}
              <View style={styles.fbGuideBox}>
                <Text style={styles.fbGuideTitle}>💡 3단계 초간단 연동 가이드 (비용 0원):</Text>
                <Text style={styles.fbGuideStep}>
                  1. <Text style={{ fontWeight: '700' }}>console.firebase.google.com</Text> 접속 후 무료 프로젝트 생성
                </Text>
                <Text style={styles.fbGuideStep}>
                  2. <Text style={{ fontWeight: '700' }}>Authentication ➔ Sign-in method</Text>에서 <Text style={{ fontWeight: '700', color: '#0369a1' }}>[전화 (Phone)]</Text> 사용 설정
                </Text>
                <Text style={styles.fbGuideStep}>
                  3. 프로젝트 설정 ➔ 일반 ➔ <Text style={{ fontWeight: '700' }}>내 앱 (웹 앱 &lt;/&gt;)</Text> 추가 후 표시되는 설정값을 아래에 복사/붙여넣기
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  apiKey <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={fbConfigInput.apiKey}
                  onChangeText={(txt) => setFbConfigInput({ ...fbConfigInput, apiKey: txt })}
                  placeholder="예: AIzaSyA1b2C3d4E5f6G7h8..."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>authDomain</Text>
                <TextInput
                  style={styles.input}
                  value={fbConfigInput.authDomain}
                  onChangeText={(txt) => setFbConfigInput({ ...fbConfigInput, authDomain: txt })}
                  placeholder="예: my-jokbo-project.firebaseapp.com"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  projectId <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={fbConfigInput.projectId}
                  onChangeText={(txt) => setFbConfigInput({ ...fbConfigInput, projectId: txt })}
                  placeholder="예: my-jokbo-project"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>appId</Text>
                <TextInput
                  style={styles.input}
                  value={fbConfigInput.appId}
                  onChangeText={(txt) => setFbConfigInput({ ...fbConfigInput, appId: txt })}
                  placeholder="예: 1:1234567890:web:abcdef123456"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>

              {/* Free Test Numbers Tip */}
              <View style={styles.fbTipBox}>
                <Text style={styles.fbTipTitle}>🧪 통신비 0원 무료 테스트 꿀팁:</Text>
                <Text style={styles.fbTipText}>
                  Firebase Console의 [테스트용 전화번호]에 본인 번호(예: <Text style={{ fontWeight: '700' }}>+82 10-1234-5678</Text>)와 고정 인증번호(예: <Text style={{ fontWeight: '700' }}>123456</Text>)를 등록해 두시면 실제 SMS 발송량 차감 없이 완전 무료로 무한정 테스트할 수 있습니다!
                </Text>
              </View>
            </ScrollView>

            <View style={styles.fbActionRow}>
              {isFirebaseConfiguredState && (
                <TouchableOpacity
                  style={styles.fbClearBtn}
                  onPress={handleClearFirebaseConfig}
                  activeOpacity={0.8}
                >
                  <Text style={styles.fbClearBtnText}>🗑️ 설정 삭제</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.fbSaveBtn}
                onPress={handleSaveFirebaseConfig}
                activeOpacity={0.85}
              >
                <Text style={styles.fbSaveBtnText}>💾 설정 저장 및 실제 SMS 활성화</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Mobile responsive styles
  overlayMobile: {
    padding: 6,
  },
  cardMobile: {
    maxWidth: '100%',
    maxHeight: '97%',
    borderRadius: 12,
  },
  headerMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#0f172a',
  },
  headerLeftMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitleMobile: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#f8fafc',
  },
  shieldBadgeMobile: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  shieldBadgeTextMobile: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800',
  },
  closeBtnMobile: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  firebaseBarMobile: {
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  firebaseBarLeftMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  firebaseBadgeMobile: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  firebaseBadgeTextMobile: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
  },
  firebaseBarTitleMobile: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9a3412',
    flexShrink: 1,
  },
  firebaseBarActionsMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  firebaseModeSwitchBtnMobile: {
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  firebaseModeSwitchTextMobile: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  firebaseSettingBtnMobile: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fdba74',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  tabBarScrollWrapperMobile: {
    height: 40,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBarScrollMobile: {
    flex: 1,
  },
  tabBarMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    height: 40,
  },
  tabBtnMobile: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    height: 40,
  },
  tabBtnActiveMobile: {
    borderBottomColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  tabBtnTextMobile: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActiveMobile: {
    color: '#0284c7',
    fontWeight: '800',
  },
  bodyContentMobile: {
    padding: 12,
    paddingBottom: 24,
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
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flexGrow: 1,
    flexBasis: '18%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
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
  // Firebase Auth Styles
  firebaseBar: {
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1.5,
    borderBottomColor: '#fed7aa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  firebaseBarLeft: {
    flex: 1,
    minWidth: 240,
  },
  firebaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  firebaseBadgeActive: {
    backgroundColor: '#ea580c',
  },
  firebaseBadgeReady: {
    backgroundColor: '#ca8a04',
  },
  firebaseBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  firebaseBarTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#9a3412',
    marginBottom: 2,
  },
  firebaseBarDesc: {
    fontSize: 11,
    color: '#c2410c',
    lineHeight: 15,
  },
  firebaseBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  firebaseModeSwitchBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  firebaseModeSwitchActive: {
    backgroundColor: '#ea580c',
    borderColor: '#c2410c',
  },
  firebaseModeSwitchSim: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  firebaseModeSwitchText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  firebaseModeSwitchTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  firebaseSettingBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fdba74',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  firebaseSettingBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#c2410c',
  },
  // Firebase Config Modal Styles
  fbOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fbCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  fbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fff7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  fbTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9a3412',
  },
  fbSub: {
    fontSize: 11,
    color: '#c2410c',
    marginTop: 2,
  },
  fbScroll: {
    padding: 18,
  },
  fbGuideBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fbGuideTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: 6,
  },
  fbGuideStep: {
    fontSize: 11.5,
    color: '#0c4a6e',
    lineHeight: 17,
    marginBottom: 3,
  },
  fbTipBox: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fef08a',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  fbTipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854d0e',
    marginBottom: 4,
  },
  fbTipText: {
    fontSize: 11,
    color: '#713f12',
    lineHeight: 16,
  },
  fbActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  fbClearBtn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ffffff',
  },
  fbClearBtnText: {
    color: '#ef4444',
    fontSize: 12.5,
    fontWeight: '800',
  },
  fbSaveBtn: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#ea580c',
    alignItems: 'center',
  },
  fbSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  phoneInputNotice: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 6,
    lineHeight: 16,
  },
  quickFillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  quickFillLabel: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  quickFillChip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  quickFillChipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
});
