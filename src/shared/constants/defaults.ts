import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  monitoring_enabled: true,
  polling_interval: 500, // 500ms
  max_history_items: 500,
  retention_days: 30, // 30 days retention
  global_shortcut: 'CommandOrControl+Shift+V',
  theme: 'dark',
  start_at_login: false,
  close_to_tray: true,
  auto_paste: false,
  detect_sensitive_data: true,
  mask_passwords_in_preview: true,
  ignore_sensitive_content: false,
  save_images: true,
  max_image_size_mb: 5,
  group_by_category: false,
};

export const IPC_CHANNELS = {
  // History
  GET_ITEMS: 'clipboard:get-items',
  GET_ITEM_BY_ID: 'clipboard:get-item-by-id',
  COPY_TO_CLIPBOARD: 'clipboard:copy-to-clipboard',
  COPY_TEXT_DIRECT: 'clipboard:copy-text-direct',
  TOGGLE_PIN: 'clipboard:toggle-pin',
  DELETE_ITEM: 'clipboard:delete-item',
  CLEAR_HISTORY: 'clipboard:clear-history',
  
  // Monitoring
  IS_MONITORING: 'clipboard:is-monitoring',
  SET_MONITORING: 'clipboard:set-monitoring',
  
  // Settings
  GET_SETTINGS: 'clipboard:get-settings',
  UPDATE_SETTINGS: 'clipboard:update-settings',
  
  // Stats
  GET_STATS: 'clipboard:get-stats',
  
  // Window controls
  WINDOW_CLOSE: 'window:close',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  HIDE_QUICK_ACCESS: 'window:hide-quick-access',
  OPEN_MAIN_WINDOW: 'window:open-main',
  OPEN_EXTERNAL_URL: 'window:open-external-url',
  
  // Events (Main -> Renderer)
  EVENT_CLIPBOARD_CHANGED: 'event:clipboard-changed',
  EVENT_MONITORING_TOGGLED: 'event:monitoring-toggled',
  EVENT_SETTINGS_CHANGED: 'event:settings-changed',
  EVENT_QUICK_ACCESS_VISIBILITY: 'event:quick-access-visibility',
  EVENT_WINDOW_MAXIMIZE_CHANGED: 'event:window-maximize-changed',
} as const;
