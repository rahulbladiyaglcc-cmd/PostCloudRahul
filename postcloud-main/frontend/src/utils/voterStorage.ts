import votersDatabase from '@/voters_database.json';
import type { RecordDetail } from '@/interfaces/record.interface';

// In-memory runtime cache per user to guarantee ultra-fast 0ms reads
const memoryStore = new Map<string, RecordDetail[]>();

export const CURRENT_DATABASE_VERSION = 'v9_indexeddb_persistent_store';

const IDB_NAME = 'postcloud_electoral_db';
const IDB_STORE = 'voters_store';
const IDB_VERSION = 1;

/**
 * Open or create native IndexedDB database with unlimited quota
 */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Get currently logged-in user from localStorage
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch { /* noop */ }
  return {
    id: 1,
    email: 'admin@gmail.com',
    firstName: 'Admin',
    lastName: '',
    role: 'ADMIN'
  };
}

/**
 * Storage key for specific user
 */
export function getUserStorageKey(email?: string): string {
  const user = email ? { email } : getCurrentUser();
  const safeEmail = (user?.email || 'admin@gmail.com').toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `custom_voter_records_${safeEmail}`;
}

/**
 * Initialize storage on application startup by loading from IndexedDB into memory
 */
export async function initVoterStorage(): Promise<RecordDetail[]> {
  const user = getCurrentUser();
  const userKey = getUserStorageKey(user.email);
  const isAdmin = (user.email || '').toLowerCase().includes('admin');

  try {
    // 1. Load from IndexedDB (Unlimited persistent storage across page refreshes)
    const idbData = await idbGet<RecordDetail[]>(userKey);
    if (Array.isArray(idbData) && idbData.length > 0) {
      memoryStore.set(userKey, idbData);
      return idbData;
    }
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
  }

  // 2. Fallback check from localStorage
  try {
    const stored = localStorage.getItem(userKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStore.set(userKey, parsed);
        idbSet(userKey, parsed); // sync to IndexedDB
        return parsed as RecordDetail[];
      }
    }
  } catch { /* ignore */ }

  // 3. For admin accounts, initialize base voter records
  if (isAdmin) {
    const base = (votersDatabase.allVoters || []) as unknown as RecordDetail[];
    memoryStore.set(userKey, base);
    idbSet(userKey, base);
    try {
      localStorage.setItem(userKey, JSON.stringify(base.slice(0, 300))); // small summary preview
    } catch { /* ignore */ }
    return base;
  }

  // 4. For new individual accounts, start clean
  memoryStore.set(userKey, []);
  return [];
}

// Auto-trigger background hydration immediately on file load
if (typeof window !== 'undefined') {
  initVoterStorage();
}

/**
 * Retrieve voters synchronously for current user.
 */
export function getStoredVoters(): RecordDetail[] {
  const user = getCurrentUser();
  const userKey = getUserStorageKey(user.email);
  const isAdmin = (user.email || '').toLowerCase().includes('admin');

  // 1. In-memory cache
  if (memoryStore.has(userKey)) {
    return memoryStore.get(userKey)!;
  }

  // 2. LocalStorage fast check
  try {
    const stored = localStorage.getItem(userKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        memoryStore.set(userKey, parsed);
        return parsed as RecordDetail[];
      }
    }
  } catch { /* noop */ }

  // 3. Admin initialization
  if (isAdmin) {
    const base = (votersDatabase.allVoters || []) as unknown as RecordDetail[];
    memoryStore.set(userKey, base);
    idbSet(userKey, base);
    return base;
  }

  memoryStore.set(userKey, []);
  return [];
}

/**
 * Saves or merges voter records into the current user's isolated storage
 * Persists permanently to IndexedDB (preventing 5MB localStorage quota loss on refresh)
 */
export function saveVoterRecords(newRecords: RecordDetail[], targetPartNumber?: string): RecordDetail[] {
  const user = getCurrentUser();
  const userKey = getUserStorageKey(user.email);
  
  try {
    const current = getStoredVoters();
    const mapById = new Map<string, any>();

    for (const v of current) {
      const vId = String(v.id || `${v.partNumber || 1}_${v.serialNumber || Math.random()}`);
      v.id = vId;
      mapById.set(vId, v);
    }

    newRecords.forEach((v, idx) => {
      if (!v.user) {
        v.user = {
          id: user.id || 1,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        };
      }

      // Generate a collision-resistant unique ID if needed
      let recId = String(v.id || `rec_${Date.now()}_${idx}`);
      if (mapById.has(recId)) {
        const existing = mapById.get(recId);
        const isSamePerson = (v.electionID && existing.electionID && String(v.electionID).trim().toUpperCase() === String(existing.electionID).trim().toUpperCase()) ||
          (v.firstName === existing.firstName && v.lastName === existing.lastName && v.houseNumber === existing.houseNumber);
        
        if (!isSamePerson) {
          recId = `${recId}_${Date.now()}_${idx}`;
          v.id = recId;
        }
      }

      mapById.set(recId, v);
    });

    const updated = Array.from(mapById.values()) as RecordDetail[];
    
    // 1. Immediately update fast in-memory store
    memoryStore.set(userKey, updated);

    // 2. Permanently persist in IndexedDB (Unlimited size, safe for 100,000+ records)
    idbSet(userKey, updated);

    // 3. Best-effort preview in localStorage
    try {
      localStorage.setItem(`voters_db_version_${userKey}`, CURRENT_DATABASE_VERSION);
    } catch { /* ignore */ }

    return updated;
  } catch (err) {
    console.error('Failed to save voter records:', err);
    memoryStore.set(userKey, newRecords);
    idbSet(userKey, newRecords);
    return newRecords;
  }
}
