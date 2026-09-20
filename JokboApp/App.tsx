import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import PataScreen from './src/screens/PataScreen';
import GenealogyMasterScreen from './src/screens/GenealogyMasterScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { TabIcon } from './src/components/TabIcon';
import { inkTheme } from './src/theme/inkTheme';
import { useAuthStore } from './src/hooks/useAuthStore';
import { SecurityLoginModal } from './src/components/SecurityLoginModal';

export type RootTabParamList = {
  Home: undefined;
  Family: undefined;
  Pata: undefined;
  GenealogyMaster: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const {
    currentUser,
    isAuthenticated,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
  } = useAuthStore();
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Home"
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: inkTheme.paper,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: inkTheme.ink8,
            },
            headerTitleStyle: {
              color: inkTheme.ink0,
              fontWeight: '800',
              fontSize: 17,
              letterSpacing: 0.5,
            },
            headerTitleAlign: 'center',
            headerRight: () => (
              <TouchableOpacity
                onPress={openLoginModal}
                style={{
                  marginRight: 14,
                  backgroundColor: '#0f172a',
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#38bdf8',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '800' }}>
                  🛡️ {currentUser.name} [{currentUser.roleLabel.split(' ')[0]}]
                </Text>
              </TouchableOpacity>
            ),
            tabBarStyle: {
              backgroundColor: inkTheme.paperDark,
              borderTopColor: inkTheme.ink8,
              borderTopWidth: 1,
              height: 62,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarActiveTintColor: inkTheme.seal,
            tabBarInactiveTintColor: inkTheme.ink5,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              marginTop: 2,
            },
            tabBarIcon: ({ focused, color, size }) => {
              return (
                <TabIcon
                  name={route.name as keyof RootTabParamList}
                  focused={focused}
                  color={color}
                  size={size ?? 22}
                />
              );
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '가계도 (디지털 족보 트리)',
              tabBarLabel: '가계도',
            }}
          />
          <Tab.Screen
            name="Family"
            component={FamilyScreen}
            options={{
              title: '친족 구성원 명부',
              tabBarLabel: '친족 명부',
            }}
          />
          <Tab.Screen
            name="Pata"
            component={PataScreen}
            options={{
              title: '무관심 타파 (친족 안부 챙김)',
              tabBarLabel: '안부 챙김',
            }}
          />
          <Tab.Screen
            name="GenealogyMaster"
            component={GenealogyMasterScreen}
            options={{
              title: '성씨별 족보 마스터 검증 센터',
              tabBarLabel: '족보 마스터',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '설정 및 데이터 관리',
              tabBarLabel: '설정',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* 4-Tier Security Gate & Authentication Modal */}
      <SecurityLoginModal
        visible={isLoginModalOpen || !isAuthenticated}
        onClose={closeLoginModal}
      />
    </SafeAreaProvider>
  );
}