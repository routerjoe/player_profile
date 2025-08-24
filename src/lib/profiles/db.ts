import { promises as fs } from 'fs';
import path from 'path';
import type { Profile } from '@/lib/types';
import { DATA_DIR } from '@/lib/users/db';

export const PROFILES_JSON_PATH = path.join(DATA_DIR, 'profiles.json');

export interface StoredProfile {
  playerId: string;
  profile: Profile;
  updatedAt: string; // ISO
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function ensureProfilesFile(): Promise<void> {
  await ensureDataDir();
  try {
    await fs.access(PROFILES_JSON_PATH);
  } catch {
    await fs.writeFile(PROFILES_JSON_PATH, '[]\n', 'utf8');
  }
}

export async function readAllProfiles(): Promise<StoredProfile[]> {
  await ensureProfilesFile();
  try {
    const raw = await fs.readFile(PROFILES_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredProfile[]) : [];
  } catch {
    try {
      const bad = `profiles-${Date.now()}.bad.json`;
      await fs.rename(PROFILES_JSON_PATH, path.join(DATA_DIR, bad));
    } catch {}
    await fs.writeFile(PROFILES_JSON_PATH, '[]\n', 'utf8');
    return [];
  }
}

export async function writeAllProfiles(rows: StoredProfile[]): Promise<void> {
  await ensureDataDir();
  const tmp = `${PROFILES_JSON_PATH}.tmp`;
  const payload = JSON.stringify(rows, null, 2) + '\n';
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, PROFILES_JSON_PATH);
}

export async function getProfileForPlayer(playerId: string): Promise<StoredProfile | undefined> {
  const all = await readAllProfiles();
  return all.find((r) => r.playerId === playerId);
}

export async function upsertProfile(playerId: string, profile: Profile): Promise<StoredProfile> {
  const all = await readAllProfiles();
  const now = new Date().toISOString();
  const idx = all.findIndex((r) => r.playerId === playerId);
  const row: StoredProfile = { playerId, profile, updatedAt: now };
  if (idx >= 0) {
    all[idx] = row;
  } else {
    all.push(row);
  }
  await writeAllProfiles(all);
  return row;
}

export async function getLatestProfile(): Promise<StoredProfile | undefined> {
  const all = await readAllProfiles();
  if (!all.length) return undefined;
  // Sort by updatedAt desc
  return [...all].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
}