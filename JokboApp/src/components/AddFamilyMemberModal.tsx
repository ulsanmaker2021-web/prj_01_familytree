import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FamilyMember, LineageType } from '../types/family';
import { getHanjaCandidates } from '../utils/koreanHanjaHelper';
import { inkTheme } from '../theme/inkTheme';

interface AddFamilyMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMember: (member: FamilyMember) => void;
  currentUserClan?: string;
  selfMemberId: string;
  selfParents?: string[];
  selfSpouseId?: string;
}

type RelativeCategory =
  | 'child_son'
  | 'child_daughter'
  | 'spouse_wife'
  | 'spouse_husband'
  | 'sibling_brother'
  | 'sibling_sister'
  | 'parent_father'
  | 'parent_mother';

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  visible,
  onClose,
  onAddMember,
  currentUserClan = '경주 최씨',
  selfMemberId,
  selfParents = [],
  selfSpouseId,
}) => {
  const [category, setCategory] = useState<RelativeCategory>('child_son');
  const [name, setName] = useState('');
  const [hanja, setHanja] = useState('');
  const [clan, setClan] = useState(currentUserClan);
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [achievements, setAchievements] = useState('');
  const [memo, setMemo] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAutoHanja = () => {
    if (!name.trim()) {
      showToast('이름(한글)을 먼저 입력해주세요.');
      return;
    }
    const chars = name.trim().split('');
    let result = '';
    for (const c of chars) {
      const candidates = getHanjaCandidates(c);
      if (candidates.length > 0) {
        result += candidates[0].hanja;
      } else {
        result += c;
      }
    }
    setHanja(result);
    showToast(`'${result}' 한자가 추천되었습니다.`);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast('이름(실명)을 입력해주세요.');
      return;
    }

    let gender: 'M' | 'F' = 'M';
    let generation = 3;
    let lineage: LineageType = 'paternal';
    let relationship = '가족';
    let parentIds: string[] | undefined = undefined;
    let spouseId: string | undefined = undefined;

    switch (category) {
      case 'child_son':
        gender = 'M';
        generation = 4;
        relationship = '아들 (자녀)';
        parentIds = selfSpouseId ? [selfMemberId, selfSpouseId] : [selfMemberId];
        break;
      case 'child_daughter':
        gender = 'F';
        generation = 4;
        relationship = '딸 (자녀)';
        parentIds = selfSpouseId ? [selfMemberId, selfSpouseId] : [selfMemberId];
        break;
      case 'spouse_wife':
        gender = 'F';
        generation = 3;
        relationship = '배우자 (아내)';
        lineage = 'inlaw_paternal';
        spouseId = selfMemberId;
        break;
      case 'spouse_husband':
        gender = 'M';
        generation = 3;
        relationship = '배우자 (남편)';
        spouseId = selfMemberId;
        break;
      case 'sibling_brother':
        gender = 'M';
        generation = 3;
        relationship = '형제 (형/동생)';
        parentIds = selfParents.length > 0 ? [...selfParents] : undefined;
        break;
      case 'sibling_sister':
        gender = 'F';
        generation = 3;
        relationship = '자매 (누나/동생)';
        parentIds = selfParents.length > 0 ? [...selfParents] : undefined;
        break;
      case 'parent_father':
        gender = 'M';
        generation = 2;
        relationship = '부 (아버지)';
        break;
      case 'parent_mother':
        gender = 'F';
        generation = 2;
        relationship = '모 (어머니)';
        lineage = 'maternal';
        break;
    }

    const newMember: FamilyMember = {
      id: `custom-mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      hanja: hanja.trim() || undefined,
      gender,
      generation,
      lineage,
      relationship,
      clan: clan.trim() || currentUserClan,
      birthDate: birthDate.trim() || undefined,
      isAlive,
      phone: phone.trim() || undefined,
      parentIds,
      spouseId,
      achievements: achievements.trim() ? [achievements.trim()] : undefined,
      memo: memo.trim() || undefined,
      clanGeneration: generation === 4 ? 31 : generation === 3 ? 30 : 29,
      descendantOrder: generation === 4 ? 30 : generation === 3 ? 29 : 28,
      isVerifiedLineage: true,
    };

    onAddMember(newMember);

    // Reset form
    setName('');
    setHanja('');
    setBirthDate('');
    setPhone('');
    setAchievements('');
    setMemo('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={{ fontSize: 20 }}>🌿</Text>
              <View>
                <Text style={styles.headerTitle}>가족 구성원 추가 (족보 등재)</Text>
                <Text style={styles.headerSub}>
                  본인 가계도에 배우자, 자녀, 형제자매 등 직계 가족을 등재합니다.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {toastMessage && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* 1. 관계 선택 (Relationship Category) */}
            <Text style={styles.fieldLabel}>가족 관계 (호칭) <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={[styles.categoryPill, category === 'child_son' && styles.categoryPillActive]}
                onPress={() => setCategory('child_son')}
              >
                <Text style={[styles.categoryPillText, category === 'child_son' && styles.categoryPillTextActive]}>
                  👶 아들 (자녀)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryPill, category === 'child_daughter' && styles.categoryPillActive]}
                onPress={() => setCategory('child_daughter')}
              >
                <Text style={[styles.categoryPillText, category === 'child_daughter' && styles.categoryPillTextActive]}>
                  👧 딸 (자녀)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryPill, category === 'spouse_wife' && styles.categoryPillActive]}
                onPress={() => setCategory('spouse_wife')}
              >
                <Text style={[styles.categoryPillText, category === 'spouse_wife' && styles.categoryPillTextActive]}>
                  💍 아내 (배우자)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryPill, category === 'spouse_husband' && styles.categoryPillActive]}
                onPress={() => setCategory('spouse_husband')}
              >
                <Text style={[styles.categoryPillText, category === 'spouse_husband' && styles.categoryPillTextActive]}>
                  🤵 남편 (배우자)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryPill, category === 'sibling_brother' && styles.categoryPillActive]}
                onPress={() => setCategory('sibling_brother')}
              >
                <Text style={[styles.categoryPillText, category === 'sibling_brother' && styles.categoryPillTextActive]}>
                  👦 형제 (형/동생)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryPill, category === 'sibling_sister' && styles.categoryPillActive]}
                onPress={() => setCategory('sibling_sister')}
              >
                <Text style={[styles.categoryPillText, category === 'sibling_sister' && styles.categoryPillTextActive]}>
                  👧 자매 (누나/동생)
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. 이름 & 한자 */}
            <View style={styles.formRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>이름 (실명) <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="예: 최서우"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.fieldLabel}>한자 성명 (선택)</Text>
                  <TouchableOpacity onPress={handleAutoHanja} activeOpacity={0.7}>
                    <Text style={{ fontSize: 11, color: '#0284c7', fontWeight: '800' }}>⚡ 자동 변환</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={hanja}
                  onChangeText={setHanja}
                  placeholder="예: 崔瑞佑"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* 3. 본관 & 생년월일 */}
            <View style={styles.formRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>가문 본관</Text>
                <TextInput
                  style={styles.input}
                  value={clan}
                  onChangeText={setClan}
                  placeholder="예: 경주 최씨"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>생년월일 (선택)</Text>
                <TextInput
                  style={styles.input}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="예: 2018-05-20"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* 4. 연락처 & 생존 여부 */}
            <View style={styles.formRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>연락처 (선택)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="010-0000-0000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>생존 여부</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                  <TouchableOpacity
                    style={[styles.aliveBtn, isAlive && styles.aliveBtnActive]}
                    onPress={() => setIsAlive(true)}
                  >
                    <Text style={[styles.aliveBtnText, isAlive && styles.aliveBtnTextActive]}>
                      🟢 생존
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.aliveBtn, !isAlive && styles.aliveBtnActive]}
                    onPress={() => setIsAlive(false)}
                  >
                    <Text style={[styles.aliveBtnText, !isAlive && styles.aliveBtnTextActive]}>
                      ⚪ 작고 (선대)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 5. 주요 약력 / 업적 */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>주요 약력 / 직함 / 업적 (거실 액자형 가계도 노출)</Text>
              <TextInput
                style={styles.input}
                value={achievements}
                onChangeText={setAchievements}
                placeholder="예: 가문 31세손, 신지식인 선정, 대학교 재학 등"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>🌿 가문 족보에 가족 구성원 등재 완료 ➔</Text>
            </TouchableOpacity>
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  toastBox: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  categoryPillActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#0369a1',
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  aliveBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  aliveBtnActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  aliveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  aliveBtnTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
