import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFamilyStore } from '../hooks/useFamilyStore';
import { DEVICE_PROFILES, DeviceId } from '../utils/mockFamilyData';
import { inkTheme } from '../theme/inkTheme';

export const DeviceSimulatorBar: React.FC = () => {
  const {
    currentDeviceId,
    currentDevice,
    connectedDevices,
    syncProgress,
    connectedCount,
    members,
    allMembers,
    switchDevice,
    toggleDeviceConnection,
    connectAllDevices,
    resetDeviceConnections,
  } = useFamilyStore();

  const [modalVisible, setModalVisible] = useState(false);

  const deviceKeys: DeviceId[] = ['device_A', 'device_B', 'device_C', 'device_D'];

  return (
    <View style={styles.wrapper}>
      {/* Device Switcher Horizontal Bar */}
      <View style={styles.topContainer}>
        <View style={styles.headerLabelRow}>
          <Text style={styles.sectionTitle}>📱 가상 스마트폰 4대 시뮬레이터</Text>
          <TouchableOpacity
            style={styles.syncStatusButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.syncStatusButtonText}>
              🔗 족보 연동 ${syncProgress}% (${members.length}/${allMembers.length}명)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4 Device Switch Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deviceList}
        >
          {deviceKeys.map((devId) => {
            const profile = DEVICE_PROFILES[devId];
            const isActive = currentDeviceId === devId;
            const isConnected = connectedDevices[devId];

            return (
              <TouchableOpacity
                key={devId}
                style={[
                  styles.deviceTab,
                  isActive && styles.deviceTabActive,
                  { borderColor: isActive ? profile.color : inkTheme.ink7 },
                ]}
                onPress={() => switchDevice(devId)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.deviceAvatar,
                    { backgroundColor: profile.color },
                  ]}
                >
                  <Text style={styles.deviceAvatarText}>
                    {profile.avatarText}
                  </Text>
                </View>

                <View style={styles.deviceInfo}>
                  <View style={styles.deviceTitleRow}>
                    <Text
                      style={[
                        styles.deviceTitle,
                        isActive && styles.deviceTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {profile.title.replace('스마트폰 ', '')}
                    </Text>
                    {isConnected ? (
                      <View style={styles.connectedDot} />
                    ) : (
                      <View style={styles.disconnectedDot} />
                    )}
                  </View>
                  <Text style={styles.deviceOwnerRelation} numberOfLines={1}>
                    {profile.ownerRelation}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Device Info Banner */}
        <View style={styles.activeBanner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerDeviceTag}>현재 폰</Text>
            <Text style={styles.bannerOwnerName}>
              {currentDevice.ownerName} ({currentDevice.ownerRelation})
            </Text>
          </View>
          <Text style={styles.bannerDesc} numberOfLines={1}>
            {currentDevice.desc}
          </Text>
        </View>
      </View>

      {/* Interactive 4-Device Connection Simulator Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>친족 족보 상호 연동 시뮬레이터</Text>
                <Text style={styles.modalSubtitle}>
                  가상 스마트폰 4대간 상호 승인을 통해 족보를 완성해 보세요.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sync Progress Visual Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  통합 족보 완성도 (${connectedCount}/4 기기 연동)
                </Text>
                <Text style={styles.progressValueText}>${syncProgress}% 완성</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${syncProgress}%`,
                      backgroundColor:
                        syncProgress === 100
                          ? inkTheme.accentPine
                          : syncProgress >= 50
                          ? inkTheme.accentGold
                          : inkTheme.accentRed,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>
                {syncProgress === 100
                  ? '✨ 축하합니다! 4대 친족의 모든 가계도가 100% 하나로 완벽히 통합되었습니다!'
                  : syncProgress === 75
                  ? '🌿 3대 기기가 연동되었습니다. 나머지 1대 기기도 연결해 보세요.'
                  : syncProgress === 50
                  ? '🌾 2대 기기가 연동되어 친족 범위가 확장되었습니다.'
                  : '🔒 현재 1대 기기 단독 상태입니다. 다른 기기와 상호 연동을 승인해 보세요.'}
              </Text>
            </View>

            {/* Device Connection Cards List */}
            <ScrollView style={styles.deviceCardList} showsVerticalScrollIndicator={false}>
              {deviceKeys.map((devId) => {
                const profile = DEVICE_PROFILES[devId];
                const isConnected = connectedDevices[devId];
                const isCurrent = currentDeviceId === devId;

                return (
                  <View
                    key={devId}
                    style={[
                      styles.deviceDetailCard,
                      isConnected && styles.deviceDetailCardConnected,
                      isCurrent && styles.deviceDetailCardCurrent,
                    ]}
                  >
                    <View style={styles.cardLeftCol}>
                      <View
                        style={[
                          styles.cardAvatar,
                          { backgroundColor: profile.color },
                        ]}
                      >
                        <Text style={styles.cardAvatarText}>
                          {profile.avatarText}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardMiddleCol}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardDeviceTitle}>
                          {profile.title}
                        </Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>현재 폰</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.cardOwnerText}>
                        소유자: {profile.ownerName} ({profile.ownerRelation})
                      </Text>

                      <Text style={styles.cardDescText}>
                        {profile.desc}
                      </Text>

                      <Text style={styles.cardMembersCount}>
                        보유 친족: {profile.initialMemberIds.length}명
                      </Text>
                    </View>

                    <View style={styles.cardRightCol}>
                      <TouchableOpacity
                        style={[
                          styles.connectToggleBtn,
                          isConnected
                            ? styles.connectToggleBtnActive
                            : styles.connectToggleBtnInactive,
                        ]}
                        onPress={() => toggleDeviceConnection(devId)}
                      >
                        <Text
                          style={[
                            styles.connectToggleBtnText,
                            isConnected && styles.connectToggleBtnTextActive,
                          ]}
                        >
                          {isConnected ? '✓ 연결됨' : '+ 연동'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Quick Action Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.connectAllBtn}
                onPress={() => connectAllDevices()}
              >
                <Text style={styles.connectAllBtnText}>
                  ⚡ 4대 전체 즉시 연결 (100% 완성)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => resetDeviceConnections()}
              >
                <Text style={styles.resetBtnText}>
                  🔄 초기 단절 상태로 분리
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: inkTheme.paperDark,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: inkTheme.ink3,
    letterSpacing: 0.3,
  },
  syncStatusButton: {
    backgroundColor: inkTheme.ink0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncStatusButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  deviceList: {
    gap: 8,
    paddingVertical: 2,
  },
  deviceTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: inkTheme.paper,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
    minWidth: 135,
  },
  deviceTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: inkTheme.ink0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deviceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink2,
  },
  deviceTitleActive: {
    color: inkTheme.ink0,
    fontWeight: '900',
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: inkTheme.accentPine,
  },
  disconnectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: inkTheme.ink6,
  },
  deviceOwnerRelation: {
    fontSize: 10,
    color: inkTheme.ink4,
    marginTop: 1,
  },
  activeBanner: {
    marginTop: 8,
    backgroundColor: inkTheme.paper,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerDeviceTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    backgroundColor: inkTheme.seal,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannerOwnerName: {
    fontSize: 12,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  bannerDesc: {
    fontSize: 11,
    color: inkTheme.ink3,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 13, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: inkTheme.paper,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: inkTheme.ink7,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
    backgroundColor: inkTheme.paperDark,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: inkTheme.ink0,
  },
  modalSubtitle: {
    fontSize: 11,
    color: inkTheme.ink4,
    marginTop: 3,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: inkTheme.paper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: inkTheme.ink7,
  },
  closeBtnText: {
    fontSize: 14,
    color: inkTheme.ink3,
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: inkTheme.ink8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: inkTheme.ink2,
  },
  progressValueText: {
    fontSize: 13,
    fontWeight: '900',
    color: inkTheme.accentPine,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: inkTheme.ink8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    color: inkTheme.ink3,
    marginTop: 6,
    lineHeight: 15,
  },
  deviceCardList: {
    padding: 16,
    maxHeight: 320,
  },
  deviceDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: inkTheme.paperDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: inkTheme.ink8,
  },
  deviceDetailCardConnected: {
    backgroundColor: '#ffffff',
    borderColor: inkTheme.accentPine,
  },
  deviceDetailCardCurrent: {
    borderWidth: 1.5,
  },
  cardLeftCol: {
    marginRight: 10,
  },
  cardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  cardMiddleCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDeviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: inkTheme.ink0,
  },
  currentBadge: {
    backgroundColor: inkTheme.seal,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  cardOwnerText: {
    fontSize: 11,
    fontWeight: '600',
    color: inkTheme.ink2,
    marginTop: 2,
  },
  cardDescText: {
    fontSize: 10,
    color: inkTheme.ink4,
    marginTop: 2,
  },
  cardMembersCount: {
    fontSize: 10,
    fontWeight: '700',
    color: inkTheme.accentGold,
    marginTop: 3,
  },
  cardRightCol: {
    marginLeft: 8,
  },
  connectToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  connectToggleBtnActive: {
    backgroundColor: '#e6f4ea',
    borderColor: inkTheme.accentPine,
  },
  connectToggleBtnInactive: {
    backgroundColor: inkTheme.paperDark,
    borderColor: inkTheme.ink6,
  },
  connectToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: inkTheme.ink3,
  },
  connectToggleBtnTextActive: {
    color: inkTheme.accentPine,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: inkTheme.ink8,
    backgroundColor: inkTheme.paperDark,
    gap: 8,
  },
  connectAllBtn: {
    backgroundColor: inkTheme.accentPine,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectAllBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  resetBtn: {
    backgroundColor: inkTheme.paper,
    borderWidth: 1,
    borderColor: inkTheme.ink6,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetBtnText: {
    color: inkTheme.ink3,
    fontSize: 12,
    fontWeight: '700',
  },
});
