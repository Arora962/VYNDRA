import React, {useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {colorFor, colors, macroColors, radius} from '../theme';
import type {Totals} from '../types';

// ---------- text ----------
export function H1({children}: {children: React.ReactNode}) {
  return <Text style={s.h1}>{children}</Text>;
}
export function H2({children, style}: {children: React.ReactNode; style?: any}) {
  return <Text style={[s.h2, style]}>{children}</Text>;
}
export function Muted({children, style}: {children: React.ReactNode; style?: any}) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

// ---------- surfaces ----------
export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [s.card, style, pressed && {opacity: 0.85}]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Pill({
  label,
  color = colors.accent,
  soft = true,
}: {
  label: string;
  color?: string;
  soft?: boolean;
}) {
  return (
    <View
      style={[
        s.pill,
        {backgroundColor: soft ? color + '26' : color, borderColor: color + '55'},
      ]}>
      <Text style={[s.pillText, {color: soft ? color : colors.bg}]}>{label}</Text>
    </View>
  );
}

export function Avatar({name, size = 44}: {name: string; size?: number}) {
  const c = colorFor(name || '?');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c + '33',
        borderWidth: 2,
        borderColor: c,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{color: c, fontWeight: '800', fontSize: size * 0.42}}>
        {(name || '?').trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

// ---------- buttons ----------
export function Button({
  label,
  onPress,
  kind = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'soft';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    kind === 'primary' ? colors.accent : kind === 'soft' ? colors.accentSoft : 'transparent';
  const fg = kind === 'primary' ? colors.bg : colors.accent;
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        s.btn,
        {
          backgroundColor: bg,
          borderColor: kind === 'ghost' ? colors.line : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[s.btnText, {color: fg}]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        active && {backgroundColor: colors.accent, borderColor: colors.accent},
      ]}>
      <Text style={[s.chipText, active && {color: colors.bg}]}>{label}</Text>
    </Pressable>
  );
}

// ---------- states ----------
export function Loading({label = 'Loading…'}: {label?: string}) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Muted style={{marginTop: 12}}>{label}</Muted>
    </View>
  );
}

export function EmptyState({
  emoji,
  title,
  hint,
  action,
}: {
  emoji: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.center}>
      <Text style={{fontSize: 48, marginBottom: 8}}>{emoji}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {hint ? <Muted style={{textAlign: 'center', marginTop: 4}}>{hint}</Muted> : null}
      {action ? <View style={{marginTop: 16}}>{action}</View> : null}
    </View>
  );
}

export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={s.error}>
      <Text style={{color: colors.red, fontWeight: '700', marginBottom: 4}}>
        Something went wrong
      </Text>
      <Text style={{color: colors.text, opacity: 0.85}}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={{marginTop: 10}}>
          <Text style={{color: colors.accent, fontWeight: '800'}}>Try again →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------- data viz (pure Views, no extra libraries) ----------

/** Ring made of 48 small ticks. */
export function TickRing({
  progress,
  size = 190,
  children,
}: {
  progress: number;
  size?: number;
  children?: React.ReactNode;
}) {
  const N = 48;
  const filled = Math.round(Math.min(Math.max(progress, 0), 1) * N);
  const over = progress > 1;
  const ticks = [];
  for (let i = 0; i < N; i++) {
    const on = i < filled;
    ticks.push(
      <View
        key={i}
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          transform: [{rotate: `${(360 / N) * i}deg`}],
        }}>
        <View
          style={{
            width: 5,
            height: size * 0.09,
            borderRadius: 3,
            backgroundColor: on ? (over ? colors.red : colors.accent) : colors.line,
          }}
        />
      </View>,
    );
  }
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      {ticks}
      <View style={{alignItems: 'center'}}>{children}</View>
    </View>
  );
}

/** Animated horizontal bar, value 0..1. */
export function Bar({
  value,
  color = colors.accent,
  height = 10,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: Math.min(Math.max(value, 0), 1),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value, w]);
  return (
    <View style={{height, borderRadius: height, backgroundColor: colors.line, overflow: 'hidden'}}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: color,
          width: w.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}),
        }}
      />
    </View>
  );
}

