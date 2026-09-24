import { UserProfile } from '../types/auth';
import { FamilyMember, EstablishedLink } from '../types/family';
import {
  STORAGE_KEY_CUSTOM_ACCOUNTS,
  getCustomRegisteredAccounts,
  saveCustomAccount,
} from './securityAuth';
import {
  getStoredCustomFamily,
  saveStoredCustomFamily,
  getStoredEstablishedLinks,
  saveStoredEstablishedLinks,
} from '../hooks/useFamilyStore';
import { saveStoredAuthSession } from '../hooks/useAuthStore';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  JokboFirebaseConfig,
} from '../config/firebaseConfig';
import { saveAllToCloudDatabase } from '../services/unifiedCloudSyncService';

export interface JokboSyncPayload {
  version: 1;
  timestamp: number;
  account: UserProfile & { password: string };
  familyTree: FamilyMember[];
  establishedLinks: EstablishedLink[];
  firebaseConfig?: JokboFirebaseConfig;
}

/**
 * UTF-8 한글 문자열을 Base64 안전 문자열로 인코딩
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch (e) {
    return '';
  }
}

/**
 * Base64 안전 문자열을 UTF-8 한글 문자열로 디코딩
 */
function base64ToUtf8(str: string): string {
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    return '';
  }
}

/**
 * 현재 기기(PC)의 등록된 계정 및 가계도 전체를 동기화 패키지로 패키징합니다.
 */
export function generateSyncPackage(userId?: string): {
  success: boolean;
  syncCode?: string;
  syncUrl?: string;
  qrCodeUrl?: string;
  accountName?: string;
  memberCount?: number;
  message: string;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { success: false, message: '브라우저 저장소를 사용할 수 없습니다.' };
  }

  try {
    const customAccounts = getCustomRegisteredAccounts();
    const targetAccount = userId
      ? customAccounts.find((a) => a.id === userId)
      : customAccounts[customAccounts.length - 1];

    if (!targetAccount) {
      return {
        success: false,
        message: '동기화할 등록된 가문 계정이 없습니다. 먼저 회원 등록을 진행해주세요.',
      };
    }

    const familyTree = getStoredCustomFamily(targetAccount.id) || [];
    const establishedLinks = getStoredEstablishedLinks(targetAccount.id) || [];
    const fbConfig = getSavedFirebaseConfig();

    const payload: JokboSyncPayload = {
      version: 1,
      timestamp: Date.now(),
      account: targetAccount,
      familyTree,
      establishedLinks,
      firebaseConfig: fbConfig || undefined,
    };

    const jsonString = JSON.stringify(payload);
    const syncCode = utf8ToBase64(jsonString);

    let syncUrl = '';
    let qrCodeUrl = '';
    if (typeof window !== 'undefined' && window.location) {
      const base = window.location.origin + window.location.pathname;
      syncUrl = `${base}?jokbo_sync=${encodeURIComponent(syncCode)}`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(syncUrl)}`;
    }

    // 클라우드 데이터베이스(Firestore/Supabase)에도 백그라운드 동기화 수행
    saveAllToCloudDatabase(targetAccount, familyTree, establishedLinks).catch((err) =>
      console.warn('Auto cloud sync from generateSyncPackage:', err)
    );

    return {
      success: true,
      syncCode,
      syncUrl,
      qrCodeUrl,
      accountName: targetAccount.name,
      memberCount: familyTree.length,
      message: `${targetAccount.name} 님의 가계도(총 ${familyTree.length}명) 동기화 데이터가 준비되었습니다.`,
    };
  } catch (e) {
    console.error('Failed to generate sync package:', e);
    return { success: false, message: '동기화 데이터 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 다른 기기(스마트폰)에서 동기화 코드(Base64)를 파싱하여 LocalStorage에 저장하고 자동 로그인 처리합니다.
 */
export function importSyncPackage(rawSyncCode: string): {
  success: boolean;
  account?: UserProfile & { password: string };
  message: string;
} {
  if (!rawSyncCode || typeof window === 'undefined' || !window.localStorage) {
    return { success: false, message: '유효하지 않은 동기화 코드입니다.' };
  }

  try {
    const cleanCode = rawSyncCode.trim();
    const jsonString = base64ToUtf8(cleanCode);
    if (!jsonString) {
      return { success: false, message: '동기화 코드를 해석할 수 없습니다. 올바른 코드를 확인해주세요.' };
    }

    const payload: JokboSyncPayload = JSON.parse(jsonString);
    if (!payload || !payload.account || !payload.account.phone) {
      return { success: false, message: '올바른 가문 족보 동기화 데이터 규격이 아닙니다.' };
    }

    const { account, familyTree, establishedLinks, firebaseConfig } = payload;

    // 1. Firebase 설정 동기화
    if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
      saveFirebaseConfig(firebaseConfig);
    }

    // 2. 계정 정보 저장
    saveCustomAccount(account);

    // 3. 가계도 트리 저장
    if (familyTree && Array.isArray(familyTree) && familyTree.length > 0) {
      saveStoredCustomFamily(account.id, familyTree);
    }

    // 4. 결연 이력 저장
    if (establishedLinks && Array.isArray(establishedLinks)) {
      saveStoredEstablishedLinks(establishedLinks, account.id);
    }

    // 5. 즉시 로그인 세션 발급
    saveStoredAuthSession(account.id);

    // 6. 클라우드 DB에도 실시간 동기화 갱신
    saveAllToCloudDatabase(account, familyTree || [], establishedLinks || []).catch((err) =>
      console.warn('Post-import cloud DB sync:', err)
    );

    return {
      success: true,
      account,
      message: `🎉 [동기화 성공] ${account.name} 님의 가문 족보와 부모님(최헌호·김경순 어르신) 결연 정보가 완벽하게 동기화되었습니다!`,
    };
  } catch (e) {
    console.error('Failed to import sync package:', e);
    return { success: false, message: '동기화 데이터 복원 중 오류가 발생했습니다.' };
  }
}

/**
 * URL에 ?jokbo_sync=... 파라미터가 있는 경우 페이지 로드 시 즉시 자동 동기화 및 로그인
 */
export function checkAndApplyUrlSync(): {
  imported: boolean;
  accountName?: string;
  message?: string;
} {
  if (typeof window === 'undefined' || !window.location || !window.location.search) {
    return { imported: false };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const syncParam = params.get('jokbo_sync');
    if (!syncParam) return { imported: false };

    const res = importSyncPackage(syncParam);
    if (res.success && res.account) {
      // URL에서 jokbo_sync 파라미터를 제거하여 깔끔한 주소 유지
      try {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
      } catch (err) {
        // ignore
      }
      return {
        imported: true,
        accountName: res.account.name,
        message: res.message,
      };
    }
  } catch (e) {
    console.error('Error during URL sync check:', e);
  }

  return { imported: false };
}
