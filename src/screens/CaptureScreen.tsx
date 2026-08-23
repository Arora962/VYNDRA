import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {launchCamera, Asset} from 'react-native-image-picker';
import {analyzeMeal} from '../api';
import {MealResult} from '../types';

type Props = {
  onBack: () => void;
  onResult: (result: MealResult, imageUri: string) => void;
};

export default function CaptureScreen({onBack, onResult}: Props) {
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const res = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
      saveToPhotos: false,
    });
    if (res.didCancel) return;
    if (res.errorMessage) {
      Alert.alert('Camera error', res.errorMessage);
      return;
    }
    const asset = res.assets?.[0];
    if (asset) setPhoto(asset);
  };

  const analyze = async () => {
    if (!photo?.uri) return;
    setLoading(true);
    try {
      const result = await analyzeMeal(photo);
      onResult(result, photo.uri);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Scan a Meal</Text>

        {photo?.uri ? (
          <Image source={{uri: photo.uri}} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No photo yet</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>
            {photo ? 'Retake Photo' : '📷  Take Photo'}
          </Text>
        </TouchableOpacity>

        {photo && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={analyze}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Analyze Meal</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  container: {flex: 1, padding: 20},
  back: {fontSize: 16, color: '#FF7A00', marginBottom: 12},
  title: {fontSize: 24, fontWeight: '800', marginBottom: 20},
  preview: {width: '100%', height: 320, borderRadius: 16, marginBottom: 20, backgroundColor: '#eee'},
  placeholder: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {color: '#999'},
  button: {backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12},
  primaryButton: {backgroundColor: '#FF7A00'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});