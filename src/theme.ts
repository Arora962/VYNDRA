// Central design tokens. Change a colour here and the whole app updates.
export const colors = {
  bg: '#120F17',
  surface: '#1C1824',
  surface2: '#262031',
  line: '#33293F',
  text: '#FFF7EE',
  sub: '#A79DB5',
  faint: '#6F657D',
  accent: '#FF7A00',
  accentSoft: 'rgba(255,122,0,0.16)',
  green: '#3DDC97',
  greenSoft: 'rgba(61,220,151,0.16)',
  red: '#FF5C6C',
  redSoft: 'rgba(255,92,108,0.16)',
  yellow: '#FFC857',
  yellowSoft: 'rgba(255,200,87,0.16)',
  blue: '#6EA8FF',
  violet: '#B28CFF',
  white: '#FFFFFF',
};

export const macroColors = {
  protein: colors.blue,
  carbs: colors.yellow,
  fat: colors.violet,
  fiber: colors.green,
};

export const radius = {sm: 10, md: 16, lg: 24, pill: 999};
export const space = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32};

// Community / avatar palette (deterministic by name or id).
export const palette = [
  '#FF7A00',
  '#3DDC97',
  '#6EA8FF',
  '#B28CFF',
  '#FF5C6C',
  '#FFC857',
  '#2EC4B6',
  '#F78FB3',
];

export function colorFor(key: string | number): string {
  const s = String(key);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length];
}

export const DAILY_CALORIE_GOAL = 2000;