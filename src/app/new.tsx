import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { PieceInfoForm } from '../components/PieceInfoForm';
import { Button } from '../components/ui';
import { createInspection, emptyPiece } from '../data/inspection';
import { store } from '../data/storage';

export default function NewInspection() {
  const [piece, setPiece] = useState(emptyPiece);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!piece.pieceMark.trim()) {
      Alert.alert('Piece mark required', 'Enter the piece mark so the inspection can be identified.');
      return;
    }
    setBusy(true);
    try {
      const inspection = createInspection({ ...piece, pieceMark: piece.pieceMark.trim() });
      await store.saveInspection(inspection);
      router.replace(`/inspection/${inspection.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <PieceInfoForm value={piece} onChange={setPiece} />
        <Button title="Start Inspection" icon="arrow-forward-circle" onPress={start} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
