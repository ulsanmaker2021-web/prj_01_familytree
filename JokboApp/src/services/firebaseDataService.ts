import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { getFirebaseAppInstance, isFirebaseConfigured } from '../config/firebaseConfig';
import { UserProfile } from '../types/auth';
import { FamilyMember, EstablishedLink } from '../types/family';
import { stripPhoneNumber } from '../utils/securityAuth';

/**
 * [Firebase Cloud Firestore 실시간 데이터베이스 서비스]
 * PC와 스마트폰 간 가문 회원 계정, 가계도(부모·자녀), 결연 정보를
 * 실시간 클라우드 DB에 저장하고 상호 동기화합니다.
 */

// Firestore 인스턴스 캐시
let _cachedFirestore: Firestore | null = null;

/**
 * [타임아웃 래퍼]
 * Firestore 데이터베이스가 Firebase 콘솔에서 아직 생성되지 않았거나 네트워크 연결이
 * 지연될 때 무한 대기(Hang) 현상이 발생하는 것을 100% 원천 차단합니다 (3.5초 타임아웃).
 */
export async function withFirestoreTimeout<T>(
  promise: Promise<T>,
  ms = 3500,
  errorMsg = '클라우드 DB 응답 시간 초과 (Firebase 콘솔에서 Cloud Firestore 생성을 확인해주세요)'
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMsg));
    }, ms);
  });

  return Promise.race([
    promise
      .then((res) => {
        if (timer) clearTimeout(timer);
        return res;
      })
      .catch((err) => {
        if (timer) clearTimeout(timer);
        throw err;
      }),
    timeoutPromise,
  ]);
}

export function getFirestoreInstance(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  const app = getFirebaseAppInstance();
  if (!app) return null;

  if (!_cachedFirestore) {
    try {
      _cachedFirestore = getFirestore(app);
    } catch (e) {
      console.error('Failed to initialize Firestore instance:', e);
      return null;
    }
  }
  return _cachedFirestore;
}

