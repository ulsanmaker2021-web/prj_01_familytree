import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { inkTheme } from '../theme/inkTheme';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>設定</Text>
      </View>
      <Text style={styles.title}>설정</Text>
      <Text style={styles.subtitle}>족보 동기화, 계정 보안 및 환경 설정 화면입니다.</Text>
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
    backgroundColor: inkTheme.ink3,
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
