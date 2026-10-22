import { BrowserWindow, screen, app, shell } from 'electron';
import path from 'path';
import { HistoryRepository } from '../database/history-repository';
import { IPC_CHANNELS } from '../../shared/constants/defaults';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private quickAccessWindow: BrowserWindow | null = null;
  private isQuitting = false;

  constructor(private repository: HistoryRepository) {}

  public setQuitting(val: boolean) {
    this.isQuitting = val;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public getQuickAccessWindow(): BrowserWindow | null {
    return this.quickAccessWindow;
  }

  public createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.show();
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const preloadPath = path.join(__dirname, 'preload.js');

    this.mainWindow = new BrowserWindow({
      width: 1040,
      height: 720,
      minWidth: 840,
      minHeight: 560,
      title: 'Clipboard History Manager',
      icon: path.join(app.getAppPath(), 'build', 'icon.png'),
      backgroundColor: '#1c1c1c',
      frame: false, // Custom sleek Windows titlebar
      show: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
    if (isDev) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
      // Open dev tools in dev mode if requested:
      // this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle close to tray
    this.mainWindow.on('close', (event) => {
      const settings = this.repository.getSettings();
      if (!this.isQuitting && settings.close_to_tray) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    this.mainWindow.on('maximize', () => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, true);
    });

    this.mainWindow.on('unmaximize', () => {
      this.mainWindow?.webContents.send(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, false);
    });

    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    return this.mainWindow;
  }

  public createQuickAccessWindow(): BrowserWindow {
    if (this.quickAccessWindow && !this.quickAccessWindow.isDestroyed()) {
      return this.quickAccessWindow;
    }

    const preloadPath = path.join(__dirname, 'preload.js');

    this.quickAccessWindow = new BrowserWindow({
      width: 580,
      height: 460,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      icon: path.join(app.getAppPath(), 'build', 'icon.png'),
      backgroundColor: '#00000000', // Fully transparent container for acrylic rounded shadow
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
    if (isDev) {
      this.quickAccessWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL!}#quick-access`);
    } else {
      this.quickAccessWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
        hash: 'quick-access',
      });
    }

    // Hide when losing focus (like native Windows clipboard popup)
    this.quickAccessWindow.on('blur', () => {
      if (this.quickAccessWindow && !this.quickAccessWindow.isDestroyed()) {
        this.quickAccessWindow.hide();
        this.quickAccessWindow.webContents.send(IPC_CHANNELS.EVENT_QUICK_ACCESS_VISIBILITY, false);
      }
    });

    return this.quickAccessWindow;
  }

  public toggleQuickAccess(): void {
    if (!this.quickAccessWindow || this.quickAccessWindow.isDestroyed()) {
      this.createQuickAccessWindow();
    }

    if (!this.quickAccessWindow) return;

    if (this.quickAccessWindow.isVisible()) {
      this.quickAccessWindow.hide();
      this.quickAccessWindow.webContents.send(IPC_CHANNELS.EVENT_QUICK_ACCESS_VISIBILITY, false);
    } else {
      // Position near cursor / screen center
      const cursor = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursor);
      const { x, y, width, height } = currentDisplay.workArea;

      // Center horizontally and place in upper half (Spotlight / Raycast style)
      const winWidth = 580;
      const winHeight = 460;
      const posX = Math.round(x + (width - winWidth) / 2);
      const posY = Math.round(y + (height - winHeight) * 0.28);

      this.quickAccessWindow.setPosition(posX, posY);
      this.quickAccessWindow.show();
      this.quickAccessWindow.focus();
      this.quickAccessWindow.webContents.send(IPC_CHANNELS.EVENT_QUICK_ACCESS_VISIBILITY, true);
    }
  }

  public hideQuickAccess(): void {
    if (this.quickAccessWindow && !this.quickAccessWindow.isDestroyed()) {
      this.quickAccessWindow.hide();
      this.quickAccessWindow.webContents.send(IPC_CHANNELS.EVENT_QUICK_ACCESS_VISIBILITY, false);
    }
  }

  public broadcastToAllWindows(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
    if (this.quickAccessWindow && !this.quickAccessWindow.isDestroyed()) {
      this.quickAccessWindow.webContents.send(channel, ...args);
    }
  }
}
