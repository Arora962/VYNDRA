import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import ProfileScreen from './src/screens/ProfileScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import ScanScreen from './src/screens/ScanScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import {colors} from './src/theme';
import type {TabKey, User} from './src/types';

type Overlay =
  | {type: 'chat'; conversationId: string; title: string}
  | {type: 'scan'; chat?: {conversationId: string; text: string; food?: string; title: string}}
  | null;

const TABS: {key: TabKey; label: string; icon: string}[] = [
  {key: 'home', label: 'Today', icon: '🏠'},
  {key: 'chat', label: 'Chat', icon: '💬'},
  {key: 'insights', label: 'Insights', icon: '📊'},
  {key: 'explore', label: 'Explore', icon: '🧭'},
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabKey>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  // Bumping this key makes Home/Insights reload after a new meal is logged.
  const [refreshKey, setRefreshKey] = useState(0);

  // Android hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlay?.type === 'scan' && overlay.chat) {
        setOverlay({type: 'chat', conversationId: overlay.chat.conversationId, title: overlay.chat.title});
        return true;
      }
      if (overlay) {
        setOverlay(null);
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [overlay, tab]);

  const logout = useCallback(() => {
    setUser(null);
    setOverlay(null);
    setTab('home');
  }, []);

  let body: React.ReactNode;

  if (!user) {
    body = <ProfileScreen onPick={setUser} />;
  } else if (overlay?.type === 'chat') {
    body = (
      <ChatScreen
        user={user}
        conversationId={overlay.conversationId}
        title={overlay.title}
        onBack={() => setOverlay(null)}
        onSnap={ctx =>
          setOverlay({type: 'scan', chat: {...ctx, title: (overlay as any).title}})
        }
      />
    );
  } else if (overlay?.type === 'scan') {
    const chat = overlay.chat;
    body = (
      <ScanScreen
        user={user}
        chat={chat}
        onSent={() => setRefreshKey(k => k + 1)}
        onClose={() => {
          setRefreshKey(k => k + 1);
          setOverlay(chat ? {type: 'chat', conversationId: chat.conversationId, title: chat.title} : null);
        }}
      />
    );
  } else {
    body = (
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          {tab === 'home' && (
            <HomeScreen
              key={`h${refreshKey}`}
              user={user}
              onSnap={() => setOverlay({type: 'scan'})}
              onChat={() => setTab('chat')}
              onSwitch={logout}
            />
          )}
          {tab === 'chat' && (
            <ChatListScreen
              user={user}
              onOpen={(id, title) => setOverlay({type: 'chat', conversationId: id, title})}
            />
          )}
          {tab === 'insights' && <InsightsScreen key={`i${refreshKey}`} user={user} />}
          {tab === 'explore' && <ExploreScreen user={user} />}
        </View>
        <SafeAreaView edges={['bottom']} style={s.barWrap}>
          <View style={s.bar}>
            {TABS.slice(0, 2).map(t => (
              <TabButton key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
            <Pressable
              onPress={() => setOverlay({type: 'scan'})}
              style={({pressed}) => [s.fab, pressed && {transform: [{scale: 0.94}]}]}>
              <Text style={{fontSize: 26}}>📸</Text>
            </Pressable>
            {TABS.slice(2).map(t => (
              <TabButton key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />
            ))}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <View style={{flex: 1, backgroundColor: colors.bg}}>{body}</View>
    </SafeAreaProvider>
  );
}

function TabButton({
  t,
  active,
  onPress,
}: {
  t: {label: string; icon: string};
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.tab}>
      <Text style={{fontSize: 22, opacity: active ? 1 : 0.45}}>{t.icon}</Text>
      <Text style={[s.tabLabel, active && {color: colors.accent}]}>{t.label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  barWrap: {backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line},
  bar: {flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 6},
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2},
  tabLabel: {color: colors.faint, fontSize: 11, fontWeight: '800'},
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    marginHorizontal: 6,
    borderWidth: 5,
    borderColor: colors.bg,
  },
});

export default App;