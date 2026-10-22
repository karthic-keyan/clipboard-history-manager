import { app, BrowserWindow } from 'electron';
import { getDatabase, closeDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { HistoryRepository } from './database/history-repository';
import { ClipboardMonitor } from './clipboard/monitor';
import { HistoryService } from './services/history-service';
import { RetentionService } from './services/retention-service';
import { WindowManager } from './windows/window-manager';
import { ShortcutManager } from './windows/shortcuts';
import { TrayManager } from './windows/tray';
import { registerIpcHandlers } from './ipc';
import { IPC_CHANNELS } from '../shared/constants/defaults';

// Ensure single application instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let db = getDatabase();
  runMigrations(db);

  const repository = new HistoryRepository(db);
  const monitor = new ClipboardMonitor(repository);
  const historyService = new HistoryService(repository, monitor);
  const retentionService = new RetentionService(repository);
  const windowManager = new WindowManager(repository);

  let shortcutManager: ShortcutManager;
  let trayManager: TrayManager;

  app.on('second-instance', () => {
    const mainWin = windowManager.getMainWindow();
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore();
      mainWin.show();
      mainWin.focus();
    } else {
      windowManager.createMainWindow();
    }
  });

  app.whenReady().then(() => {
    // Forward monitor items to all active windows
    monitor.onNewItem((item) => {
      windowManager.broadcastToAllWindows(IPC_CHANNELS.EVENT_CLIPBOARD_CHANGED, item);
    });

    // Setup shortcuts and tray
    shortcutManager = new ShortcutManager(repository, () => {
      windowManager.toggleQuickAccess();
    });

    trayManager = new TrayManager(
      historyService,
      monitor,
      () => windowManager.createMainWindow(),
      () => windowManager.toggleQuickAccess()
    );

    trayManager.create();
    shortcutManager.register();

    // Register IPC channels
    registerIpcHandlers(historyService, monitor, windowManager, shortcutManager, trayManager);

    // Start retention background cleaner
    retentionService.start(60);

    // Create Main window
    windowManager.createMainWindow();

    // Pre-create Quick Access window so it opens instantaneously on shortcut
    windowManager.createQuickAccessWindow();

    // Start clipboard monitoring if enabled in settings
    const settings = repository.getSettings();
    if (settings.monitoring_enabled) {
      monitor.start();
    }
  });

  app.on('window-all-closed', () => {
    const settings = repository.getSettings();
    // On Windows, keep running in background tray if close_to_tray is true
    if (!settings.close_to_tray) {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    windowManager.setQuitting(true);
    if (shortcutManager) {
      shortcutManager.unregister();
    }
    if (trayManager) {
      trayManager.destroy();
    }
    retentionService.stop();
    monitor.stop();
    closeDatabase();
  });
}
