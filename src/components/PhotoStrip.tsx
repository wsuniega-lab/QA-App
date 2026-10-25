import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { store } from '../data/storage';
import type { Photo } from '../data/types';
import { pickPhotos, takePhoto } from '../lib/photos';
import { colors } from '../theme';

const THUMB = 76;

export function PhotoStrip({
  photos,
  onChange,
  readOnly,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  readOnly?: boolean;
}) {
  const [viewing, setViewing] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (source: 'camera' | 'library') => {
    if (busy) return;
    setBusy(true);
    try {
      const added = source === 'camera' ? [await takePhoto()].filter((p) => p !== null) : await pickPhotos();
      if (added.length) onChange([...photos, ...added]);
    } catch (e) {
      Alert.alert('Could not save photo', String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = (photo: Photo) => {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onChange(photos.filter((p) => p.id !== photo.id));
          store.deletePhoto(photo);
          setViewing(null);
        },
      },
    ]);
  };

  const setCaption = (photo: Photo, caption: string) => {
    const updated = { ...photo, caption };
    onChange(photos.map((p) => (p.id === photo.id ? updated : p)));
    setViewing(updated);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {!readOnly && (
          <>
            <AddButton icon="camera" label="Camera" onPress={() => add('camera')} disabled={busy} />
            <AddButton icon="images" label="Library" onPress={() => add('library')} disabled={busy} />
          </>
        )}
        {photos.map((p) => (
          <Pressable key={p.id} onPress={() => setViewing(p)} accessibilityLabel="Open photo">
            <Image source={{ uri: store.photoUri(p) }} style={styles.thumb} />
            {!!p.caption && <View style={styles.captionDot} />}
          </Pressable>
        ))}
        {readOnly && photos.length === 0 && <Text style={styles.none}>No photos</Text>}
      </ScrollView>

      <Modal visible={!!viewing} animationType="fade" onRequestClose={() => setViewing(null)}>
        {viewing && (
          <SafeAreaView style={styles.viewer}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.viewerBar}>
                <Pressable onPress={() => setViewing(null)} hitSlop={12}>
                  <Ionicons name="close" size={30} color="#fff" />
                </Pressable>
                <Text style={styles.viewerDate}>{new Date(viewing.takenAt).toLocaleString()}</Text>
                {!readOnly ? (
                  <Pressable onPress={() => remove(viewing)} hitSlop={12}>
                    <Ionicons name="trash-outline" size={26} color="#fff" />
                  </Pressable>
                ) : (
                  <View style={{ width: 26 }} />
                )}
              </View>
              <Image source={{ uri: store.photoUri(viewing) }} style={styles.full} resizeMode="contain" />
              {readOnly ? (
                !!viewing.caption && <Text style={styles.captionText}>{viewing.caption}</Text>
              ) : (
                <TextInput
                  value={viewing.caption ?? ''}
                  onChangeText={(t) => setCaption(viewing, t)}
                  placeholder="Add a caption (e.g. 'North end bulkhead, cover 2 in.')"
                  placeholderTextColor="#999"
                  style={styles.captionInput}
                />
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

function AddButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: 'camera' | 'images';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === 'Camera' ? 'Take photo' : 'Add photo from library'}
      style={({ pressed }) => [styles.add, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text style={styles.addText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4, alignItems: 'center' },
  thumb: { width: THUMB, height: THUMB, borderRadius: 8, backgroundColor: colors.border },
  captionDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: '#fff',
  },
  add: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  none: { color: colors.muted, fontStyle: 'italic' },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewerDate: { color: '#ddd', fontSize: 13 },
  full: { flex: 1 },
  captionText: { color: '#fff', fontSize: 16, padding: 16 },
  captionInput: {
    backgroundColor: '#1c1c1e',
    color: '#fff',
    fontSize: 16,
    padding: 14,
    margin: 12,
    borderRadius: 8,
  },
});
