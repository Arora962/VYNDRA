import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getCommunities, getFoodInsight, getInfluencers, searchFoods} from '../api';
import {Avatar, Bar, Card, Chip, EmptyState, ErrorNote, H1, H2, Loading, Muted, Pill} from '../components/ui';
import {titleCase} from '../components/MealCard';
import {colorFor, colors, radius} from '../theme';
import type {Community, FoodInsight, Influencer, User} from '../types';

type Mode = 'people' | 'communities' | 'foods';

export default function ExploreScreen({user}: {user: User}) {
  const [mode, setMode] = useState<Mode>('people');
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <H1>Explore</H1>
        <Muted style={{marginBottom: 14}}>The social side of food: who shapes the conversation, and what to eat instead.</Muted>
        <View style={s.tabs}>
          <Chip label="🔥 Influencers" active={mode === 'people'} onPress={() => setMode('people')} />
          <Chip label="🫂 Communities" active={mode === 'communities'} onPress={() => setMode('communities')} />
          <Chip label="🥗 Foods" active={mode === 'foods'} onPress={() => setMode('foods')} />
        </View>
        {mode === 'people' && <People me={user} />}
        {mode === 'communities' && <Communities me={user} />}
        {mode === 'foods' && <Foods />}
      </ScrollView>
    </SafeAreaView>
  );
}

function useLoad<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const run = useCallback(async () => {
    setError('');
    try {
      setData(await fn());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    run();
  }, [run]);
  return {data, error, reload: run};
}

function People({me}: {me: User}) {
  const {data, error, reload} = useLoad<Influencer[]>(getInfluencers);
  if (error) {
    return <ErrorNote message={error} onRetry={reload} />;
  }
  if (!data) {
    return <View style={{height: 240}}><Loading /></View>;
  }
  if (!data.length) {
    return <EmptyState emoji="🕸️" title="No network data" hint="Run scripts/make_social_data.py on the backend." />;
  }
  const max = Math.max(...data.map(d => d.score), 1e-9);
  const medal = ['🥇', '🥈', '🥉'];
  return (
    <>
      <Muted style={{marginBottom: 10}}>
        Ranked by influence in the message / reply / reaction network (PageRank and centrality).
      </Muted>
      {data.slice(0, 15).map((u, i) => {
        const isMe = u.user_id === me.id;
        const top = Object.keys(u.metrics).slice(0, 3);
        return (
          <Card key={u.user_id + i} style={[s.person, isMe && {borderColor: colors.accent}]}>
            <Text style={s.rank}>{medal[i] ?? `#${u.rank}`}</Text>
            <Avatar name={u.name} size={40} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={s.pname}>
                {u.name}
                {isMe ? '  (you)' : ''}
              </Text>
              <View style={{marginVertical: 6}}>
                <Bar value={u.score / max} color={colorFor(u.user_id)} height={7} />
              </View>
              <View style={{flexDirection: 'row', gap: 6, flexWrap: 'wrap'}}>
                {top.map(k => (
                  <Pill key={k} label={`${k.replace(/_/g, ' ')} ${u.metrics[k].toFixed(2)}`} color={colors.sub} />
                ))}
              </View>
            </View>
          </Card>
        );
      })}
    </>
  );
}

function Communities({me}: {me: User}) {
  const {data, error, reload} = useLoad(getCommunities);
  if (error) {
    return <ErrorNote message={error} onRetry={reload} />;
  }
  if (!data) {
    return <View style={{height: 240}}><Loading /></View>;
  }
  if (!data.communities.length) {
    return <EmptyState emoji="🫂" title="No communities" hint="Run scripts/make_social_data.py on the backend." />;
  }
  return (
    <>
      {data.modularity !== null && (
        <Card style={{marginBottom: 14, backgroundColor: colors.accentSoft, borderColor: colors.accent + '55'}}>
          <Text style={{color: colors.text}}>
            Louvain found <Text style={{fontWeight: '900'}}>{data.communities.length}</Text> groups · modularity{' '}
            <Text style={{fontWeight: '900', color: colors.accent}}>{data.modularity.toFixed(3)}</Text>
          </Text>
        </Card>
      )}
      {data.communities.map((c: Community, i) => (
        <CommunityCard key={c.id} c={c} index={i} me={me} />
      ))}
    </>
  );
}

