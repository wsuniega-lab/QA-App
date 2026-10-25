import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PhotoStrip } from '../../../components/PhotoStrip';
import { Button, Centered } from '../../../components/ui';
import { CHECKLIST, type ChecklistItem } from '../../../data/checklist';
import { EMPTY_RESPONSE, progress, responseFor } from '../../../data/inspection';
import type { ItemResponse, ItemResult } from '../../../data/types';
import { useInspection } from '../../../hooks/useInspection';
import { colors, resultColors } from '../../../theme';

const RESULTS: { value: ItemResult; label: string }[] = [
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'na', label: 'N/A' },
];

export default function SectionScreen() {
  const { id, section: sectionId } = useLocalSearchParams<{ id: string; section: string }>();
  const { inspection, loading, update } = useInspection(id);
  const index = CHECKLIST.findIndex((s) => s.id === sectionId);
  const section = CHECKLIST[index];

  if (loading) return null;
  if (!inspection || !section) return <Centered><Text>Not found.</Text></Centered>;

  const locked = inspection.status !== 'draft';
  const p = progress(inspection, section);
  const next = CHECKLIST[index + 1];

  const setResponse = (itemId: string, change: Partial<ItemResponse>) =>
    update((i) => ({
      ...i,
      responses: { ...i.responses, [itemId]: { ...(i.responses[itemId] ?? EMPTY_RESPONSE), ...change } },
    }));

  const markRemainingNA = () =>
    Alert.alert('Mark remaining as N/A?', `${p.total - p.answered} unanswered item(s) will be set to N/A.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark N/A',
        onPress: () =>
          update((i) => {
            const responses = { ...i.responses };
            for (const item of section.items) {
              if (!responses[item.id]?.result) {
                responses[item.id] = { ...(responses[item.id] ?? EMPTY_RESPONSE), result: 'na' };
              }
            }
            return { ...i, responses };
          }),
      },
    ]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen options={{ title: section.title }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Text style={styles.count}>
            {p.answered} of {p.total} checked
          </Text>
          {!locked && p.answered < p.total && (
            <Pressable onPress={markRemainingNA} hitSlop={8}>
              <Text style={styles.link}>Mark remaining N/A</Text>
            </Pressable>
          )}
        </View>

        {section.items.map((item, n) => (
          <ItemCard
            key={item.id}
            number={n + 1}
            item={item}
            response={responseFor(inspection, item.id)}
            locked={locked}
            onChange={(change) => setResponse(item.id, change)}
          />
        ))}

        {next ? (
          <Button
            title={`Next: ${next.title}`}
            icon="arrow-forward"
            onPress={() => router.replace(`/inspection/${id}/${next.id}`)}
          />
        ) : (
          <Button title="Back to overview" icon="checkmark-done" onPress={() => router.back()} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ItemCard({
  number,
  item,
  response,
  locked,
  onChange,
}: {
  number: number;
  item: ChecklistItem;
  response: ItemResponse;
  locked: boolean;
  onChange: (change: Partial<ItemResponse>) => void;
}) {
  const failed = response.result === 'fail';
  return (
    <View style={[styles.card, failed && styles.cardFail]}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text style={styles.num}>{number}.</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.text}>{item.text}</Text>
          {item.hint && <Text style={styles.hint}>{item.hint}</Text>}
        </View>
      </View>

      <View style={styles.results}>
        {RESULTS.map((r) => {
          const on = response.result === r.value;
          return (
            <Pressable
              key={r.value}
              disabled={locked}
              onPress={() => onChange({ result: on ? null : r.value })}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, disabled: locked }}
              style={[
                styles.result,
                { borderColor: resultColors[r.value] },
                on && { backgroundColor: resultColors[r.value] },
                locked && !on && { opacity: 0.35 },
              ]}
            >
              <Text style={[styles.resultText, { color: on ? '#fff' : resultColors[r.value] }]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={response.note}
        onChangeText={(note) => onChange({ note })}
        editable={!locked}
        multiline
        placeholder={failed ? 'Describe the deficiency and corrective action required' : 'Notes / measurements'}
        placeholderTextColor={failed ? colors.fail : colors.muted}
        style={[styles.note, failed && !response.note && { borderColor: colors.fail }]}
      />

      <PhotoStrip photos={response.photos} readOnly={locked} onChange={(photos) => onChange({ photos })} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { color: colors.muted, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardFail: { borderWidth: 1.5, borderColor: colors.fail },
  num: { fontSize: 16, fontWeight: '700', color: colors.muted },
  text: { fontSize: 16, color: colors.text, lineHeight: 22 },
  hint: { fontSize: 13, color: colors.muted, marginTop: 2, fontStyle: 'italic' },
  results: { flexDirection: 'row', gap: 8 },
  result: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { fontSize: 16, fontWeight: '700' },
  note: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
