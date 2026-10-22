import crypto from 'node:crypto';
import { ContentType } from '../../shared/types';

export interface SensitiveDetectionResult {
  isSensitive: boolean;
  type: 'password' | 'api_key' | 'token' | 'credit_card' | 'otp' | null;
}

// Pre-compiled regular expressions to prevent garbage collection churn and re-compilation
const URL_REGEX = /^(https?:\/\/|ftp:\/\/|file:\/\/)[^\s/$.?#].[^\s]*$/i;
const WWW_REGEX = /^www\.[a-z0-9-]+(\.[a-z0-9-]+)+([/?#][^\s]*)?$/i;

const CODE_INDICATORS: readonly RegExp[] = [
  /^\s*(import\s+.*from|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=)/m,
  /^\s*(function\s+\w+\s*\(|def\s+\w+\s*\(|class\s+\w+)/m,
  /^\s*(public|private|protected)\s+(static\s+)?(class|void|string|int)/m,
  /^\s*SELECT\s+.*FROM\s+/im,
  /^\s*<\?php/m,
  /<\/[a-zA-Z0-9]+>|<[a-zA-Z0-9]+(\s+[^>]+)?>.*<\/[a-zA-Z0-9]+>/s,
  /\{[\s\S]*\}|\[[\s\S]*\]/,
  /^\s*(if|for|while|switch)\s*\(.+\)\s*\{/m,
  /;\s*$/m,
];

const MARKUP_REGEX = /<\/[a-zA-Z0-9]+>|<[a-zA-Z0-9]+(\s+[^>]+)?>.*<\/[a-zA-Z0-9]+>/s;
const JWT_REGEX = /^ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;
const API_KEY_REGEX = /^(sk_(?:live|test)_[0-9a-zA-Z]{24,}|ghp_[0-9a-zA-Z]{36}|AIza[0-9A-Za-z-_]{35}|AKIA[0-9A-Z]{16}|xox[baprs]-[0-9a-zA-Z-]{10,}|glpat-[0-9a-zA-Z-_]{20,})/;
const CREDIT_CARD_REGEX = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/;
const OTP_REGEX = /^\b\d{4,8}\b$/;

const SPACES_OR_HYPHENS = /[\s-]/g;
const CRLF_REGEX = /\r\n/g;
const MULTI_SPACE_REGEX = /\s+/g;
const LINE_BREAK_SPLIT = /\r\n|\r|\n/;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;
const HAS_SPACE = /\s/;

export function computeHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function detectContentType(text: string, hasHtml: boolean): ContentType {
  const trimmed = text.trim();

  // URL detection
  if (URL_REGEX.test(trimmed) || WWW_REGEX.test(trimmed)) {
    return 'url';
  }

  // HTML/XML/JSX markup detection
  if (MARKUP_REGEX.test(trimmed)) {
    return 'code';
  }

  // Code detection heuristics
  let codeMatches = 0;
  for (let i = 0; i < CODE_INDICATORS.length; i++) {
    if (CODE_INDICATORS[i].test(trimmed)) {
      codeMatches++;
    }
  }

  if (codeMatches >= 2 || (codeMatches >= 1 && (trimmed.includes(';') || trimmed.includes('{')))) {
    return 'code';
  }

  if (hasHtml && trimmed.includes('<') && trimmed.includes('>')) {
    return 'html';
  }

  return 'text';
}

export function detectSensitiveData(text: string): SensitiveDetectionResult {
  const trimmed = text.trim();

  // JWT token
  if (JWT_REGEX.test(trimmed)) {
    return { isSensitive: true, type: 'token' };
  }

  // API Keys (Stripe, GitHub, AWS, Google, OpenAI, Slack, etc.)
  if (API_KEY_REGEX.test(trimmed)) {
    return { isSensitive: true, type: 'api_key' };
  }

  // Credit card number (13-19 digits, optionally spaced or hyphenated)
  const stripped = trimmed.replace(SPACES_OR_HYPHENS, '');
  if (CREDIT_CARD_REGEX.test(stripped)) {
    return { isSensitive: true, type: 'credit_card' };
  }

  // One-time verification code (4 to 8 digits alone)
  if (OTP_REGEX.test(trimmed)) {
    return { isSensitive: true, type: 'otp' };
  }

  // Potential high-entropy password (length 10-50, no spaces, mixed charsets)
  if (
    trimmed.length >= 10 &&
    trimmed.length <= 50 &&
    !HAS_SPACE.test(trimmed) &&
    HAS_UPPERCASE.test(trimmed) &&
    HAS_LOWERCASE.test(trimmed) &&
    HAS_DIGIT.test(trimmed) &&
    HAS_SPECIAL.test(trimmed)
  ) {
    return { isSensitive: true, type: 'password' };
  }

  return { isSensitive: false, type: null };
}

export function generatePreview(text: string, isSensitive: boolean, maskSensitive: boolean): string {
  if (isSensitive && maskSensitive) {
    return '•••••••••••••••• (Protected Content)';
  }

  const cleaned = text.replace(CRLF_REGEX, '\n').trim();
  const firstLines = cleaned.split('\n').slice(0, 3).join(' ').replace(MULTI_SPACE_REGEX, ' ');

  if (firstLines.length > 140) {
    return firstLines.slice(0, 140) + '…';
  }
  return firstLines;
}

export function calculateTextStats(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(MULTI_SPACE_REGEX).length : 0;
  const lines = text.split(LINE_BREAK_SPLIT).length;
  const bytes = Buffer.byteLength(text, 'utf8');

  return { chars, words, lines, bytes };
}
