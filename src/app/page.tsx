import { getPublicProfile } from '@/lib/adapters/public/profile';
import { Hero } from '@/components/sections/Hero';
import { QuickStats } from '@/components/sections/QuickStats';
import { BioAcademics } from '@/components/sections/BioAcademics';
import { Highlights } from '@/components/sections/Highlights';
import { Schedule } from '@/components/sections/Schedule';
import { RecruitingPacket } from '@/components/sections/RecruitingPacket';
import { Contact } from '@/components/sections/Contact';

export default async function HomePage() {
  const profile = await getPublicProfile();
  return (
    <main className="min-h-screen">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <Hero profile={profile} />
        <QuickStats profile={profile} />
        <BioAcademics profile={profile} />
        <Highlights profile={profile} />
        <Schedule profile={profile} />
        <RecruitingPacket profile={profile} />
        <Contact profile={profile} />
      </section>
    </main>
  );
}