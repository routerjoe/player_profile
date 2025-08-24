import { Profile } from '@/lib/types';
import { ProfileSchema } from '@/lib/validation/schemas';
import { profile as sampleProfile } from '@/lib/sample/profile';
import { getProfileForPlayer } from '@/lib/profiles/db';

/**
 * getPublicProfile
 * Prefer the locally published profile for the player. Fallbacks:
 *   1) NEXT_PUBLIC_PROFILE_JSON_URL if provided
 *   2) bundled sample profile
 * Validates the returned object.
 */
export async function getPublicProfile(playerId: string): Promise<Profile> {
  const validate = (data: unknown): Profile => {
    const parsed = ProfileSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      console.warn(
        '[getPublicProfile] Validation failed:',
        first?.path?.join('.') ?? '',
        first?.message ?? parsed.error.message,
      );
      throw parsed.error;
    }
    return parsed.data;
  };

  // 1) Published local profile (data/profiles.json)
  try {
    const row = await getProfileForPlayer(playerId);
    if (row?.profile) {
      return validate(row.profile);
    }
  } catch (err) {
    console.warn('[getPublicProfile] Failed to load published profile, continuing to remote/sample', err);
  }

  // 2) Env-configured remote JSON URL (optional)
  const url = process.env.NEXT_PUBLIC_PROFILE_JSON_URL;
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (res.ok) {
        const json = await res.json();
        return validate(json);
      }
      console.warn('[getPublicProfile] Non-OK response', res.status, res.statusText);
    } catch (err) {
      console.warn('[getPublicProfile] Remote fetch failed', err);
    }
  }

  // 3) Fallback: bundled sample
  return validate(sampleProfile);
}