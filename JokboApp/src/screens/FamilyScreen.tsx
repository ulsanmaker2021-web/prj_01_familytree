import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { inkTheme } from '../theme/inkTheme';

export default function FamilyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>家族</Text>
      </View>
      <Text style={styles.title}>구성원 목록</Text>
      <Text style={styles.subtitle}>등록된 가족 및 일가 친척 명부입니다.</Text>
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
    backgroundColor: inkTheme.accentPine,
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
