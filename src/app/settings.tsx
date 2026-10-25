import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Card, Field, SectionTitle } from '../components/ui';
import { store } from '../data/storage';
import type { Settings } from '../data/types';
import { colors } from '../theme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    store.getSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  const set = (key: keyof Settings) => (v: string) => setSettings({ ...settings, [key]: v });

  const save = async () => {
    await store.saveSettings(settings);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <SectionTitle>Report header</SectionTitle>
      <Field
        label="Company name"
        value={settings.companyName}
        onChangeText={set('companyName')}
        placeholder="Shown at the top of every PDF report"
      />
      <Field
        label="Plant / location"
        value={settings.plantLocation}
        onChangeText={set('plantLocation')}
        placeholder="e.g. Plant 2, Springfield"
      />
      <SectionTitle>Inspector</SectionTitle>
      <Field
        label="Default QC inspector name"
        value={settings.defaultInspector}
        onChangeText={set('defaultInspector')}
        placeholder="Pre-fills the sign-off screen"
        autoCapitalize="words"
      />
      <Button title="Save" icon="checkmark" onPress={save} />

      <SectionTitle>Storage</SectionTitle>
      <Card>
        <Text style={styles.text}>
          Trial mode: inspections and photos are stored only on this device. Share PDF reports to keep copies
          elsewhere. Deleting the app deletes its data.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});
