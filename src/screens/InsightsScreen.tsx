import React, {useCallback, useEffect, useState} from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getInsights} from '../api';
import {Bar, BarChart, Card, EmptyState, ErrorNote, H1, H2, MacroRow, MacroSplit, Muted, Loading} from '../components/ui';
import {colors, DAILY_CALORIE_GOAL} from '../theme';
import type {Insights, User} from '../types';

export default function InsightsScreen({user}: {user: User}) {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await getInsights(user.id));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load insights');
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  const last7 = (data?.daily ?? []).slice(-7);
  const fit = data?.diet_fit;
  const hasData = !!data && (last7.length > 0 || data.weekly.calories > 0);

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
        <H1>Insights</H1>
        <Muted style={{marginBottom: 18}}>Your eating patterns, from the meals you've snapped.</Muted>

        {error ? <ErrorNote message={error} onRetry={load} /> : null}
        {!data && !error && (
          <View style={{height: 300}}>
            <Loading />
          </View>
        )}
        {data && !hasData && !error && (
          <View style={{height: 300}}>
            <EmptyState emoji="📊" title="No data yet" hint="Log a few meals and your weekly charts will appear here." />
          </View>
        )}

        {data && hasData && (
          <>
            <Card>
              <H2>Calories this week</H2>
              <View style={{height: 14}} />
              <BarChart
                data={last7.map(d => ({label: d.label, value: d.calories}))}
                goal={DAILY_CALORIE_GOAL}
                unit="kcal"
              />
            </Card>

            <Card style={{marginTop: 14}}>
              <H2>Week at a glance</H2>
              <View style={s.stats}>
                <Stat label="Total kcal" value={Math.round(data.weekly.calories).toString()} />
                <Stat label="Avg / day" value={Math.round(data.weekly.avg_daily_calories).toString()} />
                <Stat label="Meals" value={data.weekly.meals ? String(data.weekly.meals) : '–'} />
              </View>
              <MacroSplit totals={data.weekly} />
              <View style={{height: 12}} />
              <MacroRow totals={data.weekly} />
              <Muted style={{marginTop: 10, fontSize: 12}}>
                Bar shows how your protein, carbs and fat grams split.
              </Muted>
            </Card>

            {fit && (fit.score !== null || fit.label || fit.notes.length > 0) && (
              <Card style={{marginTop: 14}}>
                <H2>Diet fit{fit.label ? ` · ${fit.label}` : ''}</H2>
                {fit.score !== null && (
                  <View style={{marginTop: 12}}>
                    <Text style={s.score}>
                      {Math.round(fit.score)}
                      <Text style={s.scoreUnit}>%</Text>
                    </Text>
                    <Bar value={fit.score / 100} color={fit.score >= 70 ? colors.green : fit.score >= 40 ? colors.yellow : colors.red} />
                  </View>
                )}
                {fit.notes.map((n, i) => (
                  <Text key={i} style={s.note}>
                    • {n}
                  </Text>
                ))}
              </Card>
            )}

            <Card style={{marginTop: 14}}>
              <H2>Allergen watch</H2>
              {data.allergen_warnings.length === 0 ? (
                <Text style={[s.note, {color: colors.green}]}>✓ No allergen warnings this week.</Text>
              ) : (
                data.allergen_warnings.map((w, i) => (
                  <View key={i} style={s.warn}>
                    <Text style={{fontSize: 18}}>⚠️</Text>
                    <View style={{flex: 1, marginLeft: 10}}>
                      {w.food ? <Text style={s.warnFood}>{w.food}</Text> : null}
                      <Text style={s.warnText}>{w.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
            <Muted style={{marginTop: 16, fontSize: 12}}>
              Dietary tags are rule-generated from a dataset and are guidance only, not medical advice.
            </Muted>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <View style={{flex: 1}}>
      <Text style={s.statVal}>{value}</Text>
      <Muted style={{fontSize: 12}}>{label}</Muted>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 20, paddingBottom: 40},
  stats: {flexDirection: 'row', marginVertical: 14},
  statVal: {color: colors.accent, fontSize: 26, fontWeight: '900'},
  score: {color: colors.text, fontSize: 40, fontWeight: '900'},
  scoreUnit: {fontSize: 18, color: colors.sub},
  note: {color: colors.text, opacity: 0.85, marginTop: 10, lineHeight: 20},
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.yellowSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  warnFood: {color: colors.text, fontWeight: '800'},
  warnText: {color: colors.text, opacity: 0.85},
});