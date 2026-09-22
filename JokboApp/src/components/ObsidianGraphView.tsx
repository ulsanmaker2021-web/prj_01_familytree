import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { FamilyMember, EstablishedLink } from '../types/family';
import { getLifeStatus, getKinshipRelation } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

interface ObsidianGraphViewProps {
  members: FamilyMember[];
  centerPerson: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  establishedLinks?: EstablishedLink[];
  onOpenRelationshipStudio?: () => void;
}

interface EdgeDefinition {
  fromId: string;
  toId: string;
  color: string;
  width: number;
  dashed?: boolean;
  isDynamicLink?: boolean;
}

// Hierarchical cluster map: dragging parent drags its dependent sub-tree
const CLUSTER_HIERARCHY: Record<string, string[]> = {
  'pat-2-2': ['pat-1-1', 'pat-1-2', 'pat-2-3'],
  'pat-2-1': ['pat-3-4', 'unc-1'],
  'mat-2-1': ['mat-1-1', 'mat-1-2'],
  'mat-2-2': ['mat-2-5', 'mat-3-1', 'mat-3-2', 'mat-4-1', 'mat-4-2'],
  'mat-3-1': ['mat-4-1', 'mat-4-2'],
  'mat-2-3': ['mat-2-6', 'mat-3-3', 'mat-3-4', 'unc-2'],
  'pat-3-2': ['unc-3'],
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
  establishedLinks = [],
  onOpenRelationshipStudio,
}) => {
  // Canvas dimensions for generous obsidian network exploration with zero overlap
  const WIDTH = 1200;
  const HEIGHT = 980;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2 + 10;

  // Responsive mobile screen dimensions
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const isLandscape = windowWidth > windowHeight;
  const isNarrow = windowWidth < 960;
  const isVeryNarrow = windowWidth < 640;

  // Hover & touch tooltip state for canvas controller buttons
  const [activeCanvasTooltip, setActiveCanvasTooltip] = useState<string | null>(null);
  const canvasTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showCanvasTooltip = (text: string) => {
    setActiveCanvasTooltip(text);
    if (canvasTooltipTimeoutRef.current) clearTimeout(canvasTooltipTimeoutRef.current);
    canvasTooltipTimeoutRef.current = setTimeout(() => {
      setActiveCanvasTooltip(null);
    }, 2400);
  };

  // Fit scale calculation so the 1200px canvas fits smartphone screen width cleanly
  const fitScale = useMemo(() => {
    return Math.max(0.32, Math.min(1.0, +((windowWidth - 24) / WIDTH).toFixed(2)));
  }, [windowWidth]);

  // Zoom Level state: on mobile, initialize with fitScale (around 0.35x), on desktop 1.0
  const [zoomLevel, setZoomLevel] = useState<number>(isMobile ? fitScale : 1.0);

  const horizontalScrollRef = useRef<ScrollView>(null);

  // Center on coordinates helper
  const centerOnNode = useCallback(
    (x: number, y: number) => {
      if (!horizontalScrollRef.current) return;
      const scaledWidth = WIDTH * zoomLevel;
      if (scaledWidth <= windowWidth) {
        horizontalScrollRef.current.scrollTo({ x: 0, animated: true });
        return;
      }
      const targetScrollX = Math.max(0, x * zoomLevel - windowWidth / 2);
      horizontalScrollRef.current.scrollTo({ x: targetScrollX, animated: true });
    },
    [zoomLevel, windowWidth]
  );

  const handleFitScreen = () => {
    setZoomLevel(fitScale);
    setTimeout(() => {
      centerOnNode(CX, CY);
    }, 50);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.8, +(prev + 0.15).toFixed(2)));
    setTimeout(() => {
      centerOnNode(CX, CY);
    }, 50);
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.25, +(prev - 0.15).toFixed(2)));
    setTimeout(() => {
      centerOnNode(CX, CY);
    }, 50);
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setTimeout(() => {
      centerOnNode(CX, CY);
    }, 50);
  };

  const handleFocusCenter = () => {
    centerOnNode(CX, CY);
  };

  // Center on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      centerOnNode(CX, CY);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

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

    // 1. Fixed Mock Preset Positions (하위 호환성 보장)
    const specialPresets: Record<string, { r: number; angleDeg: number }> = {
      // 친가 직계/방계
      'pat-2-2': { r: 270, angleDeg: 225 }, // 부친 (북서쪽 10시 반)
      'pat-3-2': { r: 230, angleDeg: 200 }, // 남동생 (9시 반)
      'pat-3-3': { r: 240, angleDeg: 240 }, // 여동생 (11시)
      'pat-4-1': { r: 250, angleDeg: 125 }, // 아들 (5시)
      'pat-4-2': { r: 240, angleDeg: 145 }, // 딸 (4시 반)
      'pat-1-1': { r: 420, angleDeg: 165 }, // 친조부 (8시 반)
      'pat-1-2': { r: 420, angleDeg: 190 }, // 친조모 (9시 반)
      'pat-2-1': { r: 380, angleDeg: 140 }, // 백부 (7시)
      'pat-3-4': { r: 490, angleDeg: 130 }, // 사촌형 (백부 장남)
      'pat-2-3': { r: 390, angleDeg: 215 }, // 고모
      'pat-2-4': { r: 500, angleDeg: 115 }, // 당숙
      'unc-1': { r: 440, angleDeg: 145 },   // 김태성 (백부 차남 결연 시)
      'unc-3': { r: 270, angleDeg: 215 },   // 박지민 (남동생 배우자 결연 시)

      // 외가 직계/방계
      'mat-2-1': { r: 270, angleDeg: 315 }, // 모친 (북동쪽 1시 반)
      'mat-1-1': { r: 420, angleDeg: 350 }, // 외조부 (3시)
      'mat-1-2': { r: 420, angleDeg: 15 },  // 외조모 (3시 반)
      'mat-2-2': { r: 360, angleDeg: 335 }, // 외숙 (외삼촌)
      'mat-2-5': { r: 470, angleDeg: 335 }, // 외숙모
      'mat-3-1': { r: 460, angleDeg: 315 }, // 외사촌동생 (시우)
      'mat-3-2': { r: 470, angleDeg: 300 }, // 외사촌형 (태우)
      'mat-4-1': { r: 560, angleDeg: 315 }, // 외종조카 (준우)
      'mat-4-2': { r: 570, angleDeg: 300 }, // 외종질녀 (서아)
      'mat-2-3': { r: 360, angleDeg: 25 },  // 큰이모
      'mat-2-6': { r: 470, angleDeg: 25 },  // 이모부
      'mat-3-3': { r: 460, angleDeg: 40 },  // 이종사촌여동생 (하린)
      'mat-3-4': { r: 480, angleDeg: 55 },  // 이종사촌남동생 (민우)
      'mat-2-7': { r: 380, angleDeg: 70 },  // 작은이모
      'mat-2-4': { r: 530, angleDeg: 350 }, // 외당숙
      'unc-2': { r: 450, angleDeg: 35 },    // 최소율 (큰이모 차녀 결연 시)

      // 사돈댁 / 배우자
      'inlaw-pat-3-1': { r: 180, angleDeg: 90 },  // 배우자 (정남쪽 6시 방향)
      'inlaw-pat-2-1': { r: 320, angleDeg: 75 },  // 장인어른
      'inlaw-mat-2-1': { r: 320, angleDeg: 105 }, // 장모님
      'inlaw-pat-3-2': { r: 350, angleDeg: 120 }, // 처남
      'inlaw-pat-1-1': { r: 460, angleDeg: 70 },  // 처조부
      'inlaw-pat-1-2': { r: 470, angleDeg: 82 },  // 처조모
      'inlaw-pat-2-2': { r: 470, angleDeg: 60 },  // 처백부
      'inlaw-mat-1-1': { r: 460, angleDeg: 98 },  // 처외조부
      'inlaw-mat-1-2': { r: 470, angleDeg: 110 }, // 처외조모
      'inlaw-mat-2-2': { r: 470, angleDeg: 122 }, // 처외숙
      'inlaw-mat-2-3': { r: 480, angleDeg: 135 }, // 처이모
    };

    // 2. Separate Dynamic Members (Preset 없는 신규/중앙 결연 인물)
    const dynamicMembers: FamilyMember[] = [];
    otherMembers.forEach((m) => {
      if (specialPresets[m.id]) {
        const spec = specialPresets[m.id];
        const rad = (spec.angleDeg * Math.PI) / 180;
        posMap[m.id] = {
          x: CX + spec.r * Math.cos(rad),
          y: CY + spec.r * Math.sin(rad),
        };
      } else {
        dynamicMembers.push(m);
      }
    });

    // 3. Smart Categorization for Dynamic Members
    const eldersGen2: FamilyMember[] = [];
    const grandparentsGen1: FamilyMember[] = [];
    const siblingsGen3: FamilyMember[] = [];
    const childrenGen4: FamilyMember[] = [];
    const spouseAndInlaws: FamilyMember[] = [];
    const others: FamilyMember[] = [];

    dynamicMembers.forEach((m) => {
      const relStr = m.relationship || '';
      const isFather = m.id.startsWith('father-') || relStr.includes('부') || relStr.includes('아버지');
      const isMother = m.id.startsWith('mother-') || relStr.includes('모') || relStr.includes('어머니');
      const isElder = isFather || isMother || relStr.includes('숙') || relStr.includes('고모') || relStr.includes('이모') || relStr.includes('백부') || m.generation === 2;
      const isGrandparent = m.generation === 1 || relStr.includes('조부') || relStr.includes('조모') || relStr.includes('할아') || relStr.includes('할머');
      const isSpouse = m.spouseId === centerPerson.id || relStr.includes('배우자') || relStr.includes('아내') || relStr.includes('남편');
      const isSibling = m.generation === 3 || relStr.includes('형') || relStr.includes('동생') || relStr.includes('누나') || relStr.includes('오빠') || relStr.includes('언니') || relStr.includes('형제') || relStr.includes('자매');
      const isChild = m.generation === 4 || relStr.includes('자녀') || relStr.includes('아들') || relStr.includes('딸') || relStr.includes('조카');

      if (isSpouse || m.lineage.startsWith('inlaw')) {
        spouseAndInlaws.push(m);
      } else if (isGrandparent) {
        grandparentsGen1.push(m);
      } else if (isElder || (m.birthDate && !isChild && !isSibling)) {
        eldersGen2.push(m);
      } else if (isSibling) {
        siblingsGen3.push(m);
      } else if (isChild) {
        childrenGen4.push(m);
      } else {
        others.push(m);
      }
    });

    // Position Generation 2 (Parents & Elders) - Ring 2 (r = 270px)
    if (eldersGen2.length === 1) {
      const el = eldersGen2[0];
      const isMat = el.lineage === 'maternal' || el.gender === 'F' || (el.relationship?.includes('모'));
      const angleDeg = isMat ? 315 : 225;
      const rad = (angleDeg * Math.PI) / 180;
      posMap[el.id] = { x: CX + 270 * Math.cos(rad), y: CY + 270 * Math.sin(rad) };
    } else if (eldersGen2.length === 2) {
      // 🌟 [핵심] 2명의 부모/어르신인 경우: 한 명은 북서(225°), 다른 한 명은 북동(315°)으로 완벽한 대칭 삼각형 배치!
      // 이렇게 배치하면 중심 본인과의 직계 연결선 및 두 어르신 간 결연선이 절대 인물 카드나 다른 선과 겹치지 않습니다.
      const el1 = eldersGen2[0];
      const el2 = eldersGen2[1];
      const el2IsMother = el2.gender === 'F' || el2.lineage === 'maternal' || (el2.relationship?.includes('모'));
      const leftMember = el2IsMother ? el1 : el2;
      const rightMember = el2IsMother ? el2 : el1;

      const radLeft = (225 * Math.PI) / 180;
      const radRight = (315 * Math.PI) / 180;
      posMap[leftMember.id] = { x: CX + 270 * Math.cos(radLeft), y: CY + 270 * Math.sin(radLeft) };
      posMap[rightMember.id] = { x: CX + 270 * Math.cos(radRight), y: CY + 270 * Math.sin(radRight) };
    } else if (eldersGen2.length > 2) {
      // 3명 이상인 경우: 친가는 북서쪽(195° ~ 250°), 외가는 북동쪽(290° ~ 345°)에 최소 35° 간격으로 분산 배치
      const patElders = eldersGen2.filter((m) => m.lineage !== 'maternal' && m.gender !== 'F');
      const matElders = eldersGen2.filter((m) => m.lineage === 'maternal' || m.gender === 'F');

      patElders.forEach((m, idx) => {
        const startDeg = 195;
        const endDeg = 245;
        const angleDeg = patElders.length > 1 ? startDeg + ((endDeg - startDeg) * idx) / (patElders.length - 1) : 225;
        const rad = (angleDeg * Math.PI) / 180;
        posMap[m.id] = { x: CX + 270 * Math.cos(rad), y: CY + 270 * Math.sin(rad) };
      });

      matElders.forEach((m, idx) => {
        const startDeg = 295;
        const endDeg = 345;
        const angleDeg = matElders.length > 1 ? startDeg + ((endDeg - startDeg) * idx) / (matElders.length - 1) : 315;
        const rad = (angleDeg * Math.PI) / 180;
        posMap[m.id] = { x: CX + 270 * Math.cos(rad), y: CY + 270 * Math.sin(rad) };
      });
    }

    // Position Generation 1 (Grandparents) - Ring 3 (r = 420px, 150° ~ 185° & 355° ~ 30°)
    grandparentsGen1.forEach((m, idx) => {
      const isMat = m.lineage === 'maternal';
      const startDeg = isMat ? 355 : 155;
      const endDeg = isMat ? 30 : 185;
      const angleDeg = grandparentsGen1.length > 1 ? startDeg + ((endDeg - startDeg) * idx) / (grandparentsGen1.length - 1) : (isMat ? 10 : 170);
      const rad = (angleDeg * Math.PI) / 180;
      posMap[m.id] = { x: CX + 420 * Math.cos(rad), y: CY + 420 * Math.sin(rad) };
    });

    // Position Generation 3 (Siblings) - Ring 1 (r = 200px, 160° ~ 190°)
    siblingsGen3.forEach((m, idx) => {
      const startDeg = 160;
      const endDeg = 195;
      const angleDeg = siblingsGen3.length > 1 ? startDeg + ((endDeg - startDeg) * idx) / (siblingsGen3.length - 1) : 180;
      const rad = (angleDeg * Math.PI) / 180;
      posMap[m.id] = { x: CX + 200 * Math.cos(rad), y: CY + 200 * Math.sin(rad) };
    });

    // Position Spouse & In-laws - South (r = 180px, 90°)
    spouseAndInlaws.forEach((m, idx) => {
      const startDeg = 75;
      const endDeg = 105;
      const angleDeg = spouseAndInlaws.length > 1 ? startDeg + ((endDeg - startDeg) * idx) / (spouseAndInlaws.length - 1) : 90;
      const rad = (angleDeg * Math.PI) / 180;
      posMap[m.id] = { x: CX + 180 * Math.cos(rad), y: CY + 180 * Math.sin(rad) };
    });

    // Position Children - Ring 1 Lower (r = 250px, 120° ~ 150°)
    childrenGen4.forEach((m, idx) => {
      const startDeg = 120;
      const endDeg = 150;
      const angleDeg = childrenGen4.length > 1 ? startDeg + ((endDeg - startDeg) * idx) / (childrenGen4.length - 1) : 135;
      const rad = (angleDeg * Math.PI) / 180;
      posMap[m.id] = { x: CX + 250 * Math.cos(rad), y: CY + 250 * Math.sin(rad) };
    });

    // Position Any Remaining Others
    others.forEach((m, idx) => {
      const rad = ((250 + idx * 30) * Math.PI) / 180;
      posMap[m.id] = { x: CX + 320 * Math.cos(rad), y: CY + 320 * Math.sin(rad) };
    });

    // =========================================================================
    // 🛡️ PASS 1: Automated Radial Angular De-confliction (방사형 각도 겹침 방지)
    // 두 노드가 동일한 방사 각도상에 놓여 중심선이 카드를 관통하는 현상을 원천 방지
    // =========================================================================
    const MIN_RADIAL_GAP_RAD = (28 * Math.PI) / 180; // 최소 28도 방사 각도 간격 보장
    const allIds = Object.keys(posMap).filter((id) => id !== centerPerson.id);

    for (let iter = 0; iter < 12; iter++) {
      let angleMoved = false;
      for (let i = 0; i < allIds.length; i++) {
        for (let j = i + 1; j < allIds.length; j++) {
          const pA = posMap[allIds[i]];
          const pB = posMap[allIds[j]];
          const rA = Math.hypot(pA.x - CX, pA.y - CY) || 1;
          const rB = Math.hypot(pB.x - CX, pB.y - CY) || 1;
          let thA = Math.atan2(pA.y - CY, pA.x - CX);
          let thB = Math.atan2(pB.y - CY, pB.x - CX);
          let diff = thB - thA;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;

          if (Math.abs(diff) < MIN_RADIAL_GAP_RAD) {
            angleMoved = true;
            const pushAngle = (MIN_RADIAL_GAP_RAD - Math.abs(diff)) / 2;
            const sign = diff >= 0 ? 1 : -1;
            thB += pushAngle * sign;
            thA -= pushAngle * sign;
            posMap[allIds[i]] = { x: CX + rA * Math.cos(thA), y: CY + rA * Math.sin(thA) };
            posMap[allIds[j]] = { x: CX + rB * Math.cos(thB), y: CY + rB * Math.sin(thB) };
          }
        }
      }
      if (!angleMoved) break;
    }

    // =========================================================================
    // 🛡️ PASS 2: Bounding Box Relaxation (인물 카드 상호 겹침 방지)
    // =========================================================================
    const CARD_W = 135;
    const CARD_H = 65;
    const SAFE_MARGIN_X = 25;
    const SAFE_MARGIN_Y = 18;

    for (let iter = 0; iter < 30; iter++) {
      let moved = false;
      for (let i = 0; i < allIds.length; i++) {
        const idA = allIds[i];
        const pA = posMap[idA];

        for (let j = i + 1; j < allIds.length; j++) {
          const idB = allIds[j];
          const pB = posMap[idB];

          const centerShiftA = 55;
          const centerShiftB = 55;
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

            const pushX = nx * (overlapX * 0.5);
            const pushY = ny * (overlapY * 0.5);

            pA.x -= pushX;
            pA.y -= pushY;
            pB.x += pushX;
            pB.y += pushY;

            pA.x = Math.max(60, Math.min(WIDTH - 180, pA.x));
            pA.y = Math.max(60, Math.min(HEIGHT - 90, pA.y));
            pB.x = Math.max(60, Math.min(WIDTH - 180, pB.x));
            pB.y = Math.max(60, Math.min(HEIGHT - 90, pB.y));
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

  useEffect(() => {
    setPositions(calculateDefaultPositions());
  }, [calculateDefaultPositions]);

  // 2. Compute structured Edge definitions (Lines connecting nodes)
  // 2. Compute structured Edge definitions (Lines connecting nodes)
  const edgeDefinitions = useMemo<EdgeDefinition[]>(() => {
    const memberIdSet = new Set(members.map((m) => m.id));
    const edges: EdgeDefinition[] = [];
    const edgeKeySet = new Set<string>();

    const addEdge = (
      fromId: string,
      toId: string,
      color: string,
      width = 1.8,
      dashed = false,
      isDynamicLink = false
    ) => {
      const key = `${fromId}->${toId}`;
      const revKey = `${toId}->${fromId}`;
      if (edgeKeySet.has(key) || edgeKeySet.has(revKey)) return;
      if (memberIdSet.has(fromId) && memberIdSet.has(toId)) {
        edgeKeySet.add(key);
        edges.push({ fromId, toId, color, width, dashed, isDynamicLink });
      }
    };

    const patColor = isDarkMode ? 'rgba(239, 68, 68, 0.75)' : 'rgba(220, 38, 38, 0.75)'; // 친가 붉은색
    const matColor = isDarkMode ? 'rgba(59, 130, 246, 0.75)' : 'rgba(37, 99, 235, 0.75)'; // 외가 푸른색
    const inlawColor = isDarkMode ? 'rgba(245, 158, 11, 0.75)' : 'rgba(217, 119, 6, 0.75)'; // 사돈 황금색
    const marriageColor = isDarkMode ? 'rgba(251, 191, 36, 0.85)' : 'rgba(217, 119, 6, 0.85)'; // 💍 부부 결합선 (옅은 금색 점선)

    // 🌟 [동적 직계 관계선 생성] 회원가입 및 가족등록으로 등록된 모든 실존 인물의 부모-자식, 부부 라인 자동 연결
    members.forEach((m) => {
      // 1) 부모-자식 관계선 (Parent -> Child)
      if (m.parentIds && m.parentIds.length > 0) {
        m.parentIds.forEach((pId) => {
          const parent = members.find((p) => p.id === pId);
          const isMaternal = parent?.lineage === 'maternal' || m.lineage === 'maternal';
          const edgeColor = isMaternal ? matColor : patColor;
          const isDirectCenter = m.id === centerPerson.id || pId === centerPerson.id;
          addEdge(pId, m.id, edgeColor, isDirectCenter ? 3.0 : 2.2);
        });
      }

      // 2) 부부 결합선 (Spouse <-> Spouse: 💍 옅은 금색 점선)
      if (m.spouseId) {
        addEdge(m.id, m.spouseId, marriageColor, 2.5, true);
      }
    });

    // --- Paternal Tree Edges (친가 붉은색 - 모의 데이터 호환 보장) ---
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

    // --- Maternal Tree Edges (외가 푸른색 - 모의 데이터 호환 보장) ---
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

    // --- In-Laws Tree Edges (사돈댁 황금색 - 모의 데이터 호환 보장) ---
    addEdge(centerPerson.id, 'inlaw-pat-3-1', marriageColor, 2.8, true); // 나 - 아내 (부부 결합선)
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

    // --- 🤝 DYNAMIC ESTABLISHED RELATIONSHIPS (신규 형성된 결연 연결선 & 2중 승인 체계) ---
    (establishedLinks || []).forEach((link) => {
      if (link.status === 'pending_elder') {
        // 윗대 어르신 2차 승인 대기 중: 황금색 발광 점선 (Glowing Amber Dashed Line)
        addEdge(link.personAId, link.personBId, '#f59e0b', 3.2, true, true);
      } else {
        // 직계 어르신 공인 완료 또는 중앙 편찬: 선명한 에메랄드 그린 실선 (Emerald Glowing Solid Line)
        addEdge(link.personAId, link.personBId, '#10b981', 3.5, false, true);
      }
    });

    return edges;
  }, [members, centerPerson, isDarkMode, establishedLinks]);

  // 3. Multi-Selection & Collective Dragging States
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  const canvasRef = useRef<any>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const selectedNodeIdsRef = useRef(selectedNodeIds);
  selectedNodeIdsRef.current = selectedNodeIds;

  const membersRef = useRef(members);
  membersRef.current = members;

  const edgeDefinitionsRef = useRef(edgeDefinitions);
  edgeDefinitionsRef.current = edgeDefinitions;

  // Marquee Selection Tracking Ref
  const selectionRef = useRef<{
    isSelecting: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    hasMoved: boolean;
    isAdditive: boolean;
  }>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hasMoved: false,
    isAdditive: false,
  });

  // Helper to test if a relation line segment intersects with the selection rectangle
  const doesLineIntersectBox = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) => {
    if (
      (from.x >= minX && from.x <= maxX && from.y >= minY && from.y <= maxY) ||
      (to.x >= minX && to.x <= maxX && to.y >= minY && to.y <= maxY)
    ) {
      return true;
    }
    const steps = [0.2, 0.35, 0.5, 0.65, 0.8];
    for (const t of steps) {
      const px = from.x + (to.x - from.x) * t;
      const py = from.y + (to.y - from.y) * t;
      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        return true;
      }
    }
    return false;
  };

  // Convert viewport client coordinates to unscaled canvas coordinates (0~1200, 0~980)
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const domNode = (canvasRef.current as any).getBoundingClientRect
      ? canvasRef.current
      : (canvasRef.current as any)?._nativeTag || (canvasRef.current as any);
    const rect = domNode?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      width: WIDTH * zoomLevel,
      height: HEIGHT * zoomLevel,
    };
    const z = zoomLevel || 1;
    const x = Math.max(0, Math.min(WIDTH, (clientX - rect.left) / z));
    const y = Math.max(0, Math.min(HEIGHT, (clientY - rect.top) / z));
    return { x, y };
  }, [zoomLevel, WIDTH, HEIGHT]);

  // 4. Drag Tracking Ref for Smooth 60fps Dragging (Individual or Multi-Selection Group)
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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      // Case A: Dragging Nodes (Individual or Multi-Selection Group Movement)
      if (dragRef.current.activeId) {
        const currentZoom = zoomLevel || 1;
        const dx = (clientX - dragRef.current.startX) / currentZoom;
        const dy = (clientY - dragRef.current.startY) / currentZoom;

        if (Math.hypot(dx, dy) > 4) {
          dragRef.current.hasMoved = true;
        }

        const initPositions = dragRef.current.initialPositions;
        const clusterIds = dragRef.current.clusterIds;

        // Compute cluster initial bounding box to clamp uniformly (Rigid Body Movement)
        let minInitX = Infinity, maxInitX = -Infinity;
        let minInitY = Infinity, maxInitY = -Infinity;
        clusterIds.forEach((id) => {
          const p = initPositions[id];
          if (p) {
            if (p.x < minInitX) minInitX = p.x;
            if (p.x > maxInitX) maxInitX = p.x;
            if (p.y < minInitY) minInitY = p.y;
            if (p.y > maxInitY) maxInitY = p.y;
          }
        });

        const minAllowedDx = 35 - minInitX;
        const maxAllowedDx = (WIDTH - 35) - maxInitX;
        const minAllowedDy = 35 - minInitY;
        const maxAllowedDy = (HEIGHT - 35) - maxInitY;

        const clampedDx = Math.max(minAllowedDx, Math.min(maxAllowedDx, dx));
        const clampedDy = Math.max(minAllowedDy, Math.min(maxAllowedDy, dy));

        const updated = { ...positionsRef.current };
        clusterIds.forEach((id) => {
          const init = initPositions[id];
          if (init) {
            updated[id] = {
              x: init.x + clampedDx,
              y: init.y + clampedDy,
            };
          }
        });
        setPositions(updated);
        return;
      }

      // Case B: Marquee Box Selection on Canvas Background
      if (selectionRef.current.isSelecting) {
        const coords = getCanvasCoords(clientX, clientY);
        selectionRef.current.currentX = coords.x;
        selectionRef.current.currentY = coords.y;

        const moveDist = Math.hypot(
          coords.x - selectionRef.current.startX,
          coords.y - selectionRef.current.startY
        );
        if (moveDist > 6) {
          selectionRef.current.hasMoved = true;
        }

        if (selectionRef.current.hasMoved) {
          const box = {
            x1: selectionRef.current.startX,
            y1: selectionRef.current.startY,
            x2: coords.x,
            y2: coords.y,
          };
          setSelectionBox(box);

          const boxMinX = Math.min(box.x1, box.x2);
          const boxMaxX = Math.max(box.x1, box.x2);
          const boxMinY = Math.min(box.y1, box.y2);
          const boxMaxY = Math.max(box.y1, box.y2);

          const insideSet = new Set<string>();

          // 1. Check person nodes intersecting or inside selection box
          membersRef.current.forEach((m) => {
            const pos = positionsRef.current[m.id] || { x: CX, y: CY };
            const isCenter = m.id === centerPerson.id;
            const nodeLeft = pos.x - (isCenter ? 26 : 20);
            const nodeRight = pos.x + (isCenter ? 140 : 130);
            const nodeTop = pos.y - (isCenter ? 26 : 20);
            const nodeBottom = pos.y + 50;

            const overlaps = !(
              nodeRight < boxMinX ||
              nodeLeft > boxMaxX ||
              nodeBottom < boxMinY ||
              nodeTop > boxMaxY
            );
            if (overlaps) {
              insideSet.add(m.id);
            }
          });

          // 2. Check relationship lines passing through or inside selection box
          edgeDefinitionsRef.current.forEach((edge) => {
            const fromPos = positionsRef.current[edge.fromId];
            const toPos = positionsRef.current[edge.toId];
            if (
              fromPos &&
              toPos &&
              doesLineIntersectBox(fromPos, toPos, boxMinX, boxMaxX, boxMinY, boxMaxY)
            ) {
              insideSet.add(edge.fromId);
              insideSet.add(edge.toId);
            }
          });

          const insideIds = Array.from(insideSet);
          if (selectionRef.current.isAdditive) {
            setSelectedNodeIds((prev) => Array.from(new Set([...prev, ...insideIds])));
          } else {
            setSelectedNodeIds(insideIds);
          }
        }
      }
    };

    const onPointerUp = () => {
      // Release node dragging
      if (dragRef.current.activeId) {
        dragRef.current.activeId = null;
        setActiveDragId(null);
      }

      // Release marquee selection
      if (selectionRef.current.isSelecting) {
        if (!selectionRef.current.hasMoved) {
          // Simple click on empty canvas deselects all
          if (!selectionRef.current.isAdditive) {
            setSelectedNodeIds([]);
          }
        } else {
          if (selectedNodeIdsRef.current.length > 0) {
            showCanvasTooltip(
              `✨ ${selectedNodeIdsRef.current.length}명 및 관계선 선택됨: 함께 드래그하여 이동할 수 있습니다.`
            );
          }
        }
        selectionRef.current.isSelecting = false;
        setSelectionBox(null);
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
  }, [WIDTH, HEIGHT, zoomLevel, getCanvasCoords, CX, CY, centerPerson.id]);

  // Canvas Mouse Down: Starts Marquee Drag Selection
  const handleCanvasMouseDown = (e: any) => {
    if (e.button !== 0) return; // Left click only
    if (dragRef.current.activeId) return;

    const clientX = e.clientX;
    const clientY = e.clientY;
    const coords = getCanvasCoords(clientX, clientY);

    selectionRef.current = {
      isSelecting: true,
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
      hasMoved: false,
      isAdditive: !!(e.shiftKey || e.ctrlKey || e.metaKey),
    };
  };

  // Node Drag Start: Supports single node or multi-selection group dragging
  const handleDragStart = (memberId: string, pageX: number, pageY: number, e?: any) => {
    // Modifier key (Shift, Ctrl, Meta): toggle selection of this individual node
    if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      setSelectedNodeIds((prev) => {
        const next = prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId];
        return next;
      });
      return;
    }

    let cluster: string[];
    const currentSelected = selectedNodeIdsRef.current;

    if (currentSelected.includes(memberId)) {
      // Dragged node is part of the active multi-selection:
      // Move ALL selected nodes together!
      cluster = [...currentSelected];
      if (enableClusterDrag) {
        const set = new Set<string>(cluster);
        currentSelected.forEach((id) => {
          getClusterDescendants(id).forEach((desc) => set.add(desc));
        });
        cluster = Array.from(set);
      }
    } else {
      // Dragged node is NOT currently selected:
      cluster = enableClusterDrag ? getClusterDescendants(memberId) : [memberId];
      setSelectedNodeIds([memberId]);
    }

    dragRef.current = {
      activeId: memberId,
      startX: pageX,
      startY: pageY,
      initialPositions: { ...positionsRef.current },
      clusterIds: cluster,
      hasMoved: false,
    };
    setActiveDragId(memberId);
  };

  // Selection Action Helpers
  const handleSelectAll = () => {
    const allIds = members.map((m) => m.id);
    setSelectedNodeIds(allIds);
    showCanvasTooltip(`전체 ${allIds.length}명이 선택되었습니다. 함께 드래그하여 이동할 수 있습니다.`);
  };

  const handleClearSelection = () => {
    setSelectedNodeIds([]);
    showCanvasTooltip('선택이 해제되었습니다.');
  };

  const handleResetSelectedPositions = () => {
    const defaultPositions = calculateDefaultPositions();
    const updated = { ...positions };
    selectedNodeIds.forEach((id) => {
      if (defaultPositions[id]) {
        updated[id] = defaultPositions[id];
      }
    });
    setPositions(updated);
    showCanvasTooltip('선택된 인물들의 위치가 초기 방사형 배치로 복원되었습니다.');
  };

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
              {isVeryNarrow
                ? '🌐 옵시디언 가계도'
                : isNarrow
                ? '🌐 옵시디언 가계도 네트워크'
                : '🌐 옵시디언 동적 가계도 네트워크 (Obsidian Dynamic Graph)'}
            </Text>
            {activeDragId ? (
              <View style={styles.draggingNotice}>
                <Text style={styles.draggingNoticeText}>✨ 연쇄 이동 중</Text>
              </View>
            ) : null}
            {(() => {
              const pendingCount = establishedLinks.filter((l) => l.status === 'pending_elder').length;
              const approvedCount = establishedLinks.filter((l) => l.status === 'approved' || l.formationMode === 'centralized').length;
              return (
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  {pendingCount > 0 && (
                    <TouchableOpacity
                      // @ts-ignore
                      title={`윗대 승인 대기 결연: 총 ${pendingCount}건`}
                      style={[styles.linkCountNotice, { backgroundColor: '#78350f', borderColor: '#f59e0b' }]}
                      onPress={onOpenRelationshipStudio}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.linkCountNoticeText, { color: '#fbbf24' }]}>
                        🔔 {isVeryNarrow ? `${pendingCount}건` : `윗대 대기 ${pendingCount}건`}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {approvedCount > 0 && (
                    <View
                      // @ts-ignore
                      title={`어르신 공인 완료 결연: 총 ${approvedCount}건`}
                      style={styles.linkCountNotice}
                    >
                      <Text style={styles.linkCountNoticeText}>
                        🛡️ {isVeryNarrow ? `${approvedCount}건` : `공인 ${approvedCount}건`}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
          {!isVeryNarrow && (
            <Text style={[styles.headerSubtitle, { color: subtextColor }]}>
              💡 빈 캔버스를 마우스 왼쪽 클릭 후 드래그하여 여러 인물 노드와 관계선을 영역 선택하고 함께 이동할 수 있습니다.
            </Text>
          )}
        </View>

        {/* Floating Canvas Tooltip Pill */}
        {activeCanvasTooltip && (
          <View style={styles.canvasTooltipPill}>
            <Text style={styles.canvasTooltipText}>💡 {activeCanvasTooltip}</Text>
          </View>
        )}

        {/* Action Buttons: Studio Launcher, Multi-Select, Reset, Cluster Move Toggle, Dark/Light Mode */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            // @ts-ignore
            title={selectedNodeIds.length > 0 ? "선택 해제" : "마우스 드래그로 여러 인물과 관계선 다중 선택"}
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip(selectedNodeIds.length > 0 ? '선택 해제' : '마우스 드래그 영역 다중 선택')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[
              styles.actionBtn,
              selectedNodeIds.length > 0 && styles.actionBtnActive,
              isVeryNarrow && styles.actionBtnCompact,
              { borderColor: selectedNodeIds.length > 0 ? '#38bdf8' : isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => {
              if (selectedNodeIds.length > 0) {
                handleClearSelection();
              } else {
                handleSelectAll();
              }
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: selectedNodeIds.length > 0 ? '#38bdf8' : subtextColor, fontWeight: '800' },
              ]}
            >
              {isVeryNarrow
                ? (selectedNodeIds.length > 0 ? `🔲${selectedNodeIds.length}` : '🔲')
                : (selectedNodeIds.length > 0 ? `🔲 ${selectedNodeIds.length}명 선택 (해제)` : '🔲 다중 선택')}
            </Text>
          </TouchableOpacity>

          {onOpenRelationshipStudio && (
            <TouchableOpacity
              // @ts-ignore
              title="친족 관계 형성 스튜디오: 분산 결연 신청 및 윗대 어르신 승인 관리"
              // @ts-ignore
              onMouseEnter={() => setActiveCanvasTooltip('친족 관계 형성 스튜디오')}
              onMouseLeave={() => setActiveCanvasTooltip(null)}
              style={[styles.studioLauncherBtn, isVeryNarrow && styles.actionBtnCompact]}
              onPress={onOpenRelationshipStudio}
              activeOpacity={0.8}
            >
              <Text style={styles.studioLauncherBtnText}>
                {isVeryNarrow
                  ? `🤝${establishedLinks.length > 0 ? `(${establishedLinks.length})` : ''}`
                  : isNarrow
                  ? `🤝 스튜디오${establishedLinks.length > 0 ? `(${establishedLinks.length})` : ''}`
                  : `🤝 친족 관계 형성 스튜디오 ${establishedLinks.length > 0 ? `(${establishedLinks.length})` : ''}`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            // @ts-ignore
            title="가계 가지 함께 이동: 부모 노드를 움직이면 연결된 친족 노드가 함께 연쇄 이동"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('가계 가지 함께 이동 ON/OFF (드래그 시 연쇄 이동)')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[
              styles.actionBtn,
              enableClusterDrag && styles.actionBtnActive,
              isVeryNarrow && styles.actionBtnCompact,
              { borderColor: isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => {
              setEnableClusterDrag(!enableClusterDrag);
              showCanvasTooltip(
                !enableClusterDrag
                  ? '가계 가지 함께 이동이 켜졌습니다 (부모 이동 시 자녀 연쇄 이동).'
                  : '개별 노드 이동 모드로 변경되었습니다.'
              );
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: enableClusterDrag ? '#38bdf8' : subtextColor },
              ]}
            >
              {isVeryNarrow ? '🔗' : isNarrow ? (enableClusterDrag ? '🔗 가지이동' : '📍 개별이동') : (enableClusterDrag ? '🔗 가계 가지 함께 이동 ON' : '📍 개별 노드만 이동')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // @ts-ignore
            title="초기 위치로 정렬: 360도 균형 궤도 원위치 복원"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('초기 위치로 정렬: 360도 균형 궤도 복원')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[
              styles.actionBtn,
              isVeryNarrow && styles.actionBtnCompact,
              { borderColor: isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => {
              setPositions(calculateDefaultPositions());
              showCanvasTooltip('초기 위치로 정렬되었습니다.');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#cbd5e1' : inkTheme.ink2 }]}>
              {isVeryNarrow ? '🔄' : isNarrow ? '🔄 정렬' : '🔄 초기 위치로 정렬'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // @ts-ignore
            title="옵시디언 다크 모드 / 라이트 한지 모드 테마 전환"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('테마 전환: 옵시디언 다크 / 라이트 한지')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[
              styles.actionBtn,
              isVeryNarrow && styles.actionBtnCompact,
              { borderColor: isDarkMode ? '#475569' : inkTheme.ink7 },
            ]}
            onPress={() => {
              setIsDarkMode(!isDarkMode);
              showCanvasTooltip(!isDarkMode ? '옵시디언 다크 모드가 적용되었습니다.' : '라이트 한지 모드가 적용되었습니다.');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#fde047' : '#0284c7' }]}>
              {isVeryNarrow ? (isDarkMode ? '🌙' : '☀️') : isNarrow ? (isDarkMode ? '🌙 다크' : '☀️ 한지') : (isDarkMode ? '🌙 옵시디언 다크' : '☀️ 라이트 한지')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legend color keys */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.legendLabel, { color: '#ef4444' }]}>{isVeryNarrow ? '친가' : '친가 (부친 계통 · 붉은선)'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.legendLabel, { color: '#3b82f6' }]}>{isVeryNarrow ? '외가' : '외가 (모친 계통 · 푸른선)'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#fbbf24', borderRadius: 2 }]} />
            <Text style={[styles.legendLabel, { color: '#fbbf24' }]}>{isVeryNarrow ? '부부' : '💍 부부 결합 (옅은 금색 점선)'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.legendLabel, { color: '#10b981' }]}>{isVeryNarrow ? '공인' : '🛡️ 어르신 공인 결연 (실선)'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b', borderRadius: 2 }]} />
            <Text style={[styles.legendLabel, { color: '#f59e0b' }]}>{isVeryNarrow ? '대기' : '⏳ 윗대 승인 대기 (점선)'}</Text>
          </View>
        </View>
      </View>

      {/* 🌟 Viewport Zoom & Pan Navigation Controller (스마트폰 전체 화면 맞춤 및 확대/축소) */}
      <View style={[styles.viewportControlBar, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderColor: bannerBorder }]}>
        <View style={styles.viewportCenterGroup}>
          <TouchableOpacity
            // @ts-ignore
            title="전체 화면 맞춤: 가계도 캔버스 전체가 한눈에 들어오도록 배율 자동 조정"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('전체 화면 맞춤: 캔버스 전체 한눈에 보기')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[styles.viewportBtn, styles.viewportBtnFit, isVeryNarrow && styles.viewportBtnCompact]}
            onPress={() => {
              handleFitScreen();
              showCanvasTooltip('전체 화면 맞춤 배율이 적용되었습니다.');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.viewportBtnFitText}>
              {isVeryNarrow ? '🔍' : isNarrow ? '🔍 맞춤' : '🔍 전체 화면 맞춤'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // @ts-ignore
            title="가계도 캔버스 확대 (+15%)"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('가계도 확대 (+15%)')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[styles.viewportBtn, isVeryNarrow && styles.viewportBtnCompact, { borderColor: isDarkMode ? '#475569' : '#cbd5e1' }]}
            onPress={handleZoomIn}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewportBtnText, { color: textColor }]}>
              {isVeryNarrow ? '➕' : isNarrow ? '➕ 확대' : '➕ 확대'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // @ts-ignore
            title="가계도 캔버스 축소 (-15%)"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('가계도 축소 (-15%)')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[styles.viewportBtn, isVeryNarrow && styles.viewportBtnCompact, { borderColor: isDarkMode ? '#475569' : '#cbd5e1' }]}
            onPress={handleZoomOut}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewportBtnText, { color: textColor }]}>
              {isVeryNarrow ? '➖' : isNarrow ? '➖ 축소' : '➖ 축소'}
            </Text>
          </TouchableOpacity>

          <View style={styles.zoomBadge}>
            <Text style={styles.zoomBadgeText}>{Math.round(zoomLevel * 100)}%</Text>
          </View>

          <TouchableOpacity
            // @ts-ignore
            title="가계도 중심 인물 위치로 캔버스 스크롤 이동"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('가계도 중심 인물 보기')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[styles.viewportBtn, styles.viewportBtnCenter, isVeryNarrow && styles.viewportBtnCompact]}
            onPress={() => {
              handleFocusCenter();
              showCanvasTooltip('중심 인물로 포커스가 이동되었습니다.');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.viewportBtnCenterText}>
              {isVeryNarrow ? '🎯' : isNarrow ? '🎯 중심' : '🎯 중심인물 보기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            // @ts-ignore
            title="100% 원본 배율로 재설정"
            // @ts-ignore
            onMouseEnter={() => setActiveCanvasTooltip('100% 원본 배율로 초기화')}
            onMouseLeave={() => setActiveCanvasTooltip(null)}
            style={[styles.viewportBtn, isVeryNarrow && styles.viewportBtnCompact, { borderColor: isDarkMode ? '#475569' : '#cbd5e1' }]}
            onPress={() => {
              handleResetZoom();
              showCanvasTooltip('100% 원본 배율로 재설정되었습니다.');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewportBtnText, { color: textColor }]}>
              {isVeryNarrow ? '100%' : '100% 원본'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mobile Guide Notice */}
      {isMobile && !isVeryNarrow && (
        <View style={[styles.mobileGuideNotice, { backgroundColor: isDarkMode ? '#1e293b' : '#eff6ff' }]}>
          <Text style={[styles.mobileGuideNoticeText, { color: isDarkMode ? '#94a3b8' : '#1e40af' }]}>
            💡 <Text style={{ fontWeight: '800' }}>스마트폰 최적화</Text>: [🔍 전체 화면 맞춤]으로 가계도 전체를 한눈에 보거나, 좌우로 스크롤하여 탐색하세요.
          </Text>
        </View>
      )}

      {/* Interactive 2D Graph Canvas Area */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.canvasScrollView}
        contentContainerStyle={[
          styles.canvasScroll,
          {
            minWidth: '100%',
            width: Math.max(windowWidth, WIDTH * zoomLevel + 24),
            height: HEIGHT * zoomLevel + 24,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {/* Dynamic Centered Canvas Frame based on current scale */}
        <View
          style={{
            width: WIDTH * zoomLevel,
            height: HEIGHT * zoomLevel,
            alignSelf: 'center',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <View
            // @ts-ignore
            ref={canvasRef}
            style={[
              styles.canvas,
              {
                width: WIDTH,
                height: HEIGHT,
                transform: [{ scale: zoomLevel }],
                transformOrigin: '0 0',
                backgroundColor: canvasBg,
                borderRadius: 12,
                overflow: 'hidden',
                userSelect: 'none',
                cursor: selectionBox ? 'crosshair' : 'default',
              },
            ]}
            // @ts-ignore
            onMouseDown={handleCanvasMouseDown}
          >
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

              const isFromSelected = selectedNodeIds.includes(edge.fromId);
              const isToSelected = selectedNodeIds.includes(edge.toId);
              const isBothSelected = isFromSelected && isToSelected;
              const isHighlighted = isBothSelected || activeDragId === edge.fromId || activeDragId === edge.toId;

              // When both connected nodes are selected, the relationship line glows in cyan
              const strokeColor = isBothSelected
                ? '#38bdf8'
                : isHighlighted
                ? '#38bdf8'
                : edge.color;

              const strokeWidth = isBothSelected
                ? edge.width + 2
                : isHighlighted
                ? edge.width + 1.5
                : edge.width;

              // 부부간 결합선이거나 점선인 경우, 중간 노드나 중심 인물과의 겹침을 방지하기 위해 완만한 외곽 호(Arc Path)로 렌더링
              if (edge.dashed) {
                const midX = (fromPos.x + toPos.x) / 2;
                const midY = (fromPos.y + toPos.y) / 2;
                const dx = midX - CX;
                const dy = midY - CY;
                const distFromCenter = Math.hypot(dx, dy) || 1;
                // 바깥쪽으로 35px 볼록하게 휘어지는 아치형 곡선
                const ctrlX = midX + (dx / distFromCenter) * 35;
                const ctrlY = midY + (dy / distFromCenter) * 35;

                return (
                  <g key={`edge-${edge.fromId}-${edge.toId}-${i}`}>
                    {isBothSelected && (
                      <path
                        d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={strokeWidth + 4}
                        strokeOpacity={0.35}
                        strokeLinecap="round"
                      />
                    )}
                    <path
                      d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray="6,5"
                      strokeLinecap="round"
                    />
                  </g>
                );
              }

              return (
                <g key={`edge-${edge.fromId}-${edge.toId}-${i}`}>
                  {isBothSelected && (
                    <line
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke="#38bdf8"
                      strokeWidth={strokeWidth + 4}
                      strokeOpacity={0.35}
                      strokeLinecap="round"
                    />
                  )}
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.dashed ? '5,5' : undefined}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* 2. NODES LAYER: Interactive draggable obsidian nodes */}
          {members.map((member) => {
            const isCenter = member.id === centerPerson.id;
            const pos = positions[member.id] || { x: CX, y: CY };
            const life = getLifeStatus(member);
            const rel = getKinshipRelation(centerPerson.id, member.id, members);
            const isNewlyLinked =
              member.id.startsWith('unc-') ||
              establishedLinks.some((l) => l.personAId === member.id || l.personBId === member.id);
            const isSelected = selectedNodeIds.includes(member.id);

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
                    zIndex: isDraggingThis ? 99 : isSelected ? 60 : isCenter ? 50 : 20,
                  },
                ]}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(evt) => {
                  const ne = evt.nativeEvent;
                  const pageX = ne.pageX || 0;
                  const pageY = ne.pageY || 0;
                  handleDragStart(member.id, pageX, pageY, ne);
                }}
                // @ts-ignore: Web specific mouse down to stop bubbling and handle group drag
                onMouseDown={(e: any) => {
                  if (e && e.stopPropagation) e.stopPropagation();
                  handleDragStart(member.id, e.clientX || e.pageX, e.clientY || e.pageY, e);
                }}
                onResponderMove={(evt) => {
                  if (Platform.OS !== 'web') {
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
                      backgroundColor: isCenter ? '#10b981' : isNewlyLinked ? '#059669' : nodeColor,
                      borderColor: isSelected
                        ? '#38bdf8'
                        : isCenter
                        ? '#34d399'
                        : isNewlyLinked
                        ? '#10b981'
                        : isDraggingThis
                        ? '#38bdf8'
                        : '#ffffff',
                      borderWidth: isSelected ? 3.5 : isCenter ? 3 : isNewlyLinked ? 2.5 : 2,
                    },
                    isCenter && styles.centerPulseRing,
                    (isDraggingThis || isSelected) && styles.draggingNodePulse,
                    isSelected && styles.selectedNodeDot,
                    !member.isAlive && styles.deceasedNodeDot,
                  ]}
                >
                  <Text style={styles.nodeInitials}>
                    {isCenter ? '★' : isNewlyLinked ? '✨' : member.name.charAt(0)}
                  </Text>
                </View>

                {/* Obsidian-Style Info Chip Tag */}
                <View
                  style={[
                    styles.nodeCardChip,
                    {
                      backgroundColor: isSelected
                        ? (isDarkMode ? 'rgba(15, 23, 42, 0.96)' : '#f0f9ff')
                        : nodeCardBg,
                      borderColor: isSelected
                        ? '#38bdf8'
                        : isNewlyLinked
                        ? '#10b981'
                        : isDraggingThis
                        ? '#38bdf8'
                        : nodeCardBorder,
                      borderWidth: isSelected ? 2 : isNewlyLinked ? 1.5 : 1,
                      left: nodeSize + 8,
                    },
                    isCenter && styles.centerCardChip,
                    isSelected && styles.selectedCardChip,
                  ]}
                >
                  {/* Top: 2차 승인 / 공인 인증 배지 (이름 위 상단 독립 라인으로 분리하여 이름 가림 원천 해결) */}
                  {(() => {
                    if (!isNewlyLinked) return null;
                    const matchedLink = establishedLinks.find(
                      (l) => l.personAId === member.id || l.personBId === member.id
                    );
                    const isPending = matchedLink?.status === 'pending_elder';
                    return (
                      <View style={styles.verifiedBadgeRow}>
                        <View
                          style={[
                            styles.newLinkBadge,
                            isPending && { backgroundColor: '#b45309', borderColor: '#f59e0b' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.newLinkBadgeText,
                              isPending && { color: '#fef3c7' },
                            ]}
                          >
                            {isPending ? '⏳ 윗대 승인대기' : '🛡️ 어르신 공인'}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  <View style={styles.chipHeaderRow}>
                    <Text
                      style={[
                        styles.nodeNameText,
                        { color: isCenter ? '#10b981' : isDarkMode ? '#f8fafc' : '#1e293b' },
                      ]}
                    >
                      {member.name}
                    </Text>

                    {rel.chonText ? (
                      <View style={[styles.chonBadge, { backgroundColor: isCenter ? '#10b981' : nodeColor }]}>
                        <Text style={styles.chonBadgeText}>{rel.chonText}</Text>
                      </View>
                    ) : null}

                    {isSelected && (
                      <View style={styles.selectedBadgePill}>
                        <Text style={styles.selectedBadgePillText}>✓ 선택됨</Text>
                      </View>
                    )}
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

          {/* 3. MARQUEE SELECTION RECTANGLE LAYER */}
          {selectionBox && (
            <View
              style={[
                styles.selectionBox,
                {
                  left: Math.min(selectionBox.x1, selectionBox.x2),
                  top: Math.min(selectionBox.y1, selectionBox.y2),
                  width: Math.abs(selectionBox.x2 - selectionBox.x1),
                  height: Math.abs(selectionBox.y2 - selectionBox.y1),
                },
              ]}
            >
              <View style={styles.selectionBoxBadge}>
                <Text style={styles.selectionBoxBadgeText}>
                  {selectedNodeIds.length > 0 ? `선택: ${selectedNodeIds.length}명` : '영역 선택 중...'}
                </Text>
              </View>
            </View>
          )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Multi-Selection Action Bar */}
      {selectedNodeIds.length > 0 && (
        <View
          style={[
            styles.floatingSelectionBar,
            {
              backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: '#0284c7',
            },
          ]}
        >
          <View style={styles.floatingSelectionLeft}>
            <View style={styles.floatingSelectDot} />
            <Text style={[styles.floatingSelectionText, { color: textColor }]}>
              ✨ <Text style={{ fontWeight: '900', color: '#38bdf8' }}>{selectedNodeIds.length}명</Text> 및 관계선 선택됨 (함께 드래그 이동)
            </Text>
          </View>
          <View style={styles.floatingSelectionActions}>
            <TouchableOpacity
              style={[styles.floatingActionBtn, { backgroundColor: '#0284c7' }]}
              onPress={handleSelectAll}
              activeOpacity={0.8}
            >
              <Text style={styles.floatingActionBtnText}>전체 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.floatingActionBtn, { backgroundColor: '#475569' }]}
              onPress={handleResetSelectedPositions}
              activeOpacity={0.8}
            >
              <Text style={styles.floatingActionBtnText}>선택 위치 복원</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.floatingActionBtn, styles.floatingActionBtnDeselect]}
              onPress={handleClearSelection}
              activeOpacity={0.8}
            >
              <Text style={[styles.floatingActionBtnText, { color: '#f87171' }]}>선택 해제 ✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    marginVertical: 10,
  },
  controlBar: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  titleArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
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
  linkCountNotice: {
    backgroundColor: '#065f46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  linkCountNoticeText: {
    fontSize: 11,
    color: '#d1fae5',
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
  actionButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  studioLauncherBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  studioLauncherBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
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
  actionBtnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  // Viewport Zoom & Pan Navigation Bar
  viewportControlBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  viewportCenterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  viewportBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewportBtnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewportBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewportBtnFit: {
    backgroundColor: '#0284c7',
    borderColor: '#0ea5e9',
  },
  viewportBtnFitText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  viewportBtnCenter: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  viewportBtnCenterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  canvasScrollView: {
    width: '100%',
    maxWidth: '100%',
  },
  zoomBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  mobileGuideNotice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  mobileGuideNoticeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  canvasScroll: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 110,
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
  verifiedBadgeRow: {
    marginBottom: 3,
    alignSelf: 'flex-start',
  },
  chipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  nodeNameText: {
    fontSize: 12.5,
    fontWeight: '800',
    flexShrink: 0,
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
  newLinkBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newLinkBadgeText: {
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
  canvasTooltipPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#38bdf8',
    elevation: 12,
    zIndex: 1001,
  },
  canvasTooltipText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  selectedNodeDot: {
    borderColor: '#38bdf8',
    borderWidth: 3.5,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 10,
  },
  selectedCardChip: {
    borderColor: '#38bdf8',
    borderWidth: 2,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedBadgePill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  selectedBadgePillText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  selectionBox: {
    position: 'absolute',
    borderColor: '#38bdf8',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderRadius: 4,
    pointerEvents: 'none',
    zIndex: 90,
  },
  selectionBoxBadge: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectionBoxBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingSelectionBar: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    flexWrap: 'wrap',
    maxWidth: '92%',
    zIndex: 100,
  },
  floatingSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingSelectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  floatingSelectionText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  floatingSelectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  floatingActionBtnDeselect: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
});
