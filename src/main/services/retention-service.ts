import { HistoryRepository } from '../database/history-repository';

export class RetentionService {
  private timer: NodeJS.Timeout | null = null;

  constructor(private repository: HistoryRepository) {}

  public start(intervalMinutes = 60): void {
    // Run immediately on start
    this.runCleanup();

    // Schedule periodic retention checks
    this.timer = setInterval(() => {
      this.runCleanup();
    }, intervalMinutes * 60 * 1000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public runCleanup(): { excessPruned: number; retentionPruned: number } {
    try {
      const settings = this.repository.getSettings();
      const retentionPruned = this.repository.pruneRetention(settings.retention_days);
      const excessPruned = this.repository.pruneExcess(settings.max_history_items);

      if (retentionPruned > 0 || excessPruned > 0) {
        console.log(
          `Retention cleanup complete: ${retentionPruned} expired items pruned, ${excessPruned} excess items pruned.`
        );
      }

      return { excessPruned, retentionPruned };
    } catch (err) {
      console.error('Error running retention cleanup:', err);
      return { excessPruned: 0, retentionPruned: 0 };
    }
  }
}
