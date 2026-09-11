import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inkTheme } from '../theme/inkTheme';

interface TabIconProps {
  name: 'Home' | 'Family' | 'Pata' | 'Settings';
  focused: boolean;
  color: string;
  size?: number;
}

export const TabIcon: React.FC<TabIconProps> = ({ name, focused, color, size = 22 }) => {
  let iconName: keyof typeof Ionicons.glyphMap;

  switch (name) {
    case 'Home':
      iconName = focused ? 'git-network' : 'git-network-outline';
      break;
    case 'Family':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'Pata':
      iconName = focused ? 'heart' : 'heart-outline';
      break;
    case 'Settings':
      iconName = focused ? 'settings' : 'settings-outline';
      break;
    default:
      iconName = 'ellipse-outline';
  }

  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={size} color={color} />
      {focused && <View style={styles.dot} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: inkTheme.seal,
    marginTop: 2,
  },
});