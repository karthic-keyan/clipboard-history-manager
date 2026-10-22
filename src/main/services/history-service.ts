import { clipboard, nativeImage } from 'electron';
import fs from 'fs';
import { HistoryRepository } from '../database/history-repository';
import { ClipboardMonitor } from '../clipboard/monitor';
import { ClipboardItem, FilterOptions, AppSettings, ClipboardStats } from '../../shared/types';
import { computeHash } from '../clipboard/normalizer';

export class HistoryService {
  constructor(
    private repository: HistoryRepository,
    private monitor: ClipboardMonitor
  ) {}

  public getItems(filter?: FilterOptions): ClipboardItem[] {
    return this.repository.getItems(filter);
  }

  public getItemById(id: string): ClipboardItem | null {
    return this.repository.getById(id);
  }

  public copyToClipboard(id: string): boolean {
    const item = this.repository.getById(id);
    if (!item) return false;

    // Mark as internal copy to prevent monitor loop
    this.monitor.getDeduplication().markInternalCopy(item.content_hash);

    if (item.content_type === 'image' && item.image_path && fs.existsSync(item.image_path)) {
      const img = nativeImage.createFromPath(item.image_path);
      clipboard.writeImage(img);
    } else {
      clipboard.write({
        text: item.content,
        html: item.html_content || undefined,
      });
    }

    this.repository.updateLastCopied(id, Date.now());
    return true;
  }

  public copyTextDirect(text: string): boolean {
    const hash = computeHash(text);
    this.monitor.getDeduplication().markInternalCopy(hash);
    clipboard.writeText(text);
    return true;
  }

  public togglePin(id: string): boolean {
    return this.repository.togglePin(id);
  }

  public deleteItem(id: string): boolean {
    return this.repository.delete(id);
  }

  public clearHistory(): boolean {
    return this.repository.clearHistory(true);
  }

  public getStats(): ClipboardStats {
    return this.repository.getStats();
  }

  public getSettings(): AppSettings {
    return this.repository.getSettings();
  }

  public updateSettings(settings: Partial<AppSettings>): AppSettings {
    const updated = this.repository.saveSettings(settings);

    if (settings.monitoring_enabled !== undefined) {
      if (settings.monitoring_enabled) {
        this.monitor.start();
      } else {
        this.monitor.stop();
      }
    }

    if (settings.polling_interval !== undefined) {
      this.monitor.updateInterval(settings.polling_interval);
    }

    return updated;
  }
}