// 1. 회원 계정 정보 클라우드 DB 저장 (Upsert)
export async function syncUserToFirestore(
  user: UserProfile & { password?: string }
): Promise<{ success: boolean; message?: string }> {
  const db = getFirestoreInstance();
  if (!db) {
    return { success: false, message: 'Firebase 설정이 활성화되지 않았습니다.' };
  }

  try {
    const cleanPhone = stripPhoneNumber(user.phone);
    if (!cleanPhone) {
      return { success: false, message: '유효한 전화번호가 없습니다.' };
    }

    const userDocRef = doc(db, 'jokbo_users', cleanPhone);
    const userData = {
      id: user.id,
      phone: cleanPhone,
      name: user.name,
      hanja: user.hanja || '',
      clan: user.clan || '',
      role: user.role || 'direct_family',
      roleLabel: user.roleLabel || '가문 직계 자손',
      password: user.password || 'password123!',
      birthDate: user.birthDate || '',
      fatherName: user.fatherName || '',
      motherName: user.motherName || '',
      clanInviteCode: user.clanInviteCode || '',
      securityTier: user.securityTier || '2단계(2FA 완료)',
      is2FAVerified: user.is2FAVerified || false,
      lastLoginAt: user.lastLoginAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await withFirestoreTimeout(
      setDoc(userDocRef, userData, { merge: true }),
      3500,
      'Firebase 콘솔에 Cloud Firestore DB가 아직 생성되지 않았거나 응답이 없습니다.'
    );
    return { success: true };
  } catch (e: any) {
    console.error('Error syncing user to Firestore:', e);
    return { success: false, message: e.message || 'Firestore 저장 실패' };
  }
}

// 2. 전화번호로 회원 계정 클라우드 DB 조회
export async function fetchUserFromFirestore(
  phone: string
): Promise<(UserProfile & { password: string }) | null> {
  const db = getFirestoreInstance();
  if (!db) return null;

  try {
    const cleanPhone = stripPhoneNumber(phone);
    if (!cleanPhone) return null;

    const userDocRef = doc(db, 'jokbo_users', cleanPhone);
    const snap = await withFirestoreTimeout(
      getDoc(userDocRef),
      3500,
      'Firestore 회원 조회 시간 초과'
    );

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    return {
      id: data.id || `user-custom-${cleanPhone}`,
      memberId: `mem-${data.id || cleanPhone}`,
      name: data.name,
      hanja: data.hanja,
      clan: data.clan,
      role: data.role || 'direct_family',
      roleLabel: data.roleLabel || '가문 등록 정회원',
      phone: data.phone,
      password: data.password || 'password123!',
      birthDate: data.birthDate,
      fatherName: data.fatherName,
      motherName: data.motherName,
      clanInviteCode: data.clanInviteCode,
      securityTier: data.securityTier || '2단계(2FA 완료)',
      is2FAVerified: data.is2FAVerified || false,
      lastLoginAt: data.lastLoginAt || new Date().toISOString(),
      isCustomRegistered: true,
    };
  } catch (e) {
    console.error('Error fetching user from Firestore:', e);
    return null;
  }
}

// 3. 가계도 트리 전체 클라우드 DB 저장
export async function syncFamilyTreeToFirestore(
  userId: string,
  userPhone: string,
  tree: FamilyMember[]
): Promise<{ success: boolean; message?: string }> {
  const db = getFirestoreInstance();
  if (!db || !tree || tree.length === 0) {
    return { success: false, message: 'Firestore 미연결 또는 가계도 데이터 없음' };
  }

  try {
    const cleanPhone = stripPhoneNumber(userPhone) || userId;
    const treeDocRef = doc(db, 'jokbo_trees', cleanPhone);

    const payload = {
      userId,
      phone: cleanPhone,
      updatedAt: new Date().toISOString(),
      memberCount: tree.length,
      members: JSON.stringify(tree), // 객체 배열 직렬화 보존
    };

    await withFirestoreTimeout(
      setDoc(treeDocRef, payload, { merge: true }),
      3500,
      'Firestore 가계도 저장 시간 초과'
    );
    return { success: true };
  } catch (e: any) {
    console.error('Error syncing family tree to Firestore:', e);
    return { success: false, message: e.message || '가계도 저장 실패' };
  }
}

// 4. 가계도 트리 전체 클라우드 DB 조회
export async function fetchFamilyTreeFromFirestore(
  phoneOrUserId: string
): Promise<FamilyMember[] | null> {
  const db = getFirestoreInstance();
  if (!db) return null;

  try {
    const cleanKey = stripPhoneNumber(phoneOrUserId) || phoneOrUserId;
    const treeDocRef = doc(db, 'jokbo_trees', cleanKey);
    const snap = await withFirestoreTimeout(
      getDoc(treeDocRef),
      3500,
      'Firestore 가계도 조회 시간 초과'
    );

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    if (!data.members) return null;

    const parsed: FamilyMember[] = JSON.parse(data.members);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    console.error('Error fetching family tree from Firestore:', e);
    return null;
  }
}

// 5. 결연 관계 이력 클라우드 DB 저장
export async function syncEstablishedLinksToFirestore(
  userId: string,
  userPhone: string,
  links: EstablishedLink[]
): Promise<{ success: boolean; message?: string }> {
  const db = getFirestoreInstance();
  if (!db) return { success: false };

  try {
    const cleanKey = stripPhoneNumber(userPhone) || userId;
    const linksDocRef = doc(db, 'jokbo_links', cleanKey);

    const payload = {
      userId,
      phone: cleanKey,
      updatedAt: new Date().toISOString(),
      linksCount: links.length,
      links: JSON.stringify(links),
    };

    await withFirestoreTimeout(
      setDoc(linksDocRef, payload, { merge: true }),
      3500,
      'Firestore 결연 관계 저장 시간 초과'
    );
    return { success: true };
  } catch (e: any) {
    console.error('Error syncing links to Firestore:', e);
    return { success: false, message: e.message };
  }
}

// 6. 결연 관계 이력 클라우드 DB 조회
export async function fetchEstablishedLinksFromFirestore(
  phoneOrUserId: string
): Promise<EstablishedLink[] | null> {
  const db = getFirestoreInstance();
  if (!db) return null;

  try {
    const cleanKey = stripPhoneNumber(phoneOrUserId) || phoneOrUserId;
    const linksDocRef = doc(db, 'jokbo_links', cleanKey);
    const snap = await withFirestoreTimeout(
      getDoc(linksDocRef),
      3500,
      'Firestore 결연 이력 조회 시간 초과'
    );

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    if (!data.links) return null;

    const parsed: EstablishedLink[] = JSON.parse(data.links);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    console.error('Error fetching links from Firestore:', e);
    return null;
  }
}

// 7. [종합 클라우드 패키지 동기화] PC/모바일 원클릭 전체 업로드
export async function syncFullPackageToFirestore(
  user: UserProfile & { password?: string },
  tree: FamilyMember[],
  links: EstablishedLink[]
): Promise<{ success: boolean; message: string }> {
  const cleanPhone = stripPhoneNumber(user.phone);
  if (!cleanPhone) {
    return { success: false, message: '전화번호가 등록되지 않았습니다.' };
  }

  const userRes = await syncUserToFirestore(user);
  if (!userRes.success) {
    return { success: false, message: `회원 정보 저장 실패: ${userRes.message}` };
  }

  const treeRes = await syncFamilyTreeToFirestore(user.id, cleanPhone, tree);
  if (!treeRes.success) {
    return { success: false, message: `가계도 저장 실패: ${treeRes.message}` };
  }

  await syncEstablishedLinksToFirestore(user.id, cleanPhone, links);

  return {
    success: true,
    message: `☁️ 클라우드 DB에 최신 족보 데이터(${user.name} 님 외 ${tree.length - 1}명)가 성공적으로 저장되었습니다!`,
  };
}

// 8. [종합 클라우드 패키지 로드] 전화번호로 회원 + 가계도 + 결연 전체 일괄 로드
export async function fetchFullPackageFromFirestore(
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

  const user = await fetchUserFromFirestore(cleanPhone);
  if (!user) {
    return { success: false, message: '클라우드 DB에 등록된 회원 정보를 찾을 수 없습니다.' };
  }

  const familyTree = (await fetchFamilyTreeFromFirestore(cleanPhone)) || [];
  const establishedLinks = (await fetchEstablishedLinksFromFirestore(cleanPhone)) || [];

  return {
    success: true,
    user,
    familyTree,
    establishedLinks,
    message: `☁️ 클라우드 DB에서 ${user.name} 님의 가계도(${familyTree.length}명)를 성공적으로 불러왔습니다.`,
  };
}
