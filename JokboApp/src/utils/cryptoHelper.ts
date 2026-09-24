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
