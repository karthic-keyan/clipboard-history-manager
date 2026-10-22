import { describe, it, expect, beforeEach } from 'vitest';
import { DeduplicationService } from '../../src/main/clipboard/deduplication';

describe('DeduplicationService', () => {
  let deduplication: DeduplicationService;

  beforeEach(() => {
    deduplication = new DeduplicationService();
  });

  it('should detect identical consecutive hashes', () => {
    const hash = 'abc123hash';
    expect(deduplication.isSameAsLast(hash)).toBe(false);

    deduplication.setLastHash(hash);
    expect(deduplication.isSameAsLast(hash)).toBe(true);
    expect(deduplication.isSameAsLast('differentHash')).toBe(false);
  });

  it('should mark internal copies and allow checking them', () => {
    const hash = 'internalHash789';
    expect(deduplication.isInternalCopy(hash)).toBe(false);

    deduplication.markInternalCopy(hash);
    expect(deduplication.isInternalCopy(hash)).toBe(true);
    expect(deduplication.isSameAsLast(hash)).toBe(true);
  });

  it('should reset state cleanly', () => {
    const hash = 'sampleHash';
    deduplication.markInternalCopy(hash);
    deduplication.reset();

    expect(deduplication.isSameAsLast(hash)).toBe(false);
    expect(deduplication.isInternalCopy(hash)).toBe(false);
  });
});
