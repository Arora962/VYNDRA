import type {Asset} from 'react-native-image-picker';
import type {MealResult} from './types';

// ⚠️ CHANGE THIS to your computer's LAN IP address (see backend setup steps below).
// Never use "localhost" here — the phone/emulator is not the same machine as your laptop.
export const API_BASE_URL = 'http://172.20.10.4:5001';

export async function analyzeMeal(photo: Asset): Promise<MealResult> {
  const formData = new FormData();
  formData.append('image', {
    uri: photo.uri,
    name: photo.fileName ?? 'meal.jpg',
    type: photo.type ?? 'image/jpeg',
  } as any);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server error (${response.status}): ${text}`);
  }

  return response.json();
}