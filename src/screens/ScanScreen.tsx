import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Asset,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import {analyzeMeal, calculateNutrition, sendMeal} from '../api';
import {Button, Card, Chip, ErrorNote, H2, MacroRow, MacroSplit, Muted} from '../components/ui';
import {FoodRow, titleCase} from '../components/MealCard';
import {colors, radius} from '../theme';
import type {Analysis, Totals, User} from '../types';

type Props = {
  user: User;
  /** When set, the photo is sent into this chat instead of just analysed. */
  chat?: {conversationId: string; text: string; food?: string};
  onClose: () => void;
  onSent?: () => void;
};

const SERVINGS = [0.5, 1, 1.5, 2];

export default function ScanScreen({user, chat, onClose, onSent}: Props) {
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [servings, setServings] = useState(1);
  const [caption, setCaption] = useState(chat?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);

  const handle = (res: any) => {
    if (res.didCancel) {
      return;
    }
    if (res.errorMessage) {
      Alert.alert('Photo error', res.errorMessage);
      return;
    }
    const a = res.assets?.[0];
    if (a) {
      setPhoto(a);
      setError('');
    }
  };
  const camera = async () =>
    handle(await launchCamera({mediaType: 'photo', cameraType: 'back', quality: 0.8, saveToPhotos: false}));
  const gallery = async () =>
    handle(await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1}));

  const run = async () => {
    if (!photo?.uri) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (chat) {
        const msg = await sendMeal(photo, user.id, chat.conversationId, caption.trim());
        setResult(msg.meal ?? null);
        onSent?.();
      } else {
        setResult(await analyzeMeal(photo, user.id, servings));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  if (result && photo?.uri) {
    return <ResultView result={result} uri={photo.uri} posted={!!chat} onDone={onClose} />;
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.top}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={s.back}>✕</Text>
            </Pressable>
            <H2>{chat ? 'Snap your meal' : 'Scan a meal'}</H2>
            <View style={{width: 24}} />
          </View>

          {chat?.food ? (
            <Card style={s.hint}>
              <Text style={{color: colors.text}}>
                🍽️ You mentioned <Text style={{fontWeight: '900', color: colors.accent}}>{chat.food}</Text> — show us!
              </Text>
            </Card>
          ) : null}

          <Pressable onPress={photo ? undefined : camera} style={s.frame}>
            {photo?.uri ? (
              <Image source={{uri: photo.uri}} style={s.preview} />
            ) : (
              <View style={s.placeholder}>
                <Text style={{fontSize: 56}}>🍛</Text>
                <Text style={s.phTitle}>Put the whole plate in frame</Text>
                <Muted style={{textAlign: 'center'}}>Good light and a top-down angle work best.</Muted>
              </View>
            )}
            <View style={[s.corner, s.tl]} />
            <View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} />
            <View style={[s.corner, s.br]} />
          </Pressable>

          <View style={s.pickRow}>
            <Button label={photo ? '📷 Retake' : '📷 Camera'} onPress={camera} kind={photo ? 'ghost' : 'primary'} style={{flex: 1}} />
            <Button label="🖼️ Gallery" onPress={gallery} kind="ghost" style={{flex: 1}} />
          </View>

          {photo && !chat && (
            <>
              <Muted style={{marginTop: 20, marginBottom: 8}}>How many servings is this?</Muted>
              <View style={s.pickRow}>
                {SERVINGS.map(v => (
                  <Chip key={v} label={`${v}×`} active={servings === v} onPress={() => setServings(v)} />
                ))}
              </View>
            </>
          )}

          {photo && chat && (
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption…"
              placeholderTextColor={colors.faint}
              style={s.caption}
              maxLength={200}
            />
          )}

          {error ? <View style={{marginTop: 16}}><ErrorNote message={error} onRetry={run} /></View> : null}

          {photo && (
            <Button
              label={chat ? 'Send to chat' : 'Analyse meal'}
              onPress={run}
              loading={busy}
              style={{marginTop: 20}}
            />
          )}
          {busy && <Muted style={{textAlign: 'center', marginTop: 10}}>Recognising the dish… the first photo can take a few seconds.</Muted>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultView({
  result,
  uri,
  posted,
  onDone,
}: {
  result: Analysis;
  uri: string;
  posted: boolean;
  onDone: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const [picked, setPicked] = useState<Record<number, {name: string; totals: Totals}>>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  useEffect(() => {
    Animated.timing(fade, {toValue: 1, duration: 450, useNativeDriver: true}).start();
  }, [fade]);

  const choose = async (idx: number, name: string, grams: number) => {
    setLoadingIdx(idx);
    try {
      const t = await calculateNutrition(name, grams);
      if (t) {
        setPicked(p => ({...p, [idx]: {name, totals: t}}));
      } else {
        Alert.alert('No data', `No nutrition data for ${name}.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Lookup failed');
    } finally {
      setLoadingIdx(null);
    }
  };

  const totals: Totals = {...result.summary};
  Object.values(picked).forEach(p => {
    totals.calories += p.totals.calories;
    totals.protein += p.totals.protein;
    totals.carbs += p.totals.carbs;
    totals.fat += p.totals.fat;
    totals.fiber += p.totals.fiber;
  });

  const nothing = result.foods.length === 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Animated.View style={{opacity: fade}}>
          <Image source={{uri}} style={s.resultImg} />
          {posted && (
            <View style={s.posted}>
              <Text style={{color: colors.green, fontWeight: '800'}}>✓ Sent to chat with its analysis</Text>
            </View>
          )}

          <Card style={s.hero}>
            <Muted>Estimated energy</Muted>
            <Text style={s.kcal}>
              {Math.round(totals.calories)}
              <Text style={s.kcalUnit}> kcal</Text>
            </Text>
            <View style={{width: '100%', marginVertical: 12}}>
              <MacroSplit totals={totals} />
            </View>
            <MacroRow totals={totals} />
          </Card>

          {result.low_confidence && (
            <View style={s.warn}>
              <Text style={{color: colors.yellow, fontWeight: '800', marginBottom: 2}}>
                ⚠ Low confidence
              </Text>
              <Text style={{color: colors.text, opacity: 0.85}}>
                The model isn't very sure about this dish. Treat the numbers as a rough guide.
              </Text>
            </View>
          )}

          <H2 style={{marginTop: 24, marginBottom: 4}}>Detected</H2>
          {nothing && <Muted>No food items were detected in this photo.</Muted>}
          {result.foods.map((f, i) => (
            <View key={`${f.food}-${i}`}>
              <FoodRow food={f} />
              {f.needs_manual_selection && f.suggestions.length > 0 && !picked[i] && (
                <View style={{paddingVertical: 10}}>
                  <Muted style={{marginBottom: 8}}>
                    We can't guess nutrition for this dish. Pick the closest food:
                  </Muted>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                    {f.suggestions.map(sg => (
                      <Chip
                        key={sg}
                        label={loadingIdx === i ? '…' : titleCase(sg)}
                        onPress={() => choose(i, sg, f.quantity_grams || 100)}
                      />
                    ))}
                  </View>
                </View>
              )}
              {picked[i] && (
                <Text style={{color: colors.green, marginVertical: 8, fontWeight: '700'}}>
                  ✓ Using {titleCase(picked[i].name)} · {Math.round(picked[i].totals.calories)} kcal
                </Text>
              )}
            </View>
          ))}

          <Muted style={{marginTop: 20, fontSize: 12}}>
            Estimates come from a dish classifier and a nutrition table (per 100 g). Not medical advice.
          </Muted>
          <Button label="Done" onPress={onDone} style={{marginTop: 20}} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER = 26;
const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 20, paddingBottom: 50},
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  back: {color: colors.text, fontSize: 22, fontWeight: '700'},
  hint: {marginBottom: 14, padding: 12, backgroundColor: colors.accentSoft, borderColor: colors.accent + '55'},
  frame: {height: 340, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface},
  preview: {width: '100%', height: '100%'},
  placeholder: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30},
  phTitle: {color: colors.text, fontWeight: '800', fontSize: 17, marginTop: 10, marginBottom: 4},
  corner: {position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.accent},
  tl: {top: 14, left: 14, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10},
  tr: {top: 14, right: 14, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10},
  bl: {bottom: 14, left: 14, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10},
  br: {bottom: 14, right: 14, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10},
  pickRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  caption: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 52,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.line,
  },
  resultImg: {width: '100%', height: 230, borderRadius: radius.lg, backgroundColor: colors.surface},
  posted: {
    marginTop: 12,
    backgroundColor: colors.greenSoft,
    padding: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  hero: {marginTop: 16, alignItems: 'center'},
  kcal: {color: colors.accent, fontSize: 56, fontWeight: '900', letterSpacing: -2},
  kcalUnit: {fontSize: 18, color: colors.sub, fontWeight: '700', letterSpacing: 0},
  warn: {
    marginTop: 14,
    backgroundColor: colors.yellowSoft,
    borderColor: colors.yellow + '55',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
  },
});