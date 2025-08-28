// Player Profile data model types

export interface Name { first: string; last: string }
export interface Location { city?: string; state?: string }
export interface Contact { email?: string; website?: string; phone?: string }
export interface Twitter { handle?: string }

export interface Stat { label: string; value: string; season?: string; notes?: string }
export interface Highlight { title?: string; videoUrl?: string; thumbnailUrl?: string; date?: string; isFeatured?: boolean; notes?: string }
export interface ScheduleEntry { type?: 'game' | 'practice'; date: string; opponent?: string; location?: string; result?: string; link?: string }
export interface GalleryImage { url: string; alt: string }
export interface Photos { active?: { heroImage?: string; featuredAction?: string }; gallery?: GalleryImage[] }
export interface RecruitingPacket { url: string }
export interface Performance { metric: string; value: number; unit: string; measuredAt: string; notes?: string; source?: string }

export interface SEO { title?: string; description?: string; image?: string }

export interface Profile {
  name: Name;
  classYear?: number;
  positions?: string[];
  bats?: string;
  throws?: string;
  location?: Location;
  height?: string;
  weight?: string;

  contact?: Contact;
  twitter?: Twitter;

  gpa?: string | number;
  testScores?: { SAT?: string; ACT?: string };
  coursework?: string[];

  stats?: Stat[];
  highlights?: Highlight[];
  schedule?: ScheduleEntry[];

  photos?: Photos;
  recruitingPacket?: RecruitingPacket;

  performance?: Performance[];

  seo?: SEO;
}
// Blog types
export type BlogStatus = 'draft' | 'scheduled' | 'published';

export interface BlogPost {
  slug: string;
  title: string;
  summary?: string;
  content: string; // Markdown
  heroImage?: string;
  tags?: string[];
  publishedAt?: string;  // ISO date when published
  scheduledAt?: string;  // ISO date when scheduled (optional)
  status: BlogStatus;
  tweetOnPublish?: boolean;
}

export interface BlogIndex {
  posts: BlogPost[];
}