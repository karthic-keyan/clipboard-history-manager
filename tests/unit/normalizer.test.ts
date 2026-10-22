import { describe, it, expect } from 'vitest';
import {
  computeHash,
  detectContentType,
  detectSensitiveData,
  generatePreview,
  calculateTextStats,
} from '../../src/main/clipboard/normalizer';

describe('Clipboard Normalizer', () => {
  describe('computeHash', () => {
    it('should generate consistent SHA-256 hashes', () => {
      const hash1 = computeHash('sample clipboard text');
      const hash2 = computeHash('sample clipboard text');
      const hash3 = computeHash('different text');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('detectContentType', () => {
    it('should identify URLs', () => {
      expect(detectContentType('https://github.com/electron/electron', false)).toBe('url');
      expect(detectContentType('http://localhost:3000/dashboard', false)).toBe('url');
      expect(detectContentType('www.google.com', false)).toBe('url');
    });

    it('should identify code snippets', () => {
      const jsSnippet = `const add = (a, b) => {\n  return a + b;\n};`;
      expect(detectContentType(jsSnippet, false)).toBe('code');

      const htmlSnippet = `<div className="container">\n  <h1>Hello</h1>\n</div>`;
      expect(detectContentType(htmlSnippet, false)).toBe('code');

      const sqlSnippet = `SELECT id, name FROM users WHERE active = 1;`;
      expect(detectContentType(sqlSnippet, false)).toBe('code');
    });

    it('should identify plain text', () => {
      expect(detectContentType('This is a simple shopping list note.', false)).toBe('text');
      expect(detectContentType('Meeting notes with John at 3 PM today', false)).toBe('text');
    });
  });

  describe('detectSensitiveData', () => {
    it('should detect API keys', () => {
      const stripeKey = 'sk_test_51Ozabc1234567890abcdefghijklmnopqrstuvwxyz';
      expect(detectSensitiveData(stripeKey)).toEqual({
        isSensitive: true,
        type: 'api_key',
      });

      const ghToken = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
      expect(detectSensitiveData(ghToken)).toEqual({
        isSensitive: true,
        type: 'api_key',
      });
    });

    it('should detect JWT tokens', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(detectSensitiveData(jwt)).toEqual({
        isSensitive: true,
        type: 'token',
      });
    });

    it('should detect credit cards', () => {
      const visaCard = '4111 2222 3333 4444';
      expect(detectSensitiveData(visaCard)).toEqual({
        isSensitive: true,
        type: 'credit_card',
      });
    });

    it('should detect one-time verification codes (OTPs)', () => {
      expect(detectSensitiveData('748291')).toEqual({
        isSensitive: true,
        type: 'otp',
      });
    });

    it('should detect strong passwords', () => {
      const password = 'K8#mQ9$vL2!xP5@z';
      expect(detectSensitiveData(password)).toEqual({
        isSensitive: true,
        type: 'password',
      });
    });

    it('should not flag normal sentences as sensitive', () => {
      expect(detectSensitiveData('Antigravity is a powerful AI coding assistant.')).toEqual({
        isSensitive: false,
        type: null,
      });
    });
  });

  describe('generatePreview', () => {
    it('should mask sensitive items when masking is enabled', () => {
      const masked = generatePreview('MySecretPassword123!', true, true);
      expect(masked).toContain('••••••••');
    });

    it('should not mask sensitive items when masking is disabled', () => {
      const unmasked = generatePreview('MySecretPassword123!', true, false);
      expect(unmasked).toBe('MySecretPassword123!');
    });

    it('should truncate long text to preview length with ellipsis', () => {
      const longText = 'A'.repeat(200);
      const preview = generatePreview(longText, false, true);
      expect(preview.length).toBeLessThanOrEqual(142);
      expect(preview.endsWith('…')).toBe(true);
    });
  });

  describe('calculateTextStats', () => {
    it('should calculate accurate chars, words, lines and bytes', () => {
      const text = 'Hello world\nSecond line';
      const stats = calculateTextStats(text);

      expect(stats.chars).toBe(23);
      expect(stats.words).toBe(4);
      expect(stats.lines).toBe(2);
      expect(stats.bytes).toBe(23);
    });
  });
});
