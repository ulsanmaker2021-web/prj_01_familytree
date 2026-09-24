import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
} from 'firebase/auth';
import {
  getFirebaseAuthInstance,
  isFirebaseConfigured,
} from '../config/firebaseConfig';
import { stripPhoneNumber, formatPhoneNumber } from '../utils/securityAuth';

// In-memory active confirmation session
let activeConfirmationResult: ConfirmationResult | null = null;
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * 국내 및 일반 전화번호를 Firebase 국제 표준 규격(E.164)으로 변환
 * 예: 010-1234-5678 -> +821012345678
 * 예: 01012345678   -> +821012345678
 */
export function toE164Format(phoneNumber: string): string {
  const digits = stripPhoneNumber(phoneNumber);
  if (!digits) return '';

  if (digits.startsWith('82')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+82${digits.slice(1)}`;
  }
  return `+82${digits}`;
}

/**
 * reCAPTCHA 컨테이너 DOM 요소를 동적으로 확인 및 생성
 */
export function ensureRecaptchaContainer(containerId: string = 'recaptcha-container'): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '999999';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * reCAPTCHA Verifier 준비 및 생성
 */
export function getOrCreateRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null;

  const auth = getFirebaseAuthInstance();
  if (!auth) return null;

  try {
    if (activeRecaptchaVerifier) {
      try {
        activeRecaptchaVerifier.clear();
      } catch (e) {
        // ignore
      }
      activeRecaptchaVerifier = null;
    }

    // Clean up DOM container to prevent "reCAPTCHA has already been rendered in this element"
    const existing = document.getElementById(containerId);
    if (existing) {
      existing.innerHTML = '';
    } else {
      ensureRecaptchaContainer(containerId);
    }

    activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired. Please try again.');
      },
    });

    return activeRecaptchaVerifier;
  } catch (e) {
    console.error('Failed to create RecaptchaVerifier:', e);
    return null;
  }
}

/**
 * Firebase Phone Auth를 통해 실제 6자리 보안 SMS OTP를 발송합니다.
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<{
  success: boolean;
  message: string;
  isFirebase: boolean;
  e164Phone?: string;
}> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      message: 'Firebase 설정(apiKey, projectId 등)이 등록되어 있지 않습니다.',
      isFirebase: false,
    };
  }

  const auth = getFirebaseAuthInstance();
  if (!auth) {
    return {
      success: false,
      message: 'Firebase Auth 인스턴스를 초기화할 수 없습니다.',
      isFirebase: false,
    };
  }

  const e164 = toE164Format(phoneNumber);
  if (!e164 || e164.length < 11) {
    return {
      success: false,
      message: '올바른 휴대전화 번호 형식이 아닙니다.',
      isFirebase: true,
    };
  }

  try {
    const recaptcha = getOrCreateRecaptcha(containerId);
    if (!recaptcha) {
      return {
        success: false,
        message: '보안 reCAPTCHA 검증기를 준비할 수 없습니다. 페이지를 새로고침해주세요.',
        isFirebase: true,
      };
    }

    const confirmationResult = await signInWithPhoneNumber(auth, e164, recaptcha);
    activeConfirmationResult = confirmationResult;

    return {
      success: true,
      message: `[${formatPhoneNumber(phoneNumber)}] (${e164}) 번호로 Firebase 보안 SMS OTP가 발송되었습니다.`,
      isFirebase: true,
      e164Phone: e164,
    };
  } catch (error: any) {
    console.error('Firebase Phone Auth Error:', error);
    let errorMsg = error.message || 'Firebase SMS 발송 중 오류가 발생했습니다.';

    if (error.code === 'auth/invalid-phone-number') {
      errorMsg = '유효하지 않은 휴대전화 번호 형식입니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMsg = '너무 많은 인증 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMsg = 'Firebase SMS 일일/월간 무료 발송 한도를 초과했습니다.';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMsg = 'reCAPTCHA 보안 인증에 실패했습니다. 다시 시도해주세요.';
    }

    return {
      success: false,
      message: `Firebase SMS 발송 실패: ${errorMsg}`,
      isFirebase: true,
    };
  }
}

/**
 * 수신된 6자리 보안 OTP 코드를 검증하고 Firebase 인증을 완료합니다.
 */
export async function verifyFirebasePhoneOtp(
  verificationCode: string
): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> {
  if (!activeConfirmationResult) {
    return {
      success: false,
      message: '진행 중인 Firebase SMS 인증 세션이 없습니다. 먼저 인증번호를 발송해주세요.',
    };
  }

  try {
    const userCredential = await activeConfirmationResult.confirm(verificationCode.trim());
    const user = userCredential.user;

    return {
      success: true,
      message: `Firebase 전화번호 인증 성공! (UID: ${user.uid.slice(0, 8)}...)`,
      user,
    };
  } catch (error: any) {
    console.error('Firebase OTP Verification Error:', error);
    let errorMsg = '인증번호가 일치하지 않거나 만료되었습니다.';

    if (error.code === 'auth/invalid-verification-code') {
      errorMsg = '입력하신 6자리 인증번호가 올바르지 않습니다.';
    } else if (error.code === 'auth/code-expired') {
      errorMsg = '인증번호 유효시간이 만료되었습니다. 다시 발송해주세요.';
    }

    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * 활성화된 인증 세션을 초기화합니다.
 */
export function clearPhoneAuthSession(): void {
  activeConfirmationResult = null;
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    activeRecaptchaVerifier = null;
  }
}

/**
 * 활성 인증 세션이 존재하는지 확인합니다.
 */
export function hasActiveFirebaseSession(): boolean {
  return activeConfirmationResult !== null;
}
