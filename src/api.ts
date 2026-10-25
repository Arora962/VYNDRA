import type {Asset} from 'react-native-image-picker';
import type {
  Analysis,
  ChatMessage,
  Community,
  DayStat,
  FoodInsight,
  FoodItem,
  Influencer,
  Insights,
  MealSummary,
  SendResult,
  Totals,
  User,
} from './types';

// ⚠️ Default server address. You can also change it inside the app
// (Profile screen → "Server settings") without touching code.
// Use your laptop's LAN IP, never "localhost". Run the backend with
//   VYNDRA_HOST=0.0.0.0 python app.py
let BASE_URL = 'http://172.20.10.4:5001';
export const getBaseUrl = () => BASE_URL;
export const setBaseUrl = (url: string) => {
  BASE_URL = url.trim().replace(/\/+$/, '');
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(
  path: string,
  init: RequestInit = {},
  timeoutMs = 30000,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `Server error (${res.status})`;
      throw new ApiError(String(msg), res.status);
    }
    return data;
  } catch (e: any) {
    if (e instanceof ApiError) {
      throw e;
    }
    if (e?.name === 'AbortError') {
      throw new ApiError('The server took too long to answer.', 0);
    }
    throw new ApiError(
      `Cannot reach the server at ${BASE_URL}. Is the backend running and is the phone on the same Wi-Fi?`,
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(body),
});

// ---------- small helpers to read loosely-shaped backend data ----------
const num = (v: any, fallback = 0): number => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && isFinite(n) ? n : fallback;
};
const str = (v: any, fallback = ''): string =>
  v === null || v === undefined ? fallback : String(v);
const arr = (v: any): any[] => {
  if (Array.isArray(v)) {
    return v;
  }
  if (v && typeof v === 'object') {
    return Object.keys(v).map(k => ({_key: k, ...(typeof v[k] === 'object' ? v[k] : {value: v[k]})}));
  }
  return [];
};

export function totalsOf(s: any): Totals {
  const x = s || {};
  return {
    calories: num(x.calories ?? x.energy_kcal ?? x.total_calories ?? x.kcal ?? x.energy),
    protein: num(x.protein ?? x.protein_g ?? x.total_protein_g),
    carbs: num(x.carbs ?? x.carb_g ?? x.carbs_g ?? x.total_carbs_g),
    fat: num(x.fat ?? x.fat_g ?? x.total_fat_g),
    fiber: num(x.fiber ?? x.fibre_g ?? x.fiber_g ?? x.total_fiber_g),
  };
}

function normFood(f: any): FoodItem {
  const sugg = arr(f.suggestions).map(s =>
    typeof s === 'string' ? s : str(s.food_name ?? s.name ?? s.food ?? s.value),
  );
  return {
    food: str(f.food ?? f.food_name ?? f.class_name, 'Unknown'),
    quantity_grams: num(f.quantity_grams ?? f.quantity_g ?? f.grams, 100),
    confidence:
      f.confidence === undefined || f.confidence === null
        ? null
        : num(f.confidence),
    source: f.source,
    match_type: f.match_type,
    reviewed: f.reviewed,
    low_confidence: !!f.low_confidence,
    default_portion: !!f.default_portion,
    found: f.found,
    needs_manual_selection: !!f.needs_manual_selection,
    suggestions: sugg.filter(Boolean),
    calories: f.calories !== undefined ? num(f.calories) : undefined,
  };
}

export function normAnalysis(raw: any): Analysis | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const foods = arr(raw.foods ?? raw.items).map(normFood);
  const summary = totalsOf(raw.summary ?? raw.totals ?? raw);
  return {
    message: str(raw.message, ''),
    meal_id: raw.meal_id ?? raw.id ?? null,
    foods,
    summary,
    low_confidence:
      !!raw.low_confidence || (foods.length > 0 && foods.every(f => f.low_confidence)),
  };
}

function normMessage(m: any): ChatMessage {
  const mealRaw = m.meal ?? m.analysis ?? m.meal_analysis ?? null;
  return {
    id: str(m.id ?? m.message_id ?? `${m.created_at}-${m.user_id}`),
    user_id: str(m.user_id ?? m.sender_id),
    conversation_id: str(m.conversation_id),
    text: str(m.text),
    created_at: str(m.created_at),
    intent_label: m.intent_label ?? m.intent,
    probability: m.probability === undefined ? null : num(m.probability),
    meal: mealRaw ? normAnalysis(mealRaw) : null,
  };
}

