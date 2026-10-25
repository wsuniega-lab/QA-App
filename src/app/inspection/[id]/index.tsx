import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PhotoStrip } from '../../../components/PhotoStrip';
import { Button, Card, Centered, Field, ProgressBar, SectionTitle, StatusBadge } from '../../../components/ui';
import { CHECKLIST } from '../../../data/checklist';
import { photoCount, pieceTitle, progress } from '../../../data/inspection';
import { store } from '../../../data/storage';
import { flushSaves, useInspection } from '../../../hooks/useInspection';
import { shareReport } from '../../../report/pdf';
import { colors, statusLabels } from '../../../theme';

export default function InspectionOverview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { inspection, loading, update } = useInspection(id);
  const [sharing, setSharing] = useState(false);

  if (loading) return null;
  if (!inspection) return <Centered><Text>Inspection not found.</Text></Centered>;

  const locked = inspection.status !== 'draft';
  const totals = progress(inspection);
  const { piece } = inspection;

  const share = async () => {
    setSharing(true);
    try {
      await flushSaves();
      await shareReport(inspection);
    } catch (e) {
      Alert.alert('Could not create report', String(e));
    } finally {
      setSharing(false);
    }
  };

  const reopen = () =>
    Alert.alert(
      'Reopen inspection?',
      'The sign-off and signature will be removed so the checklist can be edited and signed again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reopen', style: 'destructive', onPress: () => update((i) => ({ ...i, status: 'draft', signOff: null })) },
      ],
    );

  const remove = () =>
    Alert.alert('Delete inspection?', `${pieceTitle(piece)} and all of its photos will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await flushSaves();
          await store.deleteInspection(inspection.id);
          router.back();
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: piece.pieceMark || 'Inspection' }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card>
          <View style={styles.headRow}>
            <Text style={styles.title}>{pieceTitle(piece)}</Text>
            <StatusBadge status={inspection.status} />
          </View>
          <Info label="Job" value={[piece.jobNumber, piece.projectName].filter(Boolean).join(' · ')} />
          <Info label="Bed / form" value={piece.bed} />
          <Info label="Pour date" value={piece.pourDate} />
          <Info
            label="Shop drawing"
            value={[piece.drawingNumber, piece.drawingRevision && `Rev ${piece.drawingRevision}`]
              .filter(Boolean)
              .join(' ')}
          />
          {!locked && (
            <Pressable onPress={() => router.push(`/inspection/${id}/info`)} style={styles.edit} hitSlop={8}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.editText}>Edit piece info</Text>
            </Pressable>
          )}
        </Card>

        {totals.fail > 0 && (
          <View style={styles.warn}>
            <Ionicons name="warning" size={20} color={colors.fail} />
            <Text style={styles.warnText}>
              {totals.fail} failed item(s). Correct them and re-check before release.
            </Text>
          </View>
        )}

        <SectionTitle>
          Checklist · {totals.answered}/{totals.total} done
        </SectionTitle>
        <View style={{ gap: 8 }}>
          {CHECKLIST.map((section) => {
            const p = progress(inspection, section);
            return (
              <Pressable
                key={section.id}
                onPress={() => router.push(`/inspection/${id}/${section.id}`)}
                style={({ pressed }) => [styles.section, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name={section.icon} size={26} color={colors.primary} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.headRow}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.count}>
                      {p.answered}/{p.total}
                    </Text>
                  </View>
                  <ProgressBar value={p.answered} total={p.total} failed={p.fail > 0} />
                  {p.fail > 0 && <Text style={styles.failText}>{p.fail} failed</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>General photos & notes</SectionTitle>
        <Card>
          <PhotoStrip
            photos={inspection.generalPhotos}
            readOnly={locked}
            onChange={(generalPhotos) => update((i) => ({ ...i, generalPhotos }))}
          />
          <Field
            label=""
            value={inspection.generalNotes}
            onChangeText={(generalNotes) => update((i) => ({ ...i, generalNotes }))}
            placeholder="Overall notes, e.g. weather, crew, anything not covered by the checklist"
            multiline
            editable={!locked}
            containerStyle={{ marginTop: 12, marginBottom: 0 }}
          />
        </Card>

        <SectionTitle>Sign-off</SectionTitle>
        {inspection.signOff ? (
          <Card style={{ gap: 4 }}>
            <Text style={styles.signed}>{statusLabels[inspection.signOff.decision]}</Text>
            <Text style={styles.muted}>
              Signed by {inspection.signOff.inspectorName} on{' '}
              {new Date(inspection.signOff.signedAt).toLocaleString()}
            </Text>
            {!!inspection.signOff.comments && <Text style={styles.muted}>“{inspection.signOff.comments}”</Text>}
            <Button title="Reopen inspection" icon="lock-open-outline" variant="secondary" onPress={reopen} style={{ marginTop: 10 }} />
          </Card>
        ) : (
          <Button title="Sign off" icon="create" onPress={() => router.push(`/inspection/${id}/signoff`)} />
        )}

        <View style={{ height: 12 }} />
        <Button
          title={`Share PDF report (${photoCount(inspection)} photos)`}
          icon="document-text-outline"
          variant="secondary"
          onPress={share}
          busy={sharing}
        />
        <Pressable onPress={remove} style={styles.delete}>
          <Text style={styles.deleteText}>Delete inspection</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, flexShrink: 1, marginBottom: 6 },
  info: { flexDirection: 'row', paddingVertical: 3 },
  infoLabel: { width: 110, color: colors.muted, fontSize: 14 },
  infoValue: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '500' },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  editText: { color: colors.primary, fontWeight: '600' },
  warn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  warnText: { color: colors.fail, flex: 1, fontWeight: '600' },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  count: { color: colors.muted, fontWeight: '600' },
  failText: { color: colors.fail, fontSize: 12, fontWeight: '700' },
  signed: { fontSize: 17, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted },
  delete: { alignItems: 'center', paddingVertical: 18 },
  deleteText: { color: colors.fail, fontWeight: '600' },
});
