import { z } from 'zod';

export const NameSchema = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
});

export const LocationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
});

export const ContactSchema = z.object({
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
});

export const TwitterSchema = z.object({
  handle: z.string().optional(),
});

export const StatSchema = z.object({
  label: z.string(),
  value: z.string(),
  season: z.string().optional(),
  notes: z.string().optional(),
});

export const HighlightSchema = z.object({
  title: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  date: z.string().optional(),
  isFeatured: z.boolean().optional(),
  notes: z.string().optional(),
});

export const ScheduleEntrySchema = z.object({
  date: z.string(),
  opponent: z.string(),
  location: z.string().optional(),
  result: z.string().optional(),
  link: z.string().optional(),
});

export const GalleryImageSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
});

export const PhotosSchema = z.object({
  active: z
    .object({
      heroImage: z.string().optional(),
      featuredAction: z.string().optional(),
    })
    .optional(),
  gallery: z.array(GalleryImageSchema).optional(),
});

export const RecruitingPacketSchema = z.object({
  url: z.string(),
});

export const PerformanceSchema = z.object({
  metric: z.string(),
  value: z.number(),
  unit: z.string(),
  measuredAt: z.string(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const SEOSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const ProfileSchema = z.object({
  name: NameSchema,
  classYear: z.number().optional(),
  positions: z.array(z.string()).optional(),
  bats: z.string().optional(),
  throws: z.string().optional(),
  location: LocationSchema.optional(),
  height: z.string().optional(),
  weight: z.string().optional(),

  contact: ContactSchema.optional(),
  twitter: TwitterSchema.optional(),

  gpa: z.union([z.string(), z.number()]).optional(),
  testScores: z
    .object({
      SAT: z.string().optional(),
      ACT: z.string().optional(),
    })
    .optional(),
  coursework: z.array(z.string()).optional(),

  stats: z.array(StatSchema).optional(),
  highlights: z.array(HighlightSchema).optional(),
  schedule: z.array(ScheduleEntrySchema).optional(),

  photos: PhotosSchema.optional(),
  recruitingPacket: RecruitingPacketSchema.optional(),

  performance: z.array(PerformanceSchema).optional(),

  seo: SEOSchema.optional(),
});

export type ProfileFromSchema = z.infer<typeof ProfileSchema>;