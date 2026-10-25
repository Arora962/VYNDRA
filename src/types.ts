// Shapes the app uses internally. api.ts converts whatever the backend
// returns into these, so a small backend change never crashes a screen.

export type User = {
  id: string;
  name: string;
  diet?: string;
  allergens?: string[];
};

export type FoodItem = {
  food: string;
  quantity_grams: number;
  confidence: number | null;
  source?: string;
  match_type?: 'exact' | 'family' | 'none' | 'estimated' | string;
  reviewed?: boolean;
  low_confidence?: boolean;
  default_portion?: boolean;
  found?: boolean;
  needs_manual_selection?: boolean;
  suggestions: string[];
  calories?: number;
};

export type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type Analysis = {
  message: string;
  meal_id?: number | null;
  foods: FoodItem[];
  summary: Totals;
  low_confidence: boolean;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  conversation_id: string;
  text: string;
  created_at: string;
  intent_label?: string;
  probability?: number | null;
  meal?: Analysis | null;
  pending?: boolean;
};

export type SendResult = {
  message: ChatMessage;
  nudge: boolean;
  nudge_text: string;
  food?: string;
};

export type DayStat = Totals & {date: string; label: string};

export type Insights = {
  daily: DayStat[];
  weekly: Totals & {meals: number; avg_daily_calories: number};
  allergen_warnings: {food: string; text: string}[];
  diet_fit: {score: number | null; label: string; notes: string[]};
};

export type MealSummary = {
  id: number;
  created_at: string;
  source: string;
  notes: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type Influencer = {
  user_id: string;
  name: string;
  score: number;
  rank: number;
  metrics: Record<string, number>;
};

export type Community = {
  id: string;
  members: string[];
  label: string;
};

export type FoodInsight = {
  food: string;
  cluster: string;
  allergens: string[];
  diets: string[];
  best_time: string;
  diet_fit: string;
  swaps: {food: string; saving: string}[];
  raw: any;
};

// Tabs shown in the bottom bar.
export type TabKey = 'home' | 'chat' | 'insights' | 'explore';