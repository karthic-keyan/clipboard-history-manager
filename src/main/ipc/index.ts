import { ipcMain, BrowserWindow, shell, app } from 'electron';
import { HistoryService } from '../services/history-service';
import { ClipboardMonitor } from '../clipboard/monitor';
import { WindowManager } from '../windows/window-manager';
import { ShortcutManager } from '../windows/shortcuts';
import { TrayManager } from '../windows/tray';
import { IPC_CHANNELS } from '../../shared/constants/defaults';
import { FilterOptionsSchema } from '../../shared/schemas/settings';

export function registerIpcHandlers(
  historyService: HistoryService,
  monitor: ClipboardMonitor,
  windowManager: WindowManager,
  shortcutManager: ShortcutManager,
  trayManager: TrayManager
): void {
  // History & Items
  ipcMain.handle(IPC_CHANNELS.GET_ITEMS, async (_, filter) => {
    try {
      const parsed = filter ? FilterOptionsSchema.parse(filter) : undefined;
      return historyService.getItems(parsed);
    } catch (err) {
      console.error('Validation error in GET_ITEMS:', err);
      return historyService.getItems();
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_ITEM_BY_ID, async (_, id: string) => {
    return historyService.getItemById(id);
  });

  ipcMain.handle(IPC_CHANNELS.COPY_TO_CLIPBOARD, async (_, id: string) => {
    const success = historyService.copyToClipboard(id);
    if (success) {
      // Notify windows so copy count and last_copied_at update
      const updated = historyService.getItemById(id);
      if (updated) {
        windowManager.broadcastToAllWindows(IPC_CHANNELS.EVENT_CLIPBOARD_CHANGED, updated);
      }
    }
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.COPY_TEXT_DIRECT, async (_, text: string) => {
    return historyService.copyTextDirect(text);
  });

  ipcMain.handle(IPC_CHANNELS.TOGGLE_PIN, async (_, id: string) => {
    const success = historyService.togglePin(id);
    if (success) {
      const updated = historyService.getItemById(id);
      if (updated) {
        windowManager.broadcastToAllWindows(IPC_CHANNELS.EVENT_CLIPBOARD_CHANGED, updated);
      }
    }
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_ITEM, async (_, id: string) => {
    const success = historyService.deleteItem(id);
    return success;
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, async () => {
    return historyService.clearHistory();
  });

  // Monitoring
  ipcMain.handle(IPC_CHANNELS.IS_MONITORING, async () => {
    return monitor.isMonitoring();
  });

  ipcMain.handle(IPC_CHANNELS.SET_MONITORING, async (_, enabled: boolean) => {
    historyService.updateSettings({ monitoring_enabled: enabled });
    trayManager.updateContextMenu();
    windowManager.broadcastToAllWindows(IPC_CHANNELS.EVENT_MONITORING_TOGGLED, enabled);
    return enabled;
  });

  // Settings
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async () => {
    return historyService.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_SETTINGS, async (_, partialSettings) => {
    try {
      const updated = historyService.updateSettings(partialSettings);

      // If global shortcut updated, reregister
      if (partialSettings.global_shortcut) {
        shortcutManager.updateShortcut(partialSettings.global_shortcut);
      }

      // If start at login preference updated
      if (partialSettings.start_at_login !== undefined) {
        app.setLoginItemSettings({
          openAtLogin: partialSettings.start_at_login,
          openAsHidden: true,
        });
      }

      trayManager.updateContextMenu();
      windowManager.broadcastToAllWindows(IPC_CHANNELS.EVENT_SETTINGS_CHANGED, updated);
      return updated;
    } catch (err) {
      console.error('Error updating settings:', err);
      return historyService.getSettings();
    }
  });

  // Stats
  ipcMain.handle(IPC_CHANNELS.GET_STATS, async () => {
    return historyService.getStats();
  });

  // Window Controls
  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
        return false;
      } else {
        win.maximize();
        return true;
      }
    }
    return false;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isMaximized() : false;
  });

  ipcMain.handle(IPC_CHANNELS.HIDE_QUICK_ACCESS, async () => {
    windowManager.hideQuickAccess();
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_MAIN_WINDOW, async () => {
    windowManager.createMainWindow();
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_URL, async (_, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await shell.openExternal(url);
    }
  });
}
