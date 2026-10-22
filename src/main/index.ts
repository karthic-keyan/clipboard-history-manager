import { app } from 'electron';
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

const startupStart = Date.now();

// Ensure single application instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let repository: HistoryRepository;
  let monitor: ClipboardMonitor;
  let historyService: HistoryService;
  let retentionService: RetentionService;
  let windowManager: WindowManager;
  let shortcutManager: ShortcutManager;
  let trayManager: TrayManager;

  app.on('second-instance', () => {
    if (!windowManager) return;
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
    // 1. Initialize database and core dependencies
    const db = getDatabase();
    runMigrations(db);

    repository = new HistoryRepository(db);
    monitor = new ClipboardMonitor(repository);
    historyService = new HistoryService(repository, monitor);
    retentionService = new RetentionService(repository);
    windowManager = new WindowManager(repository);

    // 2. Setup shortcuts and tray handlers
    shortcutManager = new ShortcutManager(repository, () => {
      windowManager.toggleQuickAccess();
    });

    trayManager = new TrayManager(
      historyService,
      monitor,
      () => windowManager.createMainWindow(),
      () => windowManager.toggleQuickAccess()
    );

    // 3. Register IPC handlers before window creation
    registerIpcHandlers(historyService, monitor, windowManager, shortcutManager, trayManager);

    // 4. Create and display the main window FIRST for optimal perceived startup time
    windowManager.createMainWindow();

    // 5. Defer non-critical background services to avoid blocking initial window rendering
    setTimeout(() => {
      // Forward real-time clipboard change events to windows
      monitor.onNewItem((item) => {
        windowManager.broadcastToAllWindows(IPC_CHANNELS.EVENT_CLIPBOARD_CHANGED, item);
      });

      // System Tray & Global Shortcuts
      trayManager.create();
      shortcutManager.register();

      // Pre-warm Quick Access window in background
      windowManager.createQuickAccessWindow();

      // Start clipboard monitoring if enabled
      const settings = repository.getSettings();
      if (settings.monitoring_enabled) {
        monitor.start();
      }

      // Schedule periodic retention cleanup
      retentionService.start(60);

      const elapsed = Date.now() - startupStart;
      console.log(`[Startup] Application ready & background services initialized in ${elapsed}ms`);
    }, 40);
  });

  app.on('window-all-closed', () => {
    if (!repository) return;
    const settings = repository.getSettings();
    // On Windows, keep running in background tray if close_to_tray is true
    if (!settings.close_to_tray) {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (windowManager) {
      windowManager.setQuitting(true);
    }
    if (shortcutManager) {
      shortcutManager.unregister();
    }
    if (trayManager) {
      trayManager.destroy();
    }
    if (retentionService) {
      retentionService.stop();
    }
    if (monitor) {
      monitor.stop();
    }
    closeDatabase();
  });
}
