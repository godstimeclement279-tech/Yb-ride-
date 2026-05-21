import { Card, Field, PageHeader, Pill, SectionTitle, Select, StatRow } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { COLLECTIONS, FIREBASE_REGION, RTDB_PATHS } from '@yb/shared';
import { FIREBASE_CONFIG } from '../services/firebase/config';

// Settings shows what's currently live in the deployed system. Anything
// that isn't actually wired to a backend write is hidden — empty placeholder
// inputs were misleading operators into thinking they could change values
// that are baked into code.

export function Settings() {
  const { mode, setMode } = useTheme();
  const { admin } = useAuth();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="What's live right now. Most values are baked into code or Cloud Function secrets — edit them in the repo, not here."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <Card>
          <SectionTitle>Appearance</SectionTitle>
          <Field label="Theme">
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'light' | 'dark')}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
        </Card>

        <Card>
          <SectionTitle>Signed in as</SectionTitle>
          <StatRow label="Name" value={admin?.name ?? '—'} />
          <StatRow label="Email" value={admin?.email ?? '—'} />
          <StatRow label="UID" value={admin?.id ?? '—'} />
        </Card>

        <Card>
          <SectionTitle>Operations</SectionTitle>
          <StatRow label="Service area" value="Agbor, Delta State, Nigeria" />
          <StatRow label="Currency" value="NGN (integer kobo)" />
          <StatRow label="Driver GPS push interval" value="5 seconds" />
          <StatRow label="Dropoff geofence" value="50 m · 30 s dwell" />
        </Card>

        <Card>
          <SectionTitle>Payments</SectionTitle>
          <Field label="Allowed methods">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone="success">Bank transfer (Paystack)</Pill>
              <Pill tone="neutral">Card (post-MVP)</Pill>
              <Pill tone="neutral">Wallet (post-MVP)</Pill>
            </div>
          </Field>
          <Field
            label="Paystack secret"
            hint="Stored as a Cloud Functions secret (PAYSTACK_SECRET). Rotate via firebase functions:secrets:set."
          >
            <Pill tone="info">Managed in Secret Manager</Pill>
          </Field>
          <Field label="Webhook URL" hint="Configure this in Paystack dashboard → Webhook URL.">
            <StatRow
              label=""
              value="https://europe-west1-yb-ride-fe206.cloudfunctions.net/paystackWebhook"
            />
          </Field>
        </Card>

        <Card>
          <SectionTitle>Maps</SectionTitle>
          <StatRow label="Provider" value="Mapbox" />
          <StatRow
            label="Public token"
            value="hardcoded in services/mapbox.ts"
          />
          <StatRow
            label="Download token"
            value="EAS secret MAPBOX_DOWNLOAD_TOKEN (per project)"
          />
        </Card>

        <Card>
          <SectionTitle>Notifications</SectionTitle>
          <StatRow label="Provider" value="Firebase Cloud Messaging (FCM)" />
          <StatRow label="Driver alert channel" value="urgent (MAX importance, bypass DND)" />
          <StatRow label="Passenger / staff channel" value="default" />
          <StatRow
            label="Trigger"
            value="notifyOnBookingStatusChange Cloud Function"
          />
        </Card>

        <Card>
          <SectionTitle>System</SectionTitle>
          <StatRow label="Firebase project" value={FIREBASE_CONFIG.projectId} />
          <StatRow label="Firebase region" value={FIREBASE_REGION} />
          <StatRow label="Bookings collection" value={COLLECTIONS.BOOKINGS} />
          <StatRow label="Drivers collection" value={COLLECTIONS.DRIVERS} />
          <StatRow label="RTDB locations" value={RTDB_PATHS.DRIVER_LOCATIONS} />
          <StatRow label="Dashboard version" value="v0.1.0" />
        </Card>
      </div>
    </>
  );
}