function normUser(u: any): User {
  return {
    id: str(u.id ?? u.user_id),
    name: str(u.name ?? u.username ?? u.display_name, 'User'),
    diet: u.diet ?? u.diet_preference,
    allergens: Array.isArray(u.allergens) ? u.allergens : undefined,
  };
}

// ---------- API ----------
export async function health(): Promise<boolean> {
  const r = await request('/api/health', {}, 6000);
  return r?.status === 'ok';
}

export async function listUsers(): Promise<User[]> {
  const r = await request('/api/users');
  return arr(r?.users ?? r).map(normUser);
}

export async function createUser(
  name: string,
  diet?: string,
  allergens?: string[],
): Promise<User> {
  const body: any = {name};
  if (diet) {
    body.diet = diet;
  }
  if (allergens && allergens.length) {
    body.allergens = allergens;
  }
  const r = await request('/api/users', json(body));
  return normUser(r?.user ?? r);
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  text: string,
): Promise<SendResult> {
  const r = await request('/api/chat/send', json({
    user_id: userId,
    conversation_id: conversationId,
    text,
  }));
  const msg = normMessage(r?.message ?? r?.saved_message ?? r);
  const mentions = arr(r?.food_mentions ?? r?.mentions);
  return {
    message: msg,
    nudge: !!r?.nudge,
    nudge_text: str(r?.nudge_text, 'That sounds delicious — snap a photo of it!'),
    food:
      r?.food ??
      (mentions.length
        ? typeof mentions[0] === 'string'
          ? mentions[0]
          : str(mentions[0]?.food ?? mentions[0]?.value)
        : undefined),
  };
}

function photoForm(photo: Asset, fields: Record<string, string | undefined>) {
  const form = new FormData();
  form.append('image', {
    uri: photo.uri,
    name: photo.fileName ?? 'meal.jpg',
    type: photo.type ?? 'image/jpeg',
  } as any);
  Object.keys(fields).forEach(k => {
    const v = fields[k];
    if (v !== undefined && v !== '') {
      form.append(k, v);
    }
  });
  return form;
}

export async function sendMeal(
  photo: Asset,
  userId: string,
  conversationId: string,
  text: string,
): Promise<ChatMessage> {
  const r = await request(
    '/api/chat/send-meal',
    {
      method: 'POST',
      body: photoForm(photo, {
        user_id: userId,
        conversation_id: conversationId,
        text,
      }),
    },
    90000,
  );
  const msg = normMessage(r?.message ?? r);
  if (!msg.meal) {
    msg.meal = normAnalysis(r?.analysis ?? r?.meal ?? r);
  }
  return msg;
}

export async function getConversation(id: string): Promise<ChatMessage[]> {
  const r = await request(`/api/chat/${encodeURIComponent(id)}`);
  return arr(r?.messages ?? r).map(normMessage);
}

export async function analyzeMeal(
  photo: Asset,
  userId: string,
  servings: number,
): Promise<Analysis> {
  const r = await request(
    '/api/meals/analyze',
    {
      method: 'POST',
      body: photoForm(photo, {
        user_id: userId,
        servings: servings !== 1 ? String(servings) : undefined,
      }),
    },
    90000,
  );
  const a = normAnalysis(r);
  if (!a) {
    throw new ApiError('The server sent an empty answer.', 0);
  }
  return a;
}

export async function listMeals(userId: string): Promise<MealSummary[]> {
  const r = await request(`/api/meals?limit=50&user_id=${encodeURIComponent(userId)}`);
  return arr(r?.meals ?? r)
    .filter(m => !m.user_id || String(m.user_id) === userId)
    .map(m => ({
      id: num(m.id),
      created_at: str(m.created_at),
      source: str(m.source),
      notes: str(m.notes),
      ...totalsOf(m),
    }));
}

function dayLabel(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return date.slice(5, 10);
  }
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

