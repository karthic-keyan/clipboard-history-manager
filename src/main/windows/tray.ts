import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { HistoryService } from '../services/history-service';
import { ClipboardMonitor } from '../clipboard/monitor';

// Clean base64 16x16 PNG clipboard icon for Windows system tray
const TRAY_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkoBAwUqifYdQAkG+w' +
  'aWbEpsXLyws/GxtbgBofHx8zAwMDo4qKCr6kSUtLC7N4eTkg9vPzA+P/v3//MvLz87PJysom' +
  'YFNH0QAjOQaMGoDBg4HxgKDG4Mh/kOqRh1Hjx/8MAMi9GZk3U/9HAAAAAElFTkSuQmCC';

export class TrayManager {
  private tray: Tray | null = null;

  constructor(
    private historyService: HistoryService,
    private monitor: ClipboardMonitor,
    private onOpenMainWindow: () => void,
    private onToggleQuickAccess: () => void
  ) {}

  public create(): Tray {
    const icoPath = path.join(app.getAppPath(), 'build', 'icon.ico');
    const icon = fs.existsSync(icoPath)
      ? nativeImage.createFromPath(icoPath)
      : nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`);
    this.tray = new Tray(icon);
    this.tray.setToolTip('Clipboard History Manager');

    this.updateContextMenu();

    this.tray.on('click', () => {
      this.onToggleQuickAccess();
    });

    this.tray.on('double-click', () => {
      this.onOpenMainWindow();
    });

    return this.tray;
  }

  public updateContextMenu(): void {
    if (!this.tray) return;

    const isMonitoring = this.monitor.isMonitoring();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Clipboard History Manager',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open History Window',
        click: () => this.onOpenMainWindow(),
      },
      {
        label: 'Quick Access Popup (Win+V style)',
        click: () => this.onToggleQuickAccess(),
      },
      { type: 'separator' },
      {
        label: isMonitoring ? '✓ Monitoring Active' : '✕ Monitoring Paused',
        click: () => {
          this.historyService.updateSettings({ monitoring_enabled: !isMonitoring });
          this.updateContextMenu();
        },
      },
      {
        label: 'Clear Unpinned History',
        click: () => {
          this.historyService.clearHistory();
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          this.onOpenMainWindow();
        },
      },
      {
        label: 'Exit',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip(
      `Clipboard History Manager (${isMonitoring ? 'Monitoring Active' : 'Paused'})`
    );
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
