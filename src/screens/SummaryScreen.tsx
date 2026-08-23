import React from 'react';
import {View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView} from 'react-native';
import {MealResult} from '../types';

type Props = {
  result: MealResult;
  imageUri: string;
  onDone: () => void;
};

export default function SummaryScreen({result, imageUri, onDone}: Props) {
  const {summary, foods} = result;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{uri: imageUri}} style={styles.image} />

        <Text style={styles.title}>Meal Summary</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.calories}>{Math.round(summary.calories)} kcal</Text>
          <View style={styles.macroRow}>
            <Macro label="Protein" value={summary.protein} />
            <Macro label="Carbs" value={summary.carbs} />
            <Macro label="Fat" value={summary.fat} />
            <Macro label="Fiber" value={summary.fiber} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detected Items</Text>
        {foods.length === 0 && (
          <Text style={styles.emptyText}>No food items were detected.</Text>
        )}
        {foods.map((food, idx) => (
          <View key={idx} style={styles.foodRow}>
            <Text style={styles.foodName}>{food.food}</Text>
            <Text style={styles.foodGrams}>{Math.round(food.quantity_grams)} g</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({label, value}: {label: string; value: number}) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>{value.toFixed(1)}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  container: {padding: 20, paddingBottom: 40},
  image: {width: '100%', height: 220, borderRadius: 16, marginBottom: 16, backgroundColor: '#eee'},
  title: {fontSize: 24, fontWeight: '800', marginBottom: 16},
  summaryCard: {backgroundColor: '#FF7A00', borderRadius: 20, padding: 20, marginBottom: 24, alignItems: 'center'},
  calories: {color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 12},
  macroRow: {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
  macro: {alignItems: 'center', flex: 1},
  macroValue: {color: '#fff', fontSize: 16, fontWeight: '700'},
  macroLabel: {color: '#fff', fontSize: 12, opacity: 0.9},
  sectionTitle: {fontSize: 18, fontWeight: '700', marginBottom: 10},
  emptyText: {color: '#999', marginBottom: 20},
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodName: {fontSize: 15, fontWeight: '600', textTransform: 'capitalize'},
  foodGrams: {fontSize: 15, color: '#666'},
  doneButton: {marginTop: 30, backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
  doneButtonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});