// YB Ride — Cloud Functions entrypoint.
//
// Initializes the Admin SDK once and re-exports every callable / trigger
// from its own module. Keeping functions in separate files keeps each one
// under the 500-line cap from CLAUDE.md.

import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { createStaffAccount } from './createStaffAccount';
export { notifyOnBookingStatusChange } from './notifyOnBookingStatusChange';
// paystackWebhook ships after PAYSTACK_SECRET is set in Secret Manager.
// Re-enable this export once the secret exists.
// export { paystackWebhook } from './paystackWebhook';
