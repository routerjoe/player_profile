import Image from 'next/image';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { getPhotosByUsage } from '@/lib/photos/service';
import type { PhotoRecord } from '@/lib/photos/types';
import { GalleryClient } from '@/components/sections/GalleryClient';

export async function Gallery({ playerId }: { playerId: string }) {
  const photos: PhotoRecord[] = await getPhotosByUsage(playerId, 'gallery' as any);
  if (!Array.isArray(photos) || photos.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Selected images from recent games and training">
        Gallery
      </SectionHeading>

      <GalleryClient photos={photos} />
    </section>
  );
}

export default Gallery;