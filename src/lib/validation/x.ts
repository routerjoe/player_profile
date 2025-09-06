import { z } from 'zod';

// Shared text validator: require non-empty (after trim) and max 280 chars
const textSchema = z
  .string()
  .max(280, 'text exceeds 280 characters')
  .refine((s) => s.trim().length > 0, { message: 'text is required' });

// POST /api/x/post (JSON or multipart/form-data with "file")
export const XPostBodySchema = z.object({
  text: textSchema,
});
export type XPostBody = z.infer<typeof XPostBodySchema>;

// POST /api/x/schedule (JSON)
export const XScheduleBodySchema = z.object({
  text: textSchema,
  // ISO datetime string (optional). Route will parse/validate.
// Keep permissive here and perform Date parsing in the handler for clear 400s.
  scheduledFor: z.string().optional(),
});
export type XScheduleBody = z.infer<typeof XScheduleBodySchema>;

// POST /api/x/retry (JSON)
export const XRetryBodySchema = z.object({
  id: z.string().min(1, 'id is required'),
});
export type XRetryBody = z.infer<typeof XRetryBodySchema>;