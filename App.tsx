import React, {useState} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import type {MealResult} from './src/types';

type Screen = 'home' | 'capture' | 'summary';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [screen, setScreen] = useState<Screen>('home');
  const [result, setResult] = useState<MealResult | null>(null);
  const [imageUri, setImageUri] = useState<string>('');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {screen === 'home' && <HomeScreen onScanPress={() => setScreen('capture')} />}
      {screen === 'capture' && (
        <CaptureScreen
          onBack={() => setScreen('home')}
          onResult={(res, uri) => {
            setResult(res);
            setImageUri(uri);
            setScreen('summary');
          }}
        />
      )}
      {screen === 'summary' && result && (
        <SummaryScreen
          result={result}
          imageUri={imageUri}
          onDone={() => {
            setResult(null);
            setScreen('home');
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

export default App;