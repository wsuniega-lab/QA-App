import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.primaryText,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Pre-Pour Inspections' }} />
        <Stack.Screen name="new" options={{ title: 'New Inspection' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="inspection/[id]/index" options={{ title: 'Inspection' }} />
        <Stack.Screen name="inspection/[id]/info" options={{ title: 'Piece Information' }} />
        <Stack.Screen name="inspection/[id]/[section]" options={{ title: 'Checklist' }} />
        <Stack.Screen name="inspection/[id]/signoff" options={{ title: 'QC Sign-off' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
