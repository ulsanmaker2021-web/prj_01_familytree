import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import PataScreen from './src/screens/PataScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { TabIcon } from './src/components/TabIcon';
import { inkTheme } from './src/theme/inkTheme';

export type RootTabParamList = {
  Home: undefined;
  Family: undefined;
  Pata: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
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
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '설정 및 데이터 관리',
              tabBarLabel: '설정',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}