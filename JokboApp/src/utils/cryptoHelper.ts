/**
 * [가문 보안 암호화 헬퍼]
 * Web Crypto API를 활용한 비밀번호 SHA-256 단방향 솔트 해싱
 */

const GLOBAL_SALT = 'jokbo_clan_security_salt_2026';

export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainPassword + GLOBAL_SALT);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex}`;
    }
  } catch (e) {
    console.error('Crypto subtle failed, fallback to plain salt hash', e);
  }
  // Fallback for non-crypto environment
  return `plain:${plainPassword}`;
}

export async function verifyPassword(inputPassword: string, storedHashOrPlain: string): Promise<boolean> {
  if (!storedHashOrPlain || !inputPassword) return false;

  // 1. 기존 평문 비밀번호 호환
  if (storedHashOrPlain === inputPassword || storedHashOrPlain === `plain:${inputPassword}`) {
    return true;
  }

  // 2. SHA-256 해시 검증
  if (storedHashOrPlain.startsWith('sha256:')) {
    const computed = await hashPassword(inputPassword);
    return computed === storedHashOrPlain;
  }

  return false;
}

const PIN_SALT = 'jokbo_clan_pin_salt_2026';

/**
 * 6자리 보안 PIN 번호를 SHA-256 단방향 솔트 해싱
 */
export async function hashPin(plainPin: string): Promise<string> {
  const clean = (plainPin || '').replace(/[^0-9]/g, '');
  if (clean.length !== 6) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(clean + PIN_SALT);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `pin256:${hashHex}`;
    }
  } catch (e) {
    console.error('Crypto subtle failed for PIN', e);
  }
  return `plain_pin:${clean}`;
}

/**
 * 6자리 보안 PIN 번호 일치 검증
 */
export async function verifyPin(inputPin: string, storedHashOrPlain: string): Promise<boolean> {
  const clean = (inputPin || '').replace(/[^0-9]/g, '');
  if (!storedHashOrPlain || clean.length !== 6) return false;

  if (storedHashOrPlain === clean || storedHashOrPlain === `plain_pin:${clean}`) {
    return true;
  }

  if (storedHashOrPlain.startsWith('pin256:')) {
    const computed = await hashPin(clean);
    return computed === storedHashOrPlain;
  }

  return false;
}
