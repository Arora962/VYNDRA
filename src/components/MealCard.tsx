import React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {Card, MacroRow, Muted, Pill} from './ui';
import {colors} from '../theme';
import type {Analysis, FoodItem} from '../types';

export const titleCase = (s: string) =>
  s.replace(/\b\w/g, c => c.toUpperCase());

export function confidenceLabel(f: FoodItem): {text: string; color: string} | null {
  if (f.confidence === null) {
    return null;
  }
  const pct = Math.round(f.confidence * 100);
  if (f.low_confidence || f.confidence < 0.3) {
    return {text: `${pct}% · unsure`, color: colors.yellow};
  }
  return {text: `${pct}% sure`, color: colors.green};
}

export function FoodRow({food}: {food: FoodItem}) {
  const conf = confidenceLabel(food);
  const missing = food.found === false || food.needs_manual_selection;
  return (
    <View style={s.row}>
      <View style={{flex: 1}}>
        <Text style={s.name}>{titleCase(food.food)}</Text>
        <View style={{flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap'}}>
          {conf && <Pill label={conf.text} color={conf.color} />}
          {food.match_type === 'family' && <Pill label="similar dish" color={colors.blue} />}
          {food.default_portion && <Pill label="default 100 g" color={colors.violet} />}
          {missing && <Pill label="no nutrition data" color={colors.red} />}
        </View>
      </View>
      <Text style={s.grams}>{Math.round(food.quantity_grams)} g</Text>
    </View>
  );
}

/** Compact analysis card, used inside chat bubbles and on the Home screen. */
export function MealCard({meal}: {meal: Analysis}) {
  const foods = meal.foods.filter(f => f.found !== false);
  return (
    <Card style={{padding: 12, backgroundColor: colors.surface2}}>
      <Text style={s.kcal}>
        {Math.round(meal.summary.calories)}
        <Text style={s.kcalUnit}> kcal</Text>
      </Text>
      <Muted style={{marginBottom: 10}}>
        {foods.length ? foods.map(f => titleCase(f.food)).join(' · ') : 'Needs manual selection'}
      </Muted>
      <MacroRow totals={meal.summary} />
      {meal.low_confidence && (
        <Muted style={{marginTop: 8, color: colors.yellow}}>
          ⚠ The model is not very sure about this dish.
        </Muted>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  name: {color: colors.text, fontSize: 16, fontWeight: '800'},
  grams: {color: colors.sub, fontWeight: '700', fontSize: 15, marginLeft: 12},
  kcal: {color: colors.accent, fontSize: 32, fontWeight: '900'},
  kcalUnit: {fontSize: 14, color: colors.sub, fontWeight: '700'},
});