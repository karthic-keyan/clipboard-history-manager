import { z } from 'zod';

export const ContentTypeSchema = z.enum(['text', 'url', 'code', 'html', 'image']);

export const ClipboardItemSchema = z.object({
  id: z.string(),
  content_type: ContentTypeSchema,
  content: z.string(),
  preview: z.string(),
  html_content: z.string().nullable().optional(),
  content_hash: z.string(),
  content_size: z.number().nonnegative(),
  char_count: z.number().nonnegative(),
  word_count: z.number().nonnegative(),
  line_count: z.number().nonnegative(),
  image_path: z.string().nullable().optional(),
  image_width: z.number().nullable().optional(),
  image_height: z.number().nullable().optional(),
  is_pinned: z.boolean(),
  is_sensitive: z.boolean(),
  sensitive_type: z.enum(['password', 'api_key', 'token', 'credit_card', 'otp']).nullable().optional(),
  source_app: z.string().nullable().optional(),
  created_at: z.number(),
  last_copied_at: z.number(),
  copy_count: z.number().int().positive(),
});

export const AppSettingsSchema = z.object({
  monitoring_enabled: z.boolean(),
  polling_interval: z.number().min(100).max(10000),
  max_history_items: z.number().min(10).max(50000),
  retention_days: z.number().min(0).max(365), // 0 means forever
  global_shortcut: z.string().min(1),
  theme: z.enum(['dark', 'light', 'system']),
  start_at_login: z.boolean(),
  close_to_tray: z.boolean(),
  auto_paste: z.boolean(),
  detect_sensitive_data: z.boolean(),
  mask_passwords_in_preview: z.boolean(),
  ignore_sensitive_content: z.boolean(),
  save_images: z.boolean(),
  max_image_size_mb: z.number().min(1).max(50),
  group_by_category: z.boolean().optional(),
});

export const FilterOptionsSchema = z.object({
  query: z.string().optional(),
  type: z.union([ContentTypeSchema, z.literal('all')]).optional(),
  pinnedOnly: z.boolean().optional(),
  dateRange: z.enum(['all', 'today', 'week', 'month']).optional(),
  sortBy: z.enum(['recent', 'oldest', 'most_copied']).optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
});
