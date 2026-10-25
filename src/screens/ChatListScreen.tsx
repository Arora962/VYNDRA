import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {listUsers} from '../api';
import {Avatar, Card, EmptyState, ErrorNote, H1, Loading, Muted} from '../components/ui';
import {colors} from '../theme';
import type {User} from '../types';
import {LOUNGE_ID, dmId} from '../utils';

type Props = {
  user: User;
  onOpen: (conversationId: string, title: string) => void;
};

export default function ChatListScreen({user, onOpen}: Props) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setUsers((await listUsers()).filter(u => u.id !== user.id));
    } catch (e: any) {
      setUsers([]);
      setError(e?.message ?? 'Could not load friends');
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

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
        <H1>Chats</H1>
        <Muted style={{marginBottom: 18}}>
          Talk about food and VYNDRA will nudge you to snap it.
        </Muted>

        {error ? <ErrorNote message={error} onRetry={load} /> : null}

        <Card onPress={() => onOpen(LOUNGE_ID, 'VYNDRA Lounge')} style={s.row}>
          <View style={s.group}>
            <Text style={{fontSize: 24}}>🍜</Text>
          </View>
          <View style={{flex: 1, marginLeft: 14}}>
            <Text style={s.name}>VYNDRA Lounge</Text>
            <Muted>Group chat for everyone</Muted>
          </View>
          <Text style={s.chev}>›</Text>
        </Card>

        <Text style={s.section}>FRIENDS</Text>
        {users === null && (
          <View style={{height: 120}}>
            <Loading />
          </View>
        )}
        {users !== null && users.length === 0 && !error && (
          <EmptyState
            emoji="👋"
            title="No friends yet"
            hint="Create another profile (tap your avatar on Today to switch profile) to chat between two users."
          />
        )}
        {users?.map(u => (
          <Card key={u.id} onPress={() => onOpen(dmId(user.id, u.id), u.name)} style={s.row}>
            <Avatar name={u.name} />
            <View style={{flex: 1, marginLeft: 14}}>
              <Text style={s.name}>{u.name}</Text>
              <Muted>{u.diet ?? 'Say hi 👋'}</Muted>
            </View>
            <Text style={s.chev}>›</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {padding: 20, paddingBottom: 40},
  row: {flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10},
  group: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {color: colors.text, fontWeight: '800', fontSize: 16},
  chev: {color: colors.accent, fontSize: 22},
  section: {color: colors.faint, fontWeight: '800', fontSize: 12, letterSpacing: 1.5, marginTop: 18, marginBottom: 10},
});