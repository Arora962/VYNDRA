import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {listMeals} from '../api';
import {Avatar, Card, EmptyState, ErrorNote, H2, MacroRow, MacroSplit, Muted, TickRing} from '../components/ui';
import {colors, DAILY_CALORIE_GOAL} from '../theme';
import type {MealSummary, Totals, User} from '../types';
import {greeting, isToday, mealEmoji, timeOf} from '../utils';

type Props = {
  user: User;
  onSnap: () => void;
  onChat: () => void;
  onSwitch: () => void;
};

export default function HomeScreen({user, onSnap, onChat, onSwitch}: Props) {
  const [meals, setMeals] = useState<MealSummary[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setMeals(await listMeals(user.id));
    } catch (e: any) {
      setMeals([]);
      setError(e?.message ?? 'Could not load meals');
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const today = (meals ?? []).filter(m => isToday(m.created_at));
  const totals: Totals = today.reduce(
    (a, m) => ({
      calories: a.calories + m.calories,
      protein: a.protein + m.protein,
      carbs: a.carbs + m.carbs,
      fat: a.fat + m.fat,
      fiber: a.fiber + m.fiber,
    }),
    {calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0},
  );
  const pct = totals.calories / DAILY_CALORIE_GOAL;
  const left = Math.round(DAILY_CALORIE_GOAL - totals.calories);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }>
        <View style={s.header}>
          <View style={{flex: 1}}>
            <Muted>{greeting()},</Muted>
            <Text style={s.name}>{user.name} 👋</Text>
          </View>
          <Pressable onPress={onSwitch} hitSlop={10}>
            <Avatar name={user.name} size={46} />
          </Pressable>
        </View>

        <Card style={s.hero}>
          <TickRing progress={pct} size={200}>
            <Text style={s.kcal}>{Math.round(totals.calories)}</Text>
            <Muted>of {DAILY_CALORIE_GOAL} kcal</Muted>
            <Text style={[s.left, left < 0 && {color: colors.red}]}>
              {left >= 0 ? `${left} left` : `${-left} over`}
            </Text>
          </TickRing>
          <View style={{width: '100%', marginTop: 20}}>
            <MacroSplit totals={totals} />
            <View style={{height: 12}} />
            <MacroRow totals={totals} />
          </View>
        </Card>

        <Pressable onPress={onSnap} style={({pressed}) => [s.snap, pressed && {opacity: 0.85}]}>
          <Text style={{fontSize: 28}}>📸</Text>
          <View style={{marginLeft: 14, flex: 1}}>
            <Text style={s.snapTitle}>Snap a meal</Text>
            <Text style={s.snapSub}>Identify the dish and get nutrition</Text>
          </View>
          <Text style={{color: colors.bg, fontSize: 26, fontWeight: '900'}}>›</Text>
        </Pressable>

        <Card onPress={onChat} style={s.tip}>
          <Text style={{fontSize: 22}}>💬</Text>
          <Text style={s.tipText}>
            Mention food in a chat — VYNDRA spots it and nudges you to share a photo.
          </Text>
        </Card>

        <H2 style={{marginTop: 26, marginBottom: 12}}>Recent meals</H2>
        {error ? <ErrorNote message={error} onRetry={load} /> : null}
        {meals !== null && meals.length === 0 && !error && (
          <View style={{height: 200}}>
            <EmptyState emoji="🍽️" title="Nothing logged yet" hint="Snap your first meal to see it here." />
          </View>
        )}
        {(meals ?? []).slice(0, 8).map(m => (
          <Card key={m.id} style={s.meal}>
            <Text style={{fontSize: 28}}>{mealEmoji(m.created_at)}</Text>
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={s.mealTitle}>{m.notes || (m.source === 'manual' ? 'Meal' : 'Photo meal')}</Text>
              <Muted>
                {isToday(m.created_at) ? 'Today' : m.created_at.slice(0, 10)} · {timeOf(m.created_at)}
              </Muted>
            </View>
            <Text style={s.mealKcal}>{Math.round(m.calories)}</Text>
            <Text style={s.mealUnit}> kcal</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 20, paddingBottom: 40},
  header: {flexDirection: 'row', alignItems: 'center', marginBottom: 18},
  name: {color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5},
  hero: {alignItems: 'center', paddingVertical: 24},
  kcal: {color: colors.text, fontSize: 44, fontWeight: '900', letterSpacing: -1.5},
  left: {color: colors.green, fontWeight: '800', marginTop: 4},
  snap: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  snapTitle: {color: colors.bg, fontSize: 19, fontWeight: '900'},
  snapSub: {color: colors.bg, opacity: 0.75, fontWeight: '600', marginTop: 2},
  tip: {marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  tipText: {color: colors.sub, flex: 1, lineHeight: 19},
  meal: {flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10},
  mealTitle: {color: colors.text, fontWeight: '800', fontSize: 15},
  mealKcal: {color: colors.accent, fontWeight: '900', fontSize: 18},
  mealUnit: {color: colors.sub, fontSize: 12, fontWeight: '700', marginTop: 3},
});