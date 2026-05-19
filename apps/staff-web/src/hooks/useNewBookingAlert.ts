import { useEffect, useRef } from 'react';
import type { Booking } from '@yb/shared';

// ─── useNewBookingAlert ────────────────────────────────────────────────────
//
// Plays a loud three-tone alert whenever a brand-new paid booking lands in
// the queue. Web Audio synthesis (no asset shipped) so the alert works on
// any modern browser without bundling MP3s.
//
// Browsers block audio until the user has interacted with the page at least
// once. The staff dashboard already requires sign-in (a click), so by the
// time bookings start streaming we're safely past the autoplay gate.
//
// Tracks notified IDs in a ref so a single booking only fires once even
// when Firestore replays the snapshot (re-attach, tab focus, etc.).

const STORAGE_KEY = 'yb-staff:new-booking-seen';
const FRESHNESS_MS = 5 * 60 * 1000; // 5 min — older than this and we assume the operator already saw it.

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function persistSeen(seen: Set<string>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    /* sessionStorage may be unavailable in private mode — fail silent */
  }
}

function playAlert(): void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    // Three rising beeps — cuts through ambient office noise without
    // being aggressive enough to startle.
    const tones: Array<{ freq: number; offset: number; gain: number }> = [
      { freq: 880, offset: 0, gain: 0.35 },
      { freq: 1175, offset: 0.18, gain: 0.35 },
      { freq: 1568, offset: 0.36, gain: 0.4 },
    ];
    for (const t of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = t.freq;
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t.offset);
      gain.gain.exponentialRampToValueAtTime(t.gain, ctx.currentTime + t.offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t.offset + 0.4);
      osc.start(ctx.currentTime + t.offset);
      osc.stop(ctx.currentTime + t.offset + 0.45);
    }
    // Optional: navigator.vibrate so it also buzzes on a touch device tab.
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate([150, 80, 150, 80, 250]);
    }
  } catch {
    /* audio context may be locked — nothing we can do until next user gesture */
  }
}

/**
 * Watch a bookings list (typically from useAllBookings) and fire an audio
 * alert any time a `paid` booking the operator hasn't seen before appears.
 * Safe to call on every render — internally throttles via a ref.
 */
export function useNewBookingAlert(bookings: Booking[]): void {
  const seenRef = useRef<Set<string>>(loadSeen());
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!bookings || bookings.length === 0) {
      bootedRef.current = true;
      return;
    }
    const now = Date.now();
    let fired = false;
    for (const b of bookings) {
      if (b.status !== 'paid') continue;
      if (now - b.createdAt > FRESHNESS_MS) continue;
      if (seenRef.current.has(b.id)) continue;
      seenRef.current.add(b.id);
      // Skip audio on the first render — that's just the initial load.
      if (bootedRef.current) {
        fired = true;
      }
    }
    persistSeen(seenRef.current);
    if (fired) playAlert();
    bootedRef.current = true;
  }, [bookings]);
}
