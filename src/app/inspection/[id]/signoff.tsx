import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SignaturePad, type Signature } from '../../../components/SignaturePad';
import { Button, Card, Centered, Field, SectionTitle } from '../../../components/ui';
import { pieceTitle, progress, releaseBlockers } from '../../../data/inspection';
import { store } from '../../../data/storage';
import type { SignOff } from '../../../data/types';
import { useInspection } from '../../../hooks/useInspection';
import { colors } from '../../../theme';

type Decision = SignOff['decision'];

export default function SignOffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { inspection, loading, update } = useInspection(id);
  const [name, setName] = useState('');
  const [comments, setComments] = useState('');
  const [signature, setSignature] = useState<Signature | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    store.getSettings().then((s) => setName((n) => n || s.defaultInspector));
  }, []);

  if (loading) return null;
  if (!inspection) return <Centered><Text>Inspection not found.</Text></Centered>;
  if (inspection.status !== 'draft') {
    return (
      <Centered>
        <Text>This inspection is already signed.</Text>
      </Centered>
    );
  }

  const blockers = releaseBlockers(inspection);
  const canRelease = blockers.length === 0;
  const p = progress(inspection);

  const submit = () => {
    if (!decision) return Alert.alert('Choose a decision', 'Select Release to pour or Reject.');
    if (!name.trim()) return Alert.alert('Inspector name required');
    if (!signature?.paths.length) return Alert.alert('Signature required', 'Sign in the box to complete sign-off.');
    if (decision === 'rejected' && !comments.trim()) {
      return Alert.alert('Reason required', 'Add a comment explaining why the piece is rejected.');
    }
    update((i) => ({
      ...i,
      status: decision,
      signOff: {
        decision,
        inspectorName: name.trim(),
        comments: comments.trim(),
        signedAt: new Date().toISOString(),
        signature,
      },
    }));
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={styles.title}>{pieceTitle(inspection.piece)}</Text>
          <Text style={styles.muted}>
            {p.pass} pass · {p.fail} fail · {p.na} N/A · {p.total - p.answered} open
          </Text>
        </Card>

        {!canRelease && (
          <View style={styles.warn}>
            <Text style={styles.warnTitle}>Not ready for release</Text>
            {blockers.map((b) => (
              <Text key={b} style={styles.warnText}>
                • {b}
              </Text>
            ))}
          </View>
        )}

        <SectionTitle>Decision</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Choice
            label="Release to pour"
            icon="checkmark-circle"
            color={colors.pass}
            selected={decision === 'released'}
            disabled={!canRelease}
            onPress={() => setDecision('released')}
          />
          <Choice
            label="Reject"
            icon="close-circle"
            color={colors.fail}
            selected={decision === 'rejected'}
            onPress={() => setDecision('rejected')}
          />
        </View>

        <SectionTitle>QC inspector</SectionTitle>
        <Field label="Name" required value={name} onChangeText={setName} autoCapitalize="words" />
        <Field
          label={decision === 'rejected' ? 'Reason for rejection' : 'Comments'}
          required={decision === 'rejected'}
          value={comments}
          onChangeText={setComments}
          multiline
        />
        <SignaturePad value={signature} onChange={setSignature} onDrawingChange={(d) => setScrollEnabled(!d)} />

        <Text style={styles.legal}>
          By signing I confirm I personally inspected this piece and the results above are accurate.
        </Text>
        <Button
          title="Complete sign-off"
          icon="lock-closed"
          variant={decision === 'rejected' ? 'danger' : 'success'}
          onPress={submit}
          disabled={!decision}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Choice({
  label,
  icon,
  color,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'checkmark-circle' | 'close-circle';
  color: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.choice,
        { borderColor: color, opacity: disabled ? 0.35 : 1 },
        selected && { backgroundColor: color },
      ]}
    >
      <Ionicons name={icon} size={28} color={selected ? '#fff' : color} />
      <Text style={[styles.choiceText, { color: selected ? '#fff' : color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, marginTop: 4 },
  warn: { backgroundColor: colors.warnBg, borderRadius: 10, padding: 12, marginTop: 12, gap: 4 },
  warnTitle: { color: colors.warnText, fontWeight: '800' },
  warnText: { color: colors.warnText },
  choice: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  choiceText: { fontWeight: '700', fontSize: 15 },
  legal: { color: colors.muted, fontSize: 12, marginVertical: 12 },
});
