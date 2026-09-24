import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 기본 연동 프로젝트 URL
export const DEFAULT_SUPABASE_URL = 'https://ovruyfmvdareluqsrgdw.supabase.co';

const STORAGE_KEY_SUPABASE_URL = 'jokbo_supabase_url_v1';
const STORAGE_KEY_SUPABASE_ANON_KEY = 'jokbo_supabase_anon_key_v1';

export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window === 'undefined' || !window.localStorage) {
    return { url: envUrl || DEFAULT_SUPABASE_URL, anonKey: envKey || '' };
  }
  const localUrl = window.localStorage.getItem(STORAGE_KEY_SUPABASE_URL);
  const localAnonKey = window.localStorage.getItem(STORAGE_KEY_SUPABASE_ANON_KEY);

  const url = localUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = localAnonKey || envKey || '';
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    window.localStorage.setItem(STORAGE_KEY_SUPABASE_ANON_KEY, anonKey.trim());
    _cachedClient = null; // 인스턴스 갱신
    return true;
  } catch (e) {
    console.error('Failed to save supabase config:', e);
    return false;
  }
}

let _cachedClient: SupabaseClient | null = null;

/**
 * 활성화된 Supabase 클라이언트를 반환합니다.
 * anonKey가 설정되지 않은 경우 null을 반환합니다.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSavedSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (!_cachedClient) {
    try {
      _cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return _cachedClient;
}

export function isSupabaseConnected(): boolean {
  const { url, anonKey } = getSavedSupabaseConfig();
  return Boolean(url && anonKey && anonKey.length > 20);
}
