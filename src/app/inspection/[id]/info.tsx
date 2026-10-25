import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { PieceInfoForm } from '../../../components/PieceInfoForm';
import { Button } from '../../../components/ui';
import type { PieceInfo } from '../../../data/types';
import { useInspection } from '../../../hooks/useInspection';

export default function EditPieceInfo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { inspection, update } = useInspection(id);
  // Edits stay local until Save, starting from the stored piece info.
  const [edits, setEdits] = useState<PieceInfo | null>(null);
  const piece = edits ?? inspection?.piece;

  if (!piece) return null;

  const save = () => {
    if (!piece.pieceMark.trim()) {
      Alert.alert('Piece mark required');
      return;
    }
    update((i) => ({ ...i, piece: { ...piece, pieceMark: piece.pieceMark.trim() } }));
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <PieceInfoForm value={piece} onChange={setEdits} />
        <Button title="Save" icon="checkmark" onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