export async function getInsights(userId: string): Promise<Insights> {
  const r = await request(`/api/insights/${encodeURIComponent(userId)}`);
  const dailyRaw = arr(r?.daily ?? r?.days);
  const daily: DayStat[] = dailyRaw.map(d => {
    const date = str(d.date ?? d._key ?? d.day);
    return {date, label: dayLabel(date), ...totalsOf(d)};
  });
  const wk = r?.weekly ?? r?.week ?? {};
  const weeklyTotals = totalsOf(Array.isArray(wk) ? wk[0] : wk);
  const warnings = arr(r?.allergen_warnings ?? r?.allergens).map(w => {
    if (typeof w === 'string') {
      return {food: '', text: w};
    }
    const al = w.allergen ?? w.allergens;
    return {
      food: str(w.food ?? w.food_name),
      text: str(
        w.message ?? w.text ?? (al ? `Contains ${Array.isArray(al) ? al.join(', ') : al}` : ''),
      ),
    };
  });
  const fit = r?.diet_fit ?? {};
  const rawScore = fit.score ?? fit.fit ?? (typeof fit === 'number' ? fit : null);
  let score: number | null = rawScore === null || rawScore === undefined ? null : num(rawScore, NaN);
  if (score !== null && isNaN(score)) {
    score = null;
  }
  if (score !== null && score <= 1) {
    score = score * 100;
  }
  return {
    daily,
    weekly: {
      ...weeklyTotals,
      meals: num(wk.meals ?? wk.meal_count ?? r?.meal_count),
      avg_daily_calories: num(
        wk.avg_daily_calories ?? wk.avg_calories,
        daily.length ? weeklyTotals.calories / Math.max(daily.length, 1) : 0,
      ),
    },
    allergen_warnings: warnings,
    diet_fit: {
      score,
      label: str(fit.label ?? fit.diet ?? (typeof fit === 'string' ? fit : '')),
      notes: arr(fit.notes ?? fit.reasons).map(n => (typeof n === 'string' ? n : str(n.text ?? n.value))),
    },
  };
}

export async function getInfluencers(): Promise<Influencer[]> {
  const r = await request('/api/social/influencers');
  return arr(r?.influencers ?? r?.ranking ?? r).map((u, i) => {
    const metrics: Record<string, number> = {};
    Object.keys(u).forEach(k => {
      if (typeof u[k] === 'number' && !['rank', 'score'].includes(k)) {
        metrics[k] = u[k];
      }
    });
    return {
      user_id: str(u.user_id ?? u.id ?? u.user),
      name: str(u.name ?? u.username ?? u.user_id ?? u.id ?? u.user),
      score: num(u.score ?? u.influence ?? u.pagerank ?? u.influence_score),
      rank: num(u.rank, i + 1),
      metrics,
    };
  });
}

export async function getCommunities(): Promise<{
  communities: Community[];
  modularity: number | null;
}> {
  const r = await request('/api/social/communities');
  const list = arr(r?.communities ?? r?.louvain ?? r);
  return {
    communities: list.map((c, i) => {
      const members = Array.isArray(c) ? c : arr(c.members ?? c.users).map(m => (typeof m === 'string' ? m : str(m.user_id ?? m.id)));
      return {
        id: str(c.id ?? c.community ?? c._key ?? i),
        members: members.map(String),
        label: str(c.label ?? c.name, `Community ${i + 1}`),
      };
    }),
    modularity: r?.modularity !== undefined ? num(r.modularity) : null,
  };
}

export async function searchFoods(q: string): Promise<string[]> {
  const r = await request(`/api/foods/search?q=${encodeURIComponent(q)}`);
  return arr(r?.foods).map(f => (typeof f === 'string' ? f : str(f.food_name ?? f.name)));
}

export async function getFoodInsight(name: string): Promise<FoodInsight> {
  const r = await request(`/api/foods/${encodeURIComponent(name)}/insights`);
  const listOf = (v: any): string[] =>
    arr(v).map(x => (typeof x === 'string' ? x : str(x.name ?? x.tag ?? x.value ?? x.food_name)));
  const swapsRaw = arr(r?.swaps ?? r?.healthier_swaps);
  const cluster = r?.cluster;
  return {
    food: str(r?.food ?? r?.food_name ?? name),
    cluster:
      typeof cluster === 'object' && cluster
        ? str(cluster.description ?? cluster.label ?? cluster.id)
        : str(cluster),
    allergens: listOf(r?.allergens ?? r?.allergen_warnings),
    diets: listOf(r?.diets ?? r?.diet_tags ?? r?.diet_fit),
    best_time: str(r?.best_time ?? r?.best_time_to_eat),
    diet_fit: str(r?.diet_fit_text ?? ''),
    swaps: swapsRaw.map(s => {
      if (typeof s === 'string') {
        return {food: s, saving: ''};
      }
      const pct = s.kcal_saving_pct ?? s.saving_pct ?? s.saving;
      return {
        food: str(s.food ?? s.food_name ?? s.name),
        saving: pct !== undefined && pct !== null ? (typeof pct === 'number' ? `${Math.round(pct)}% fewer kcal` : str(pct)) : '',
      };
    }),
    raw: r,
  };
}

// Used by the manual-suggestion flow on the result screen.
export async function calculateNutrition(food: string, grams: number): Promise<Totals | null> {
  const r = await request('/api/nutrition/calculate', json({food_name: food, grams}));
  if (!r || r.found === false) {
    return null;
  }
  return totalsOf(r);
}