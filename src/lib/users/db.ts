import { promises as fs } from 'fs';
import path from 'path';
import type { UserRecord } from '@/lib/users/types';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const USERS_JSON_PATH = path.join(DATA_DIR, 'users.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function ensureUsersFile(): Promise<void> {
  await ensureDataDir();
  try {
    await fs.access(USERS_JSON_PATH);
  } catch {
    await fs.writeFile(USERS_JSON_PATH, '[]\n', 'utf8');
  }
}

export async function readAllUsers(): Promise<UserRecord[]> {
  await ensureUsersFile();
  try {
    const raw = await fs.readFile(USERS_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserRecord[]) : [];
  } catch {
    try {
      const badName = `users-${Date.now()}.bad.json`;
      await fs.rename(USERS_JSON_PATH, path.join(DATA_DIR, badName));
    } catch {}
    await fs.writeFile(USERS_JSON_PATH, '[]\n', 'utf8');
    return [];
  }
}

export async function writeAllUsers(rows: UserRecord[]): Promise<void> {
  await ensureDataDir();
  const tmpPath = `${USERS_JSON_PATH}.tmp`;
  const payload = JSON.stringify(rows, null, 2) + '\n';
  await fs.writeFile(tmpPath, payload, 'utf8');
  await fs.rename(tmpPath, USERS_JSON_PATH);
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  const all = await readAllUsers();
  return all.find((u) => u.id === id);
}

export async function findUserByUsernameOrEmail(usernameOrEmail: string): Promise<UserRecord | undefined> {
  const q = usernameOrEmail.trim().toLowerCase();
  const all = await readAllUsers();
  return all.find((u) => u.username.toLowerCase() === q || u.email.toLowerCase() === q);
}

export async function isUsernameTaken(username: string, exceptId?: string): Promise<boolean> {
  const q = username.trim().toLowerCase();
  const all = await readAllUsers();
  return all.some((u) => u.username.toLowerCase() === q && u.id !== exceptId);
}

export async function isEmailTaken(email: string, exceptId?: string): Promise<boolean> {
  const q = email.trim().toLowerCase();
  const all = await readAllUsers();
  return all.some((u) => u.email.toLowerCase() === q && u.id !== exceptId);
}

export async function upsertUser(row: UserRecord): Promise<void> {
  const all = await readAllUsers();
  const i = all.findIndex((u) => u.id === row.id);
  if (i >= 0) {
    all[i] = row;
  } else {
    all.push(row);
  }
  await writeAllUsers(all);
}

export async function deleteUserById(id: string): Promise<void> {
  const all = await readAllUsers();
  const i = all.findIndex((u) => u.id === id);
  if (i >= 0) {
    all.splice(i, 1);
    await writeAllUsers(all);
  }
}