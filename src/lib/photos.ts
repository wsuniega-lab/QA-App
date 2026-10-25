import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { store } from '../data/storage';
import type { Photo } from '../data/types';

/** Longest edge of stored photos. Keeps files small enough for PDF reports while staying legible. */
const MAX_EDGE = 1600;

async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const req = await ImagePicker.requestCameraPermissionsAsync();
  if (!req.granted) {
    Alert.alert('Camera access needed', 'Allow camera access in your phone settings to take inspection photos.');
  }
  return req.granted;
}

async function saveAsset(asset: ImagePicker.ImagePickerAsset): Promise<Photo> {
  const resize =
    asset.width >= asset.height
      ? { width: Math.min(asset.width, MAX_EDGE) }
      : { height: Math.min(asset.height, MAX_EDGE) };
  const image = await ImageManipulator.manipulate(asset.uri).resize(resize).renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  const photo = await store.addPhoto(result.uri);
  // Clean up the temporary copies in the cache directory.
  for (const uri of [result.uri, asset.uri]) {
    try {
      const f = new File(uri);
      if (f.exists) f.delete();
    } catch {
      // Not ours to delete (e.g. a library asset); ignore.
    }
  }
  return photo;
}

export async function takePhoto(): Promise<Photo | null> {
  if (!(await ensureCameraPermission())) return null;
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
  if (res.canceled) return null;
  return saveAsset(res.assets[0]);
}

export async function pickPhotos(): Promise<Photo[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: 10,
  });
  if (res.canceled) return [];
  const photos: Photo[] = [];
  for (const asset of res.assets) photos.push(await saveAsset(asset));
  return photos;
}
