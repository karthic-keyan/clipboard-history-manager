import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/defaults';
import { FilterOptions, AppSettings, ClipboardItem } from '../shared/types';

const api = {
  // History & Items
  getItems: (filter?: FilterOptions) => ipcRenderer.invoke(IPC_CHANNELS.GET_ITEMS, filter),
  getItemById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_ITEM_BY_ID, id),
  copyToClipboard: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.COPY_TO_CLIPBOARD, id),
  copyTextDirect: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.COPY_TEXT_DIRECT, text),
  togglePin: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_PIN, id),
  deleteItem: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_ITEM, id),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),

  // Monitoring
  isMonitoring: () => ipcRenderer.invoke(IPC_CHANNELS.IS_MONITORING),
  setMonitoring: (enabled: boolean) => ipcRenderer.invoke(IPC_CHANNELS.SET_MONITORING, enabled),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  updateSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SETTINGS, settings),

  // Stats
  getStats: () => ipcRenderer.invoke(IPC_CHANNELS.GET_STATS),

  // Window Controls
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  isWindowMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  hideQuickAccess: () => ipcRenderer.invoke(IPC_CHANNELS.HIDE_QUICK_ACCESS),
  openMainWindow: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_MAIN_WINDOW),
  openExternalUrl: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_URL, url),

  // Event Listeners with Cleanup
  onClipboardChanged: (callback: (item: ClipboardItem) => void) => {
    const handler = (_: any, item: ClipboardItem) => callback(item);
    ipcRenderer.on(IPC_CHANNELS.EVENT_CLIPBOARD_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_CLIPBOARD_CHANGED, handler);
    };
  },

  onMonitoringToggled: (callback: (enabled: boolean) => void) => {
    const handler = (_: any, enabled: boolean) => callback(enabled);
    ipcRenderer.on(IPC_CHANNELS.EVENT_MONITORING_TOGGLED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_MONITORING_TOGGLED, handler);
    };
  },

  onSettingsChanged: (callback: (settings: AppSettings) => void) => {
    const handler = (_: any, settings: AppSettings) => callback(settings);
    ipcRenderer.on(IPC_CHANNELS.EVENT_SETTINGS_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SETTINGS_CHANGED, handler);
    };
  },

  onQuickAccessVisibilityChanged: (callback: (visible: boolean) => void) => {
    const handler = (_: any, visible: boolean) => callback(visible);
    ipcRenderer.on(IPC_CHANNELS.EVENT_QUICK_ACCESS_VISIBILITY, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_QUICK_ACCESS_VISIBILITY, handler);
    };
  },

  onMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: any, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_WINDOW_MAXIMIZE_CHANGED, handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronApi', api);
