import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { getLifeStatus, getKinshipRelation } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

interface ObsidianGraphViewProps {
  members: FamilyMember[];
  centerPerson: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
}

interface EdgeDefinition {
  fromId: string;
  toId: string;
  color: string;
  width: number;
  dashed?: boolean;
}

// Hierarchical cluster map: dragging parent drags its dependent sub-tree
const CLUSTER_HIERARCHY: Record<string, string[]> = {
  'pat-2-2': ['pat-1-1', 'pat-1-2', 'pat-2-3'],
  'pat-2-1': ['pat-3-4'],
  'mat-2-1': ['mat-1-1', 'mat-1-2'],
  'mat-2-2': ['mat-2-5', 'mat-3-1', 'mat-3-2', 'mat-4-1', 'mat-4-2'],
  'mat-3-1': ['mat-4-1', 'mat-4-2'],
  'mat-2-3': ['mat-2-6', 'mat-3-3', 'mat-3-4'],
  'inlaw-pat-3-1': ['inlaw-pat-2-1', 'inlaw-mat-2-1', 'inlaw-pat-3-2'],
  'inlaw-pat-2-1': ['inlaw-pat-1-1', 'inlaw-pat-1-2', 'inlaw-pat-2-2'],
  'inlaw-mat-2-1': ['inlaw-mat-1-1', 'inlaw-mat-1-2', 'inlaw-mat-2-2', 'inlaw-mat-2-3'],
};

// Recursively collect all descendants in the cluster
function getClusterDescendants(nodeId: string): string[] {
  const result = new Set<string>([nodeId]);
  function traverse(current: string) {
    const children = CLUSTER_HIERARCHY[current] || [];
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        traverse(child);
      }
    }
  }
  traverse(nodeId);
  return Array.from(result);
}

