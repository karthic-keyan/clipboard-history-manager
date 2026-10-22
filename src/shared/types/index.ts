export type ContentType = 'text' | 'url' | 'code' | 'html' | 'image';

export interface ClipboardItem {
  id: string;
  content_type: ContentType;
  content: string;
  preview: string;
  html_content?: string | null;
  content_hash: string;
  content_size: number;
  char_count: number;
  word_count: number;
  line_count: number;
  image_path?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  is_pinned: boolean;
  is_sensitive: boolean;
  sensitive_type?: 'password' | 'api_key' | 'token' | 'credit_card' | 'otp' | null;
  source_app?: string | null;
  created_at: number;
  last_copied_at: number;
  copy_count: number;
}

export type SortOrder = 'recent' | 'oldest' | 'most_copied';
export type DateRange = 'all' | 'today' | 'week' | 'month';

export interface FilterOptions {
  query?: string;
  type?: ContentType | 'all';
  pinnedOnly?: boolean;
  dateRange?: DateRange;
  sortBy?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface AppSettings {
  monitoring_enabled: boolean;
  polling_interval: number; // ms, e.g. 500
  max_history_items: number; // e.g. 500
  retention_days: number; // e.g. 30, 0 = never expire
  global_shortcut: string; // e.g. "CommandOrControl+Shift+V"
  theme: 'dark' | 'light' | 'system';
  start_at_login: boolean;
  close_to_tray: boolean;
  auto_paste: boolean;
  detect_sensitive_data: boolean;
  mask_passwords_in_preview: boolean;
  ignore_sensitive_content: boolean;
  save_images: boolean;
  max_image_size_mb: number;
  group_by_category?: boolean;
}

export interface ClipboardStats {
  total_items: number;
  pinned_items: number;
  text_items: number;
  code_items: number;
  url_items: number;
  image_items: number;
  db_size_bytes: number;
}

export interface NativeApi {
  // History operations
  getItems: (filter?: FilterOptions) => Promise<ClipboardItem[]>;
  getItemById: (id: string) => Promise<ClipboardItem | null>;
  copyToClipboard: (id: string) => Promise<boolean>;
  copyTextDirect: (text: string) => Promise<boolean>;
  togglePin: (id: string) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  clearHistory: () => Promise<boolean>;
  
  // Monitoring controls
  isMonitoring: () => Promise<boolean>;
  setMonitoring: (enabled: boolean) => Promise<boolean>;
  
  // Settings operations
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  
  // Stats
  getStats: () => Promise<ClipboardStats>;
  
  // Windows & Navigation
  closeWindow: () => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  isWindowMaximized: () => Promise<boolean>;
  hideQuickAccess: () => Promise<void>;
  openMainWindow: () => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;
  
  // Event subscriptions from Main to Renderer
  onClipboardChanged: (callback: (item: ClipboardItem) => void) => () => void;
  onMonitoringToggled: (callback: (enabled: boolean) => void) => () => void;
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
  onQuickAccessVisibilityChanged: (callback: (visible: boolean) => void) => () => void;
  onMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronApi: NativeApi;
  }
}
