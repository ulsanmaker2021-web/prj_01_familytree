import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { inkTheme } from '../theme/inkTheme';

export default function PataScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>破打破</Text>
      </View>
      <Text style={styles.title}>무관심 파타</Text>
      <Text style={styles.subtitle}>소원해진 친족과의 인연을 잇고 안부를 챙기는 공간입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: inkTheme.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: inkTheme.accentGold,
    marginBottom: 16,
  },
  badgeText: {
    color: inkTheme.paper,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: inkTheme.ink0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: inkTheme.ink4,
    textAlign: 'center',
    lineHeight: 20,
  },
});