export const ObsidianGraphView: React.FC<ObsidianGraphViewProps> = ({
  members,
  centerPerson,
  onSelectMember,
}) => {
  // Canvas dimensions for generous obsidian network exploration with zero overlap
  const WIDTH = 1200;
  const HEIGHT = 980;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2 + 10;

  // Obsidian theme toggle: dark graphite (classic Obsidian) vs light ink
  const [isDarkMode, setIsDarkMode] = useState(true);
  // Cluster move toggle: moving a branch head drags its family branch together
  const [enableClusterDrag, setEnableClusterDrag] = useState(true);
  // Active dragging node ID for visual feedback
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // 1. Calculate pristine initial coordinates for each member in radial layout
  // with automated anti-collision relaxation so NO cards ever overlap!
  const calculateDefaultPositions = useCallback((): Record<string, { x: number; y: number }> => {
    const posMap: Record<string, { x: number; y: number }> = {};

    // Center Person at Canvas Center
    posMap[centerPerson.id] = { x: CX, y: CY };

    const otherMembers = members.filter((m) => m.id !== centerPerson.id);
    const paternalMembers = otherMembers.filter((m) => m.lineage === 'paternal');
    const maternalMembers = otherMembers.filter((m) => m.lineage === 'maternal');
    const inlawMembers = otherMembers.filter(
      (m) => m.lineage === 'inlaw_paternal' || m.lineage === 'inlaw_maternal'
    );

    // ==========================================
    // Specific Calibrated Positions (Angles in degrees, radius in px)
    // Perfectly matched to avoid overlap:
    // - 김영수 (아버지): 180° (West)
    // - 김민혁 (남동생): 215° (Upper-West)
    // - 김지우 (여동생): 250° (Upper-Left-Mid)
    // - 김도윤 (장남):   290° (Upper-Right-Mid)
    // - 김하은 (장녀):   325° (Upper-East)
    // - 이은경 (어머니): 0° (East)
    // - 정서연 (배우자): 90° (South)
    // ==========================================
    const patSpecialPositions: Record<string, { r: number; angleDeg: number }> = {
      'pat-2-2': { r: 250, angleDeg: 180 }, // 부친 (정서쪽 9시 방향)
      'pat-3-2': { r: 240, angleDeg: 215 }, // 남동생 (10시 반 방향)
      'pat-3-3': { r: 250, angleDeg: 250 }, // 여동생 (11시 반 방향)
      'pat-4-1': { r: 250, angleDeg: 290 }, // 아들 (12시 반 방향)
      'pat-4-2': { r: 240, angleDeg: 325 }, // 딸 (1시 반 방향)

      // 조부모 및 방계 친족
      'pat-1-1': { r: 410, angleDeg: 165 }, // 친조부
      'pat-1-2': { r: 410, angleDeg: 195 }, // 친조모
      'pat-2-1': { r: 380, angleDeg: 140 }, // 백부
      'pat-3-4': { r: 500, angleDeg: 130 }, // 사촌형 (백부 장남)
      'pat-2-3': { r: 390, angleDeg: 215 }, // 고모
      'pat-2-4': { r: 510, angleDeg: 115 }, // 당숙
    };

    paternalMembers.forEach((m, idx) => {
      if (patSpecialPositions[m.id]) {
        const spec = patSpecialPositions[m.id];
        const rad = (spec.angleDeg * Math.PI) / 180;
        posMap[m.id] = {
          x: CX + spec.r * Math.cos(rad),
          y: CY + spec.r * Math.sin(rad),
        };
      } else {
        const startRad = (130 * Math.PI) / 180;
        const endRad = (240 * Math.PI) / 180;
        const step =
          paternalMembers.length > 1
            ? startRad + ((endRad - startRad) * idx) / (paternalMembers.length - 1)
            : Math.PI;
        const radius = m.generation === 1 ? 400 : m.generation === 2 ? 280 : 340;
        posMap[m.id] = {
          x: CX + radius * Math.cos(step),
          y: CY + radius * Math.sin(step),
        };
      }
    });

    // ==========================================
    // 외가 (Maternal): Right / Upper-Right sector (-65° to 65°)
    // ==========================================
    const matSpecialPositions: Record<string, { r: number; angleDeg: number }> = {
      'mat-2-1': { r: 250, angleDeg: 0 },   // 모친 (정동쪽 3시 방향)
      'mat-1-1': { r: 420, angleDeg: -15 }, // 외조부
      'mat-1-2': { r: 420, angleDeg: 15 },  // 외조모
      'mat-2-2': { r: 360, angleDeg: -25 }, // 외숙 (외삼촌)
      'mat-2-5': { r: 470, angleDeg: -25 }, // 외숙모
      'mat-3-1': { r: 460, angleDeg: -45 }, // 외사촌동생 (시우)
      'mat-3-2': { r: 470, angleDeg: -58 }, // 외사촌형 (태우)
      'mat-4-1': { r: 560, angleDeg: -45 }, // 외종조카 (준우)
      'mat-4-2': { r: 570, angleDeg: -58 }, // 외종질녀 (서아)
      'mat-2-3': { r: 360, angleDeg: 25 },  // 큰이모
      'mat-2-6': { r: 470, angleDeg: 25 },  // 이모부
      'mat-3-3': { r: 460, angleDeg: 40 },  // 이종사촌여동생 (하린)
      'mat-3-4': { r: 480, angleDeg: 52 },  // 이종사촌남동생 (민우)
      'mat-2-7': { r: 380, angleDeg: 68 },  // 작은이모
      'mat-2-4': { r: 530, angleDeg: -10 }, // 외당숙
    };

    maternalMembers.forEach((m, idx) => {
      if (matSpecialPositions[m.id]) {
        const spec = matSpecialPositions[m.id];
        const rad = (spec.angleDeg * Math.PI) / 180;
        posMap[m.id] = {
          x: CX + spec.r * Math.cos(rad),
          y: CY + spec.r * Math.sin(rad),
        };
      } else {
        const startRad = (-50 * Math.PI) / 180;
        const endRad = (50 * Math.PI) / 180;
        const step =
          maternalMembers.length > 1
            ? startRad + ((endRad - startRad) * idx) / (maternalMembers.length - 1)
            : 0;
        const radius = m.generation === 1 ? 420 : m.generation === 2 ? 340 : 440;
        posMap[m.id] = {
          x: CX + radius * Math.cos(step),
          y: CY + radius * Math.sin(step),
        };
      }
    });

    // ==========================================
    // 사돈댁 (In-Laws): Lower sector (70° to 110°)
    // ==========================================
    const inlawSpecialPositions: Record<string, { r: number; angleDeg: number }> = {
      'inlaw-pat-3-1': { r: 180, angleDeg: 90 },  // 배우자 (정남쪽 6시 방향)
      'inlaw-pat-2-1': { r: 320, angleDeg: 78 },  // 장인어른
      'inlaw-mat-2-1': { r: 320, angleDeg: 102 }, // 장모님
      'inlaw-pat-3-2': { r: 350, angleDeg: 118 }, // 처남
      'inlaw-pat-1-1': { r: 460, angleDeg: 72 },  // 처조부
      'inlaw-pat-1-2': { r: 470, angleDeg: 84 },  // 처조모
      'inlaw-pat-2-2': { r: 470, angleDeg: 62 },  // 처백부
      'inlaw-mat-1-1': { r: 460, angleDeg: 96 },  // 처외조부
      'inlaw-mat-1-2': { r: 470, angleDeg: 108 }, // 처외조모
      'inlaw-mat-2-2': { r: 470, angleDeg: 120 }, // 처외숙
      'inlaw-mat-2-3': { r: 480, angleDeg: 132 }, // 처이모
    };

    inlawMembers.forEach((m, idx) => {
      if (inlawSpecialPositions[m.id]) {
        const spec = inlawSpecialPositions[m.id];
        const rad = (spec.angleDeg * Math.PI) / 180;
        posMap[m.id] = {
          x: CX + spec.r * Math.cos(rad),
          y: CY + spec.r * Math.sin(rad),
        };
      } else {
        const startRad = (75 * Math.PI) / 180;
        const endRad = (105 * Math.PI) / 180;
        const step =
          inlawMembers.length > 1
            ? startRad + ((endRad - startRad) * idx) / (inlawMembers.length - 1)
            : (90 * Math.PI) / 180;
        posMap[m.id] = {
          x: CX + 280 * Math.cos(step),
          y: CY + 280 * Math.sin(step),
        };
      }
    });

    // ==========================================
    // 🛡️ Automated Anti-Collision Relaxation Pass
    // Guarantees zero bounding-box overlaps across all active nodes!
    // ==========================================
    const CARD_W = 125; // Approximate card width
    const CARD_H = 58;  // Approximate card height
    const SAFE_MARGIN_X = 18;
    const SAFE_MARGIN_Y = 14;

    const allKeys = Object.keys(posMap);
    for (let iter = 0; iter < 30; iter++) {
      let moved = false;
      for (let i = 0; i < allKeys.length; i++) {
        const idA = allKeys[i];
        if (idA === centerPerson.id) continue; // Anchor center
        const pA = posMap[idA];

        for (let j = i + 1; j < allKeys.length; j++) {
          const idB = allKeys[j];
          if (idB === centerPerson.id) continue;
          const pB = posMap[idB];

          // Check visual card collision
          // Visual card center is shifted slightly to the right of node.x
          const centerShiftA = 50;
          const centerShiftB = 50;
          const ax = pA.x + centerShiftA;
          const ay = pA.y;
          const bx = pB.x + centerShiftB;
          const by = pB.y;

          const dx = bx - ax;
          const dy = by - ay;
          const overlapX = CARD_W + SAFE_MARGIN_X - Math.abs(dx);
          const overlapY = CARD_H + SAFE_MARGIN_Y - Math.abs(dy);

          if (overlapX > 0 && overlapY > 0) {
            moved = true;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Push apart proportional to overlap
            const pushX = nx * (overlapX * 0.45);
            const pushY = ny * (overlapY * 0.45);

            pA.x -= pushX;
            pA.y -= pushY;
            pB.x += pushX;
            pB.y += pushY;

            // Constrain inside canvas
            pA.x = Math.max(50, Math.min(WIDTH - 150, pA.x));
            pA.y = Math.max(50, Math.min(HEIGHT - 80, pA.y));
            pB.x = Math.max(50, Math.min(WIDTH - 150, pB.x));
            pB.y = Math.max(50, Math.min(HEIGHT - 80, pB.y));
          }
        }
      }
      if (!moved) break;
    }

    return posMap;
  }, [members, centerPerson, CX, CY]);

  // Positions state
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    calculateDefaultPositions
  );

  // Sync positions whenever centerPerson or member list changes
  useEffect(() => {
    setPositions(calculateDefaultPositions());
  }, [calculateDefaultPositions]);

  // 2. Compute structured Edge definitions (Lines connecting nodes)
  const edgeDefinitions = useMemo<EdgeDefinition[]>(() => {
    const memberIdSet = new Set(members.map((m) => m.id));
    const edges: EdgeDefinition[] = [];

    const addEdge = (fromId: string, toId: string, color: string, width = 1.8, dashed = false) => {
      if (memberIdSet.has(fromId) && memberIdSet.has(toId)) {
        edges.push({ fromId, toId, color, width, dashed });
      }
    };

    const patColor = isDarkMode ? 'rgba(239, 68, 68, 0.75)' : 'rgba(220, 38, 38, 0.75)'; // 친가 붉은색
    const matColor = isDarkMode ? 'rgba(59, 130, 246, 0.75)' : 'rgba(37, 99, 235, 0.75)'; // 외가 푸른색
    const inlawColor = isDarkMode ? 'rgba(245, 158, 11, 0.75)' : 'rgba(217, 119, 6, 0.75)'; // 사돈 황금색

    // --- Paternal Tree Edges (친가 붉은색) ---
    addEdge(centerPerson.id, 'pat-2-2', patColor, 3.0); // 나 - 아버지
    addEdge('pat-2-2', 'pat-1-1', patColor, 2.2); // 아버지 - 친조부
    addEdge('pat-2-2', 'pat-1-2', patColor, 2.2); // 아버지 - 친조모
    addEdge('pat-1-1', 'pat-2-1', patColor, 2.0); // 친조부 - 백부
    addEdge('pat-2-1', 'pat-3-4', patColor, 2.0); // 백부 - 사촌형
    addEdge('pat-1-1', 'pat-2-3', patColor, 1.8); // 친조부 - 고모
    addEdge('pat-1-1', 'pat-2-4', patColor, 1.5, true); // 친조부 - 당숙
    addEdge(centerPerson.id, 'pat-3-2', patColor, 2.2); // 나 - 남동생
    addEdge(centerPerson.id, 'pat-3-3', patColor, 2.2); // 나 - 여동생
    addEdge(centerPerson.id, 'pat-4-1', patColor, 2.4); // 나 - 아들
    addEdge(centerPerson.id, 'pat-4-2', patColor, 2.4); // 나 - 딸

    // Radial guide lines for distant paternal
    addEdge(centerPerson.id, 'pat-2-1', 'rgba(239, 68, 68, 0.25)', 1.2, true);
    addEdge(centerPerson.id, 'pat-3-4', 'rgba(239, 68, 68, 0.25)', 1.2, true);

    // --- Maternal Tree Edges (외가 푸른색) ---
    addEdge(centerPerson.id, 'mat-2-1', matColor, 3.0); // 나 - 어머니
    addEdge('mat-2-1', 'mat-1-1', matColor, 2.2); // 어머니 - 외조부
    addEdge('mat-2-1', 'mat-1-2', matColor, 2.2); // 어머니 - 외조모
    addEdge('mat-2-1', 'mat-2-2', matColor, 2.2); // 어머니 - 외숙 (외삼촌)
    addEdge('mat-2-2', 'mat-2-5', matColor, 1.8, true); // 외숙 - 외숙모
    addEdge('mat-2-2', 'mat-3-1', matColor, 2.0); // 외숙 - 외사촌동생 (이시우)
    addEdge('mat-2-2', 'mat-3-2', matColor, 2.0); // 외숙 - 외사촌형 (이태우)
    addEdge('mat-3-1', 'mat-4-1', matColor, 1.8); // 외사촌 - 외종조카 (이준우)
    addEdge('mat-3-1', 'mat-4-2', matColor, 1.8); // 외사촌 - 외종질녀 (이서아)

    addEdge('mat-2-1', 'mat-2-3', matColor, 2.2); // 어머니 - 큰이모
    addEdge('mat-2-3', 'mat-2-6', matColor, 1.8, true); // 큰이모 - 이모부
    addEdge('mat-2-3', 'mat-3-3', matColor, 2.0); // 큰이모 - 이종사촌여동생 (최하린)
    addEdge('mat-2-3', 'mat-3-4', matColor, 2.0); // 큰이모 - 이종사촌남동생 (최민우)
    addEdge('mat-2-1', 'mat-2-7', matColor, 2.0); // 어머니 - 작은이모
    addEdge('mat-1-1', 'mat-2-4', matColor, 1.5, true); // 외조부 - 외당숙

    // Radial guide lines for maternal cousins
    addEdge(centerPerson.id, 'mat-2-2', 'rgba(59, 130, 246, 0.25)', 1.2, true);
    addEdge(centerPerson.id, 'mat-2-3', 'rgba(59, 130, 246, 0.25)', 1.2, true);
    addEdge(centerPerson.id, 'mat-3-1', 'rgba(59, 130, 246, 0.25)', 1.2, true);

    // --- In-Laws Tree Edges (사돈댁 황금색) ---
    addEdge(centerPerson.id, 'inlaw-pat-3-1', inlawColor, 3.2); // 나 - 아내
    addEdge('inlaw-pat-3-1', 'inlaw-pat-2-1', inlawColor, 2.0); // 아내 - 장인
    addEdge('inlaw-pat-3-1', 'inlaw-mat-2-1', inlawColor, 2.0); // 아내 - 장모
    addEdge('inlaw-pat-3-1', 'inlaw-pat-3-2', inlawColor, 1.8); // 아내 - 처남
    addEdge('inlaw-pat-2-1', 'inlaw-pat-1-1', inlawColor, 1.6); // 장인 - 처조부
    addEdge('inlaw-pat-2-1', 'inlaw-pat-1-2', inlawColor, 1.6); // 장인 - 처조모
    addEdge('inlaw-pat-2-1', 'inlaw-pat-2-2', inlawColor, 1.5, true); // 장인 - 처백부
    addEdge('inlaw-mat-2-1', 'inlaw-mat-1-1', inlawColor, 1.6); // 장모 - 처외조부
    addEdge('inlaw-mat-2-1', 'inlaw-mat-1-2', inlawColor, 1.6); // 장모 - 처외조모
    addEdge('inlaw-mat-2-1', 'inlaw-mat-2-2', inlawColor, 1.5, true); // 장모 - 처외숙
    addEdge('inlaw-mat-2-1', 'inlaw-mat-2-3', inlawColor, 1.5, true); // 장모 - 처이모

    return edges;
  }, [members, centerPerson, isDarkMode]);

  // 3. Drag Tracking Ref for Smooth 60fps Dragging
  const dragRef = useRef<{
    activeId: string | null;
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
    clusterIds: string[];
    hasMoved: boolean;
  }>({
    activeId: null,
    startX: 0,
    startY: 0,
    initialPositions: {},
    clusterIds: [],
    hasMoved: false,
  });

  // Attach global window pointer handlers on web so dragging outside node never drops
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.activeId) return;

      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;

      if (Math.hypot(dx, dy) > 4) {
        dragRef.current.hasMoved = true;
      }

      const updated = { ...dragRef.current.initialPositions };
      dragRef.current.clusterIds.forEach((id) => {
        const init = dragRef.current.initialPositions[id];
        if (init) {
          updated[id] = {
            x: Math.max(35, Math.min(WIDTH - 35, init.x + dx)),
            y: Math.max(35, Math.min(HEIGHT - 35, init.y + dy)),
          };
        }
      });
      setPositions(updated);
    };

    const onPointerUp = () => {
      if (dragRef.current.activeId) {
        dragRef.current.activeId = null;
        setActiveDragId(null);
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [WIDTH, HEIGHT]);

  // Handle Drag Start
  const handleDragStart = (memberId: string, pageX: number, pageY: number) => {
    const cluster = enableClusterDrag ? getClusterDescendants(memberId) : [memberId];
    dragRef.current = {
      activeId: memberId,
      startX: pageX,
      startY: pageY,
      initialPositions: { ...positions },
      clusterIds: cluster,
      hasMoved: false,
    };
    setActiveDragId(memberId);
  };

  // Theme-dependent color tokens
  const bgColor = isDarkMode ? '#0f172a' : '#fafaf9';
  const canvasBg = isDarkMode ? '#090d16' : '#fbfbfa';
  const bannerBg = isDarkMode ? '#1e293b' : '#ffffff';
  const bannerBorder = isDarkMode ? '#334155' : inkTheme.ink8;
  const textColor = isDarkMode ? '#f1f5f9' : '#111827';
  const subtextColor = isDarkMode ? '#94a3b8' : inkTheme.ink4;
  const ringColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const nodeCardBg = isDarkMode ? 'rgba(30, 41, 59, 0.94)' : 'rgba(255, 255, 255, 0.95)';
  const nodeCardBorder = isDarkMode ? '#334155' : inkTheme.ink8;

  return (
    <View style={[styles.outerContainer, { backgroundColor: bgColor }]}>
      {/* Obsidian-Style Control & Legend Bar */}
      <View style={[styles.controlBar, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
        <View style={styles.titleArea}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              🌐 옵시디언 동적 가계도 네트워크 (Obsidian Dynamic Graph)
            </Text>
            {activeDragId ? (
              <View style={styles.draggingNotice}>
                <Text style={styles.draggingNoticeText}>✨ 실시간 연쇄 이동 중</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.headerSubtitle, { color: subtextColor }]}>
            💡 노드 간 겹침 방지 궤도가 적용되었습니다. 노드를 드래그하면 연결선과 가족 가지가 유기적으로 따라 움직입니다.
          </Text>
        </View>

        {/* Action Buttons: Reset, Cluster Move Toggle, Dark/Light Mode */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              enableClusterDrag && styles.actionBtnActive,
              { borderColor: isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => setEnableClusterDrag(!enableClusterDrag)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: enableClusterDrag ? '#38bdf8' : subtextColor },
              ]}
            >
              {enableClusterDrag ? '🔗 가계 가지 함께 이동 ON' : '📍 개별 노드만 이동'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => setPositions(calculateDefaultPositions())}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#cbd5e1' : inkTheme.ink2 }]}>
              🔄 초기 위치로 정렬
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { borderColor: isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#fde047' : '#0284c7' }]}>
              {isDarkMode ? '🌙 옵시디언 다크' : '☀️ 라이트 한지'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legend color keys */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.legendLabel, { color: '#ef4444' }]}>친가 (부친 계통 · 붉은선)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.legendLabel, { color: '#3b82f6' }]}>외가 (모친 계통 · 푸른선)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.legendLabel, { color: '#f59e0b' }]}>사돈댁 (처가 계통 · 황금선)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.legendLabel, { color: '#10b981' }]}>중심 인물 (기준)</Text>
          </View>
        </View>
      </View>

      {/* Interactive 2D Graph Canvas Area */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.canvasScroll}
      >
        <View style={[styles.canvas, { width: WIDTH, height: HEIGHT, backgroundColor: canvasBg }]}>
          {/* Subtle concentric orbit rings for obsidian aesthetics */}
          <View
            style={[
              styles.orbitRing,
              {
                width: 360,
                height: 360,
                borderRadius: 180,
                left: CX - 180,
                top: CY - 180,
                borderColor: ringColor,
              },
            ]}
          />
          <View
            style={[
              styles.orbitRing,
              {
                width: 520,
                height: 520,
                borderRadius: 260,
                left: CX - 260,
                top: CY - 260,
                borderColor: ringColor,
              },
            ]}
          />
          <View
            style={[
              styles.orbitRing,
              {
                width: 820,
                height: 820,
                borderRadius: 410,
                left: CX - 410,
                top: CY - 410,
                borderColor: ringColor,
              },
            ]}
          />

          {/* 1. EDGES LAYER: Native SVG connecting lines dynamically anchored to node positions */}
          {/* @ts-ignore: React Native Web supports native svg element */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {edgeDefinitions.map((edge, i) => {
              const fromPos = positions[edge.fromId];
              const toPos = positions[edge.toId];
              if (!fromPos || !toPos) return null;

              const isHighlighted =
                activeDragId === edge.fromId || activeDragId === edge.toId;

              return (
                <line
                  key={`edge-${edge.fromId}-${edge.toId}-${i}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={isHighlighted ? '#38bdf8' : edge.color}
                  strokeWidth={isHighlighted ? edge.width + 1.5 : edge.width}
                  strokeDasharray={edge.dashed ? '5,5' : undefined}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* 2. NODES LAYER: Interactive draggable obsidian nodes */}
          {members.map((member) => {
            const isCenter = member.id === centerPerson.id;
            const pos = positions[member.id] || { x: CX, y: CY };
            const life = getLifeStatus(member);
            const rel = getKinshipRelation(centerPerson.id, member.id);

            // Node color depending on lineage
            let nodeColor = '#ef4444'; // 친가 붉은색
            if (isCenter) {
              nodeColor = '#10b981'; // 중심 녹색
            } else if (member.lineage === 'maternal') {
              nodeColor = '#3b82f6'; // 외가 푸른색
            } else if (
              member.lineage === 'inlaw_paternal' ||
              member.lineage === 'inlaw_maternal'
            ) {
              nodeColor = '#f59e0b'; // 사돈 황금색
            }

            const nodeSize = isCenter ? 44 : 28;
            const halfSize = nodeSize / 2;
            const isDraggingThis = activeDragId === member.id;

            return (
              <View
                key={member.id}
                style={[
                  styles.nodeWrapper,
                  {
                    left: pos.x - halfSize,
                    top: pos.y - halfSize,
                    zIndex: isDraggingThis ? 99 : isCenter ? 50 : 20,
                  },
                ]}
                // React Native Responder System handles mobile & desktop pointer dragging
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(evt) => {
                  const ne = evt.nativeEvent;
                  const pageX = ne.pageX || 0;
                  const pageY = ne.pageY || 0;
                  handleDragStart(member.id, pageX, pageY);
                }}
                onResponderMove={(evt) => {
                  if (Platform.OS !== 'web') {
                    // Mobile React Native native move fallback
                    const ne = evt.nativeEvent;
                    const pageX = ne.pageX;
                    const pageY = ne.pageY;
                    const dx = pageX - dragRef.current.startX;
                    const dy = pageY - dragRef.current.startY;
                    if (Math.hypot(dx, dy) > 4) dragRef.current.hasMoved = true;
                    const updated = { ...dragRef.current.initialPositions };
                    dragRef.current.clusterIds.forEach((id) => {
                      const init = dragRef.current.initialPositions[id];
                      if (init) {
                        updated[id] = {
                          x: Math.max(35, Math.min(WIDTH - 35, init.x + dx)),
                          y: Math.max(35, Math.min(HEIGHT - 35, init.y + dy)),
                        };
                      }
                    });
                    setPositions(updated);
                  }
                }}
                onResponderRelease={() => {
                  if (!dragRef.current.hasMoved) {
                    onSelectMember(member);
                  }
                  dragRef.current.activeId = null;
                  setActiveDragId(null);
                }}
              >
                {/* Node Circle Orb */}
                <View
                  style={[
                    styles.nodeDot,
                    {
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: halfSize,
                      backgroundColor: isCenter ? '#10b981' : nodeColor,
                      borderColor: isCenter
                        ? '#34d399'
                        : isDraggingThis
                        ? '#38bdf8'
                        : '#ffffff',
                      borderWidth: isCenter ? 3 : 2,
                    },
                    isCenter && styles.centerPulseRing,
                    isDraggingThis && styles.draggingNodePulse,
                    !member.isAlive && styles.deceasedNodeDot,
                  ]}
                >
                  <Text style={styles.nodeInitials}>
                    {isCenter ? '★' : member.name.charAt(0)}
                  </Text>
                </View>

                {/* Obsidian-Style Info Chip Tag */}
                <View
                  style={[
                    styles.nodeCardChip,
                    {
                      backgroundColor: nodeCardBg,
                      borderColor: isDraggingThis ? '#38bdf8' : nodeCardBorder,
                      left: halfSize + 6,
                    },
                    isCenter && styles.centerCardChip,
                  ]}
                >
                  <View style={styles.chipHeaderRow}>
                    <Text
                      style={[
                        styles.nodeNameText,
                        { color: isCenter ? '#10b981' : isDarkMode ? '#f8fafc' : '#1e293b' },
                      ]}
                      numberOfLines={1}
                    >
                      {member.name}
                    </Text>

                    {rel.chonText ? (
                      <View style={[styles.chonBadge, { backgroundColor: nodeColor }]}>
                        <Text style={styles.chonBadgeText}>{rel.chonText}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.relTitleText,
                      { color: isDarkMode ? '#94a3b8' : inkTheme.ink3 },
                    ]}
                    numberOfLines={1}
                  >
                    {rel.title}
                  </Text>

                  <Text
                    style={[
                      styles.lifeStatusText,
                      { color: member.isAlive ? '#10b981' : '#94a3b8' },
                    ]}
                  >
                    {member.isAlive ? `🌿 ${life.ageText}` : `🕯️ 작고`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    marginVertical: 12,
  },
  controlBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleArea: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  draggingNotice: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draggingNoticeText: {
    fontSize: 11,
    color: '#e0f2fe',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  canvasScroll: {
    padding: 10,
  },
  canvas: {
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    pointerEvents: 'none',
  },
  nodeWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeDot: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeInitials: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  centerPulseRing: {
    borderWidth: 3,
    shadowColor: '#10b981',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  draggingNodePulse: {
    transform: [{ scale: 1.15 }],
    shadowColor: '#38bdf8',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 10,
  },
  deceasedNodeDot: {
    opacity: 0.7,
  },
  nodeCardChip: {
    position: 'absolute',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  centerCardChip: {
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  chipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nodeNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chonBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  chonBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  relTitleText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  lifeStatusText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
});
