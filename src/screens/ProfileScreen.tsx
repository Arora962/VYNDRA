import React, {useCallback, useEffect, useState} from 'react';
import {
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
  ApiError,
  createUser,
  getBaseUrl,
  health,
  listUsers,
  setBaseUrl,
} from '../api';
import {Avatar, Button, Card, Chip, ErrorNote, H2, Loading, Muted} from '../components/ui';
import {colors, radius} from '../theme';
import type {User} from '../types';

// Exact vocabulary used in Selective_Diet_Mapping.csv
const DIETS = ['Vegetarian', 'Vegan', 'Keto', 'Pescatarian', 'Mediterranean', 'Paleo'];
const ALLERGENS = ['Lactose / Dairy', 'Eggs', 'Gluten', 'Nuts', 'Seafood / Shellfish', 'Soy'];

export default function ProfileScreen({onPick}: {onPick: (u: User) => void}) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [diet, setDiet] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [url, setUrl] = useState(getBaseUrl());
  const [serverMsg, setServerMsg] = useState('');

  const load = useCallback(async () => {
    setError('');
    setUsers(null);
    try {
      setUsers(await listUsers());
    } catch (e: any) {
      setUsers([]);
      setError(e?.message ?? 'Could not load users');
      setShowServer(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAllergen = (a: string) =>
    setAllergens(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]));

  const create = async () => {
    if (!name.trim()) {
      return;
    }
    setCreating(true);
    setError('');
    try {
      const u = await createUser(name.trim(), diet || undefined, allergens);
      onPick(u);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : 'Could not create the profile');
    } finally {
      setCreating(false);
    }
  };

  const testServer = async () => {
    setBaseUrl(url);
    setServerMsg('Checking…');
    try {
      await health();
      setServerMsg('✅ Connected!');
      load();
    } catch (e: any) {
      setServerMsg(`❌ ${e?.message ?? 'Failed'}`);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <View style={s.logo}>
              <Text style={s.logoV}>V</Text>
            </View>
            <Text style={s.brand}>VYNDRA</Text>
            <Muted style={{textAlign: 'center', fontSize: 15}}>
              Chat with friends. Snap your food. Know what you eat.
            </Muted>
          </View>

          {error ? <ErrorNote message={error} onRetry={load} /> : null}

          <H2 style={{marginTop: 24, marginBottom: 12}}>Who's this?</H2>
          {users === null ? (
            <View style={{height: 120}}>
              <Loading />
            </View>
          ) : users.length === 0 ? (
            <Muted>No profiles yet — create the first one below.</Muted>
          ) : (
            users.map(u => (
              <Card key={u.id} onPress={() => onPick(u)} style={s.userRow}>
                <Avatar name={u.name} />
                <View style={{flex: 1, marginLeft: 14}}>
                  <Text style={s.userName}>{u.name}</Text>
                  <Muted>{u.diet ? u.diet : 'Tap to continue'}</Muted>
                </View>
                <Text style={{color: colors.accent, fontSize: 22}}>›</Text>
              </Card>
            ))
          )}

          <H2 style={{marginTop: 28, marginBottom: 12}}>Create a new profile</H2>
          <Card>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.faint}
              style={s.input}
              maxLength={40}
            />
            <Muted style={{marginTop: 16, marginBottom: 8}}>Diet (optional)</Muted>
            <View style={s.wrap}>
              {DIETS.map(d => (
                <Chip key={d} label={d} active={diet === d} onPress={() => setDiet(diet === d ? '' : d)} />
              ))}
            </View>
            <Muted style={{marginTop: 16, marginBottom: 8}}>Allergies (optional)</Muted>
            <View style={s.wrap}>
              {ALLERGENS.map(a => (
                <Chip key={a} label={a} active={allergens.includes(a)} onPress={() => toggleAllergen(a)} />
              ))}
            </View>
            <Button
              label="Create & start"
              onPress={create}
              loading={creating}
              disabled={!name.trim()}
              style={{marginTop: 20}}
            />
          </Card>

          <Pressable onPress={() => setShowServer(!showServer)} style={{marginTop: 28, alignItems: 'center'}}>
            <Text style={{color: colors.sub, fontWeight: '700'}}>
              ⚙️ Server settings {showServer ? '▲' : '▼'}
            </Text>
          </Pressable>
          {showServer && (
            <Card style={{marginTop: 12}}>
              <Muted style={{marginBottom: 8}}>
                Your laptop's address on the same Wi-Fi, e.g. http://192.168.1.5:5001
              </Muted>
              <TextInput
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={s.input}
                placeholderTextColor={colors.faint}
              />
              <Button label="Save & test" kind="soft" onPress={testServer} style={{marginTop: 12}} />
              {serverMsg ? <Muted style={{marginTop: 10}}>{serverMsg}</Muted> : null}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 20, paddingBottom: 60},
  hero: {alignItems: 'center', marginTop: 16},
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{rotate: '-8deg'}],
    marginBottom: 14,
  },
  logoV: {color: colors.bg, fontSize: 44, fontWeight: '900'},
  brand: {color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 4, marginBottom: 6},
  userRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14},
  userName: {color: colors.text, fontWeight: '800', fontSize: 17},
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 52,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});