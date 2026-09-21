import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { FamilyMember } from '../types/family';
import { inkTheme } from '../theme/inkTheme';
import { formatPhoneNumber, stripPhoneNumber } from '../utils/securityAuth';

interface EditMemberInfoModalProps {
  visible: boolean;
  member: FamilyMember | null;
  onClose: () => void;
  onSave: (updatedMember: FamilyMember) => void;
}

export const EditMemberInfoModal: React.FC<EditMemberInfoModalProps> = ({
  visible,
  member,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [hanja, setHanja] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLunar, setIsLunar] = useState(false);
  const [isAlive, setIsAlive] = useState(true);
  const [deathDate, setDeathDate] = useState('');
  const [burialSite, setBurialSite] = useState('');
  const [phone, setPhone] = useState('');
  const [clan, setClan] = useState('');
  const [memo, setMemo] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setHanja(member.hanja || '');
      setBirthDate(member.birthDate || '');
      setIsLunar(Boolean(member.lunarBirth));
      setIsAlive(member.isAlive !== false);
      setDeathDate(member.deathDate || '');
      setBurialSite(member.burialSite || '');
      setPhone(member.phone || '');
      setClan(member.clan || '');
      setMemo(member.memo || '');
      setErrorMessage(null);
    }
  }, [member, visible]);

  if (!member) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('성명을 입력해주세요.');
      return;
    }

    const updated: FamilyMember = {
      ...member,
      name: name.trim(),
      hanja: hanja.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      lunarBirth: isLunar,
      isAlive,
      deathDate: !isAlive && deathDate.trim() ? deathDate.trim() : undefined,
      burialSite: !isAlive && burialSite.trim() ? burialSite.trim() : undefined,
      phone: isAlive && phone.trim() ? stripPhoneNumber(phone.trim()) : undefined,
      clan: clan.trim() || member.clan,
      memo: memo.trim() || undefined,
    };

    onSave(updated);
    onClose();
  };

  const isParentOrAncestor =
    member.relationship.includes('부') ||
    member.relationship.includes('모') ||
    member.relationship.includes('아버지') ||
    member.relationship.includes('어머니') ||
    member.generation <= 2;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                ✏️ {member.name} ({member.relationship}) 정보 수정
              </Text>
              <Text style={styles.headerSubtitle}>
                {isParentOrAncestor
                  ? '직계 자손으로서 부모·선조의 인적 사항 및 작고(기일·장지) 정보를 직접 관리합니다.'
                  : '가계도에 등재된 인물의 기본 정보를 수정합니다.'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. 성명 및 한자 */}
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>
                  성명 (한글) <Text style={styles.reqStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setErrorMessage(null);
                  }}
                  placeholder="예: 최현호"
                  placeholderTextColor={inkTheme.ink5}
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>한자 성명</Text>
                <TextInput
                  style={styles.input}
                  value={hanja}
                  onChangeText={setHanja}
                  placeholder="예: 崔顯鎬"
                  placeholderTextColor={inkTheme.ink5}
                />
              </View>
            </View>

            {/* 2. 생년월일 & 음력/양력 */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>생년월일</Text>
                <View style={styles.lunarToggleGroup}>
                  <TouchableOpacity
                    style={[styles.lunarBtn, !isLunar && styles.lunarBtnActive]}
                    onPress={() => setIsLunar(false)}
                  >
                    <Text style={[styles.lunarBtnText, !isLunar && styles.lunarBtnTextActive]}>
                      양력
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.lunarBtn, isLunar && styles.lunarBtnActive]}
                    onPress={() => setIsLunar(true)}
                  >
                    <Text style={[styles.lunarBtnText, isLunar && styles.lunarBtnTextActive]}>
                      음력
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD (예: 1942-01-15)"
                placeholderTextColor={inkTheme.ink5}
              />
            </View>

            {/* 3. 생존 여부 스위치 (생존 vs 작고) */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                생존 여부 <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.lifeStatusToggleRow}>
                <TouchableOpacity
                  style={[styles.lifeStatusBtn, isAlive && styles.lifeStatusBtnAlive]}
                  onPress={() => setIsAlive(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.lifeStatusBtnText, isAlive && styles.lifeStatusBtnTextAlive]}
                  >
                    🌿 생존 (현재 생존)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.lifeStatusBtn, !isAlive && styles.lifeStatusBtnDeceased]}
                  onPress={() => setIsAlive(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.lifeStatusBtnText, !isAlive && styles.lifeStatusBtnTextDeceased]}
                  >
                    🕊️ 작고 (별세 / 선조)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. 작고(사망) 시 추가 정보 필드 (기일, 묘소/봉안당) */}
            {!isAlive ? (
              <View style={styles.deceasedDetailBox}>
                <View style={styles.deceasedDetailHeader}>
                  <Text style={styles.deceasedDetailTitle}>🕯️ 작고 및 기일(忌日)·장지 기록</Text>
                  <Text style={styles.deceasedDetailNotice}>
                    자손들이 제례 및 명절 안부를 기릴 수 있도록 정확히 기록합니다.
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>사망일자 (기일 忌日)</Text>
                  <TextInput
                    style={styles.input}
                    value={deathDate}
                    onChangeText={setDeathDate}
                    placeholder="YYYY-MM-DD (예: 2018-10-15)"
                    placeholderTextColor={inkTheme.ink5}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.subLabel}>묘소 / 봉안당 위치 (선산 장지)</Text>
                  <TextInput
                    style={styles.input}
                    value={burialSite}
                    onChangeText={setBurialSite}
                    placeholder="예: 경기도 용인시 처인구 선영 제2묘원 / 국립현충원"
                    placeholderTextColor={inkTheme.ink5}
                  />
                </View>
              </View>
            ) : (
              /* 생존 시 연락처 */
              <View style={styles.formSection}>
                <Text style={styles.label}>연락처 (휴대전화)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="하이픈 없이 숫자만 입력 (예: 01012345678)"
                  placeholderTextColor={inkTheme.ink5}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            {/* 5. 본관 및 계파 */}
            <View style={styles.formSection}>
              <Text style={styles.label}>본관 및 계파</Text>
              <TextInput
                style={styles.input}
                value={clan}
                onChangeText={setClan}
                placeholder="예: 경주 김씨 판도판서공파"
                placeholderTextColor={inkTheme.ink5}
              />
            </View>

            {/* 6. 유훈, 추모 비고 및 가문 기록 */}
            <View style={styles.formSection}>
              <Text style={styles.label}>
                {!isAlive ? '유훈 및 추모 기록 (비고)' : '가문 비고 및 소개 메모'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={memo}
                onChangeText={setMemo}
                placeholder={
                  !isAlive
                    ? '고인의 유훈, 묘비명, 문중 공헌 내역 등을 자유롭게 기록하세요.'
                    : '가문 족보 비고 또는 인물 소개'
                }
                placeholderTextColor={inkTheme.ink5}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>💾 변경 내용 저장</Text>
            </TouchableOpacity>
          </View>
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
    zIndex: 9999,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: inkTheme.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: inkTheme.ink1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: inkTheme.ink4,
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formCol: {
    flex: 1,
  },
  formSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: inkTheme.ink2,
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: inkTheme.ink3,
    marginBottom: 4,
  },
  reqStar: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: inkTheme.ink1,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  lunarToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 2,
  },
  lunarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  lunarBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  lunarBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: inkTheme.ink4,
  },
  lunarBtnTextActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  lifeStatusToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lifeStatusBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: inkTheme.ink7,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  lifeStatusBtnAlive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  lifeStatusBtnDeceased: {
    backgroundColor: '#2e2e2a',
    borderColor: '#1c1917',
  },
  lifeStatusBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  lifeStatusBtnTextAlive: {
    color: '#047857',
  },
  lifeStatusBtnTextDeceased: {
    color: '#fafaf9',
  },
  deceasedDetailBox: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  deceasedDetailHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
    paddingBottom: 8,
  },
  deceasedDetailTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#44403c',
  },
  deceasedDetailNotice: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },
  fieldGroup: {
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: inkTheme.paperDark,
    borderTopWidth: 1,
    borderTopColor: inkTheme.ink8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: inkTheme.ink7,
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: inkTheme.ink3,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
