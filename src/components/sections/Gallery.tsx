import Image from 'next/image';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { getPhotosByUsage } from '@/lib/photos/service';
import type { PhotoRecord } from '@/lib/photos/types';

export async function Gallery({ playerId }: { playerId: string }) {
  const photos: PhotoRecord[] = await getPhotosByUsage(playerId, 'gallery' as any);
  if (!Array.isArray(photos) || photos.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeading as="h2" subtitle="Selected images from recent games and training">
        Gallery
      </SectionHeading>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((p) => {
          const isExternal = /^https?:\/\//i.test(p.url);
          const isSvg = /\.svg($|\?)/i.test(p.url);
          const alt = p.alt || p.title || 'Gallery image';
          return (
            <li key={p.id}>
              <Card className="overflow-hidden p-0">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)]"
                  aria-label={`Open image: ${alt}`}
                >
                  <div className="relative w-full pt-[75%] bg-slate-100">
                    {isExternal || isSvg ? (
                      <img
                        src={p.url}
                        alt={alt}
                        width={800}
                        height={600}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={p.url}
                        alt={alt}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 ring-1 ring-black/5" />
                  </div>
                </a>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default Gallery;