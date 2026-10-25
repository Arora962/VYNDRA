import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getConversation, listUsers, sendMessage} from '../api';
import {MealCard} from '../components/MealCard';
import {Avatar, ErrorNote, Muted, Pill} from '../components/ui';
import {colors, radius} from '../theme';
import type {ChatMessage, User} from '../types';
import {timeOf} from '../utils';

type Props = {
  user: User;
  conversationId: string;
  title: string;
  onBack: () => void;
  onSnap: (ctx: {conversationId: string; text: string; food?: string}) => void;
};

type Nudge = {text: string; food?: string; message: string};

export default function ChatScreen({user, conversationId, title, onBack, onSnap}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const load = useCallback(async () => {
    try {
      const m = await getConversation(conversationId);
      setMessages(prev => {
        const pending = prev.filter(p => p.pending);
        return [...m, ...pending];
      });
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'Could not load messages');
    }
  }, [conversationId]);

  useEffect(() => {
    load();
    listUsers()
      .then(us => setNames(Object.fromEntries(us.map(u => [u.id, u.name]))))
      .catch(() => {});
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) {
      return;
    }
    setSending(true);
    setText('');
    setNudge(null);
    const temp: ChatMessage = {
      id: `tmp-${Date.now()}`,
      user_id: user.id,
      conversation_id: conversationId,
      text: body,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages(m => [...m, temp]);
    try {
      const r = await sendMessage(user.id, conversationId, body);
      setMessages(m => m.filter(x => x.id !== temp.id));
      await load();
      if (r.nudge) {
        setNudge({text: r.nudge_text, food: r.food, message: body});
      }
    } catch (e: any) {
      setMessages(m => m.filter(x => x.id !== temp.id));
      setText(body);
      setError(e?.message ?? 'Message failed');
    } finally {
      setSending(false);
    }
  };

  const nameOf = (id: string) => (id === user.id ? user.name : names[id] ?? `User ${id}`);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <Avatar name={title} size={36} />
        <View style={{marginLeft: 10, flex: 1}}>
          <Text style={s.title}>{title}</Text>
          <Muted style={{fontSize: 11}}>Food mentions trigger a photo nudge 📸</Muted>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{padding: 16, paddingBottom: 8}}
          onContentSizeChange={() => listRef.current?.scrollToEnd({animated: true})}
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 60}}>
              <Text style={{fontSize: 44}}>💬</Text>
              <Muted style={{marginTop: 8, textAlign: 'center'}}>
                Try: “I just had biryani for lunch 😋”
              </Muted>
            </View>
          }
          renderItem={({item}) => (
            <Bubble
              m={item}
              mine={item.user_id === user.id}
              sender={nameOf(item.user_id)}
              group={conversationId === 'lounge'}
            />
          )}
          ListFooterComponent={
            nudge ? (
              <NudgeCard
                nudge={nudge}
                onSnap={() => {
                  onSnap({conversationId, text: nudge.message, food: nudge.food});
                  setNudge(null);
                }}
                onDismiss={() => setNudge(null)}
              />
            ) : undefined
          }
        />
        {error ? (
          <View style={{paddingHorizontal: 16}}>
            <ErrorNote message={error} />
          </View>
        ) : null}
        <View style={s.inputBar}>
          <Pressable
            style={s.cam}
            onPress={() => onSnap({conversationId, text: '', food: undefined})}>
            <Text style={{fontSize: 20}}>📷</Text>
          </Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Send a message…"
            placeholderTextColor={colors.faint}
            style={s.input}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={[s.sendBtn, (!text.trim() || sending) && {opacity: 0.4}]}>
            <Text style={{color: colors.bg, fontSize: 18, fontWeight: '900'}}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({
  m,
  mine,
  sender,
  group,
}: {
  m: ChatMessage;
  mine: boolean;
  sender: string;
  group: boolean;
}) {
  const foodIntent = m.intent_label && m.intent_label.toLowerCase().includes('food_intent');
  return (
    <View style={{alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 10}}>
      {!mine && group && <Text style={s.sender}>{sender}</Text>}
      <View
        style={[
          s.bubble,
          mine ? s.mine : s.theirs,
          m.pending && {opacity: 0.55},
        ]}>
        {m.text ? <Text style={[s.msg, mine && {color: colors.bg}]}>{m.text}</Text> : null}
        {m.meal ? (
          <View style={{marginTop: m.text ? 8 : 0, minWidth: 230}}>
            <MealCard meal={m.meal} />
          </View>
        ) : null}
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3}}>
        <Text style={s.time}>{timeOf(m.created_at)}</Text>
        {mine && foodIntent && (
          <Pill
            label={`🍽 food intent${m.probability ? ` ${Math.round(m.probability * 100)}%` : ''}`}
            color={colors.green}
          />
        )}
      </View>
    </View>
  );
}

function NudgeCard({
  nudge,
  onSnap,
  onDismiss,
}: {
  nudge: Nudge;
  onSnap: () => void;
  onDismiss: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1.03, duration: 700, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 1, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View style={[s.nudge, {transform: [{scale: pulse}]}]}>
      <Text style={s.nudgeTitle}>📸 Snap it!</Text>
      <Text style={s.nudgeText}>{nudge.text}</Text>
      <View style={{flexDirection: 'row', gap: 10, marginTop: 12}}>
        <Pressable onPress={onSnap} style={s.nudgeBtn}>
          <Text style={{color: colors.bg, fontWeight: '900'}}>Open camera</Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={s.nudgeSkip}>
          <Text style={{color: colors.sub, fontWeight: '800'}}>Not now</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  back: {color: colors.accent, fontSize: 36, marginRight: 12, marginTop: -6},
  title: {color: colors.text, fontWeight: '800', fontSize: 17},
  sender: {color: colors.sub, fontSize: 11, fontWeight: '700', marginBottom: 3, marginLeft: 6},
  bubble: {maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20},
  mine: {backgroundColor: colors.accent, borderBottomRightRadius: 6},
  theirs: {backgroundColor: colors.surface2, borderBottomLeftRadius: 6},
  msg: {color: colors.text, fontSize: 16, lineHeight: 21},
  time: {color: colors.faint, fontSize: 10, fontWeight: '600'},
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  cam: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudge: {
    marginTop: 8,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: 16,
  },
  nudgeTitle: {color: colors.accent, fontWeight: '900', fontSize: 16, marginBottom: 4},
  nudgeText: {color: colors.text, fontSize: 15, lineHeight: 20},
  nudgeBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  nudgeSkip: {paddingHorizontal: 14, paddingVertical: 12},
});