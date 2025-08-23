import { Profile } from '@/lib/types';
import { ProfileSchema } from '@/lib/validation/schemas';
import { profile as sampleProfile } from '@/lib/sample/profile';

/**
 * getPublicProfile
 * Load profile data via env-configured JSON URL or fall back to local sample.
 * Validates and returns the UI Profile shape using Zod.
 */
export async function getPublicProfile(): Promise<Profile> {
  const url = process.env.NEXT_PUBLIC_PROFILE_JSON_URL;

  // Helper to safely validate unknown data
  const validate = (data: unknown): Profile => {
    const parsed = ProfileSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      console.warn('[getPublicProfile] Validation failed:', first?.path?.join('.') ?? '', first?.message ?? parsed.error.message);
      throw parsed.error;
    }
    return parsed.data;
  };

  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) {
        console.warn('[getPublicProfile] Non-OK response', res.status, res.statusText);
        return validate(sampleProfile);
      }
      const json = await res.json();
      return validate(json);
    } catch (err) {
      console.warn('[getPublicProfile] Fetch failed, falling back to sample', err);
      return validate(sampleProfile);
    }
  }

  // Default: local sample
  return validate(sampleProfile);
}