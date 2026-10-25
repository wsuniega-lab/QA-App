import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PIECE_TYPES } from '../data/checklist';
import type { PieceInfo } from '../data/types';
import { colors } from '../theme';
import { Field, styles as ui } from './ui';

export function PieceInfoForm({ value, onChange }: { value: PieceInfo; onChange: (v: PieceInfo) => void }) {
  const set = (key: keyof PieceInfo) => (text: string) => onChange({ ...value, [key]: text });
  return (
    <View>
      <Field label="Job number" value={value.jobNumber} onChangeText={set('jobNumber')} placeholder="e.g. 24-118" />
      <Field
        label="Project name"
        value={value.projectName}
        onChangeText={set('projectName')}
        placeholder="e.g. Riverside Parking Structure"
      />
      <Field
        label="Piece mark"
        required
        value={value.pieceMark}
        onChangeText={set('pieceMark')}
        placeholder="e.g. DT-12"
        autoCapitalize="characters"
      />

      <Text style={ui.label}>Piece type</Text>
      <View style={styles.chips}>
        {PIECE_TYPES.map((t) => {
          const on = value.pieceType === t;
          return (
            <Pressable
              key={t}
              onPress={() => onChange({ ...value, pieceType: on ? '' : t })}
              style={[styles.chip, on && styles.chipOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <Field
          label="Bed / form #"
          value={value.bed}
          onChangeText={set('bed')}
          placeholder="e.g. Bed 3"
          containerStyle={styles.half}
        />
        <Field
          label="Pour date"
          value={value.pourDate}
          onChangeText={set('pourDate')}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          containerStyle={styles.half}
        />
      </View>
      <View style={styles.row}>
        <Field
          label="Shop drawing #"
          value={value.drawingNumber}
          onChangeText={set('drawingNumber')}
          placeholder="e.g. E-201"
          autoCapitalize="characters"
          containerStyle={styles.half}
        />
        <Field
          label="Revision"
          value={value.drawingRevision}
          onChangeText={set('drawingRevision')}
          placeholder="e.g. 2"
          autoCapitalize="characters"
          containerStyle={styles.half}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
