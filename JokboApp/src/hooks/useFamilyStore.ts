import { useState, useEffect } from 'react';
import { FamilyMember, LineageType, EstablishedLink, RelationType } from '../types/family';
import {
  INITIAL_FAMILY_DATA,
  UNCONNECTED_TEST_MEMBERS,
  DeviceId,
  DEVICE_PROFILES,
  calculateKinshipBetween,
} from '../utils/mockFamilyData';

// Module-level shared store state
let globalMembers: FamilyMember[] = [...INITIAL_FAMILY_DATA];
let globalUnconnectedMembers: FamilyMember[] = [...UNCONNECTED_TEST_MEMBERS];
let globalEstablishedLinks: EstablishedLink[] = [];

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

export function useFamilyStore() {
  const [members, setMembers] = useState<FamilyMember[]>(globalMembers);
  const [unconnectedMembers, setUnconnectedMembers] = useState<FamilyMember[]>(globalUnconnectedMembers);
  const [establishedLinks, setEstablishedLinks] = useState<EstablishedLink[]>(globalEstablishedLinks);
  const [currentDeviceId, setCurrentDeviceId] = useState<DeviceId>(globalCurrentDeviceId);
  const [connectedDevices, setConnectedDevices] = useState<Record<DeviceId, boolean>>({ ...globalConnectedDevices });
  const [centerPersonId, setCenterPersonId] = useState<string>(globalCenterPersonId);

  useEffect(() => {
    const handleUpdate = () => {
      setMembers([...globalMembers]);
      setUnconnectedMembers([...globalUnconnectedMembers]);
      setEstablishedLinks([...globalEstablishedLinks]);
      setCurrentDeviceId(globalCurrentDeviceId);
      setConnectedDevices({ ...globalConnectedDevices });
      setCenterPersonId(globalCenterPersonId);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

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
  // 🤝 Relationship Establishment (관계 형성) Core Logic
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

    // Check if either person is from the unconnected pool
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

    // Clone objects for mutation
    let updatedA = { ...targetA };
    let updatedB = { ...targetB };

    // Apply relationship wiring
    if (relationType === 'parent_child') {
      // Person A is parent of Person B
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
      // Person B is parent of Person A
      const existingParents = updatedA.parentIds || [];
      if (!existingParents.includes(updatedB.id)) {
        updatedA.parentIds = [...existingParents, updatedB.id];
      }
      updatedA.generation = updatedB.generation + 1;
    } else if (relationType === 'spouse') {
      // Person A and Person B are spouses
      updatedA.spouseId = updatedB.id;
      updatedB.spouseId = updatedA.id;
      updatedB.generation = updatedA.generation;
      if (updatedA.id === 'pat-3-2') {
        updatedB.relationship = '제수씨 (남동생의 아내)';
      } else {
        updatedB.relationship = updatedB.gender === 'F' ? '배우자 (아내)' : '남편 (배우자)';
      }
    } else if (relationType === 'sibling') {
      // Share parents
      if (updatedA.parentIds && updatedA.parentIds.length > 0) {
        updatedB.parentIds = [...updatedA.parentIds];
      }
      updatedB.generation = updatedA.generation;
      updatedB.lineage = updatedA.lineage;
      updatedB.relationship = updatedB.gender === 'M' ? '남동생/형제' : '여동생/자매';
    }

    // Add B into globalMembers if it was unconnected
    if (uncIdxB !== -1) {
      globalUnconnectedMembers = globalUnconnectedMembers.filter((m) => m.id !== personBId);
      if (!globalMembers.some((m) => m.id === updatedB.id)) {
        globalMembers = [...globalMembers, updatedB];
      }
    } else {
      globalMembers = globalMembers.map((m) => (m.id === updatedB.id ? updatedB : m));
    }

    // Update A in globalMembers
    globalMembers = globalMembers.map((m) => (m.id === updatedA.id ? updatedA : m));

    // Record established link
    const newLink: EstablishedLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      personAId,
      personBId,
      relationType,
      establishedDate: '2026-09-13',
      isNewlyFormed: true,
    };
    globalEstablishedLinks = [newLink, ...globalEstablishedLinks];

    // Compute kinship result
    const kinship = calculateKinshipBetween(personAId, personBId, globalMembers);

    notify();

    return {
      success: true,
      message: `${updatedA.name}님과 ${updatedB.name}님의 ${kinship.chonText} 관계가 성립되었습니다!`,
      chonText: kinship.chonText,
      titleAtoB: kinship.titleAtoB,
      titleBtoA: kinship.titleBtoA,
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

  // Filter members that are visible in current connected network
  const visibleMembers = members.filter((m) => visibleMemberIdSet.has(m.id));

  // Sync Progress % (25%, 50%, 75%, 100%)
  const connectedCount = Object.values(connectedDevices).filter(Boolean).length;
  const syncProgress = Math.round((connectedCount / 4) * 100);

  const logContact = (memberId: string) => {
    const today = '2026-09-13';
    globalMembers = globalMembers.map((m) =>
      m.id === memberId ? { ...m, lastContactDate: today } : m
    );
    notify();
  };

  const resetData = () => {
    globalMembers = [...INITIAL_FAMILY_DATA];
    globalUnconnectedMembers = [...UNCONNECTED_TEST_MEMBERS];
    globalEstablishedLinks = [];
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

  return {
    // All members in database
    allMembers: members,
    // Members currently visible through connected devices & new links
    members: visibleMembers,
    // Unconnected candidates for testing
    unconnectedMembers,
    // Dynamic established links
    establishedLinks,
    connectMembers,
    disconnectLink,
    resetEstablishedLinks,
    // Device simulation state
    currentDeviceId,
    currentDevice: DEVICE_PROFILES[currentDeviceId],
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
  };
}
