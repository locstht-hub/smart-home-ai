import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { DataProvider } from './src/contexts/DataContext';
import { ForecastProvider } from './src/contexts/ForecastContext';
import { SmartHomeServerProvider } from './src/contexts/SmartHomeServerContext';
import AppNavigator from './src/navigation/AppNavigator';

const iconFonts = Platform.OS === 'web'
  ? { ionicons: { uri: '/fonts/Ionicons.ttf' } }
  : Ionicons.font;

export default function App() {
  const [fontsLoaded, fontError] = useFonts(iconFonts);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SmartHomeServerProvider>
        <AuthProvider>
          <DataProvider>
            <ForecastProvider>
              <AppNavigator />
            </ForecastProvider>
          </DataProvider>
        </AuthProvider>
      </SmartHomeServerProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
