import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, SafeAreaView} from 'react-native';

type Props = {
  onScanPress: () => void;
};

export default function HomeScreen({onScanPress}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>VYNDRA</Text>
        <Text style={styles.subtitle}>Intelligence behind every bite.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Intake</Text>
          <Text style={styles.cardValue}>0%</Text>
          <Text style={styles.cardHint}>Scan a meal to get started</Text>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={onScanPress}>
          <Text style={styles.scanButtonText}>📷  Scan a Meal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  container: {flex: 1, padding: 24, justifyContent: 'center'},
  title: {fontSize: 34, fontWeight: '800', textAlign: 'center', color: '#1a1a1a'},
  subtitle: {fontSize: 14, textAlign: 'center', color: '#888', marginBottom: 32},
  card: {
    backgroundColor: '#FF7A00',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  cardTitle: {color: '#fff', fontSize: 14, opacity: 0.9},
  cardValue: {color: '#fff', fontSize: 42, fontWeight: '800', marginVertical: 4},
  cardHint: {color: '#fff', fontSize: 12, opacity: 0.85},
  scanButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanButtonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});