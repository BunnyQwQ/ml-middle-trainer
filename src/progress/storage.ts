/**
 * Persistence with three tiers and no way to throw at the caller:
 *   IndexedDB -> localStorage -> in-memory.
 * Every browser call is wrapped, so private mode, blocked storage or a
 * quota error degrades the app instead of breaking it.
 */

export type StorageKind = 'idb' | 'local' | 'memory';

const DB_NAME = 'mlmt';
const STORE = 'kv';
const DB_VERSION = 1;

let kind: StorageKind | null = null;
const memory = new Map<string, string>();

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        } catch {
          /* ignore */
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
      // Safari can hang the open request forever in private mode.
      setTimeout(() => resolve(req.readyState === 'done' ? req.result ?? null : null), 2000);
    } catch {
      resolve(null);
    }
  });
}

async function idbOp<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<{ ok: true; value: T } | { ok: false }> {
  const db = await openDb();
  if (!db) return { ok: false };
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      req.onsuccess = () => resolve({ ok: true, value: req.result });
      req.onerror = () => resolve({ ok: false });
      tx.onabort = () => resolve({ ok: false });
    } catch {
      resolve({ ok: false });
    }
  });
}

function localGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function localSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export async function storageGet(key: string): Promise<string | null> {
  const res = await idbOp<string | undefined>('readonly', (s) => s.get(key) as IDBRequest<string | undefined>);
  if (res.ok) {
    kind = 'idb';
    if (typeof res.value === 'string') return res.value;
    // Fall through: an older session may have written to localStorage.
    const legacy = localGet(key);
    return legacy;
  }
  const local = localGet(key);
  if (local !== null) {
    kind = 'local';
    return local;
  }
  kind = kind ?? (typeof localStorage === 'undefined' ? 'memory' : 'local');
  return memory.get(key) ?? null;
}

export async function storageSet(key: string, value: string): Promise<void> {
  const res = await idbOp('readwrite', (s) => s.put(value, key) as IDBRequest<IDBValidKey>);
  if (res.ok) {
    kind = 'idb';
    return;
  }
  if (localSet(key, value)) {
    kind = 'local';
    return;
  }
  kind = 'memory';
  memory.set(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  await idbOp('readwrite', (s) => s.delete(key) as IDBRequest<undefined>);
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  memory.delete(key);
}

/** Which tier actually served the last operation. Shown in settings. */
export function storageKind(): StorageKind {
  return kind ?? 'memory';
}

/** Test seam: reset the cached tier detection. */
export function resetStorageKind(): void {
  kind = null;
  memory.clear();
}
