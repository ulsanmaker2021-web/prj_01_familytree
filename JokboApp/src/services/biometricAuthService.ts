/**
 * [스마트폰 자체 생체인증(WebAuthn / Passkey / FIDO2) 서비스]
 * 외부 유료 API나 서드파티 서비스 없이(비용 0원), 스마트폰의 내장 하드웨어 보안 칩
 * (안드로이드 삼성패스/지문인식, 아이폰 Touch ID / Face ID, PC Windows Hello)을
 * W3C 국제 웹 표준 WebAuthn API로 직접 호출하여 0.2초 초고속 본인인증을 수행합니다.
 */

// Helper to convert String to Uint8Array
function strToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const STORAGE_KEY_BIOMETRIC_PREFIX = 'jokbo_biometric_cred_';

/**
 * 1. 현재 브라우저/기기가 지문 또는 Face ID 생체인증을 지원하는지 확인
 */
export async function isPlatformBiometricsAvailable(): Promise<{
  supported: boolean;
  type?: 'fingerprint' | 'face' | 'platform';
  message: string;
}> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { supported: false, message: '브라우저 환경이 아닙니다.' };
  }

  // WebAuthn API 및 PublicKeyCredential 지원 여부
  if (!window.PublicKeyCredential) {
    return {
      supported: false,
      message: '현재 브라우저가 생체인증(WebAuthn) 표준을 지원하지 않습니다.',
    };
  }

  try {
    // 스마트폰/PC 자체 내장 생체인증 장치(지문센서, Face ID 등) 확인
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (available) {
      const userAgent = navigator.userAgent.toLowerCase();
      let type: 'fingerprint' | 'face' | 'platform' = 'fingerprint';
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        type = 'face'; // iOS Face ID / Touch ID
      } else if (userAgent.includes('android')) {
        type = 'fingerprint'; // Android 지문인식
      }

      return {
        supported: true,
        type,
        message: '스마트폰 생체인증(지문/Face ID)이 준비되었습니다.',
      };
    }

    return {
      supported: false,
      message: '기기에 등록된 지문 또는 안면인식 센서가 없습니다.',
    };
  } catch (e: any) {
    console.warn('Biometric availability check error:', e);
    return {
      supported: false,
      message: '생체인증 가용성을 확인할 수 없습니다.',
    };
  }
}

/**
 * 2. 현재 기기에 사용자의 생체인증(지문/Face ID) 자격증명 등록
 */
export async function registerPlatformBiometric(
  userId: string,
  userName: string
): Promise<{ success: boolean; credentialId?: string; message: string }> {
  const status = await isPlatformBiometricsAvailable();
  if (!status.supported) {
    return { success: false, message: status.message };
  }

  try {
    const challenge = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    } else {
      for (let i = 0; i < 32; i++) challenge[i] = Math.floor(Math.random() * 256);
    }

    const hostname = window.location.hostname || 'localhost';

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: '가문 족보 360',
        id: hostname === 'localhost' ? undefined : hostname,
      },
      user: {
        id: strToUint8Array(userId),
        name: userName || '가문 등록 정회원',
        displayName: userName || '가문 등록 정회원',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256 (표준 지문/Face ID 암호화)
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // 스마트폰 자체 하드웨어 센서 사용
        userVerification: 'required', // 지문/얼굴 본인확인 필수
        residentKey: 'discouraged',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, message: '생체인증 등록이 취소되었습니다.' };
    }

    const credentialId = bufferToBase64(credential.rawId);

    // 기기 로컬에 등록 자격증명 ID 캐시
    try {
      localStorage.setItem(STORAGE_KEY_BIOMETRIC_PREFIX + userId, credentialId);
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      credentialId,
      message: '🎉 스마트폰 생체인증(지문/Face ID)이 성공적으로 등록되었습니다!',
    };
  } catch (e: any) {
    console.error('Biometric registration error:', e);
    if (e.name === 'NotAllowedError') {
      return { success: false, message: '사용자가 생체인증 등록을 취소했습니다.' };
    }
    return { success: false, message: `생체인증 등록 실패: ${e.message || '센서 오류'}` };
  }
}

/**
 * 3. 스마트폰 지문 또는 Face ID로 2단계 본인 확인(Authentication) 실행
 */
export async function authenticatePlatformBiometric(
  userId: string,
  savedCredentialId?: string
): Promise<{ success: boolean; message: string }> {
  const status = await isPlatformBiometricsAvailable();
  if (!status.supported) {
    return { success: false, message: status.message };
  }

  try {
    const challenge = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    } else {
      for (let i = 0; i < 32; i++) challenge[i] = Math.floor(Math.random() * 256);
    }

    const hostname = window.location.hostname || 'localhost';

    let credId = savedCredentialId;
    if (!credId && typeof localStorage !== 'undefined') {
      credId = localStorage.getItem(STORAGE_KEY_BIOMETRIC_PREFIX + userId) || undefined;
    }

    const allowCredentials: PublicKeyCredentialDescriptor[] = credId
      ? [
          {
            type: 'public-key',
            id: base64ToUint8Array(credId),
            transports: ['internal'],
          },
        ]
      : [];

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: hostname === 'localhost' ? undefined : hostname,
      userVerification: 'required', // 지문 / Face ID 본인 터치 필수
      timeout: 60000,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, message: '생체인증 확인이 취소되었습니다.' };
    }

    return {
      success: true,
      message: '✅ 스마트폰 생체인증(지문/Face ID) 확인이 완료되었습니다!',
    };
  } catch (e: any) {
    console.error('Biometric authentication error:', e);
    if (e.name === 'NotAllowedError') {
      return { success: false, message: '지문/Face ID 인증이 취소되었거나 불일치합니다.' };
    }
    return { success: false, message: `생체인증 오류: ${e.message || '센서 오류'}` };
  }
}