function CommunityCard({c, index, me}: {c: Community; index: number; me: User}) {
  const color = colorFor(c.id + index);
  const mine = c.members.includes(me.id);
  return (
    <Card style={[{marginBottom: 12}, mine && {borderColor: colors.accent}]}>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
        <View style={[s.dot, {backgroundColor: color}]} />
        <Text style={s.cname}>{c.label}</Text>
        <Text style={s.csize}>{c.members.length} people</Text>
      </View>
      <View style={s.bubbles}>
        {c.members.slice(0, 14).map(m => (
          <View key={m} style={[s.bubble, {backgroundColor: color + '33', borderColor: color}]}>
            <Text style={{color, fontWeight: '800', fontSize: 11}}>{m.length > 5 ? m.slice(-3) : m}</Text>
          </View>
        ))}
        {c.members.length > 14 && <Muted>+{c.members.length - 14}</Muted>}
      </View>
      {mine && <Pill label="You're here" color={colors.accent} />}
    </Card>
  );
}

function Foods() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [insight, setInsight] = useState<FoodInsight | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (t: string) => {
    setQ(t);
    setInsight(null);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (t.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        setResults((await searchFoods(t.trim())).slice(0, 12));
        setError('');
      } catch (e: any) {
        setError(e?.message ?? 'Search failed');
      }
    }, 300);
  };

  const open = async (name: string) => {
    setBusy(true);
    setError('');
    try {
      setInsight(await getFoodInsight(name));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load insights');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TextInput
        value={q}
        onChangeText={onChange}
        placeholder="Search a food, e.g. paneer, dosa, rajma…"
        placeholderTextColor={colors.faint}
        style={s.search}
        autoCorrect={false}
      />
      {error ? <View style={{marginTop: 12}}><ErrorNote message={error} /></View> : null}
      {busy && <View style={{height: 120}}><Loading /></View>}

      {!insight && results.map(r => (
        <Pressable key={r} onPress={() => open(r)} style={s.result}>
          <Text style={{color: colors.text, fontSize: 15, flex: 1}}>{r}</Text>
          <Text style={{color: colors.accent, fontSize: 18}}>›</Text>
        </Pressable>
      ))}

      {!insight && !busy && q.trim().length < 2 && (
        <EmptyState emoji="🔎" title="Look up any food" hint="See its food cluster, allergens, best time to eat and healthier swaps." />
      )}

      {insight && (
        <Card style={{marginTop: 16}}>
          <Text style={s.fname}>{titleCase(insight.food)}</Text>
          {insight.cluster ? <Muted style={{marginTop: 4}}>Food group: {insight.cluster}</Muted> : null}

          {insight.best_time ? (
            <Row label="Best time" body={<Pill label={insight.best_time} color={colors.blue} />} />
          ) : null}
          {insight.diets.length > 0 && (
            <Row label="Diet tags" body={<Wrap items={insight.diets} color={colors.green} />} />
          )}
          {insight.allergens.length > 0 && (
            <Row label="Allergens" body={<Wrap items={insight.allergens} color={colors.red} />} />
          )}

          <H2 style={{marginTop: 18, marginBottom: 8}}>Healthier swaps</H2>
          {insight.swaps.length === 0 ? (
            <Muted>No lighter alternative found in the same food group.</Muted>
          ) : (
            insight.swaps.map(sw => (
              <Pressable key={sw.food} onPress={() => open(sw.food)} style={s.swap}>
                <Text style={{color: colors.text, fontWeight: '700', flex: 1}}>{sw.food}</Text>
                {sw.saving ? <Pill label={sw.saving} color={colors.green} /> : null}
              </Pressable>
            ))
          )}
          <Muted style={{marginTop: 14, fontSize: 12}}>
            Tags are rule-generated from a dataset — guidance only, not medical advice.
          </Muted>
        </Card>
      )}
    </>
  );
}

const Row = ({label, body}: {label: string; body: React.ReactNode}) => (
  <View style={{marginTop: 14}}>
    <Muted style={{marginBottom: 6, fontWeight: '700'}}>{label}</Muted>
    {body}
  </View>
);
const Wrap = ({items, color}: {items: string[]; color: string}) => (
  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
    {items.map(i => (
      <Pill key={i} label={i} color={color} />
    ))}
  </View>
);

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 20, paddingBottom: 40},
  tabs: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  person: {flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10},
  rank: {width: 38, color: colors.sub, fontWeight: '900', fontSize: 15, textAlign: 'center'},
  pname: {color: colors.text, fontWeight: '800', fontSize: 15},
  dot: {width: 14, height: 14, borderRadius: 7, marginRight: 10},
  cname: {color: colors.text, fontWeight: '800', fontSize: 16, flex: 1},
  csize: {color: colors.sub, fontWeight: '700', fontSize: 12},
  bubbles: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10},
  bubble: {width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center'},
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  fname: {color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.4},
  swap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
});