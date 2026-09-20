import { useState, useEffect } from 'react';
import { getGlobalCurrentUser, addAuthListener } from './useAuthStore';
import { UserProfile } from '../types/auth';
import { extractSurname } from '../utils/koreanHanjaHelper';
import {
  FamilyMember,
  LineageType,
  EstablishedLink,
  RelationType,
  OperationMode,
  ApprovalStatus,
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

// Module-level shared store state
let globalMembers: FamilyMember[] = [...INITIAL_FAMILY_DATA];
let globalUnconnectedMembers: FamilyMember[] = [...UNCONNECTED_TEST_MEMBERS];
let globalEstablishedLinks: EstablishedLink[] = [];
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
  const gfatherId = `gfather-${user.id}`;
  const gmotherId = `gmother-${user.id}`;

  const fatherName = user.fatherName?.trim() || `${surname}진우`;
  const motherName = user.motherName?.trim() || `이정옥`;
  const gfatherName = `${surname}태환`;
  const gmotherName = `박순자`;

  const selfMember: FamilyMember = {
    id: selfMemberId,
    name: user.name,
    hanja: user.hanja,
    gender: 'M',
    generation: 3,
    lineage: 'paternal',
    relationship: '본인',
    clan: clan,
    birthDate: user.birthDate || '1990-01-01',
    isAlive: true,
    parentIds: [fatherId, motherId],
    phone: user.phone,
    clanGeneration: 30,
    descendantOrder: 29,
    hangnyeolChar: user.hanja ? user.hanja.charAt(user.hanja.length - 1) : undefined,
    isVerifiedLineage: true,
    achievements: ['가문 디지털 족보 등재 정회원', user.roleLabel || '가문 정회원'],
    memo: '스마트폰 가문 족보 실시간 등재 완료',
  };

  const fatherMember: FamilyMember = {
    id: fatherId,
    name: fatherName,
    gender: 'M',
    generation: 2,
    lineage: 'paternal',
    relationship: '부 (아버지)',
    clan: clan,
    birthDate: '1963-03-12',
    isAlive: true,
    parentIds: [gfatherId, gmotherId],
    spouseId: motherId,
    clanGeneration: 29,
    descendantOrder: 28,
    isVerifiedLineage: true,
    achievements: ['가문 29세손 어르신'],
  };

  const motherMember: FamilyMember = {
    id: motherId,
    name: motherName,
    gender: 'F',
    generation: 2,
    lineage: 'paternal',
    relationship: '모 (어머니)',
    clan: '외가 배위',
    birthDate: '1966-08-20',
    isAlive: true,
    spouseId: fatherId,
    isVerifiedLineage: true,
  };

  const gfatherMember: FamilyMember = {
    id: gfatherId,
    name: gfatherName,
    gender: 'M',
    generation: 1,
    lineage: 'paternal',
    relationship: '조부 (할아버지)',
    clan: clan,
    birthDate: '1935-10-04',
    isAlive: false,
    spouseId: gmotherId,
    clanGeneration: 28,
    descendantOrder: 27,
    isVerifiedLineage: true,
    achievements: ['가문 28세 선대 중시조'],
  };

  const gmotherMember: FamilyMember = {
    id: gmotherId,
    name: gmotherName,
    gender: 'F',
    generation: 1,
    lineage: 'paternal',
    relationship: '조모 (할머니)',
    clan: '선대 배위',
    birthDate: '1938-12-15',
    isAlive: false,
    spouseId: gfatherId,
    isVerifiedLineage: true,
  };

  return [selfMember, fatherMember, motherMember, gfatherMember, gmotherMember];
}

let globalIsViewingDemo: boolean = false;

function syncWithAuth() {
  const currentUser = getGlobalCurrentUser();
  if (currentUser && currentUser.isCustomRegistered && !globalIsViewingDemo) {
    let customTree = getStoredCustomFamily(currentUser.id);
    if (!customTree || customTree.length === 0) {
      customTree = createInitialFamilyForUser(currentUser);
      saveStoredCustomFamily(currentUser.id, customTree);
    }
    globalMembers = customTree;
    globalCenterPersonId = currentUser.memberId || customTree[0].id;
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
  const [operationMode, setOperationModeState] = useState<OperationMode>(globalOperationMode);
  const [currentDeviceId, setCurrentDeviceId] = useState<DeviceId>(globalCurrentDeviceId);
  const [connectedDevices, setConnectedDevices] = useState<Record<DeviceId, boolean>>({ ...globalConnectedDevices });
  const [centerPersonId, setCenterPersonId] = useState<string>(globalCenterPersonId);

  useEffect(() => {
    const handleUpdate = () => {
      setMembers([...globalMembers]);
      setUnconnectedMembers([...globalUnconnectedMembers]);
      setEstablishedLinks([...globalEstablishedLinks]);
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

    let updatedA = { ...targetA };
    let updatedB = { ...targetB };

    if (relationType === 'parent_child') {
      const existingParents = updatedB.parentIds || [];
      if (!existingParents.includes(updatedA.id)) {
        updatedB.parentIds = [...existingParents, updatedA.id];
      }
      updatedB.generation = updatedA.generation + 1;
      updatedB.lineage = updatedA.lineage;
      updatedB.relationship = updatedA.lineage === 'maternal'
        ? (updatedB.gender === 'M' ? '이종사촌남동생 (4촌)' : '이종사촌여동생 (4촌)')
        : (updatedB.gender === 'M' ? '사촌동생 (4촌)' : '사촌여동생 (4촌)');
    } else if (relationType === 'child_parent') {
      const existingParents = updatedA.parentIds || [];
      if (!existingParents.includes(updatedB.id)) {
        updatedA.parentIds = [...existingParents, updatedB.id];
      }
      updatedA.generation = updatedB.generation + 1;
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

    if (relationType === 'parent_child') {
      const existingParents = updatedB.parentIds || [];
      if (!existingParents.includes(updatedA.id)) {
        updatedB.parentIds = [...existingParents, updatedA.id];
      }
      updatedB.generation = updatedA.generation + 1;
      updatedB.lineage = updatedA.lineage;
      updatedB.relationship = updatedA.lineage === 'maternal'
        ? (updatedB.gender === 'M' ? '이종사촌남동생 (4촌)' : '이종사촌여동생 (4촌)')
        : (updatedB.gender === 'M' ? '사촌동생 (4촌)' : '사촌여동생 (4촌)');
    } else if (relationType === 'child_parent') {
      const existingParents = updatedA.parentIds || [];
      if (!existingParents.includes(updatedB.id)) {
        updatedA.parentIds = [...existingParents, updatedB.id];
      }
      updatedA.generation = updatedB.generation + 1;
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

    const personA = globalMembers.find((m) => m.id === link.personAId);
    const personB = globalMembers.find((m) => m.id === link.personBId);

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
    notify();
  };

  // Reset all dynamic established links
  const resetEstablishedLinks = () => {
    globalMembers = [...INITIAL_FAMILY_DATA];
    globalUnconnectedMembers = [...UNCONNECTED_TEST_MEMBERS];
    globalEstablishedLinks = [];
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
