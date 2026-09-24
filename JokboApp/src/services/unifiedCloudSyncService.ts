import {
  syncFullPackageToFirestore,
  fetchFullPackageFromFirestore,
  fetchUserFromFirestore,
} from './firebaseDataService';
import {
  syncUserToSupabase,
  fetchUserFromSupabase,
  syncFamilyTreeToSupabase,
  fetchFamilyTreeFromSupabase,
  syncEstablishedLinksToSupabase,
  fetchEstablishedLinksFromSupabase,
} from './supabaseDataService';
import { isFirebaseConfigured } from '../config/firebaseConfig';
import { isSupabaseConnected } from '../config/supabaseClient';
import { UserProfile } from '../types/auth';
import { FamilyMember, EstablishedLink } from '../types/family';
import { stripPhoneNumber } from '../utils/securityAuth';

/**
 * [통합 클라우드 데이터베이스 동기화 매니저]
 * PC와 스마트폰 간 실시간 데이터베이스 양방향 저장을 총괄합니다.
 * Firebase Firestore 및 Supabase 클라우드 DB와 자동 연동됩니다.
 */

export interface CloudSyncStatus {
  isConfigured: boolean;
  provider: 'firebase' | 'supabase' | 'both' | 'local_only';
  lastSyncedAt?: string;
  memberCount?: number;
}

export function getCloudSyncStatus(): CloudSyncStatus {
  const hasFirebase = isFirebaseConfigured();
  const hasSupabase = isSupabaseConnected();

  if (hasFirebase && hasSupabase) {
    return { isConfigured: true, provider: 'both' };
  }
  if (hasFirebase) {
    return { isConfigured: true, provider: 'firebase' };
  }
  if (hasSupabase) {
    return { isConfigured: true, provider: 'supabase' };
  }
  return { isConfigured: false, provider: 'local_only' };
}

/**
 * 1. 클라우드 데이터베이스에 전체 가계도 패키지 저장
 */
export async function saveAllToCloudDatabase(
  user: UserProfile & { password?: string },
  tree: FamilyMember[],
  links: EstablishedLink[]
): Promise<{ success: boolean; message: string; provider?: string }> {
  const status = getCloudSyncStatus();
  let syncSuccess = false;
  let finalMessage = '';
  let fbError = '';

  // 1-1. Firebase Firestore 동기화
  if (isFirebaseConfigured()) {
    try {
      const fbRes = await syncFullPackageToFirestore(user, tree, links);
      if (fbRes.success) {
        syncSuccess = true;
        finalMessage = fbRes.message;
      } else {
        fbError = fbRes.message;
      }
    } catch (e: any) {
      console.warn('Firebase sync warning:', e);
      fbError = e?.message || 'Firebase 연결 응답 시간 초과';
    }
  }

  // 1-2. Supabase 동기화
  if (isSupabaseConnected()) {
    try {
      await Promise.all([
        syncUserToSupabase(user),
        syncFamilyTreeToSupabase(user.id, tree),
        syncEstablishedLinksToSupabase(user.id, links),
      ]);
      syncSuccess = true;
      finalMessage = `☁️ Supabase 클라우드 DB에 최신 족보(${tree.length}명)가 저장되었습니다.`;
    } catch (e: any) {
      console.warn('Supabase sync warning:', e);
    }
  }

  if (syncSuccess) {
    return {
      success: true,
      provider: status.provider,
      message: finalMessage || '☁️ 클라우드 DB 동기화가 성공적으로 완료되었습니다.',
    };
  }

  if (fbError) {
    return {
      success: false,
      provider: status.provider,
      message: `⚠️ 클라우드 DB 안내: ${fbError}\n(Firebase 콘솔에서 [Firestore Database]를 생성하시면 클라우드 저장이 즉시 활성화됩니다. 생성 전이라도 아래 [스마트폰 연동 링크] 및 [QR 코드]로 스마트폰과 1초 만에 동일하게 동기화됩니다!)`,
    };
  }

  return {
    success: false,
    provider: status.provider,
    message: '클라우드 DB(Firebase/Supabase) 설정이 활성화되지 않았습니다. 상단 QR 코드나 동기화 링크를 통해 스마트폰으로 즉시 전송할 수 있습니다.',
  };
}

/**
 * 2. 전화번호로 클라우드 데이터베이스에서 회원 및 가계도 전체 조회
 */
export async function fetchAllFromCloudDatabase(
  phone: string
): Promise<{
  success: boolean;
  user?: UserProfile & { password: string };
  familyTree?: FamilyMember[];
  establishedLinks?: EstablishedLink[];
  message: string;
}> {
  const cleanPhone = stripPhoneNumber(phone);
  if (!cleanPhone) {
    return { success: false, message: '올바른 전화번호를 입력해주세요.' };
  }

  // 2-1. Firebase Firestore 우선 조회
  if (isFirebaseConfigured()) {
    try {
      const fbRes = await fetchFullPackageFromFirestore(cleanPhone);
      if (fbRes.success && fbRes.user) {
        return fbRes;
      }
    } catch (e) {
      console.warn('Firestore fetch failed, checking Supabase:', e);
    }
  }

  // 2-2. Supabase 조회
  if (isSupabaseConnected()) {
    try {
      const user = await fetchUserFromSupabase(cleanPhone);
      if (user) {
        const familyTree = (await fetchFamilyTreeFromSupabase(user.id)) || [];
        const establishedLinks = (await fetchEstablishedLinksFromSupabase(user.id)) || [];
        return {
          success: true,
          user,
          familyTree,
          establishedLinks,
          message: `☁️ Supabase 클라우드 DB에서 ${user.name} 님의 가계도(${familyTree.length}명)를 불러왔습니다.`,
        };
      }
    } catch (e) {
      console.warn('Supabase fetch failed:', e);
    }
  }

  return {
    success: false,
    message: '클라우드 DB에서 해당 전화번호의 등록 계정을 찾을 수 없습니다.',
  };
}
