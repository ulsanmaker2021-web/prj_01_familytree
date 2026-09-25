import { useState, useEffect } from 'react';
import { getGlobalCurrentUser, addAuthListener, updateGlobalCurrentUserProfile } from './useAuthStore';
import { UserProfile } from '../types/auth';
import { extractSurname } from '../utils/koreanHanjaHelper';
import {
  FamilyMember,
  LineageType,
  EstablishedLink,
  RelationType,
  OperationMode,
  ApprovalStatus,
  SmartKinshipRequest,
  SiblingSubtype,
} from '../types/family';
import {
  INITIAL_FAMILY_DATA,
  UNCONNECTED_TEST_MEMBERS,
  DeviceId,
  DEVICE_PROFILES,
  calculateKinshipBetween,
  findElderApproverFor,
  DESIGNATED_ELDERS,
  ElderApproverInfo,
} from '../utils/mockFamilyData';
import {
  stripPhoneNumber,
  formatPhoneNumber,
  getAllSecurityAccounts,
} from '../utils/securityAuth';
import {
  fetchFamilyTreeFromSupabase,
  syncFamilyTreeToSupabase,
  fetchEstablishedLinksFromSupabase,
  syncEstablishedLinksToSupabase,
} from '../services/supabaseDataService';
import {
  saveAllToCloudDatabase,
  fetchAllFromCloudDatabase,
} from '../services/unifiedCloudSyncService';
import { isSupabaseConnected } from '../config/supabaseClient';

// ==========================================
// 🔗 [공인 결연 및 어르신 승인 저장소 (LocalStorage)]
// ==========================================
const ESTABLISHED_LINKS_KEY_PREFIX = 'jokbo_established_links_v1_';

