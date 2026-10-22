import { describe, it, expect } from 'vitest';
import {
  ClipboardItemSchema,
  AppSettingsSchema,
  FilterOptionsSchema,
} from '../../src/shared/schemas/settings';
import { DEFAULT_SETTINGS } from '../../src/shared/constants/defaults';

describe('Zod Schema Validation', () => {
  it('should validate valid AppSettings', () => {
    const result = AppSettingsSchema.safeParse(DEFAULT_SETTINGS);
    expect(result.success).toBe(true);
  });

  it('should reject invalid polling interval', () => {
    const invalid = { ...DEFAULT_SETTINGS, polling_interval: 10 }; // min is 100
    const result = AppSettingsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate a valid ClipboardItem record', () => {
    const validItem = {
      id: 'test-uuid-1',
      content_type: 'code',
      content: 'console.log("hello")',
      preview: 'console.log("hello")',
      html_content: null,
      content_hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      content_size: 21,
      char_count: 21,
      word_count: 1,
      line_count: 1,
      image_path: null,
      image_width: null,
      image_height: null,
      is_pinned: false,
      is_sensitive: false,
      sensitive_type: null,
      source_app: null,
      created_at: Date.now(),
      last_copied_at: Date.now(),
      copy_count: 1,
    };

    const result = ClipboardItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should validate filter options with query and type', () => {
    const filter = {
      query: 'electron',
      type: 'code' as const,
      pinnedOnly: true,
      dateRange: 'week' as const,
      sortBy: 'recent' as const,
      limit: 50,
      offset: 0,
    };

    const result = FilterOptionsSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it('should validate group_by_category setting boolean values', () => {
    expect(DEFAULT_SETTINGS.group_by_category).toBe(false);

    const withTrue = { ...DEFAULT_SETTINGS, group_by_category: true };
    expect(AppSettingsSchema.safeParse(withTrue).success).toBe(true);

    const withFalse = { ...DEFAULT_SETTINGS, group_by_category: false };
    expect(AppSettingsSchema.safeParse(withFalse).success).toBe(true);
  });
});
