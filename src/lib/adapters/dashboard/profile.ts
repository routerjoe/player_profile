import { Profile } from '@/lib/types';
import { ProfileSchema } from '@/lib/validation/schemas';

export type StorageProfile = Record<string, unknown>;

export function toStorageProfile(ui: Profile): StorageProfile {
  const json = JSON.parse(JSON.stringify(ui));
  return json as StorageProfile;
}

export function fromStorageProfile(storage: unknown): Profile {
  const parsed = ProfileSchema.safeParse(storage);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    throw new Error(
      `[fromStorageProfile] Invalid storage payload: ${first?.path?.join('.') ?? ''} ${first?.message ?? parsed.error.message}`,
    );
  }
  return parsed.data;
}