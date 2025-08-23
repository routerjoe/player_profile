import { Profile } from '@/lib/types';
import { ProfileSchema } from '@/lib/validation/schemas';

const KEY_RAW = 'pp:dashboard:draft:raw';
const KEY_LAST_VALID = 'pp:dashboard:draft:lastValid';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function read(key: string): any | null {
  if (!canUseStorage()) return null;
  const s = window.localStorage.getItem(key);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function write(key: string, value: any): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getRawDraft<T = any>(): T | null {
  return read(KEY_RAW);
}

export function setRawDraft(value: any): void {
  write(KEY_RAW, value);
}

/**
 * Return last valid Profile draft (validated by Zod) if available,
 * otherwise null. Use getRawDraft() to access possibly-invalid form state.
 */
export function getDraft(): Profile | null {
  const raw = getRawDraft();
  if (raw) {
    const parsed = ProfileSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }
  const lastValid = read(KEY_LAST_VALID);
  return lastValid ?? null;
}

/**
 * Save the draft (raw) and, if valid, also persist a last-valid snapshot.
 * Returns validation status and issues when invalid.
 */
export function saveDraft(value: any): {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
} {
  setRawDraft(value);
  const parsed = ProfileSchema.safeParse(value);
  if (parsed.success) {
    write(KEY_LAST_VALID, parsed.data);
    return { valid: true };
  }
  const errors = parsed.error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
  return { valid: false, errors };
}

export function resetDraft(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(KEY_RAW);
  window.localStorage.removeItem(KEY_LAST_VALID);
}

export function exportDraft(preferValid = true): string {
  const data = preferValid ? getDraft() ?? getRawDraft() : getRawDraft() ?? getDraft();
  return JSON.stringify(data ?? {}, null, 2);
}

export function importDraft(json: string): {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
} {
  try {
    const obj = JSON.parse(json);
    return saveDraft(obj);
  } catch (e: any) {
    return { valid: false, errors: [{ path: '', message: e?.message ?? 'Invalid JSON' }] };
  }
}

/**
 * Subscribe to storage changes across tabs/windows.
 * Returns an unsubscribe function.
 */
export function subscribe(
  callback: (raw: any, valid: Profile | null) => void,
): () => void {
  if (!canUseStorage()) return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === KEY_RAW || e.key === KEY_LAST_VALID) {
      callback(getRawDraft(), getDraft());
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}