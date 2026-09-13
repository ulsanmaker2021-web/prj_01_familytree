import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
} from 'react-native';
import { FamilyMember, RelationType, EstablishedLink } from '../types/family';
import { calculateKinshipBetween, UNCONNECTED_TEST_MEMBERS } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

interface RelationshipStudioModalProps {
  visible: boolean;
  onClose: () => void;
  allMembers: FamilyMember[];
  unconnectedMembers: FamilyMember[];
  establishedLinks: EstablishedLink[];
  onConnect: (personAId: string, personBId: string, relationType: RelationType) => {
    success: boolean;
    message: string;
    chonText: string;
    titleAtoB: string;
    titleBtoA: string;
  };
  onDisconnect: (linkId: string) => void;
  onResetAll: () => void;
  initialPersonAId?: string;
}

export const RelationshipStudioModal: React.FC<RelationshipStudioModalProps> = ({
  visible,
  onClose,
  allMembers,
  unconnectedMembers,
  establishedLinks,
  onConnect,
  onDisconnect,
  onResetAll,
  initialPersonAId,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'manage'>('presets');

  // Custom Linker State
  const [selectedPersonAId, setSelectedPersonAId] = useState<string>(
    initialPersonAId || 'pat-2-1' // Default: 백부 김영호
  );
  const [selectedPersonBId, setSelectedPersonBId] = useState<string>(
    unconnectedMembers.length > 0 ? unconnectedMembers[0].id : ''
  );
  const [selectedRelationType, setSelectedRelationType] = useState<RelationType>('parent_child');
  const [filterQueryA, setFilterQueryA] = useState('');
  const [filterQueryB, setFilterQueryB] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Combine registered and unconnected candidates for Person B selection
  const selectableCandidatesB = useMemo(() => {
    const list = [...unconnectedMembers, ...allMembers.filter((m) => m.id !== selectedPersonAId)];
    if (!filterQueryB) return list;
    return list.filter(
      (m) =>
        m.name.includes(filterQueryB) ||
        (m.hanja && m.hanja.includes(filterQueryB)) ||
        m.relationship.includes(filterQueryB)
    );
  }, [unconnectedMembers, allMembers, selectedPersonAId, filterQueryB]);

  const selectableCandidatesA = useMemo(() => {
    if (!filterQueryA) return allMembers;
    return allMembers.filter(
      (m) =>
        m.name.includes(filterQueryA) ||
        (m.hanja && m.hanja.includes(filterQueryA)) ||
        m.relationship.includes(filterQueryA)
    );
  }, [allMembers, filterQueryA]);

  const personA = useMemo(
    () => allMembers.find((m) => m.id === selectedPersonAId),
    [allMembers, selectedPersonAId]
  );
  const personB = useMemo(
    () =>
      unconnectedMembers.find((m) => m.id === selectedPersonBId) ||
      allMembers.find((m) => m.id === selectedPersonBId),
    [unconnectedMembers, allMembers, selectedPersonBId]
  );

  // Live Kinship Preview Calculation
  const livePreview = useMemo(() => {
    if (!personA || !personB) return null;

    // Simulate link to compute projected kinship
    let simTitleAtoB = '';
    let simTitleBtoA = '';
    let simChon = '';
    let simImpact = '';

    if (selectedRelationType === 'parent_child') {
      simChon = '1촌 (부모-자녀)';
      simTitleAtoB = personB.gender === 'M' ? '차남/장남 (자녀)' : '딸 (자녀)';
      simTitleBtoA = personA.gender === 'M' ? '아버지 (부친)' : '어머니 (모친)';
      if (personA.id === 'pat-2-1') {
        simImpact = '본인(김준혁)과 4촌 종형제(사촌동생) 관계가 형성되며, 친가 붉은선에 편입됩니다.';
      } else if (personA.id === 'mat-2-3') {
        simImpact = '본인(김준혁)과 4촌 이종사촌 관계가 형성되며, 외가 푸른선에 편입됩니다.';
      } else {
        simImpact = `${personA.name}님의 직계 계보에 자녀로 연결됩니다.`;
      }
    } else if (selectedRelationType === 'child_parent') {
      simChon = '1촌 (자녀-부모)';
      simTitleAtoB = personB.gender === 'M' ? '아버지 (부친)' : '어머니 (모친)';
      simTitleBtoA = personA.gender === 'M' ? '아들 (자녀)' : '딸 (자녀)';
      simImpact = `${personB.name}님이 ${personA.name}님의 윗대 부모로 가계도에 연결됩니다.`;
    } else if (selectedRelationType === 'spouse') {
      simChon = '0촌 (부부 결연)';
      simTitleAtoB = personB.gender === 'F' ? '아내 (배우자)' : '남편 (배우자)';
      simTitleBtoA = personA.gender === 'F' ? '아내 (배우자)' : '남편 (배우자)';
      if (personA.id === 'pat-3-2') {
        simImpact = '남동생의 아내(제수씨)로서 본인 가계도의 사돈/인척 계통에 편입됩니다.';
      } else {
        simImpact = '양가 혼인을 통한 부부 결연이 형성됩니다.';
      }
    } else if (selectedRelationType === 'sibling') {
      simChon = '2촌 (형제·자매)';
      simTitleAtoB = personB.gender === 'M' ? '남동생/형제' : '여동생/자매';
      simTitleBtoA = personA.gender === 'M' ? '형/오빠' : '누나/언니';
      simImpact = `${personA.name}님과 동일한 부모를 모시는 동기간으로 결연됩니다.`;
    }

    return {
      chon: simChon,
      titleAtoB: simTitleAtoB,
      titleBtoA: simTitleBtoA,
      impact: simImpact,
    };
  }, [personA, personB, selectedRelationType]);

  // Execute Preset Test Scenarios
  const handleRunPreset = (scenarioIndex: number) => {
    if (scenarioIndex === 1) {
      // Scenario 1: 백부 김영호 ↔ 미등록 종친 김태성 (부자 결연)
      const res = onConnect('pat-2-1', 'unc-1', 'parent_child');
      showToast(res.message);
    } else if (scenarioIndex === 2) {
      // Scenario 2: 큰이모 이은미 ↔ 미등록 외가 친족 최소율 (모녀 결연)
      const res = onConnect('mat-2-3', 'unc-2', 'parent_child');
      showToast(res.message);
    } else if (scenarioIndex === 3) {
      // Scenario 3: 남동생 김민혁 ↔ 예비 신부 박지민 (부부 결연)
      const res = onConnect('pat-3-2', 'unc-3', 'spouse');
      showToast(res.message);
    }
  };

  const handleCustomConnect = () => {
    if (!selectedPersonAId || !selectedPersonBId) {
      showToast('두 인물을 모두 선택해 주세요.');
      return;
    }
    const res = onConnect(selectedPersonAId, selectedPersonBId, selectedRelationType);
    showToast(res.message);
    if (res.success) {
      setActiveTab('manage');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleArea}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerIcon}>🤝</Text>
                <Text style={styles.headerTitle}>친족 관계 형성 및 결연 스튜디오</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                가계도에 아직 연결되지 않은 인물이나 서로 다른 두 친족을 혈연/혼인으로 결연합니다.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastText}>✨ {toastMessage}</Text>
            </View>
          )}

          {/* Tab Selector Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'presets' && styles.tabBtnActive]}
              onPress={() => setActiveTab('presets')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'presets' && styles.tabBtnTextActive]}>
                ⚡ 1초 퀵 테스트 시나리오
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'custom' && styles.tabBtnActive]}
              onPress={() => setActiveTab('custom')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'custom' && styles.tabBtnTextActive]}>
                🎯 자유 친족 결연
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'manage' && styles.tabBtnActive]}
              onPress={() => setActiveTab('manage')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'manage' && styles.tabBtnTextActive]}>
                📋 형성된 결연 ({establishedLinks.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ======================================================== */}
            {/* TAB 1: PRESET QUICK TEST SCENARIOS                       */}
            {/* ======================================================== */}
            {activeTab === 'presets' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionIntro}>
                  💡 아래의 대표적인 3가지 미연결 친족 시나리오 중 하나를 선택하면, 1초 만에 가계도 상에 새로운 계보와 연결선이 생성되는 과정을 시뮬레이션할 수 있습니다.
                </Text>

                {/* Scenario 1 Card */}
                <View style={styles.scenarioCard}>
                  <View style={styles.scenarioHeader}>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#ef4444' }]}>
                      <Text style={styles.scenarioBadgeText}>친가 종친 결연</Text>
                    </View>
                    <Text style={styles.scenarioTitle}>
                      1. 백부 김영호 ↔ 미등록 종친 김태성 (부자 결연)
                    </Text>
                  </View>

                  <Text style={styles.scenarioDesc}>
                    대구에 거주하는 30대 미등록 종친 김태성을 백부 김영호의 차남(자녀)으로 결연합니다.
                  </Text>

                  <View style={styles.scenarioPreviewBox}>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>김영호 ↔ 김태성</Text>: 1촌 부자(父子) 관계 성립
                    </Text>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>본인(김준혁) ↔ 김태성</Text>: 4촌 사촌동생(종제) 관계 형성!
                    </Text>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>옵시디언 효과</Text>: 백부로부터 붉은색 연결선이 즉시 형성
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.runScenarioBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => handleRunPreset(1)}
                  >
                    <Text style={styles.runScenarioBtnText}>
                      🚀 [시나리오 1] 부자(父子) 결연 테스트 실행
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Scenario 2 Card */}
                <View style={styles.scenarioCard}>
                  <View style={styles.scenarioHeader}>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#2563eb' }]}>
                      <Text style={styles.scenarioBadgeText}>외가 친족 결연</Text>
                    </View>
                    <Text style={styles.scenarioTitle}>
                      2. 큰이모 이은미 ↔ 미등록 외가 친족 최소율 (모녀 결연)
                    </Text>
                  </View>

                  <Text style={styles.scenarioDesc}>
                    수원에 거주하는 20대 외가 친족 최소율을 큰이모 이은미의 차녀(딸)로 결연합니다.
                  </Text>

                  <View style={styles.scenarioPreviewBox}>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>이은미 ↔ 최소율</Text>: 1촌 모녀(母女) 관계 성립
                    </Text>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>본인(김준혁) ↔ 최소율</Text>: 4촌 이종사촌여동생 관계 형성!
                    </Text>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>옵시디언 효과</Text>: 큰이모로부터 푸른색 외가 연결선 즉시 형성
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.runScenarioBtn, { backgroundColor: '#2563eb' }]}
                    onPress={() => handleRunPreset(2)}
                  >
                    <Text style={styles.runScenarioBtnText}>
                      🚀 [시나리오 2] 모녀(母女) 결연 테스트 실행
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Scenario 3 Card */}
                <View style={styles.scenarioCard}>
                  <View style={styles.scenarioHeader}>
                    <View style={[styles.scenarioBadge, { backgroundColor: '#d97706' }]}>
                      <Text style={styles.scenarioBadgeText}>혼인 결연</Text>
                    </View>
                    <Text style={styles.scenarioTitle}>
                      3. 남동생 김민혁 ↔ 예비 신부 박지민 (부부 결연)
                    </Text>
                  </View>

                  <Text style={styles.scenarioDesc}>
                    미혼인 남동생 김민혁과 예비 신부 박지민을 부부로 혼인 결연합니다.
                  </Text>

                  <View style={styles.scenarioPreviewBox}>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>김민혁 ↔ 박지민</Text>: 0촌 부부(夫婦) 관계 성립
                    </Text>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>본인(김준혁) ↔ 박지민</Text>: 제수씨(弟嫂) 인척 관계 형성!
                    </Text>
                    <Text style={styles.scenarioPreviewLine}>
                      • <Text style={styles.boldText}>옵시디언 효과</Text>: 남동생 옆에 황금색 배우자 연결선 생성
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.runScenarioBtn, { backgroundColor: '#d97706' }]}
                    onPress={() => handleRunPreset(3)}
                  >
                    <Text style={styles.runScenarioBtnText}>
                      🚀 [시나리오 3] 부부(夫婦) 결연 테스트 실행
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 2: CUSTOM RELATIONSHIP LINKER                         */}
            {/* ======================================================== */}
            {activeTab === 'custom' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionIntro}>
                  직접 가계도 내/외의 두 사람을 선택하여 혈연 및 혼인 관계를 자유롭게 형성할 수 있습니다.
                </Text>

                {/* Step 1: Select Person A */}
                <View style={styles.selectorSection}>
                  <Text style={styles.selectorSectionTitle}>
                    1️⃣ 첫 번째 인물 (기준 인물 A) 선택:
                  </Text>
                  <TextInput
                    style={styles.searchBar}
                    placeholder="이름 또는 호칭 검색 (예: 백부, 김영호)"
                    placeholderTextColor="#9ca3af"
                    value={filterQueryA}
                    onChangeText={setFilterQueryA}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {selectableCandidatesA.slice(0, 15).map((m) => {
                      const isSelected = m.id === selectedPersonAId;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                          onPress={() => setSelectedPersonAId(m.id)}
                        >
                          <Text style={[styles.memberChipName, isSelected && styles.memberChipNameSelected]}>
                            {m.name}
                          </Text>
                          <Text style={[styles.memberChipRel, isSelected && styles.memberChipRelSelected]}>
                            {m.relationship}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Step 2: Select Person B */}
                <View style={styles.selectorSection}>
                  <Text style={styles.selectorSectionTitle}>
                    2️⃣ 두 번째 인물 (결연 대상 B) 선택:
                  </Text>
                  {unconnectedMembers.length > 0 && (
                    <View style={styles.unconnectedCallout}>
                      <Text style={styles.unconnectedCalloutTitle}>⭐ 미연결 추천 후보:</Text>
                      <View style={styles.unconnectedRow}>
                        {unconnectedMembers.map((m) => {
                          const isSelected = m.id === selectedPersonBId;
                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={[styles.unconnectedChip, isSelected && styles.unconnectedChipSelected]}
                              onPress={() => setSelectedPersonBId(m.id)}
                            >
                              <Text style={[styles.unconnectedChipText, isSelected && styles.unconnectedChipTextSelected]}>
                                ✨ {m.name} ({m.clan?.split(' ')[0] || '미등록'})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <TextInput
                    style={styles.searchBar}
                    placeholder="인물 B 검색 (예: 최소율, 김태성, 박지민)"
                    placeholderTextColor="#9ca3af"
                    value={filterQueryB}
                    onChangeText={setFilterQueryB}
                  />

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {selectableCandidatesB.slice(0, 15).map((m) => {
                      const isSelected = m.id === selectedPersonBId;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                          onPress={() => setSelectedPersonBId(m.id)}
                        >
                          <Text style={[styles.memberChipName, isSelected && styles.memberChipNameSelected]}>
                            {m.name}
                          </Text>
                          <Text style={[styles.memberChipRel, isSelected && styles.memberChipRelSelected]}>
                            {m.relationship}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Step 3: Select Relationship Type */}
                <View style={styles.selectorSection}>
                  <Text style={styles.selectorSectionTitle}>3️⃣ 관계 형성 방식 지정:</Text>
                  <View style={styles.relationTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.relationTypeBtn,
                        selectedRelationType === 'parent_child' && styles.relationTypeBtnActive,
                      ]}
                      onPress={() => setSelectedRelationType('parent_child')}
                    >
                      <Text
                        style={[
                          styles.relationTypeBtnText,
                          selectedRelationType === 'parent_child' && styles.relationTypeBtnTextActive,
                        ]}
                      >
                        A가 B의 부모 (자녀 결연)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.relationTypeBtn,
                        selectedRelationType === 'child_parent' && styles.relationTypeBtnActive,
                      ]}
                      onPress={() => setSelectedRelationType('child_parent')}
                    >
                      <Text
                        style={[
                          styles.relationTypeBtnText,
                          selectedRelationType === 'child_parent' && styles.relationTypeBtnTextActive,
                        ]}
                      >
                        B가 A의 부모 (부모 결연)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.relationTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.relationTypeBtn,
                        selectedRelationType === 'spouse' && styles.relationTypeBtnActive,
                      ]}
                      onPress={() => setSelectedRelationType('spouse')}
                    >
                      <Text
                        style={[
                          styles.relationTypeBtnText,
                          selectedRelationType === 'spouse' && styles.relationTypeBtnTextActive,
                        ]}
                      >
                        부부 / 혼인 결연 (0촌)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.relationTypeBtn,
                        selectedRelationType === 'sibling' && styles.relationTypeBtnActive,
                      ]}
                      onPress={() => setSelectedRelationType('sibling')}
                    >
                      <Text
                        style={[
                          styles.relationTypeBtnText,
                          selectedRelationType === 'sibling' && styles.relationTypeBtnTextActive,
                        ]}
                      >
                        형제 / 자매 결연 (2촌)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Live Preview Card */}
                {livePreview && personA && personB && (
                  <View style={styles.livePreviewCard}>
                    <View style={styles.livePreviewHeader}>
                      <Text style={styles.livePreviewTitle}>🔍 관계 형성 실시간 미리보기</Text>
                      <View style={styles.liveChonBadge}>
                        <Text style={styles.liveChonText}>{livePreview.chon}</Text>
                      </View>
                    </View>

                    <View style={styles.livePreviewRow}>
                      <Text style={styles.livePreviewLabel}>
                        • {personA.name}님이 {personB.name}님을 부를 때:
                      </Text>
                      <Text style={styles.livePreviewValue}>{livePreview.titleAtoB}</Text>
                    </View>

                    <View style={styles.livePreviewRow}>
                      <Text style={styles.livePreviewLabel}>
                        • {personB.name}님이 {personA.name}님을 부를 때:
                      </Text>
                      <Text style={styles.livePreviewValue}>{livePreview.titleBtoA}</Text>
                    </View>

                    <View style={styles.livePreviewRow}>
                      <Text style={styles.livePreviewLabel}>• 가계도 상 영향:</Text>
                      <Text style={styles.livePreviewImpact}>{livePreview.impact}</Text>
                    </View>

                    <TouchableOpacity style={styles.executeConnectBtn} onPress={handleCustomConnect}>
                      <Text style={styles.executeConnectBtnText}>
                        🤝 [{personA.name}] ↔ [{personB.name}] 친족 결연 확정
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ======================================================== */}
            {/* TAB 3: MANAGE ESTABLISHED LINKS                          */}
            {/* ======================================================== */}
            {activeTab === 'manage' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionIntro}>
                  현재 앱 내에서 동적으로 형성된 친족 결연 내역입니다. 언제든 결연을 해제하거나 전체 초기화하여 재테스팅할 수 있습니다.
                </Text>

                {establishedLinks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📂</Text>
                    <Text style={styles.emptyText}>아직 새로 형성된 동적 결연이 없습니다.</Text>
                    <Text style={styles.emptySubtext}>
                      [⚡ 1초 퀵 테스트 시나리오] 탭에서 결연을 실행해보세요!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.linkList}>
                    {establishedLinks.map((link) => {
                      const pA = allMembers.find((m) => m.id === link.personAId);
                      const pB = allMembers.find((m) => m.id === link.personBId);
                      const relationName =
                        link.relationType === 'parent_child'
                          ? '부모-자녀'
                          : link.relationType === 'spouse'
                          ? '부부 (혼인)'
                          : link.relationType === 'sibling'
                          ? '형제·자매'
                          : '자녀-부모';

                      return (
                        <View key={link.id} style={styles.linkCard}>
                          <View style={styles.linkCardHeader}>
                            <View style={styles.linkRelationBadge}>
                              <Text style={styles.linkRelationBadgeText}>{relationName}</Text>
                            </View>
                            <Text style={styles.linkDate}>{link.establishedDate}</Text>
                          </View>

                          <View style={styles.linkNamesRow}>
                            <Text style={styles.linkNameA}>{pA?.name || '인물 A'}</Text>
                            <Text style={styles.linkArrow}>↔</Text>
                            <Text style={styles.linkNameB}>{pB?.name || '인물 B'}</Text>
                          </View>

                          <View style={styles.linkActionRow}>
                            <Text style={styles.linkStatus}>✨ 옵시디언 가계도 동적 연결 완료</Text>
                            <TouchableOpacity
                              style={styles.disconnectBtn}
                              onPress={() => onDisconnect(link.id)}
                            >
                              <Text style={styles.disconnectBtnText}>✂️ 결연 해제</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    <TouchableOpacity style={styles.resetAllBtn} onPress={onResetAll}>
                      <Text style={styles.resetAllBtnText}>🔄 모든 결연 초기화 (초기 상태 복원)</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleArea: {
    flex: 1,
    marginRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  toastBanner: {
    backgroundColor: '#047857',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0284c7',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabContent: {
    paddingBottom: 24,
  },
  sectionIntro: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scenarioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  scenarioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scenarioBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  scenarioPreviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  scenarioPreviewLine: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
  },
  runScenarioBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  runScenarioBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  selectorSection: {
    marginBottom: 16,
  },
  selectorSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  searchBar: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  memberChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
    alignItems: 'center',
  },
  memberChipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  memberChipName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  memberChipNameSelected: {
    color: '#ffffff',
  },
  memberChipRel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  memberChipRelSelected: {
    color: '#e0f2fe',
  },
  unconnectedCallout: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  unconnectedCalloutTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  unconnectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unconnectedChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  unconnectedChipSelected: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  unconnectedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  unconnectedChipTextSelected: {
    color: '#ffffff',
  },
  relationTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  relationTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  relationTypeBtnActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  relationTypeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  relationTypeBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  livePreviewCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
    padding: 16,
    marginTop: 8,
  },
  livePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  livePreviewTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#166534',
  },
  liveChonBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveChonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  livePreviewRow: {
    marginBottom: 6,
  },
  livePreviewLabel: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },
  livePreviewValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#14532d',
    marginLeft: 10,
  },
  livePreviewImpact: {
    fontSize: 11,
    color: '#166534',
    marginLeft: 10,
    marginTop: 2,
    lineHeight: 16,
  },
  executeConnectBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  executeConnectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  linkList: {
    gap: 10,
  },
  linkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  linkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkRelationBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linkRelationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  linkDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  linkNamesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  linkNameA: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  linkArrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
  },
  linkNameB: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0284c7',
  },
  linkActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  linkStatus: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700',
  },
  disconnectBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disconnectBtnText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  resetAllBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  resetAllBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
});
