import { useState, useEffect } from 'react';
import { FamilyMember, LineageType } from '../types/family';
import { INITIAL_FAMILY_DATA, DeviceId, DEVICE_PROFILES } from '../utils/mockFamilyData';

// Module-level shared store state
let globalMembers: FamilyMember[] = [...INITIAL_FAMILY_DATA];

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
  const [currentDeviceId, setCurrentDeviceId] = useState<DeviceId>(globalCurrentDeviceId);
  const [connectedDevices, setConnectedDevices] = useState<Record<DeviceId, boolean>>({ ...globalConnectedDevices });
  const [centerPersonId, setCenterPersonId] = useState<string>(globalCenterPersonId);

  useEffect(() => {
    const handleUpdate = () => {
      setMembers([...globalMembers]);
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
    // Also auto-ensure current device is connected in the device's local view
    globalConnectedDevices = {
      ...globalConnectedDevices,
      [deviceId]: true,
    };
    // Center on the new device owner by default
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

  // Calculate visible member IDs based on which devices are currently connected
  const visibleMemberIdSet = new Set<string>();
  (Object.keys(connectedDevices) as DeviceId[]).forEach((devId) => {
    if (connectedDevices[devId]) {
      DEVICE_PROFILES[devId].initialMemberIds.forEach((mId) => visibleMemberIdSet.add(mId));
    }
  });

  // Filter members that are visible in current connected network
  const visibleMembers = members.filter((m) => visibleMemberIdSet.has(m.id));

  // Sync Progress % (25%, 50%, 75%, 100%)
  const connectedCount = Object.values(connectedDevices).filter(Boolean).length;
  const syncProgress = Math.round((connectedCount / 4) * 100);

  const logContact = (memberId: string) => {
    const today = '2026-09-12';
    globalMembers = globalMembers.map((m) =>
      m.id === memberId ? { ...m, lastContactDate: today } : m
    );
    notify();
  };

  const resetData = () => {
    globalMembers = [...INITIAL_FAMILY_DATA];
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
    // Members currently visible through connected devices
    members: visibleMembers,
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