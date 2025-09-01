// Photo types and shared contracts for API and UI

export type PhotoUsage =
  | 'unassigned'
  | 'hero'
  | 'headshot'
  | 'gallery'
  | 'blog_cover'
  | 'highlights_cover'
  | 'thumbnail'
  | 'banner'
  | 'social';

export interface PhotoRecord {
  id: string; // crypto.randomUUID()
  playerId: string;
  url: string; // /uploads/{playerId}/{id}.{ext}
  originalName: string;
  title: string; // display name
  alt: string;
  usage: PhotoUsage; // default: 'unassigned'
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

// Payloads
export type UpdatePhotoPayload = Partial<Pick<PhotoRecord, 'title' | 'alt' | 'usage'>>;

// Shared server/client constants
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export const ALLOWED_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};