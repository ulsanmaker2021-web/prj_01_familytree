import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

export interface JokboFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

const STORAGE_KEY_FIREBASE = 'jokbo_firebase_config_v1';

// 기본 템플릿 (사용자가 콘솔에서 키를 발급받아 입력하기 전 기본 구조)
export const DEFAULT_FIREBASE_PLACEHOLDER: JokboFirebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/**
 * 브라우저 저장소에서 Firebase 설정을 가져옵니다.
 */
export function getSavedFirebaseConfig(): JokboFirebaseConfig | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse saved Firebase config:', e);
    return null;
  }
}

/**
 * Firebase 설정을 브라우저 저장소에 영구 보존합니다.
 */
export function saveFirebaseConfig(config: JokboFirebaseConfig): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
    return false;
  }
}

/**
 * 저장된 Firebase 설정을 초기화(제거)합니다.
 */
export function clearFirebaseConfig(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY_FIREBASE);
  }
}

/**
 * 현재 Firebase 설정이 유효한지 확인합니다.
 */
export function isFirebaseConfigured(): boolean {
  const config = getSavedFirebaseConfig();
  return Boolean(config && config.apiKey && config.apiKey.length > 10 && config.projectId);
}

/**
 * Firebase App 인스턴스를 가져오거나 초기화합니다.
 */
export function getFirebaseAppInstance(): FirebaseApp | null {
  const config = getSavedFirebaseConfig();
  if (!config || !config.apiKey) {
    return null;
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      return getApp();
    }
    return initializeApp(config);
  } catch (e) {
    console.error('Failed to initialize Firebase App:', e);
    return null;
  }
}

/**
 * Firebase Auth 인스턴스를 가져옵니다.
 */
export function getFirebaseAuthInstance(): Auth | null {
  const app = getFirebaseAppInstance();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (e) {
    console.error('Failed to get Firebase Auth instance:', e);
    return null;
  }
}
