export class DeduplicationService {
  private lastHash: string | null = null;
  private internalCopies: Set<string> = new Set();

  public isSameAsLast(hash: string): boolean {
    return this.lastHash === hash;
  }

  public setLastHash(hash: string): void {
    this.lastHash = hash;
  }

  public markInternalCopy(hash: string): void {
    this.internalCopies.add(hash);
    this.lastHash = hash;
    // Auto clear after 2 seconds
    setTimeout(() => {
      this.internalCopies.delete(hash);
    }, 2000);
  }

  public isInternalCopy(hash: string): boolean {
    return this.internalCopies.has(hash);
  }

  public reset(): void {
    this.lastHash = null;
    this.internalCopies.clear();
  }
}
