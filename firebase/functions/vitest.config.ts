import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    env: {
      // firebase-functions decodes (instead of verifying) ID tokens when the
      // skipTokenVerification debug feature is on; tests send fake tokens
      // whose `sub` claim becomes request.auth.uid.
      FIREBASE_DEBUG_MODE: 'true',
      FIREBASE_DEBUG_FEATURES: JSON.stringify({ skipTokenVerification: true }),
      // Secret values are read from process.env when running outside Cloud.
      PAYSTACK_SECRET: 'test-paystack-secret',
    },
  },
});
