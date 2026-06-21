import { Platform } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb, getFbStorage } from './firebase/index';

// ─── Avatar picker + upload pipeline ───────────────────────────────────────
//
// Lazy-load expo-image-picker so a missing native module doesn't crash the
// app on cold-boot. The picker only loads when the user actually taps the
// "Change photo" affordance.
//
// Flow:
//   1. Ask for media-library permission (iOS + Android both prompt the
//      first time; subsequent taps are silent).
//   2. Launch the system picker (square crop, quality 0.6 to keep upload
//      reasonable on slow Nigerian cellular).
//   3. Read the picked file as a Blob and upload to Firebase Storage at
//      `avatars/{uid}.jpg` — fixed key so re-uploads overwrite, no
//      orphaned files.
//   4. Read back the public download URL and write it to
//      `/users/{uid}.avatarUrl` so every subscriber updates.
//
// Returns null when the user cancels the picker — caller should treat as
// "no change", not an error.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _picker: any = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPicker(): any | null {
  if (_picker !== undefined) return _picker;
  try {
    _picker = require('expo-image-picker');
  } catch (err) {
    if (__DEV__) console.warn('expo-image-picker unavailable', err);
    _picker = null;
  }
  return _picker;
}

export interface PickAndUploadResult {
  status: 'uploaded' | 'cancelled' | 'permission_denied' | 'not_available' | 'failed';
  avatarUrl?: string;
  message?: string;
}

export async function pickAndUploadAvatar(
  userId: string,
): Promise<PickAndUploadResult> {
  if (Platform.OS === 'web') {
    return { status: 'not_available', message: 'Photo upload is mobile-only.' };
  }
  if (!FIREBASE_CONFIGURED) {
    return { status: 'not_available', message: 'Firebase is not configured.' };
  }
  const Picker = getPicker();
  if (!Picker) {
    return {
      status: 'not_available',
      message: 'Photo picker is not available in this build.',
    };
  }

  // Permission.
  const perm = await Picker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== 'granted') {
    return {
      status: 'permission_denied',
      message: 'Allow photo library access in Settings to change your photo.',
    };
  }

  // Pick. Square crop, JPEG, modest quality to keep upload small.
  const result = await Picker.launchImageLibraryAsync({
    mediaTypes: Picker.MediaTypeOptions?.Images ?? 'Images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.[0]) {
    return { status: 'cancelled' };
  }
  const asset = result.assets[0];

  // Read the local URI into a Blob the SDK can upload.
  let blob: Blob;
  try {
    const res = await fetch(asset.uri);
    blob = await res.blob();
  } catch (err) {
    if (__DEV__) console.warn('avatar fetch local file failed', err);
    return { status: 'failed', message: 'Could not read the chosen image.' };
  }

  // Upload to Firebase Storage. Fixed key so re-uploads overwrite.
  const storage = getFbStorage();
  if (!storage) {
    return { status: 'not_available', message: 'Storage not configured.' };
  }
  const storageRef = ref(storage, `avatars/${userId}.jpg`);
  let downloadUrl: string;
  try {
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    downloadUrl = await getDownloadURL(storageRef);
  } catch (err) {
    if (__DEV__) console.warn('avatar upload failed', err);
    return {
      status: 'failed',
      message: 'Upload failed. Check your connection and try again.',
    };
  }

  // Persist the URL on the user doc so every subscriber updates.
  try {
    const db = getDb()!;
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      avatarUrl: downloadUrl,
      updatedAt: Date.now(),
    });
  } catch (err) {
    if (__DEV__) console.warn('avatar persist URL failed', err);
    return {
      status: 'failed',
      message: 'Photo uploaded but profile could not be updated. Try again.',
    };
  }

  return { status: 'uploaded', avatarUrl: downloadUrl };
}
