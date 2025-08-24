import { getPublicProfile } from '@/lib/adapters/public/profile';
import { Hero } from '@/components/sections/Hero';
import { QuickStats } from '@/components/sections/QuickStats';
import { BioAcademics } from '@/components/sections/BioAcademics';
import { Highlights } from '@/components/sections/Highlights';
import { Schedule } from '@/components/sections/Schedule';
import { RecruitingPacket } from '@/components/sections/RecruitingPacket';
import { Contact } from '@/components/sections/Contact';
import { getHeroPhoto } from '@/lib/photos/service';
import { getThemeForPlayer } from '@/lib/users/public';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/users/session';
import { getLatestProfile } from '@/lib/profiles/db';
import { Performance } from '@/components/sections/Performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export default async function HomePage({ searchParams }: { searchParams?: { playerId?: string } }) {
  // Resolve playerId in this order:
  // 1) Logged-in session player
  // 2) Latest published profile
  // 3) Env default or 'demo'
  let playerId: string | null = null;
  const requested = searchParams?.playerId?.toString().trim();
  if (requested) {
    playerId = requested;
  }
  try {
    const token = cookies().get('pp_session')?.value;
    if (token) {
      const sess = verifySessionToken(token);
      if (sess?.playerId) {
        playerId = sess.playerId;
      }
    }
  } catch {
    // ignore cookie parsing errors; continue
  }
  if (!playerId) {
    try {
      const latest = await getLatestProfile();
      if (latest?.playerId) {
        playerId = latest.playerId;
      }
    } catch {
      // ignore
    }
  }
  if (!playerId) {
    playerId = process.env.NEXT_PUBLIC_DEFAULT_PLAYER_ID ?? 'demo';
  }

  // Load published profile for the resolved player
  const profile = await getPublicProfile(playerId);

  const [hero, theme] = await Promise.all([
    getHeroPhoto(playerId),
    getThemeForPlayer(playerId),
  ]);

  const frameColor = theme?.heroFrame || 'var(--brand-green)';
  const fillColor = theme?.heroFill || frameColor;
  const overlayOpacity = typeof theme?.heroOverlayOpacity === 'number' ? theme?.heroOverlayOpacity : undefined;
  const overlayEnabled = theme?.heroOverlayEnabled !== false;
  return (
    <main className="min-h-screen">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <Hero
          profile={profile}
          heroUrlOverride={hero?.url}
          frameColor={frameColor}
          fillColor={fillColor}
          overlayOpacity={overlayOpacity}
          overlayEnabled={overlayEnabled}
        />
        <QuickStats profile={profile} />
        <Performance profile={profile} />
        <BioAcademics profile={profile} />
        <Highlights profile={profile} />
        <Schedule profile={profile} />
        <RecruitingPacket profile={profile} />
        <Contact profile={profile} />
      </section>
    </main>
  );
}