import { useState, useEffect } from 'react';
import { FamilyMember, LineageType } from '../types/family';
import { INITIAL_FAMILY_DATA } from '../utils/mockFamilyData';

// Module-level shared store state
let globalMembers: FamilyMember[] = [...INITIAL_FAMILY_DATA];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useFamilyStore() {
  const [members, setMembers] = useState<FamilyMember[]>(globalMembers);

  useEffect(() => {
    const handleUpdate = () => {
      setMembers([...globalMembers]);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const logContact = (memberId: string) => {
    const today = '2026-09-12';
    globalMembers = globalMembers.map((m) =>
      m.id === memberId ? { ...m, lastContactDate: today } : m
    );
    notify();
  };

  const resetData = () => {
    globalMembers = [...INITIAL_FAMILY_DATA];
    notify();
  };

  const getMembersByLineage = (lineage?: LineageType | 'all') => {
    if (!lineage || lineage === 'all') return members;
    return members.filter((m) => m.lineage === lineage);
  };

  return {
    members,
    logContact,
    resetData,
    getMembersByLineage,
  };
}