import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { COLLECTIONS, type SavedAddress } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

// /users/{uid}/savedAddresses/{addressId}
//
// Storing saved places as a Firestore subcollection (not as an array on the
// user doc) avoids the 1 MB doc cap, lets each address be edited / deleted
// independently, and keeps the per-doc updatedAt timestamps useful for
// "most recently used" sorting later.
//
// Fields persisted per doc:
//   id            (doc id; set by Firestore, not in the data payload)
//   type          'home' | 'work' | 'other'
//   label         human label ("Home", "Mom's place")
//   formatted     full address string from geocoding
//   point         { latitude, longitude } — required for routing
//   placeId       optional Mapbox / Google place id
//   createdAt     ms epoch

type Unsubscribe = () => void;

function addressesRef(userId: string) {
  return collection(getDb()!, COLLECTIONS.USERS, userId, 'savedAddresses');
}

function addressDoc(userId: string, addressId: string) {
  return doc(getDb()!, COLLECTIONS.USERS, userId, 'savedAddresses', addressId);
}

/**
 * Live list of the passenger's saved addresses, ordered by createdAt asc
 * (oldest first) so the Home + Work pills always appear before later ones.
 * Returns an empty list while Firestore isn't configured so the UI degrades
 * gracefully in dev.
 */
export function subscribeSavedAddresses(
  userId: string,
  callback: (addresses: SavedAddress[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const q = query(addressesRef(userId), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as DocumentData) } as SavedAddress),
      );
      callback(rows);
    },
    (err) => {
      if (__DEV__) console.warn('subscribeSavedAddresses error', err);
    },
  );
}

export type SaveAddressInput = Omit<SavedAddress, 'id' | 'createdAt'>;

/**
 * Create a new saved address under /users/{uid}/savedAddresses.
 * Returns the generated doc id so the caller can navigate / select it.
 */
export async function addSavedAddress(
  userId: string,
  input: SaveAddressInput,
): Promise<string> {
  if (!FIREBASE_CONFIGURED) {
    throw new Error('Firebase not configured.');
  }
  const ref = await addDoc(addressesRef(userId), {
    ...input,
    createdAt: Date.now(),
  });
  return ref.id;
}

/**
 * Update an existing saved address. Caller provides only the fields that
 * change; createdAt is preserved.
 */
export async function updateSavedAddress(
  userId: string,
  addressId: string,
  partial: Partial<SaveAddressInput>,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) {
    throw new Error('Firebase not configured.');
  }
  await updateDoc(addressDoc(userId, addressId), partial);
}

export async function deleteSavedAddress(
  userId: string,
  addressId: string,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) {
    throw new Error('Firebase not configured.');
  }
  await deleteDoc(addressDoc(userId, addressId));
}
