module.exports = {
  preset: '@react-native/jest-preset',
  // Let Jest compile these packages (they ship un-transpiled source).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-image-picker|react-native-safe-area-context)/)',
  ],
};