export function getStoredEstablishedLinks(userId?: string): EstablishedLink[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const key = ESTABLISHED_LINKS_KEY_PREFIX + (userId || 'global');
    let raw = localStorage.getItem(key);
    if (!raw && userId) {
      raw = localStorage.getItem(ESTABLISHED_LINKS_KEY_PREFIX + 'global');
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredEstablishedLinks(links: EstablishedLink[], userId?: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const key = ESTABLISHED_LINKS_KEY_PREFIX + (userId || 'global');
    localStorage.setItem(key, JSON.stringify(links));
    localStorage.setItem(ESTABLISHED_LINKS_KEY_PREFIX + 'global', JSON.stringify(links));

    // [통합 클라우드 DB 실시간 저장]
    const currentUser = getGlobalCurrentUser();
    if (currentUser && userId && currentUser.id === userId) {
      const tree = getStoredCustomFamily(userId) || [];
      saveAllToCloudDatabase(currentUser, tree, links).catch((err) =>
        console.warn('Auto cloud sync from saveStoredEstablishedLinks:', err)
      );
    } else if (isSupabaseConnected() && userId && userId !== 'global') {
      syncEstablishedLinksToSupabase(userId, links).catch((err) =>
        console.error('Failed to sync established links to Supabase:', err)
      );
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Module-level shared store state
let globalMembers: FamilyMember[] = [...INITIAL_FAMILY_DATA];
let globalUnconnectedMembers: FamilyMember[] = [...UNCONNECTED_TEST_MEMBERS];
let globalEstablishedLinks: EstablishedLink[] = getStoredEstablishedLinks();
let globalOperationMode: OperationMode = 'decentralized'; // Default: Dual-Mode with Decentralized P2P Active

// 4 Virtual Devices State
let globalCurrentDeviceId: DeviceId = 'device_A';
let globalConnectedDevices: Record<DeviceId, boolean> = {
  device_A: true,
  device_B: false,
  device_C: false,
  device_D: false,
};

// Central person for radial/tree focus (defaults to device owner)
let globalCenterPersonId: string = DEVICE_PROFILES.device_A.ownerId;

// ==========================================
// 📱 [스마트 형제·친족 결연 신청 저장소]
// ==========================================
const SMART_REQUESTS_KEY = 'jokbo_smart_requests_v1';

export function getStoredSmartRequests(): SmartKinshipRequest[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(SMART_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveStoredSmartRequests(requests: SmartKinshipRequest[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(SMART_REQUESTS_KEY, JSON.stringify(requests));
    return true;
  } catch (e) {
    return false;
  }
}

let globalSmartRequests: SmartKinshipRequest[] = getStoredSmartRequests();

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}


// ==========================================
// 💾 [실제 등록 회원 가계도 저장소 (LocalStorage)]
// ==========================================
const CUSTOM_TREE_KEY_PREFIX = 'jokbo_custom_tree_v1_';

export function getStoredCustomFamily(userId: string): FamilyMember[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(CUSTOM_TREE_KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredCustomFamily(userId: string, tree: FamilyMember[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(CUSTOM_TREE_KEY_PREFIX + userId, JSON.stringify(tree));

    // [통합 클라우드 DB 실시간 저장] Firebase Firestore 및 Supabase 실시간 동기화
    const currentUser = getGlobalCurrentUser();
    const links = getStoredEstablishedLinks(userId);
    if (currentUser && currentUser.id === userId) {
      saveAllToCloudDatabase(currentUser, tree, links).catch((err) =>
        console.warn('Auto cloud sync from saveStoredCustomFamily:', err)
      );
    } else if (isSupabaseConnected() && userId) {
      syncFamilyTreeToSupabase(userId, tree).catch((err) =>
        console.error('Failed to sync family tree to Supabase:', err)
      );
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function createInitialFamilyForUser(user: UserProfile): FamilyMember[] {
  const surname = extractSurname(user.name) || '최';
  const clan = user.clan || `${surname}씨 본가`;
  const selfMemberId = user.memberId || `mem-${user.id}`;
  const fatherId = `father-${user.id}`;
  const motherId = `mother-${user.id}`;

  const hasFather = Boolean(user.fatherName && user.fatherName.trim().length > 0);
  const hasMother = Boolean(user.motherName && user.motherName.trim().length > 0);

  const parentIds: string[] = [];
  if (hasFather) parentIds.push(fatherId);
  if (hasMother) parentIds.push(motherId);

  const selfMember: FamilyMember = {
    id: selfMemberId,
    name: user.name,
    hanja: user.hanja,
    gender: 'M',
    generation: 3,
    lineage: 'paternal', // 부계: 붉은 계열 테두리/라인
    relationship: '본인',
    clan: clan,
    birthDate: user.birthDate || '1990-01-01',
    isAlive: true,
    parentIds,
    phone: user.phone,
    clanGeneration: 30,
    descendantOrder: 29,
    hangnyeolChar: user.hanja ? user.hanja.charAt(user.hanja.length - 1) : undefined,
    isVerifiedLineage: true,
    achievements: ['가문 디지털 족보 등재 정회원', user.roleLabel || '가문 정회원'],
    memo: '스마트폰 가문 족보 실시간 등재 완료',
  };

  const initialTree: FamilyMember[] = [selfMember];

  // 1대 가상 조부모는 절대 임의 생성하지 않음 (실존 인물 등록 원칙)
  // 2대 부모는 사용자가 가입 시 직접 성함을 입력한 경우에만 등재
  if (hasFather) {
    const fatherName = user.fatherName!.trim();
    const fatherMember: FamilyMember = {
      id: fatherId,
      name: fatherName,
      gender: 'M',
      generation: 2,
      lineage: 'paternal', // 부계: 붉은 계열 테두리/라인
      relationship: '부 (아버지)',
      clan: clan,
      birthDate: '1963-03-12',
      isAlive: true,
      parentIds: [],
      spouseId: hasMother ? motherId : undefined,
      clanGeneration: 29,
      descendantOrder: 28,
      isVerifiedLineage: true,
      achievements: ['가문 29세손 어르신'],
    };
    initialTree.push(fatherMember);
  }

  if (hasMother) {
    const motherName = user.motherName!.trim();
    const motherSurname = extractSurname(motherName) || '이';
    const motherMember: FamilyMember = {
      id: motherId,
      name: motherName,
      gender: 'F',
      generation: 2,
      lineage: 'maternal', // 모계: 푸른 계열 테두리/라인
      relationship: '모 (어머니)',
      clan: `${motherSurname}씨 배위`,
      birthDate: '1966-08-20',
      isAlive: true,
      spouseId: hasFather ? fatherId : undefined,
      isVerifiedLineage: true,
    };
    initialTree.push(motherMember);
  }

  return initialTree;
}

let globalIsViewingDemo: boolean = false;

/**
 * [가문 가계도 본인 중복 노드 완벽 방지 및 단일화]
 * 로그인한 사용자(본인)와 성명/전화번호가 동일한 중복 노드(예: 결연 시 잘못 추가된 남동생 노드)를
 * 1개의 '본인' 중심 노드로 자동 정리하여 1인 다중 노드 생성을 원천 차단합니다.
 */
export function deduplicateFamilyMembers(members: FamilyMember[], user?: UserProfile): FamilyMember[] {
  if (!members || members.length === 0) return [];
  const selfName = user?.name?.trim();
  const selfPhone = user?.phone ? stripPhoneNumber(user.phone) : undefined;
  const selfMemberId = user?.memberId;

  let primarySelf = members.find((m) => m.id === selfMemberId);
  if (!primarySelf) {
    primarySelf = members.find((m) => m.relationship === '본인');
  }
  if (!primarySelf && selfName) {
    primarySelf = members.find((m) => m.name && m.name.trim() === selfName);
  }

  const primarySelfId = primarySelf?.id;
  const seenIds = new Set<string>();
  let hasSelfIncluded = false;
  const cleaned: FamilyMember[] = [];

  for (const m of members) {
    if (!m || !m.id) continue;
    if (seenIds.has(m.id)) continue;

    const isNameMatch = Boolean(selfName && m.name && m.name.trim() === selfName);
    const isPhoneMatch = Boolean(selfPhone && m.phone && stripPhoneNumber(m.phone) === selfPhone);

    // 본인과 일치하는 노드인 경우
    if (isNameMatch || isPhoneMatch || (primarySelfId && m.id === primarySelfId)) {
      if (!hasSelfIncluded) {
        hasSelfIncluded = true;
        seenIds.add(m.id);
        cleaned.push({
          ...m,
          relationship: '본인',
        });
      } else {
        // 중복 복제본 노드 제거
        console.warn('Deduplicating duplicate self node:', m.id, m.name, m.relationship);
      }
      continue;
    }

    seenIds.add(m.id);
    cleaned.push(m);
  }

  return cleaned;
}

function syncWithAuth() {
  const currentUser = getGlobalCurrentUser();
  globalEstablishedLinks = getStoredEstablishedLinks(currentUser?.id);
  if (currentUser && currentUser.isCustomRegistered && !globalIsViewingDemo) {
    let customTree = getStoredCustomFamily(currentUser.id);
    if (customTree && customTree.length > 0) {
      customTree = deduplicateFamilyMembers(customTree, currentUser);
    }
    // 부모 노드가 트리에 존재하지만 currentUser 프로필에 이름이 빠져있는 경우 상호 자동 복원
    if (customTree && customTree.length > 0) {
      customTree.forEach((m) => {
        if ((m.id.startsWith('father-') || m.relationship.includes('아버지') || m.relationship === '부') && m.name) {
          if (!currentUser.fatherName) {
            currentUser.fatherName = m.name;
          }
        }
        if ((m.id.startsWith('mother-') || m.relationship.includes('어머니') || m.relationship === '모') && m.name) {
          if (!currentUser.motherName) {
            currentUser.motherName = m.name;
          }
        }
      });

      customTree = customTree.filter((m) => {
        if (m.id.startsWith('gfather-') || m.id.startsWith('gmother-')) return false;
        return true;
      });

      // 어머니 성함이 프로필에 있으나 트리에 어머니 노드가 없다면 자동 생성/복원
      const hasMotherNode = customTree.some(
        (m) => m.id.startsWith('mother-') || m.relationship.includes('어머니') || m.relationship === '모'
      );
      if (currentUser.motherName && !hasMotherNode) {
        const motherSurname = extractSurname(currentUser.motherName) || '김';
        const motherMember: FamilyMember = {
          id: `mother-${currentUser.id}`,
          name: currentUser.motherName.trim(),
          gender: 'F',
          generation: 2,
          lineage: 'maternal',
          relationship: '모 (어머니)',
          clan: `${motherSurname}씨 배위`,
          birthDate: '1966-08-20',
          isAlive: true,
          spouseId: `father-${currentUser.id}`,
          isVerifiedLineage: true,
        };
        customTree.push(motherMember);
      }

      // 모친이 있는 경우 lineage를 maternal로 보정
      customTree = customTree.map((m) => {
        if (m.id.startsWith('mother-') || m.relationship.includes('어머니') || m.relationship === '모') {
          return { ...m, lineage: 'maternal' as LineageType };
        }
        return m;
      });

      // 🌿 [부모-자녀 세대(Generation) 및 계통 자동 보정]
      // 중앙집권/P2P 결연 시 부모-자식이 역전되어 4대(자녀)로 저장된 케이스 원천 자동 복구
      const selfMember = customTree.find((m) => m.relationship === '본인' || m.id.startsWith('mem-')) || customTree[0];
      const selfGen = selfMember?.generation || 3;
      const fatherMember = customTree.find((m) => m.id.startsWith('father-') || m.relationship.includes('아버지') || m.relationship === '부');
      const motherMember = customTree.find((m) => m.id.startsWith('mother-') || m.relationship.includes('어머니') || m.relationship === '모');
      const fatherId = fatherMember?.id || (currentUser ? `father-${currentUser.id}` : undefined);
      const motherId = motherMember?.id || (currentUser ? `mother-${currentUser.id}` : undefined);

      customTree = customTree.map((m) => {
        // 아버지 노드: 본인보다 윗대(2대)로 고정, 부모 목록에서 본인 제거
        if (m.id.startsWith('father-') || m.relationship.includes('아버지') || m.relationship === '부') {
          return {
            ...m,
            generation: Math.max(1, selfGen - 1),
            lineage: 'paternal' as LineageType,
            relationship: '부 (아버지)',
            parentIds: (m.parentIds || []).filter((pid) => pid !== selfMember.id),
            spouseId: motherId || m.spouseId,
            clanGeneration: m.clanGeneration || (selfMember.clanGeneration ? selfMember.clanGeneration - 1 : 29),
            descendantOrder: m.descendantOrder || (selfMember.descendantOrder ? selfMember.descendantOrder - 1 : 28),
          };
        }
        // 어머니 노드: 본인보다 윗대(2대)로 고정, 부모 목록에서 본인 제거
        if (m.id.startsWith('mother-') || m.relationship.includes('어머니') || m.relationship === '모') {
          return {
            ...m,
            generation: Math.max(1, selfGen - 1),
            lineage: 'maternal' as LineageType,
            relationship: '모 (어머니)',
            parentIds: (m.parentIds || []).filter((pid) => pid !== selfMember.id),
            spouseId: fatherId || m.spouseId,
          };
        }
        // 본인 노드: parentIds에 부모님 정상 연결
        if (m.id === selfMember.id || m.relationship === '본인') {
          const parentsSet = new Set(m.parentIds || []);
          if (fatherId) parentsSet.add(fatherId);
          if (motherId) parentsSet.add(motherId);
          return {
            ...m,
            generation: selfGen,
            parentIds: Array.from(parentsSet),
          };
        }
        return m;
      });

      saveStoredCustomFamily(currentUser.id, customTree);
    }
    if (!customTree || customTree.length === 0) {
      customTree = createInitialFamilyForUser(currentUser);
      saveStoredCustomFamily(currentUser.id, customTree);
      // 부모님(최헌호·김경순) 포함 초기 가계도를 중앙 클라우드 DB에 즉시 영구 저장
      saveAllToCloudDatabase(currentUser, customTree, []).catch((e) =>
        console.warn('Sync initial tree to Cloud DB:', e)
      );
    }
    globalMembers = customTree;
    globalCenterPersonId = currentUser.memberId || customTree[0].id;

    // [통합 클라우드 DB 실시간 패치] Firestore / Supabase에서 최신 원격 가계도 및 결연 정보 비동기 로드
    fetchAllFromCloudDatabase(currentUser.phone || currentUser.id)
      .then((cloudRes) => {
        if (cloudRes.success) {
          let hasChange = false;
          if (cloudRes.user) {
            if (cloudRes.user.motherName && !currentUser.motherName) {
              currentUser.motherName = cloudRes.user.motherName;
              hasChange = true;
            }
            if (cloudRes.user.fatherName && !currentUser.fatherName) {
              currentUser.fatherName = cloudRes.user.fatherName;
              hasChange = true;
            }
          }
          if (cloudRes.familyTree && cloudRes.familyTree.length > 0) {
            const cleanedCloudTree = deduplicateFamilyMembers(cloudRes.familyTree, currentUser);
            localStorage.setItem(CUSTOM_TREE_KEY_PREFIX + currentUser.id, JSON.stringify(cleanedCloudTree));
            globalMembers = cleanedCloudTree;
            hasChange = true;
            if (cleanedCloudTree.length < cloudRes.familyTree.length) {
              // 중복 노드가 제거된 깨끗한 트리를 클라우드 DB에 즉시 영구 반영
              saveAllToCloudDatabase(currentUser, cleanedCloudTree, globalEstablishedLinks).catch(() => {});
            }
          }
          if (cloudRes.establishedLinks && cloudRes.establishedLinks.length > 0) {
            localStorage.setItem(ESTABLISHED_LINKS_KEY_PREFIX + currentUser.id, JSON.stringify(cloudRes.establishedLinks));
            localStorage.setItem(ESTABLISHED_LINKS_KEY_PREFIX + 'global', JSON.stringify(cloudRes.establishedLinks));
            globalEstablishedLinks = cloudRes.establishedLinks;
            hasChange = true;
          }
          if (hasChange) {
            notify();
          }
        }
      })
      .catch((err) => console.error('Cloud data sync error:', err));
  } else {
    // Demo simulation mode (Kim clan)
    globalMembers = [...INITIAL_FAMILY_DATA];
    globalCenterPersonId = DEVICE_PROFILES[globalCurrentDeviceId]?.ownerId || 'pat-3-1';
  }
}

// Initial sync
syncWithAuth();

// Listen to auth changes
addAuthListener(() => {
  syncWithAuth();
  notify();
});

export function useFamilyStore() {
  const [members, setMembers] = useState<FamilyMember[]>(globalMembers);
  const [unconnectedMembers, setUnconnectedMembers] = useState<FamilyMember[]>(globalUnconnectedMembers);
  const [establishedLinks, setEstablishedLinks] = useState<EstablishedLink[]>(globalEstablishedLinks);
  const [smartRequests, setSmartRequests] = useState<SmartKinshipRequest[]>(globalSmartRequests);
  const [operationMode, setOperationModeState] = useState<OperationMode>(globalOperationMode);
  const [currentDeviceId, setCurrentDeviceId] = useState<DeviceId>(globalCurrentDeviceId);
  const [connectedDevices, setConnectedDevices] = useState<Record<DeviceId, boolean>>({ ...globalConnectedDevices });
  const [centerPersonId, setCenterPersonId] = useState<string>(globalCenterPersonId);

  useEffect(() => {
    const handleUpdate = () => {
      setMembers([...globalMembers]);
      setUnconnectedMembers([...globalUnconnectedMembers]);
      setEstablishedLinks([...globalEstablishedLinks]);
      setSmartRequests([...globalSmartRequests]);
      setOperationModeState(globalOperationMode);
      setCurrentDeviceId(globalCurrentDeviceId);
      setConnectedDevices({ ...globalConnectedDevices });
      setCenterPersonId(globalCenterPersonId);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // Dual Operating Mode Switcher (중앙 집중형 ↔ 분산 결연형)
  const setOperatingMode = (mode: OperationMode) => {
    globalOperationMode = mode;
    notify();
  };

  // Switch active virtual device
  const switchDevice = (deviceId: DeviceId) => {
    globalCurrentDeviceId = deviceId;
    globalConnectedDevices = {
      ...globalConnectedDevices,
      [deviceId]: true,
    };
    globalCenterPersonId = DEVICE_PROFILES[deviceId].ownerId;
    notify();
  };

  // Toggle connection of another device
  const toggleDeviceConnection = (deviceId: DeviceId) => {
    globalConnectedDevices = {
      ...globalConnectedDevices,
      [deviceId]: !globalConnectedDevices[deviceId],
    };
    notify();
  };

  // Connect all 4 devices (100% full unified Jokbo)
  const connectAllDevices = () => {
    globalConnectedDevices = {
      device_A: true,
      device_B: true,
      device_C: true,
      device_D: true,
    };
    notify();
  };

  // Disconnect all except current active device (reset to isolated 25% state)
  const resetDeviceConnections = () => {
    globalConnectedDevices = {
      device_A: globalCurrentDeviceId === 'device_A',
      device_B: globalCurrentDeviceId === 'device_B',
      device_C: globalCurrentDeviceId === 'device_C',
      device_D: globalCurrentDeviceId === 'device_D',
    };
    globalCenterPersonId = DEVICE_PROFILES[globalCurrentDeviceId].ownerId;
    notify();
  };

  // Change center person
  const setCenterPerson = (memberId: string) => {
    globalCenterPersonId = memberId;
    notify();
  };

  // Reset center to current device owner
  const resetCenterToOwner = () => {
    globalCenterPersonId = DEVICE_PROFILES[globalCurrentDeviceId].ownerId;
    notify();
  };

  // ==========================================
  // 🏛️ [모드 1] 중앙 집중형 관리자 직권 결연 (Centralized)
  // ==========================================
  const connectMembers = (
    personAId: string,
    personBId: string,
    relationType: RelationType
  ): { success: boolean; message: string; chonText: string; titleAtoB: string; titleBtoA: string } => {
    if (personAId === personBId) {
      return {
        success: false,
        message: '동일 인물 간에는 관계를 형성할 수 없습니다.',
        chonText: '본인',
        titleAtoB: '본인',
        titleBtoA: '본인',
      };
    }

    const uncIdxB = globalUnconnectedMembers.findIndex((m) => m.id === personBId);
    let targetB = uncIdxB !== -1 ? globalUnconnectedMembers[uncIdxB] : globalMembers.find((m) => m.id === personBId);
    let targetA = globalMembers.find((m) => m.id === personAId);

    if (!targetA || !targetB) {
      return {
        success: false,
        message: '대상 인물을 찾을 수 없습니다.',
        chonText: '오류',
        titleAtoB: '미상',
        titleBtoA: '미상',
      };
    }

    let updatedA = { ...targetA, isElderApproved: true, isVerifiedLineage: true };
    let updatedB = { ...targetB, isElderApproved: true, isVerifiedLineage: true };

    if (relationType === 'parent_child' || relationType === 'child_parent') {
      const isBTheParent =
        relationType === 'child_parent' ||
        targetB.id.startsWith('father-') ||
        targetB.id.startsWith('mother-') ||
        (targetB.relationship && (targetB.relationship.includes('부') || targetB.relationship.includes('모') || targetB.relationship.includes('어머니') || targetB.relationship.includes('아버지'))) ||
        (targetA.relationship === '본인' && targetB.relationship !== '자녀' && targetB.relationship !== '아들' && targetB.relationship !== '딸');

      if (isBTheParent) {
        // B가 부모, A가 자녀!
        const existingParentsA = updatedA.parentIds || [];
        if (!existingParentsA.includes(updatedB.id)) {
          updatedA.parentIds = [...existingParentsA, updatedB.id];
        }
        updatedB.generation = Math.max(1, updatedA.generation - 1);
        if (targetB.id.startsWith('father-') || updatedB.gender === 'M') {
          updatedB.lineage = 'paternal';
          updatedB.relationship = '부 (아버지)';
        } else {
          updatedB.lineage = 'maternal';
          updatedB.relationship = '모 (어머니)';
        }
      } else {
        // A가 부모, B가 자녀!
        const existingParentsB = updatedB.parentIds || [];
        if (!existingParentsB.includes(updatedA.id)) {
          updatedB.parentIds = [...existingParentsB, updatedA.id];
        }
        updatedB.generation = updatedA.generation + 1;
        updatedB.lineage = updatedA.lineage;
        if (updatedB.gender === 'M') {
          updatedB.relationship = '아들 (자녀)';
        } else {
          updatedB.relationship = '딸 (자녀)';
        }
      }
    } else if (relationType === 'spouse') {
      updatedA.spouseId = updatedB.id;
      updatedB.spouseId = updatedA.id;
      updatedB.generation = updatedA.generation;
      if (updatedA.id === 'pat-3-2') {
        updatedB.relationship = '제수씨 (남동생의 아내)';
      } else {
        updatedB.relationship = updatedB.gender === 'F' ? '배우자 (아내)' : '남편 (배우자)';
      }
    } else if (relationType === 'sibling') {
      if (updatedA.parentIds && updatedA.parentIds.length > 0) {
        updatedB.parentIds = [...updatedA.parentIds];
      }
      updatedB.generation = updatedA.generation;
      updatedB.lineage = updatedA.lineage;
      updatedB.relationship = updatedB.gender === 'M' ? '남동생/형제' : '여동생/자매';
    }

    if (uncIdxB !== -1) {
      globalUnconnectedMembers = globalUnconnectedMembers.filter((m) => m.id !== personBId);
      if (!globalMembers.some((m) => m.id === updatedB.id)) {
        globalMembers = [...globalMembers, updatedB];
      }
    } else {
      globalMembers = globalMembers.map((m) => (m.id === updatedB.id ? updatedB : m));
    }
    globalMembers = globalMembers.map((m) => (m.id === updatedA.id ? updatedA : m));

    const newLink: EstablishedLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      personAId,
      personBId,
      relationType,
      establishedDate: '2026-09-14',
      isNewlyFormed: true,
      formationMode: 'centralized',
      status: 'approved',
      note: '중앙 족보 편찬 관리자 직권 공인',
    };
    globalEstablishedLinks = [newLink, ...globalEstablishedLinks];

    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks(globalEstablishedLinks, currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }

    const kinship = calculateKinshipBetween(personAId, personBId, globalMembers);
    notify();

    return {
      success: true,
      message: `[중앙 편찬] ${updatedA.name}님과 ${updatedB.name}님의 ${kinship.chonText} 관계가 즉시 공인되었습니다!`,
      chonText: kinship.chonText,
      titleAtoB: kinship.titleAtoB,
      titleBtoA: kinship.titleBtoA,
    };
  };

  // ==========================================
  // 📱 [모드 2] 분산 결연형 및 2중 윗대 승인 체계 (Decentralized P2P & Elder Verification)
  // ==========================================
  // 1단계: 두 사람의 스마트폰 P2P 신청 및 상호 동의 -> '2차 윗대 어르신 승인 대기' 상태 진입
  const requestP2PKinship = (
    personAId: string,
    personBId: string,
    relationType: RelationType,
    customElderId?: string
  ): {
    success: boolean;
    linkId?: string;
    invitationCode?: string;
    message: string;
    elder?: ElderApproverInfo;
    chonText: string;
    titleAtoB: string;
    titleBtoA: string;
  } => {
    if (personAId === personBId) {
      return {
        success: false,
        message: '동일 인물 간에는 결연을 신청할 수 없습니다.',
        chonText: '본인',
        titleAtoB: '본인',
        titleBtoA: '본인',
      };
    }

    const uncIdxB = globalUnconnectedMembers.findIndex((m) => m.id === personBId);
    let targetB = uncIdxB !== -1 ? globalUnconnectedMembers[uncIdxB] : globalMembers.find((m) => m.id === personBId);
    let targetA = globalMembers.find((m) => m.id === personAId) || globalUnconnectedMembers.find((m) => m.id === personAId);

    if (!targetA || !targetB) {
      return {
        success: false,
        message: '결연 대상 인물을 찾을 수 없습니다.',
        chonText: '오류',
        titleAtoB: '미상',
        titleBtoA: '미상',
      };
    }

    // Determine 2nd step verifying elder (부모 또는 조부)
    let elderInfo: ElderApproverInfo;
    if (customElderId) {
      elderInfo = DESIGNATED_ELDERS.find((e) => e.id === customElderId) || findElderApproverFor(personAId, personBId, globalMembers);
    } else {
      elderInfo = findElderApproverFor(personAId, personBId, globalMembers);
    }

    // 🌿 엄격한 생존 확인 (작고하신 선조 승인 불가 원칙)
    const elderMember = globalMembers.find((m) => m.id === elderInfo.id);
    if ((elderMember && !elderMember.isAlive) || !elderInfo.isAlive) {
      return {
        success: false,
        message: `[승인 불가] ${elderInfo.name}님은 작고하신 선조이므로 2차 결연 승인 권한이 없습니다. 반드시 현재 생존해 계신 윗대 어르신을 선택해주세요.`,
        chonText: '오류',
        titleAtoB: '미상',
        titleBtoA: '미상',
      };
    }

    // Temporary node wiring for tentative visualization
    let updatedA = { ...targetA };
    let updatedB = { ...targetB };

    if (relationType === 'parent_child' || relationType === 'child_parent') {
      const isBTheParent =
        relationType === 'child_parent' ||
        targetB.id.startsWith('father-') ||
        targetB.id.startsWith('mother-') ||
        (targetB.relationship && (targetB.relationship.includes('부') || targetB.relationship.includes('모') || targetB.relationship.includes('어머니') || targetB.relationship.includes('아버지'))) ||
        (targetA.relationship === '본인' && targetB.relationship !== '자녀' && targetB.relationship !== '아들' && targetB.relationship !== '딸');

      if (isBTheParent) {
        // B가 부모, A가 자녀!
        const existingParentsA = updatedA.parentIds || [];
        if (!existingParentsA.includes(updatedB.id)) {
          updatedA.parentIds = [...existingParentsA, updatedB.id];
        }
        updatedB.generation = Math.max(1, updatedA.generation - 1);
        if (targetB.id.startsWith('father-') || updatedB.gender === 'M') {
          updatedB.lineage = 'paternal';
          updatedB.relationship = '부 (아버지)';
        } else {
          updatedB.lineage = 'maternal';
          updatedB.relationship = '모 (어머니)';
        }
      } else {
        // A가 부모, B가 자녀!
        const existingParentsB = updatedB.parentIds || [];
        if (!existingParentsB.includes(updatedA.id)) {
          updatedB.parentIds = [...existingParentsB, updatedA.id];
        }
        updatedB.generation = updatedA.generation + 1;
        updatedB.lineage = updatedA.lineage;
        if (updatedB.gender === 'M') {
          updatedB.relationship = '아들 (자녀)';
        } else {
          updatedB.relationship = '딸 (자녀)';
        }
      }
    } else if (relationType === 'spouse') {
      updatedA.spouseId = updatedB.id;
      updatedB.spouseId = updatedA.id;
      updatedB.generation = updatedA.generation;
      if (updatedA.id === 'pat-3-2') {
        updatedB.relationship = '제수씨 (남동생의 아내)';
      } else {
        updatedB.relationship = updatedB.gender === 'F' ? '배우자 (아내)' : '남편 (배우자)';
      }
    } else if (relationType === 'sibling') {
      if (updatedA.parentIds && updatedA.parentIds.length > 0) {
        updatedB.parentIds = [...updatedA.parentIds];
      }
      updatedB.generation = updatedA.generation;
      updatedB.lineage = updatedA.lineage;
      updatedB.relationship = updatedB.gender === 'M' ? '남동생/형제' : '여동생/자매';
    }

    // Make candidate tentatively visible in graph with amber pending state
    if (uncIdxB !== -1) {
      if (!globalMembers.some((m) => m.id === updatedB.id)) {
        globalMembers = [...globalMembers, updatedB];
      }
    }

    const linkId = `p2p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const invitationCode = `JK-${Math.floor(1000 + Math.random() * 9000)}`;
    const kinship = calculateKinshipBetween(personAId, personBId, globalMembers);

    const newLink: EstablishedLink = {
      id: linkId,
      personAId,
      personBId,
      relationType,
      establishedDate: '2026-09-16',
      isNewlyFormed: true,
      formationMode: 'decentralized_p2p',
      status: 'pending_elder',
      requesterId: personAId,
      receiverId: personBId,
      approverElderId: elderInfo.id,
      approverElderName: elderInfo.name,
      approverElderRelation: elderInfo.relation,
      p2pInvitationCode: invitationCode,
      titleAtoB: kinship.titleAtoB,
      titleBtoA: kinship.titleBtoA,
      chonText: kinship.chonText,
      note: `1차 스마트폰 P2P 상호 동의 완료 → 2차 윗대 어르신(${elderInfo.name} ${elderInfo.relation}) 최종 승인 대기 중`,
    };

    globalEstablishedLinks = [newLink, ...globalEstablishedLinks];
    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks(globalEstablishedLinks, currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }
    notify();

    return {
      success: true,
      linkId,
      invitationCode,
      message: `[1단계 P2P 동의 완료] ${updatedA.name}님과 ${updatedB.name}님의 상호 결연 요청이 성사되었습니다. (초대코드: ${invitationCode}) 윗대 어르신(${elderInfo.name} ${elderInfo.relation})의 2차 승인이 필요합니다.`,
      elder: elderInfo,
      chonText: kinship.chonText,
      titleAtoB: kinship.titleAtoB,
      titleBtoA: kinship.titleBtoA,
    };
  };

  // 2단계: 윗대 부모/조부의 최종 확인 및 공인 승인 (Official Approval)
  const elderApproveKinship = (
    linkId: string,
    comment?: string
  ): { success: boolean; certificateNo?: string; message: string } => {
    const link = globalEstablishedLinks.find((l) => l.id === linkId);
    if (!link) {
      return { success: false, message: '해당 결연 요청을 찾을 수 없습니다.' };
    }

    // 🌿 엄격한 생존 확인 (작고하신 어르신 명의 승인 차단)
    const approver = globalMembers.find((m) => m.id === link.approverElderId);
    if (approver && !approver.isAlive) {
      return {
        success: false,
        message: `[승인 불가] 승인 담당 어르신(${approver.name})이 작고하신 상태이므로 승인을 진행할 수 없습니다. 생존해 계신 윗대 어르신으로 재지정해야 합니다.`,
      };
    }

    // Permanently remove from unconnected pool
    globalUnconnectedMembers = globalUnconnectedMembers.filter((m) => m.id !== link.personBId);

    const certificateNo = `족보공인 제 2026-${Math.floor(10000 + Math.random() * 90000)}호`;

    // Update link to approved
    globalEstablishedLinks = globalEstablishedLinks.map((l) =>
      l.id === linkId
        ? {
            ...l,
            status: 'approved' as ApprovalStatus,
            elderApprovedAt: '2026-09-16',
            elderComment:
              comment ||
              `[직계 존속 공인] 윗대 어르신(${l.approverElderName || '어르신'})으로서 본 결연이 진실된 친족 혈통/인척임을 확인하고 가계도 편입을 최종 승인합니다.`,
            note: `2중 확인 완료: ${l.approverElderName} 어르신 정식 공인 (${certificateNo})`,
            certificateIssued: true,
            certificateNo,
          }
        : l
    );

    // Also update member elder approval flags
    globalMembers = globalMembers.map((m) => {
      if (m.id === link.personAId || m.id === link.personBId) {
        return { ...m, isElderApproved: true, isVerifiedLineage: true };
      }
      return m;
    });

    const personA = globalMembers.find((m) => m.id === link.personAId);
    const personB = globalMembers.find((m) => m.id === link.personBId);

    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks(globalEstablishedLinks, currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }

    notify();

    return {
      success: true,
      certificateNo,
      message: `[2차 승인 완료] ${link.approverElderName} 어르신의 공인으로 ${personA?.name}님과 ${personB?.name}님의 친족 관계가 공식 족보에 정식 등록되었습니다! (${certificateNo} 발급)`,
    };
  };

  // 2단계 반려: 윗대 부모/조부가 허위/오인 결연을 감지하여 반려 (Fake Rejection)
  const elderRejectKinship = (
    linkId: string,
    reason?: string
  ): { success: boolean; message: string } => {
    const link = globalEstablishedLinks.find((l) => l.id === linkId);
    if (!link) {
      return { success: false, message: '해당 결연 요청을 찾을 수 없습니다.' };
    }

    // Revert wiring in globalMembers and restore to unconnected
    const personB = globalMembers.find((m) => m.id === link.personBId);
    if (personB && (personB.id.startsWith('unc-') || !INITIAL_FAMILY_DATA.some((im) => im.id === personB.id))) {
      globalMembers = globalMembers.filter((m) => m.id !== link.personBId);
      if (!globalUnconnectedMembers.some((m) => m.id === personB.id)) {
        globalUnconnectedMembers = [...globalUnconnectedMembers, personB];
      }
    }

    globalEstablishedLinks = globalEstablishedLinks.filter((l) => l.id !== linkId);
    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks(globalEstablishedLinks, currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }
    notify();

    return {
      success: true,
      message: `[허위 결연 차단 완료] 윗대 어르신께서 "${reason || '친족 혈연 불일치'}" 사유로 결연을 반려하여 가계도 왜곡을 사전에 방지하였습니다.`,
    };
  };

  // Disconnect an established link
  const disconnectLink = (linkId: string) => {
    const link = globalEstablishedLinks.find((l) => l.id === linkId);
    if (!link) return;

    // Revert parentIds or spouseId if applicable
    globalMembers = globalMembers.map((m) => {
      if (m.id === link.personBId && (link.relationType === 'parent_child' || link.relationType === 'sibling')) {
        return {
          ...m,
          parentIds: (m.parentIds || []).filter((pid) => pid !== link.personAId),
        };
      }
      if (m.id === link.personAId && link.relationType === 'child_parent') {
        return {
          ...m,
          parentIds: (m.parentIds || []).filter((pid) => pid !== link.personBId),
        };
      }
      if (link.relationType === 'spouse') {
        if (m.id === link.personAId && m.spouseId === link.personBId) return { ...m, spouseId: undefined };
        if (m.id === link.personBId && m.spouseId === link.personAId) return { ...m, spouseId: undefined };
      }
      return m;
    });

    globalEstablishedLinks = globalEstablishedLinks.filter((l) => l.id !== linkId);
    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks(globalEstablishedLinks, currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }
    notify();
  };

  // Reset all dynamic established links
  const resetEstablishedLinks = () => {
    globalMembers = [...INITIAL_FAMILY_DATA];
    globalUnconnectedMembers = [...UNCONNECTED_TEST_MEMBERS];
    globalEstablishedLinks = [];
    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks([], currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }
    notify();
  };

  // Calculate visible member IDs based on which devices are currently connected + newly established members
  const visibleMemberIdSet = new Set<string>();
  (Object.keys(connectedDevices) as DeviceId[]).forEach((devId) => {
    if (connectedDevices[devId]) {
      DEVICE_PROFILES[devId].initialMemberIds.forEach((mId) => visibleMemberIdSet.add(mId));
    }
  });

  // Always make established linked members visible in the network
  globalEstablishedLinks.forEach((link) => {
    visibleMemberIdSet.add(link.personAId);
    visibleMemberIdSet.add(link.personBId);
  });

  const isCustomUserMode = Boolean(getGlobalCurrentUser()?.isCustomRegistered && !globalIsViewingDemo);

  // Filter members that are visible in current connected network (or all for custom user)
  const visibleMembers = isCustomUserMode
    ? members
    : members.filter((m) => visibleMemberIdSet.has(m.id));

  const customOwnerProfile = {
    id: 'device_A' as DeviceId,
    ownerId: getGlobalCurrentUser()?.memberId || members.find((m) => m.relationship === '본인')?.id || members[0]?.id || 'pat-3-1',
    ownerName: getGlobalCurrentUser()?.name || '본인',
    ownerRelation: '본인',
    title: `${getGlobalCurrentUser()?.name || '회원'} 본인 스마트폰`,
    desc: `${getGlobalCurrentUser()?.clan || '가문'} 직계 족보`,
    avatarText: (getGlobalCurrentUser()?.name || '본인').slice(-2),
    color: '#0284c7',
    initialMemberIds: members.map((m) => m.id),
  };

  // Sync Progress % (25%, 50%, 75%, 100%)
  const connectedCount = Object.values(connectedDevices).filter(Boolean).length;
  const syncProgress = Math.round((connectedCount / 4) * 100);

  // Grouped links for UI
  const pendingElderLinks = establishedLinks.filter((l) => l.status === 'pending_elder');
  const approvedLinks = establishedLinks.filter((l) => l.status === 'approved' || l.formationMode === 'centralized');

  const logContact = (memberId: string) => {
    const today = '2026-09-14';
    globalMembers = globalMembers.map((m) =>
      m.id === memberId ? { ...m, lastContactDate: today } : m
    );
    notify();
  };

  const resetData = () => {
    globalMembers = [...INITIAL_FAMILY_DATA];
    globalUnconnectedMembers = [...UNCONNECTED_TEST_MEMBERS];
    globalEstablishedLinks = [];
    globalOperationMode = 'decentralized';
    globalCurrentDeviceId = 'device_A';
    globalConnectedDevices = {
      device_A: true,
      device_B: false,
      device_C: false,
      device_D: false,
    };
    globalCenterPersonId = DEVICE_PROFILES.device_A.ownerId;
    const currentUser = getGlobalCurrentUser();
    saveStoredEstablishedLinks([], currentUser?.id);
    if (currentUser?.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }
    notify();
  };

  const getMembersByLineage = (lineage?: LineageType | 'all') => {
    if (!lineage || lineage === 'all') return visibleMembers;
    return visibleMembers.filter((m) => m.lineage === lineage);
  };

  // ➕ 신규 친족 직접 등록 (분산 P2P 결연 후보군으로 추가)
  const addCustomUnconnectedMember = (data: {
    name: string;
    hanja?: string;
    gender: 'M' | 'F';
    birthDate?: string;
    clan?: string;
    relationship?: string;
    memo?: string;
  }): FamilyMember => {
    const newMember: FamilyMember = {
      id: `custom-${Date.now()}`,
      name: data.name,
      hanja: data.hanja,
      gender: data.gender,
      generation: 3,
      lineage: 'paternal',
      relationship: data.relationship || '미등록 친족 후보',
      clan: data.clan || '경주 김씨',
      birthDate: data.birthDate || '1996-05-15',
      isAlive: true,
      phone: '010-8822-4411',
      lastContactDate: '2026-09-16',
      contactCycleDays: 30,
      memo: data.memo || '사용자가 직접 등록한 분산 결연 후보 인물',
    };
    globalUnconnectedMembers = [newMember, ...globalUnconnectedMembers];
    notify();
    return newMember;
  };

  // 🖼️ Update member photo (stores photo URL or base64 string in data layer)
  const updateMemberPhoto = (memberId: string, photoUrl: string) => {
    globalMembers = globalMembers.map((m) =>
      m.id === memberId ? { ...m, photoUrl } : m
    );
    globalUnconnectedMembers = globalUnconnectedMembers.map((m) =>
      m.id === memberId ? { ...m, photoUrl } : m
    );
    notify();
  };

  // 🧹 Clear all simulation test photos before production deployment
  const clearSimulationPhotos = () => {
    globalMembers = globalMembers.map((m) => ({ ...m, photoUrl: undefined }));
    globalUnconnectedMembers = globalUnconnectedMembers.map((m) => ({ ...m, photoUrl: undefined }));
    notify();
  };

  // ✏️ 인물 정보 직접 수정 (본인 또는 자식이 부모/선조의 생존·작고 정보 수정)
  const updateMember = (updated: FamilyMember) => {
    globalMembers = globalMembers.map((m) => (m.id === updated.id ? updated : m));
    globalUnconnectedMembers = globalUnconnectedMembers.map((m) => (m.id === updated.id ? updated : m));

    const currentUser = getGlobalCurrentUser();
    if (currentUser && currentUser.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }

    // 본인 수정 시 사용자 프로필 동기화
    if (
      currentUser &&
      (currentUser.memberId === updated.id || updated.relationship === '본인')
    ) {
      updateGlobalCurrentUserProfile({
        name: updated.name,
        hanja: updated.hanja,
        birthDate: updated.birthDate,
        phone: updated.phone,
        clan: updated.clan,
      });
    }

    // 부모 수정 시 프로필 내 부/모 성함 동기화
    if (currentUser) {
      if (updated.relationship.includes('부') || updated.relationship.includes('아버지')) {
        updateGlobalCurrentUserProfile({ fatherName: updated.name });
      } else if (updated.relationship.includes('모') || updated.relationship.includes('어머니')) {
        updateGlobalCurrentUserProfile({ motherName: updated.name });
      }
    }

    notify();
  };

  // 📱 스마트 형제·친족 전화번호 결연 신청
  const sendSmartKinshipRequest = (
    receiverPhoneInput: string,
    relationType: RelationType = 'sibling',
    siblingSubtype: SiblingSubtype = 'brother',
    siblingSubtypeLabel: string = '형제'
  ): { success: boolean; message: string; request?: SmartKinshipRequest } => {
    const cleanReceiverPhone = stripPhoneNumber(receiverPhoneInput);
    if (cleanReceiverPhone.length < 10) {
      return { success: false, message: '올바른 휴대전화 번호(10~11자리)를 입력해주세요.' };
    }

    const currentUser = getGlobalCurrentUser();
    const selfMember =
      globalMembers.find((m) => m.id === currentUser?.memberId || m.relationship === '본인') ||
      globalMembers[0];

    if (!selfMember) {
      return { success: false, message: '신청자의 정보를 가계도에서 찾을 수 없습니다.' };
    }

    const cleanSelfPhone = stripPhoneNumber(currentUser?.phone || selfMember.phone);
    if (cleanSelfPhone && cleanSelfPhone === cleanReceiverPhone) {
      return { success: false, message: '본인의 전화번호로는 결연을 신청할 수 없습니다.' };
    }

    // 부모 정보 추출
    const father = globalMembers.find(
      (m) =>
        selfMember.parentIds?.includes(m.id) &&
        (m.gender === 'M' || m.relationship.includes('부') || m.relationship.includes('아버지'))
    );
    const mother = globalMembers.find(
      (m) =>
        selfMember.parentIds?.includes(m.id) &&
        (m.gender === 'F' || m.relationship.includes('모') || m.relationship.includes('어머니'))
    );

    const senderFatherName = father?.name || currentUser?.fatherName;
    const senderMotherName = mother?.name || currentUser?.motherName;

    // 수신 대상 계정 확인
    const allAccounts = getAllSecurityAccounts();
    const targetAccount = allAccounts.find(
      (a) => stripPhoneNumber(a.phone) === cleanReceiverPhone
    );

    const requestId = `smart-req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newReq: SmartKinshipRequest = {
      id: requestId,
      senderUserId: currentUser?.id || `user-custom-${Date.now()}`,
      senderMemberId: selfMember.id,
      senderName: selfMember.name,
      senderPhone: cleanSelfPhone,
      senderBirthDate: selfMember.birthDate,
      senderGender: (selfMember.gender as 'M' | 'F') || (currentUser?.gender as 'M' | 'F') || 'M',
      senderFatherName,
      senderMotherName,
      senderClan: selfMember.clan,
      receiverPhone: cleanReceiverPhone,
      receiverUserId: targetAccount?.id,
      relationType,
      siblingSubtype,
      siblingSubtypeLabel,
      status: 'pending',
      createdAt: new Date().toISOString().substring(0, 10),
    };

    // 부모 정보 대조 사전 판정
    if (targetAccount) {
      const targetFather = targetAccount.fatherName;
      const targetMother = targetAccount.motherName;
      const fMatch = Boolean(
        senderFatherName && targetFather && senderFatherName.trim() === targetFather.trim()
      );
      const mMatch = Boolean(
        senderMotherName && targetMother && senderMotherName.trim() === targetMother.trim()
      );
      newReq.fatherMatched = fMatch;
      newReq.motherMatched = mMatch;
      newReq.matchScore = (fMatch ? 50 : 0) + (mMatch ? 50 : 0);
    }

    globalSmartRequests = [newReq, ...globalSmartRequests.filter((r) => r.id !== requestId)];
    saveStoredSmartRequests(globalSmartRequests);
    notify();

    const targetLabel = targetAccount ? `${targetAccount.name} 회원님` : `${formatPhoneNumber(cleanReceiverPhone)} 님`;
    return {
      success: true,
      message: `🎉 [${siblingSubtypeLabel} 결연 신청 완료] ${targetLabel}께 스마트 ${siblingSubtypeLabel} 결연 신청이 전송되었습니다! 상대방이 앱에서 부모 정보를 확인 후 승인하면 가계도가 하나로 통합됩니다.`,
      request: newReq,
    };
  };

  // 🤝 스마트 형제·남매·자매 결연 승인 및 부모 노드 단일화 & 가계도 통합 (Merge)
  const approveSmartKinshipRequest = (
    requestId: string
  ): { success: boolean; message: string; certificateNo?: string } => {
    const req = globalSmartRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: '해당 결연 신청 건을 찾을 수 없습니다.' };
    }

    const currentUser = getGlobalCurrentUser();
    const selfMember =
      globalMembers.find((m) => m.id === currentUser?.memberId || m.relationship === '본인') ||
      globalMembers[0];

    const certificateNo = `족보공인 제 2026-B${Math.floor(10000 + Math.random() * 90000)}호`;

    // 1. 본인 자신에 대한 결연 요청인 경우 중복 노드 생성 방지
    const isSelfSender =
      Boolean(req.senderName && selfMember.name && req.senderName.trim() === selfMember.name.trim()) ||
      Boolean(req.senderPhone && selfMember.phone && stripPhoneNumber(req.senderPhone) === stripPhoneNumber(selfMember.phone)) ||
      Boolean(currentUser?.id && req.senderUserId === currentUser.id);

    if (isSelfSender) {
      const updatedReq: SmartKinshipRequest = {
        ...req,
        status: 'approved',
        certificateNo,
      };
      globalSmartRequests = globalSmartRequests.map((r) => (r.id === requestId ? updatedReq : r));
      saveStoredSmartRequests(globalSmartRequests);
      globalMembers = deduplicateFamilyMembers(globalMembers, currentUser);
      notify();
      return {
        success: true,
        message: '본인 계정의 정보가 확인되어 중복 노드 생성 없이 승인 완료되었습니다.',
        certificateNo,
      };
    }

    // 1. 요청 상태 업데이트
    const updatedReq: SmartKinshipRequest = {
      ...req,
      status: 'approved',
      certificateNo,
    };
    globalSmartRequests = globalSmartRequests.map((r) => (r.id === requestId ? updatedReq : r));
    saveStoredSmartRequests(globalSmartRequests);

    // 2. 부모 노드 확인 및 단일화
    const existingParentIds = [...(selfMember.parentIds || [])];

    let fatherNode = globalMembers.find(
      (m) =>
        existingParentIds.includes(m.id) &&
        (m.gender === 'M' || m.relationship.includes('부') || m.relationship.includes('아버지'))
    );
    let motherNode = globalMembers.find(
      (m) =>
        existingParentIds.includes(m.id) &&
        (m.gender === 'F' || m.relationship.includes('모') || m.relationship.includes('어머니'))
    );

    if (!fatherNode && (req.senderFatherName || currentUser?.fatherName)) {
      const fName = req.senderFatherName || currentUser?.fatherName || '선친';
      const fId = `father-${currentUser?.id || Date.now()}`;
      fatherNode = {
        id: fId,
        name: fName,
        gender: 'M',
        generation: 2,
        lineage: 'paternal',
        relationship: '부 (아버지)',
        clan: selfMember.clan,
        birthDate: '1963-03-12',
        isAlive: true,
        parentIds: [],
        isVerifiedLineage: true,
      };
      globalMembers.push(fatherNode);
      if (!existingParentIds.includes(fId)) {
        existingParentIds.push(fId);
      }
    }

    if (!motherNode && (req.senderMotherName || currentUser?.motherName)) {
      const mName = req.senderMotherName || currentUser?.motherName || '자모';
      const mId = `mother-${currentUser?.id || Date.now()}`;
      motherNode = {
        id: mId,
        name: mName,
        gender: 'F',
        generation: 2,
        lineage: 'maternal',
        relationship: '모 (어머니)',
        clan: `${extractSurname(mName) || '이'}씨 배위`,
        birthDate: '1966-08-20',
        isAlive: true,
        parentIds: [],
        spouseId: fatherNode?.id,
        isVerifiedLineage: true,
      };
      if (fatherNode) fatherNode.spouseId = mId;
      globalMembers.push(motherNode);
      if (!existingParentIds.includes(mId)) {
        existingParentIds.push(mId);
      }
    }

    selfMember.parentIds = existingParentIds;

    // 3. 신청자를 형제·남매·자매 노드로 수신자 가계도에 편입 (성별 및 연령 맞춤 호칭 산정)
    const isSenderOlder =
      req.senderBirthDate && selfMember.birthDate
        ? req.senderBirthDate < selfMember.birthDate
        : false;

    const senderGender: 'M' | 'F' = req.senderGender || 'M';
    const selfGender: 'M' | 'F' = (selfMember.gender as 'M' | 'F') || 'M';
    const subtypeLabel = req.siblingSubtypeLabel || (
      senderGender === selfGender ? (senderGender === 'M' ? '형제' : '자매') : '남매'
    );

    // 호칭 계산 (신청자가 수신자에게 어떤 호칭인가?)
    let siblingRel = '동기간';
    if (senderGender === 'M') {
      if (selfGender === 'F') {
        siblingRel = isSenderOlder ? '오빠 (남매)' : '남동생 (남매)';
      } else {
        siblingRel = isSenderOlder ? '형 (형제)' : '남동생 (형제)';
      }
    } else {
      if (selfGender === 'F') {
        siblingRel = isSenderOlder ? '언니 (자매)' : '여동생 (자매)';
      } else {
        siblingRel = isSenderOlder ? '누나 (남매)' : '여동생 (남매)';
      }
    }

    // 역호칭 계산 (수신자가 신청자에게 어떤 호칭인가?)
    let reverseRel = '동기간';
    if (selfGender === 'M') {
      if (senderGender === 'F') {
        reverseRel = isSenderOlder ? '남동생 (남매)' : '오빠 (남매)';
      } else {
        reverseRel = isSenderOlder ? '남동생 (형제)' : '형 (형제)';
      }
    } else {
      if (senderGender === 'F') {
        reverseRel = isSenderOlder ? '여동생 (자매)' : '언니 (자매)';
      } else {
        reverseRel = isSenderOlder ? '여동생 (남매)' : '누나 (남매)';
      }
    }

    const existingSibling = globalMembers.find(
      (m) =>
        m.id === req.senderMemberId ||
        (m.name === req.senderName && stripPhoneNumber(m.phone) === req.senderPhone)
    );

    let brotherNode: FamilyMember;
    if (existingSibling) {
      brotherNode = {
        ...existingSibling,
        gender: senderGender,
        parentIds: [...existingParentIds], // 동일 부모 노드 공유
        relationship: siblingRel,
        isVerifiedLineage: true,
        achievements: [`가문 족보 ${subtypeLabel} 결연 공인`],
        memo: `스마트 족보 결연: 동일 부모(${req.senderFatherName || '부'}, ${req.senderMotherName || '모'}) 확인 및 ${subtypeLabel} 가계도 편입 (${certificateNo})`,
      };
      globalMembers = globalMembers.map((m) => (m.id === brotherNode.id ? brotherNode : m));
    } else {
      brotherNode = {
        id: req.senderMemberId || `mem-sibling-${Date.now()}`,
        name: req.senderName,
        gender: senderGender,
        generation: selfMember.generation || 3,
        lineage: 'paternal',
        relationship: siblingRel,
        clan: selfMember.clan,
        birthDate: req.senderBirthDate || '1992-05-10',
        isAlive: true,
        parentIds: [...existingParentIds], // 동일 부모 노드 공유!
        phone: req.senderPhone,
        isVerifiedLineage: true,
        achievements: [`가문 족보 ${subtypeLabel} 결연 공인`],
        memo: `스마트 족보 결연: 동일 부모(${req.senderFatherName || '부'}, ${req.senderMotherName || '모'}) 확인 및 ${subtypeLabel} 가계도 편입 (${certificateNo})`,
      };
      globalMembers.push(brotherNode);
    }

    // 수신자 가계도 영구 저장
    if (currentUser && currentUser.isCustomRegistered) {
      saveStoredCustomFamily(currentUser.id, globalMembers);
    }

    // 4. 신청자의 저장된 가계도에도 수신자를 형제·남매·자매로 상호 편입
    if (req.senderUserId) {
      const senderTree = getStoredCustomFamily(req.senderUserId);
      if (senderTree && senderTree.length > 0) {
        const senderSelf =
          senderTree.find((m) => m.id === req.senderMemberId || m.relationship === '본인') ||
          senderTree[0];
        const recipientAsBrother: FamilyMember = {
          id: selfMember.id,
          name: selfMember.name,
          gender: selfGender,
          generation: selfMember.generation,
          lineage: 'paternal',
          relationship: reverseRel,
          clan: selfMember.clan,
          birthDate: selfMember.birthDate,
          isAlive: selfMember.isAlive,
          parentIds: senderSelf.parentIds || [],
          phone: selfMember.phone,
          isVerifiedLineage: true,
          achievements: [`가문 족보 ${subtypeLabel} 결연 공인`],
          memo: `스마트 족보 결연: 동일 부모 확인 및 ${subtypeLabel} 가계도 편입 (${certificateNo})`,
        };
        const updatedSenderTree = senderTree.filter((m) => m.id !== selfMember.id);
        updatedSenderTree.push(recipientAsBrother);
        saveStoredCustomFamily(req.senderUserId, updatedSenderTree);
      }
    }

    // 5. 공인 결연 링크 추가
    const newLink: EstablishedLink = {
      id: `link-smart-${Date.now()}`,
      personAId: selfMember.id,
      personBId: brotherNode.id,
      relationType: 'sibling',
      establishedDate: new Date().toISOString().substring(0, 10),
      isNewlyFormed: true,
      formationMode: 'decentralized_p2p',
      status: 'approved',
      requesterId: req.senderMemberId,
      receiverId: selfMember.id,
      certificateIssued: true,
      certificateNo,
      titleAtoB: siblingRel,
      titleBtoA: reverseRel.split(' ')[0],
      chonText: `2촌 (${subtypeLabel})`,
      note: `스마트 부모 일치 검증 완료 (부: ${req.senderFatherName || '일치'}, 모: ${req.senderMotherName || '일치'}) → 단일 가계도 통합`,
    };
    globalEstablishedLinks = [newLink, ...globalEstablishedLinks];
    saveStoredEstablishedLinks(globalEstablishedLinks, currentUser?.id);

    notify();

    return {
      success: true,
      certificateNo,
      message: `🎉 [${subtypeLabel} 결연 승인 완료] ${req.senderName}님과의 ${subtypeLabel} 관계가 공인되었습니다! 부모 노드가 하나로 단일화되고 가계도에 편입되었습니다. (${certificateNo})`,
    };
  };

  // ❌ 스마트 결연 반려
  const rejectSmartKinshipRequest = (
    requestId: string,
    reason: string = '친족 정보 불일치'
  ): { success: boolean; message: string } => {
    const req = globalSmartRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: '해당 결연 요청을 찾을 수 없습니다.' };

    const updatedReq: SmartKinshipRequest = {
      ...req,
      status: 'rejected',
      note: reason,
    };
    globalSmartRequests = globalSmartRequests.map((r) => (r.id === requestId ? updatedReq : r));
    saveStoredSmartRequests(globalSmartRequests);
    notify();

    return {
      success: true,
      message: `결연 요청이 반려되었습니다. (사유: ${reason})`,
    };
  };

  // 대기 중인 스마트 결연 요청 (수신 대상이 나인 건)
  const cleanCurrentUserPhone = stripPhoneNumber(getGlobalCurrentUser()?.phone);
  const currentUserId = getGlobalCurrentUser()?.id;
  const pendingSmartRequests = smartRequests.filter((r) => {
    if (r.status !== 'pending') return false;
    if (cleanCurrentUserPhone && stripPhoneNumber(r.receiverPhone) === cleanCurrentUserPhone) return true;
    if (currentUserId && r.receiverUserId === currentUserId) return true;
    return false;
  });

  return {
    // All members in database
    allMembers: members,
    // Members currently visible through connected devices & new links
    members: visibleMembers,
    // Unconnected candidates for testing
    unconnectedMembers,
    // Dynamic established links
    establishedLinks,
    pendingElderLinks,
    approvedLinks,
    // Smart Kinship Requests
    smartRequests,
    pendingSmartRequests,
    sendSmartKinshipRequest,
    approveSmartKinshipRequest,
    rejectSmartKinshipRequest,
    updateMember,
    operationMode,
    setOperatingMode,
    // Connect & 2-step verification APIs
    connectMembers,
    requestP2PKinship,
    elderApproveKinship,
    elderRejectKinship,
    disconnectLink,
    resetEstablishedLinks,
    addCustomUnconnectedMember,
    // Photo management APIs
    updateMemberPhoto,
    clearSimulationPhotos,
    // Device simulation state
    currentDeviceId,
    currentDevice: isCustomUserMode ? customOwnerProfile : DEVICE_PROFILES[currentDeviceId],
    connectedDevices,
    syncProgress,
    connectedCount,
    switchDevice,
    toggleDeviceConnection,
    connectAllDevices,
    resetDeviceConnections,
    // Center person
    centerPersonId,
    setCenterPerson,
    resetCenterToOwner,
    // Actions
    logContact,
    resetData,
    getMembersByLineage,
    // Real Custom Member Mode State & Actions
    isCustomUserMode,
    isViewingDemo: globalIsViewingDemo,
    toggleDemoView: (viewDemo?: boolean) => {
      globalIsViewingDemo = viewDemo !== undefined ? viewDemo : !globalIsViewingDemo;
      syncWithAuth();
      notify();
    },
    addCustomFamilyMember: (member: FamilyMember) => {
      const currentUser = getGlobalCurrentUser();
      globalMembers = [...globalMembers, member];
      if (currentUser && currentUser.isCustomRegistered) {
        saveStoredCustomFamily(currentUser.id, globalMembers);
      }
      notify();
    },
    updateCustomFamilyMember: (member: FamilyMember) => {
      const currentUser = getGlobalCurrentUser();
      globalMembers = globalMembers.map((m) => (m.id === member.id ? member : m));
      if (currentUser && currentUser.isCustomRegistered) {
        saveStoredCustomFamily(currentUser.id, globalMembers);
      }
      notify();
    },
    deleteCustomFamilyMember: (memberId: string) => {
      const currentUser = getGlobalCurrentUser();
      globalMembers = globalMembers.filter((m) => m.id !== memberId);
      if (currentUser && currentUser.isCustomRegistered) {
        saveStoredCustomFamily(currentUser.id, globalMembers);
      }
      notify();
    },
    resetToInitialCustomTree: () => {
      const currentUser = getGlobalCurrentUser();
      if (currentUser && currentUser.isCustomRegistered) {
        const initial = createInitialFamilyForUser(currentUser);
        saveStoredCustomFamily(currentUser.id, initial);
        globalMembers = initial;
        globalCenterPersonId = currentUser.memberId;
        notify();
      }
    },
  };
}
