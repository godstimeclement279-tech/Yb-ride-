import { EventEmitter } from 'node:events';

// ─── Fake "Firestore" helpers ───────────────────────────────────────────────

function fromValueProto(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  const v = value as Record<string, unknown>;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (Array.isArray(v.arrayValue)) return v.arrayValue.map(fromValueProto);
  if (v.arrayValue !== undefined) {
    const arrayValue = v.arrayValue as { values?: unknown[] };
    return (arrayValue.values ?? []).map(fromValueProto);
  }
  if (v.mapValue !== undefined) {
    const mapValue = v.mapValue as { fields?: Record<string, unknown> };
    return Object.fromEntries(
      Object.entries(mapValue.fields ?? {}).map(([k, val]) => [k, fromValueProto(val)]),
    );
  }
  return undefined;
}

// ─── In-memory Firestore fake ───────────────────────────────────────────────
// Covers exactly the surface the cloud functions use: doc(path) → ref with
// get/set/update/delete, and runTransaction(txFn) where tx.get/update act on
// the underlying docs. Payloads are cloned so tests can mutate captured
// results without contaminating the fixture.

export class FakeFirestore {
  private docs = new Map<string, Record<string, unknown>>();
  readonly updates: Array<{ path: string; kind: 'set' | 'update' | 'delete'; data?: unknown }> =
    [];

  clear(): void {
    this.docs.clear();
    this.updates.length = 0;
  }

  seed(path: string, data: object): void {
    this.docs.set(path, structuredClone(data) as Record<string, unknown>);
  }

  // firebase-functions converts CloudEvent payloads to snapshots through
  // Firestore#snapshot_, so the fake implements just enough of that surface:
  // a resource-name string means a missing snapshot; a Document proto means
  // an existing one whose fields need plain-value decoding.
  snapshot_(protoOrName: unknown, _readTime?: unknown, _source?: string): {
    exists: boolean;
    data: () => Record<string, unknown> | undefined;
  } {
    if (typeof protoOrName !== 'object' || protoOrName === null) {
      return { exists: false, data: () => undefined };
    }
    const fields = (protoOrName as { fields?: Record<string, unknown> }).fields ?? {};
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, fromValueProto(value)]),
    );
    return { exists: true, data: () => structuredClone(data) };
  }

  doc(path: string): {
    get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
    set: (data: unknown, opts?: unknown) => Promise<void>;
    update: (data: unknown) => Promise<void>;
    delete: () => Promise<void>;
  } {
    const clone = (v: unknown): unknown =>
      v === undefined ? v : structuredClone(v);
    return {
      get: async () => {
        const found = this.docs.get(path);
        return {
          exists: found !== undefined,
          data: () => (found === undefined ? undefined : structuredClone(found)),
        };
      },
      set: async (data, _opts) => {
        this.docs.set(path, structuredClone(data as Record<string, unknown>));
        this.updates.push({ path, kind: 'set', data: clone(data) });
      },
      update: async (data) => {
        this.docs.set(path, { ...(this.docs.get(path) ?? {}), ...structuredClone(data as Record<string, unknown>) });
        this.updates.push({ path, kind: 'update', data: clone(data) });
      },
      delete: async () => {
        this.docs.delete(path);
        this.updates.push({ path, kind: 'delete' });
      },
    };
  }

  runTransaction(fn: (tx: {
    get: (ref: { get: () => Promise<{ exists: boolean; data(): unknown }> }) => Promise<{ exists: boolean; data(): unknown }>;
    update: (ref: { update: (data: unknown) => Promise<void> }, data: unknown) => Promise<void>;
  }) => Promise<void>): Promise<void> {
    return fn({
      get: async (ref) => ref.get(),
      update: async (ref, data) => ref.update(data),
    });
  }
}

// ─── Mock Express req/res ────────────────────────────────────────────────────
// The v2 function wrappers only touch a small slice of the Express surface:
// req.header(s), req.method, req.body, req.headers, req.rawBody, plus
// res.on('finish'), res.status().send(), res.setHeader/getHeader/write/end.

export interface InvokeHttpOptions {
  method?: string;
  headers?: Record<string, string | undefined>;
  body?: unknown;
  rawBody?: Buffer;
}

export interface InvokeHttpResult {
  status: number;
  body: unknown;
}

class MockResponse extends EventEmitter {
  statusCode = 200;
  body: unknown;
  headers: Record<string, string> = {};

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  send(body: unknown): void {
    this.body = body;
    this.endSoon();
  }

  end(): void {
    this.endSoon();
  }

  write(): boolean {
    return false;
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  getHeader(name: string): string | undefined {
    return this.headers[name];
  }

  // finish must fire after the handler has settled (the wrapper resolves on
  // 'finish'), so defer it past the current microtask batch.
  private endSoon(): void {
    setTimeout(() => this.emit('finish'), 0);
  }
}

export function invokeHttp(
  fn: (req: unknown, res: unknown) => unknown,
  options: InvokeHttpOptions = {},
): Promise<InvokeHttpResult> {
  const headers: Record<string, string | undefined> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const req: Record<string, unknown> = {
    method: options.method ?? 'POST',
    body: options.body,
    rawBody: options.rawBody,
    headers,
    header(name: string): string | undefined {
      const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
      return key === undefined ? undefined : headers[key];
    },
  };
  const res = new MockResponse();
  const result = fn(req, res);
  return Promise.resolve(result)
    .catch(() => undefined)
    .then(() => ({ status: res.statusCode, body: res.body }));
}

// ─── Callable envelope ──────────────────────────────────────────────────────
// Mirrors the payload checks in isValidRequest() (POST + JSON body with only
// a `data` key) and the emulator's tracking of `finish`.

export interface InvokeCallableOptions {
  data?: unknown;
  auth?: { uid: string };
}

export async function invokeCallable(
  fn: (req: unknown, res: unknown) => unknown,
  options: InvokeCallableOptions = {},
): Promise<InvokeHttpResult> {
  const headers: Record<string, string | undefined> = {};
  if (options.auth) headers.Authorization = `Bearer ${fakeIdToken(options.auth.uid)}`;
  return invokeHttp(fn, {
    method: 'POST',
    headers,
    body: { data: options.data === undefined ? null : options.data },
  });
}

// Payload-only fake ID token. firebase-functions decodes (never verifies)
// tokens when FIREBASE_DEBUG_MODE + skipTokenVerification is enabled in
// vitest.config.ts; `sub` becomes auth.uid.
function fakeIdToken(uid: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: uid, aud: 'unit-test', exp: 4_100_000_000 }),
  ).toString('base64url');
  return `eyJhbGciOiJub25lIn0.${payload}.signature`;
}

export function callableError(result: InvokeHttpResult): { status: number; code: string; message: string } {
  const body = result.body as { error?: { status?: string; message?: string } } | undefined;
  return {
    status: result.status,
    // The v2 callable wire protocol uppercases the status and separates
    // words with underscores; normalize back to the HttpsErrorCode spelling.
    code: (body?.error?.status ?? '').toLowerCase().replaceAll('_', '-'),
    message: body?.error?.message ?? '',
  };
}
