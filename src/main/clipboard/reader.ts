import { clipboard } from 'electron';
import { ContentType } from '../../shared/types';
import {
  computeHash,
  detectContentType,
  detectSensitiveData,
  generatePreview,
  calculateTextStats,
} from './normalizer';

export interface ReadClipboardResult {
  hasContent: boolean;
  contentType: ContentType;
  content: string;
  preview: string;
  htmlContent: string | null;
  contentHash: string;
  contentSize: number;
  charCount: number;
  wordCount: number;
  lineCount: number;
  imagePath: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageBuffer?: Buffer | null;
  isSensitive: boolean;
  sensitiveType: 'password' | 'api_key' | 'token' | 'credit_card' | 'otp' | null;
}

export function readCurrentClipboard(
  _id: string,
  options: {
    saveImages: boolean;
    maxImageSizeMb: number;
    detectSensitive: boolean;
    maskSensitive: boolean;
  }
): ReadClipboardResult | null {
  try {
    // 1. Check for Image content first
    const image = clipboard.readImage();
    if (!image.isEmpty() && options.saveImages) {
      const size = image.getSize();
      const pngBuffer = image.toPNG();
      const maxBytes = options.maxImageSizeMb * 1024 * 1024;

      if (pngBuffer.length > 0 && pngBuffer.length <= maxBytes) {
        const hash = computeHash(pngBuffer);

        // Defer writing to disk until deduplication verifies it is not a repeated or duplicate item
        return {
          hasContent: true,
          contentType: 'image',
          content: '',
          preview: `Image (${size.width} × ${size.height} px, ${(pngBuffer.length / 1024).toFixed(1)} KB)`,
          htmlContent: null,
          contentHash: hash,
          contentSize: pngBuffer.length,
          charCount: 0,
          wordCount: 0,
          lineCount: 0,
          imagePath: null,
          imageWidth: size.width,
          imageHeight: size.height,
          imageBuffer: pngBuffer,
          isSensitive: false,
          sensitiveType: null,
        };
      }
    }

    // 2. Check for Text / HTML content
    const text = clipboard.readText();
    if (!text || text.trim().length === 0) {
      return null;
    }

    const html = clipboard.readHTML();
    const hasHtml = Boolean(html && html.trim().length > 0 && html !== text);

    const contentType = detectContentType(text, hasHtml);
    const hash = computeHash(text);
    const stats = calculateTextStats(text);

    let isSensitive = false;
    let sensitiveType: 'password' | 'api_key' | 'token' | 'credit_card' | 'otp' | null = null;

    if (options.detectSensitive) {
      const detection = detectSensitiveData(text);
      isSensitive = detection.isSensitive;
      sensitiveType = detection.type;
    }

    const preview = generatePreview(text, isSensitive, options.maskSensitive);

    return {
      hasContent: true,
      contentType,
      content: text,
      preview,
      htmlContent: hasHtml ? html : null,
      contentHash: hash,
      contentSize: stats.bytes,
      charCount: stats.chars,
      wordCount: stats.words,
      lineCount: stats.lines,
      imagePath: null,
      imageWidth: null,
      imageHeight: null,
      imageBuffer: null,
      isSensitive,
      sensitiveType,
    };
  } catch (err) {
    console.error('Error reading clipboard:', err);
    return null;
  }
}
