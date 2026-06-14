// YB Ride — Cloud Functions entrypoint.
//
// Initializes the Admin SDK once and re-exports every callable / trigger
// from its own module. Keeping functions in separate files keeps each one
// under the 500-line cap from CLAUDE.md.

import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { createStaffAccount } from './createStaffAccount';
export { deleteAccount } from './deleteAccount';
export { initializePaystackTransaction } from './initializePaystackTransaction';
export { notifyOnBookingStatusChange } from './notifyOnBookingStatusChange';
export { paystackWebhook } from './paystackWebhook';
