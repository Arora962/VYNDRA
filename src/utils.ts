// Backend timestamps may come as "2026-10-25T07:00:00.000Z" or without the Z.
export function parseDate(iso: string): Date {
  if (!iso) {
    return new Date(NaN);
  }
  let t = iso.replace(' ', 'T');
  if (/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?$/.test(t)) {
    t += 'Z';
  }
  return new Date(t);
}

export function timeOf(iso: string): string {
  const d = parseDate(iso);
  if (isNaN(d.getTime())) {
    return '';
  }
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

export function isToday(iso: string): boolean {
  const d = parseDate(iso);
  return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
}

export function mealEmoji(iso: string): string {
  const h = parseDate(iso).getHours();
  if (isNaN(h)) {
    return '🍽️';
  }
  if (h < 11) {
    return '🍳';
  }
  if (h < 16) {
    return '🍛';
  }
  if (h < 19) {
    return '🥪';
  }
  return '🍲';
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// Same room for everyone (group) and a stable id for every pair (DM).
export const LOUNGE_ID = 'lounge';
export const dmId = (a: string, b: string) =>
  `dm-${[a, b].sort().join('-')}`;