import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { getLifeStatus, getKinshipRelation } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

interface ObsidianGraphViewProps {
  members: FamilyMember[];
  centerPerson: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
}

interface GraphNode {
  member: FamilyMember;
  x: number;
  y: number;
  color: string;
  isCenter: boolean;
  relTitle: string;
  chonText?: string;
  isAlive: boolean;
  ageText: string;
}

interface GraphEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
  dashed?: boolean;
}

export const ObsidianGraphView: React.FC<ObsidianGraphViewProps> = ({
  members,
  centerPerson,
  onSelectMember,
}) => {
  // Canvas dimensions for generous panning & obsidian aesthetic
  const WIDTH = 860;
  const HEIGHT = 760;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2 + 10;

  // Compute node positions and edges mathematically
  const { nodes, edges } = useMemo(() => {
    const calculatedNodes: GraphNode[] = [];
    const calculatedEdges: GraphEdge[] = [];

    // 1. Center Node
    const centerLife = getLifeStatus(centerPerson);
    calculatedNodes.push({
      member: centerPerson,
      x: CX,
      y: CY,
      color: '#111827',
      isCenter: true,
      relTitle: '중심 (나/기준)',
      isAlive: centerPerson.isAlive,
      ageText: centerLife.ageText,
    });

    // Partition remaining members into groups
    const otherMembers = members.filter((m) => m.id !== centerPerson.id);

    const paternalMembers = otherMembers.filter((m) => m.lineage === 'paternal');
    const maternalMembers = otherMembers.filter((m) => m.lineage === 'maternal');
    const inlawMembers = otherMembers.filter(
      (m) => m.lineage === 'inlaw_paternal' || m.lineage === 'inlaw_maternal'
    );

    // Paternal (친가 - 붉은색): Left / Upper-Left sector (120° to 240°)
    const patCount = paternalMembers.length;
    paternalMembers.forEach((m, idx) => {
      const life = getLifeStatus(m);
      const rel = getKinshipRelation(centerPerson.id, m.id);

      let radius = 180;
      if (m.generation === 1) radius = 300; // 조부모
      else if (m.id === 'pat-3-4' || m.id === 'pat-2-4') radius = 320; // 4촌, 5촌 종친
      else if (m.generation === 2) radius = 200; // 부모, 백부
      else if (m.generation === 3) radius = 140; // 형제
      else if (m.generation === 4) radius = 220; // 자녀

      const startAngle = (125 * Math.PI) / 180;
      const endAngle = (240 * Math.PI) / 180;
      const angle =
        patCount > 1
          ? startAngle + ((endAngle - startAngle) * idx) / (patCount - 1)
          : (180 * Math.PI) / 180;

      const jitterX = Math.sin(idx * 2.3) * 10;
      const jitterY = Math.cos(idx * 1.7) * 10;

      const x = CX + radius * Math.cos(angle) + jitterX;
      const y = CY + radius * Math.sin(angle) + jitterY;

      calculatedNodes.push({
        member: m,
        x,
        y,
        color: '#dc2626', // 친가: 선명한 붉은색
        isCenter: false,
        relTitle: rel.title,
        chonText: rel.chonText,
        isAlive: m.isAlive,
        ageText: life.ageText,
      });

      // Edge from Center to Paternal member (RED)
      calculatedEdges.push({
        fromX: CX,
        fromY: CY,
        toX: x,
        toY: y,
        color: 'rgba(220, 38, 38, 0.7)', // 붉은색 친가 연결선
        width: m.generation === 2 ? 2.5 : 1.8,
      });
    });

    // Maternal (외가 - 푸른색): Right / Upper-Right sector (-55° to 35°)
    const matCount = maternalMembers.length;
    maternalMembers.forEach((m, idx) => {
      const life = getLifeStatus(m);
      const rel = getKinshipRelation(centerPerson.id, m.id);

      let radius = 190;
      if (m.generation === 1) radius = 310; // 외조부모
      else if (m.id === 'mat-3-1' || m.id === 'mat-2-4') radius = 320; // 외사촌, 외당숙
      else if (m.generation === 2) radius = 210; // 모친, 외숙, 이모

      const startAngle = (-55 * Math.PI) / 180;
      const endAngle = (35 * Math.PI) / 180;
      const angle =
        matCount > 1
          ? startAngle + ((endAngle - startAngle) * idx) / (matCount - 1)
          : (-10 * Math.PI) / 180;

      const jitterX = Math.cos(idx * 2.1) * 10;
      const jitterY = Math.sin(idx * 1.9) * 10;

      const x = CX + radius * Math.cos(angle) + jitterX;
      const y = CY + radius * Math.sin(angle) + jitterY;

      calculatedNodes.push({
        member: m,
        x,
        y,
        color: '#2563eb', // 외가: 선명한 푸른색
        isCenter: false,
        relTitle: rel.title,
        chonText: rel.chonText,
        isAlive: m.isAlive,
        ageText: life.ageText,
      });

      // Edge from Center to Maternal member (BLUE)
      calculatedEdges.push({
        fromX: CX,
        fromY: CY,
        toX: x,
        toY: y,
        color: 'rgba(37, 99, 235, 0.7)', // 푸른색 외가 연결선
        width: m.id === 'mat-2-1' ? 2.5 : 1.8,
      });
    });

    // In-laws (사돈댁 - 황금빛): Lower sector (50° to 110°)
    const inlawCount = inlawMembers.length;
    inlawMembers.forEach((m, idx) => {
      const life = getLifeStatus(m);
      const rel = getKinshipRelation(centerPerson.id, m.id);

      let radius = 180;
      if (m.id === 'inlaw-pat-3-1') radius = 100; // 배우자
      else if (m.generation === 1) radius = 290;
      else if (m.generation === 2) radius = 210;
      else radius = 170;

      const startAngle = (45 * Math.PI) / 180;
      const endAngle = (115 * Math.PI) / 180;
      const angle =
        inlawCount > 1
          ? startAngle + ((endAngle - startAngle) * idx) / (inlawCount - 1)
          : (80 * Math.PI) / 180;

      const x = CX + radius * Math.cos(angle);
      const y = CY + radius * Math.sin(angle);

      calculatedNodes.push({
        member: m,
        x,
        y,
        color: '#d97706',
        isCenter: false,
        relTitle: rel.title,
        chonText: rel.chonText,
        isAlive: m.isAlive,
        ageText: life.ageText,
      });

      calculatedEdges.push({
        fromX: CX,
        fromY: CY,
        toX: x,
        toY: y,
        color: 'rgba(217, 119, 6, 0.55)',
        width: m.id === 'inlaw-pat-3-1' ? 2.8 : 1.5,
        dashed: m.id !== 'inlaw-pat-3-1',
      });
    });

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [members, centerPerson]);

  return (
    <View style={styles.outerContainer}>
      {/* Obsidian-Style Legend Banner */}
      <View style={styles.legendBanner}>
        <View style={styles.legendLeft}>
          <Text style={styles.legendTitle}>🌐 옵시디언 스타일 방사형 네트워크 가계도</Text>
          <Text style={styles.legendSubtitle}>
            노드를 탭하면 상세 정보 및 '중심 인물로 재배치'가 가능합니다.
          </Text>
        </View>

        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#dc2626' }]} />
            <Text style={[styles.legendText, { color: '#dc2626' }]}>친가 (부친쪽 붉은선)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#2563eb' }]} />
            <Text style={[styles.legendText, { color: '#2563eb' }]}>외가 (모친쪽 푸른선)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#d97706' }]} />
            <Text style={[styles.legendText, { color: '#d97706' }]}>사돈댁 (처가)</Text>
          </View>
        </View>
      </View>

      {/* Interactive Graph Canvas Area */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.canvasScroll}
      >
        <View style={[styles.canvas, { width: WIDTH, height: HEIGHT }]}>
          {/* Subtle concentric orbit rings for obsidian aesthetics */}
          <View style={[styles.orbitRing, { width: 220, height: 220, borderRadius: 110, left: CX - 110, top: CY - 110 }]} />
          <View style={[styles.orbitRing, { width: 420, height: 420, borderRadius: 210, left: CX - 210, top: CY - 210 }]} />
          <View style={[styles.orbitRing, { width: 620, height: 620, borderRadius: 310, left: CX - 310, top: CY - 310 }]} />

          {/* 1. EDGES LAYER: Native SVG lines for web */}
          {/* @ts-ignore: React Native Web supports native svg element */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: WIDTH,
              height: HEIGHT,
              pointerEvents: 'none',
            }}
          >
            {edges.map((edge, i) => (
              <line
                key={`edge-${i}`}
                x1={edge.fromX}
                y1={edge.fromY}
                x2={edge.toX}
                y2={edge.toY}
                stroke={edge.color}
                strokeWidth={edge.width}
                strokeDasharray={edge.dashed ? '4,4' : undefined}
              />
            ))}
          </svg>

          {/* 2. NODES LAYER: Touchable interactive obsidian nodes */}
          {nodes.map((node) => {
            const isCenter = node.isCenter;
            const nodeSize = isCenter ? 44 : 28;
            const halfSize = nodeSize / 2;

            return (
              <TouchableOpacity
                key={node.member.id}
                style={[
                  styles.nodeWrapper,
                  {
                    left: node.x - halfSize,
                    top: node.y - halfSize,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => onSelectMember(node.member)}
              >
                {/* Visual Circle Node Dot */}
                <View
                  style={[
                    styles.nodeDot,
                    {
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: halfSize,
                      backgroundColor: isCenter ? '#111827' : node.color,
                      borderColor: isCenter ? inkTheme.accentGold : '#ffffff',
                      borderWidth: isCenter ? 3 : 2,
                    },
                    isCenter && styles.centerPulseRing,
                    !node.isAlive && styles.deceasedNode,
                  ]}
                >
                  <Text style={styles.nodeInitials}>
                    {isCenter ? '★' : node.member.name.charAt(0)}
                  </Text>
                </View>

                {/* Obsidian-style typography label */}
                <View
                  style={[
                    styles.nodeLabelBox,
                    isCenter && styles.centerLabelBox,
                    { left: halfSize + 6, top: -4 },
                  ]}
                >
                  <View style={styles.labelHeader}>
                    <Text
                      style={[
                        styles.nodeNameText,
                        isCenter && styles.centerNameText,
                        { color: isCenter ? '#111827' : node.color },
                      ]}
                      numberOfLines={1}
                    >
                      {node.member.name}
                    </Text>
                    {node.chonText ? (
                      <View style={[styles.chonBadge, { backgroundColor: node.color }]}>
                        <Text style={styles.chonBadgeText}>{node.chonText}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.relTitleText} numberOfLines={1}>
                    {node.relTitle}
                  </Text>

                  <Text
                    style={[
                      styles.lifeStatusText,
                      { color: node.isAlive ? '#059669' : '#6b7280' },
                    ]}
                  >
                    {node.isAlive ? `🌿 생존 (${node.ageText})` : `🕯️ 작고 (${node.ageText})`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#fafaf9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
    marginVertical: 12,
  },
  legendBanner: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendLeft: {
    flex: 1,
    minWidth: 240,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.3,
  },
  legendSubtitle: {
    fontSize: 11,
    color: inkTheme.ink4,
    marginTop: 2,
  },
  legendItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '800',
  },
  canvasScroll: {
    padding: 10,
  },
  canvas: {
    position: 'relative',
    backgroundColor: '#fbfbfa',
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderStyle: 'dashed',
    pointerEvents: 'none',
  },
  nodeWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nodeDot: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  centerPulseRing: {
    shadowColor: inkTheme.accentGold,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  deceasedNode: {
    opacity: 0.75,
  },
  nodeInitials: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  nodeLabelBox: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
    minWidth: 95,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  centerLabelBox: {
    backgroundColor: '#ffffff',
    borderColor: inkTheme.accentGold,
    borderWidth: 1.5,
    minWidth: 110,
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nodeNameText: {
    fontSize: 12,
    fontWeight: '900',
  },
  centerNameText: {
    fontSize: 13,
  },
  chonBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  chonBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  relTitleText: {
    fontSize: 10,
    fontWeight: '700',
    color: inkTheme.ink2,
    marginTop: 1,
  },
  lifeStatusText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
});

