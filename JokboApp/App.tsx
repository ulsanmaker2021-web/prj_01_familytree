import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from './src/screens/HomeScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import PataScreen from './src/screens/PataScreen';
import SettingsScreen from './src/screens/SettingsScreen';
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
              fontWeight: '700',
              fontSize: 18,
            },
            headerTitleAlign: 'center',
            tabBarStyle: {
              backgroundColor: inkTheme.paperDark,
              borderTopColor: inkTheme.ink8,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarActiveTintColor: inkTheme.seal,
            tabBarInactiveTintColor: inkTheme.ink5,
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: string;

              switch (route.name) {
                case 'Home':
                  iconName = focused ? 'git-network' : 'git-network-outline';
                  break;
                case 'Family':
                  iconName = focused ? 'people' : 'people-outline';
                  break;
                case 'Pata':
                  iconName = focused ? 'flame' : 'flame-outline';
                  break;
                case 'Settings':
                  iconName = focused ? 'settings' : 'settings-outline';
                  break;
                default:
                  iconName = 'help-circle-outline';
              }

              return <Ionicons name={iconName} size={size ?? 22} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '族譜 트리',
              tabBarLabel: '홈',
            }}
          />
          <Tab.Screen
            name="Family"
            component={FamilyScreen}
            options={{
              title: '가족 (구성원 목록)',
              tabBarLabel: '가족',
            }}
          />
          <Tab.Screen
            name="Pata"
            component={PataScreen}
            options={{
              title: '무관심 파타',
              tabBarLabel: '파타',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '설정',
              tabBarLabel: '설정',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