export function MacroRow({totals}: {totals: Totals}) {
  const items: {k: keyof typeof macroColors; label: string; v: number}[] = [
    {k: 'protein', label: 'Protein', v: totals.protein},
    {k: 'carbs', label: 'Carbs', v: totals.carbs},
    {k: 'fat', label: 'Fat', v: totals.fat},
    {k: 'fiber', label: 'Fiber', v: totals.fiber},
  ];
  return (
    <View style={{flexDirection: 'row', gap: 8}}>
      {items.map(i => (
        <View key={i.k} style={[s.macro, {borderColor: macroColors[i.k] + '55'}]}>
          <Text style={{color: macroColors[i.k], fontWeight: '800', fontSize: 17}}>
            {i.v.toFixed(i.v >= 100 ? 0 : 1)}
            <Text style={{fontSize: 11}}> g</Text>
          </Text>
          <Text style={s.macroLabel}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** One stacked bar showing protein / carbs / fat split by grams. */
export function MacroSplit({totals}: {totals: Totals}) {
  const total = totals.protein + totals.carbs + totals.fat || 1;
  const part = (v: number, c: string) => (
    <View style={{flex: Math.max(v / total, 0.001), backgroundColor: c}} />
  );
  return (
    <View style={{height: 14, borderRadius: 8, overflow: 'hidden', flexDirection: 'row'}}>
      {part(totals.protein, macroColors.protein)}
      {part(totals.carbs, macroColors.carbs)}
      {part(totals.fat, macroColors.fat)}
    </View>
  );
}

/** Vertical bar chart: data = [{label, value}]. */
export function BarChart({
  data,
  goal,
  height = 140,
  color = colors.accent,
  unit = '',
}: {
  data: {label: string; value: number}[];
  goal?: number;
  height?: number;
  color?: string;
  unit?: string;
}) {
  const max = Math.max(goal ?? 0, ...data.map(d => d.value), 1);
  return (
    <View>
      <View style={{height, flexDirection: 'row', alignItems: 'flex-end', gap: 8}}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * (height - 22), d.value > 0 ? 4 : 2);
          const over = goal !== undefined && d.value > goal;
          return (
            <View key={`${d.label}-${i}`} style={{flex: 1, alignItems: 'center', justifyContent: 'flex-end'}}>
              <Text style={s.barVal}>{d.value > 0 ? Math.round(d.value) : ''}</Text>
              <View
                style={{
                  width: '70%',
                  height: h,
                  borderRadius: 6,
                  backgroundColor: over ? colors.red : color,
                  opacity: d.value > 0 ? 1 : 0.25,
                }}
              />
            </View>
          );
        })}
      </View>
      {goal !== undefined && (
        <Muted style={{fontSize: 11, marginTop: 6}}>
          Goal: {goal} {unit}
        </Muted>
      )}
      <View style={{flexDirection: 'row', gap: 8, marginTop: 4}}>
        {data.map((d, i) => (
          <Text key={`${d.label}-l${i}`} style={s.barLabel}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  h1: {fontSize: 30, fontWeight: '900', color: colors.text, letterSpacing: -0.5},
  h2: {fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.2},
  muted: {fontSize: 13, color: colors.sub, lineHeight: 18},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillText: {fontSize: 11, fontWeight: '800', letterSpacing: 0.3},
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  btnText: {fontSize: 16, fontWeight: '800'},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipText: {color: colors.text, fontWeight: '700', fontSize: 13},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  emptyTitle: {color: colors.text, fontWeight: '800', fontSize: 18, textAlign: 'center'},
  error: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red + '55',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
  },
  macro: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface2,
  },
  macroLabel: {color: colors.sub, fontSize: 11, marginTop: 2, fontWeight: '600'},
  barVal: {color: colors.sub, fontSize: 10, marginBottom: 3, fontWeight: '700'},
  barLabel: {flex: 1, textAlign: 'center', color: colors.sub, fontSize: 11, fontWeight: '700'},
});