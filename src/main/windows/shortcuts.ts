import { globalShortcut } from 'electron';
import { HistoryRepository } from '../database/history-repository';

export class ShortcutManager {
  private currentShortcut: string | null = null;

  constructor(
    private repository: HistoryRepository,
    private onTriggerQuickAccess: () => void
  ) {}

  public register(): boolean {
    const settings = this.repository.getSettings();
    const shortcutToTry = settings.global_shortcut || 'CommandOrControl+Shift+V';

    this.unregister();

    try {
      const success = globalShortcut.register(shortcutToTry, () => {
        this.onTriggerQuickAccess();
      });

      if (success) {
        this.currentShortcut = shortcutToTry;
        console.log(`Global shortcut registered successfully: ${shortcutToTry}`);
        return true;
      } else {
        console.warn(`Failed to register global shortcut: ${shortcutToTry}. Trying fallback...`);
        // Fallback to Alt+Shift+V if primary shortcut is taken
        const fallback = 'Alt+Shift+V';
        const fallbackSuccess = globalShortcut.register(fallback, () => {
          this.onTriggerQuickAccess();
        });
        if (fallbackSuccess) {
          this.currentShortcut = fallback;
          console.log(`Registered fallback shortcut: ${fallback}`);
          return true;
        }
      }
    } catch (err) {
      console.error('Error during global shortcut registration:', err);
    }

    return false;
  }

  public unregister(): void {
    if (this.currentShortcut) {
      try {
        globalShortcut.unregister(this.currentShortcut);
      } catch (err) {
        // Ignore
      }
      this.currentShortcut = null;
    }
  }

  public updateShortcut(newShortcut: string): boolean {
    this.unregister();
    this.repository.saveSettings({ global_shortcut: newShortcut });
    return this.register();
  }
}
