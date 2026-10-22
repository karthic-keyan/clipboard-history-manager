import {
  ClipboardItem,
  FilterOptions,
  AppSettings,
  NativeApi,
} from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants/defaults';

let mockSettings: AppSettings = { ...DEFAULT_SETTINGS };

let mockItems: ClipboardItem[] = [
  {
    id: 'mock-1',
    content_type: 'code',
    content: `// React Clipboard History Hook\nexport function useClipboardMonitor() {\n  const [history, setHistory] = useState<ClipboardItem[]>([]);\n  useEffect(() => {\n    return window.electronApi.onClipboardChanged((item) => {\n      setHistory((prev) => [item, ...prev]);\n    });\n  }, []);\n  return history;\n}`,
    preview: `// React Clipboard History Hook\nexport function useClipboardMonitor() {`,
    html_content: null,
    content_hash: 'hash-code-123456',
    content_size: 284,
    char_count: 284,
    word_count: 26,
    line_count: 10,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: true,
    is_sensitive: false,
    sensitive_type: null,
    source_app: 'VS Code',
    created_at: Date.now() - 1000 * 60 * 15,
    last_copied_at: Date.now() - 1000 * 60 * 15,
    copy_count: 4,
  },
  {
    id: 'mock-2',
    content_type: 'url',
    content: 'https://github.com/electron/electron',
    preview: 'https://github.com/electron/electron',
    html_content: null,
    content_hash: 'hash-url-789012',
    content_size: 36,
    char_count: 36,
    word_count: 1,
    line_count: 1,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: false,
    is_sensitive: false,
    sensitive_type: null,
    source_app: 'Google Chrome',
    created_at: Date.now() - 1000 * 60 * 42,
    last_copied_at: Date.now() - 1000 * 60 * 42,
    copy_count: 2,
  },
  {
    id: 'mock-3',
    content_type: 'text',
    content: 'sk_test_51Ozabc1234567890abcdefghijklmnopqrstuvwxyz',
    preview: '•••••••••••••••• (Protected Content)',
    html_content: null,
    content_hash: 'hash-secret-554433',
    content_size: 51,
    char_count: 51,
    word_count: 1,
    line_count: 1,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: false,
    is_sensitive: true,
    sensitive_type: 'api_key',
    source_app: 'Terminal',
    created_at: Date.now() - 1000 * 60 * 120,
    last_copied_at: Date.now() - 1000 * 60 * 120,
    copy_count: 1,
  },
  {
    id: 'mock-4',
    content_type: 'code',
    content: `SELECT id, content_type, preview, created_at \nFROM clipboard_items \nWHERE is_pinned = 1 \nORDER BY last_copied_at DESC;`,
    preview: `SELECT id, content_type, preview, created_at FROM clipboard_items...`,
    html_content: null,
    content_hash: 'hash-sql-998877',
    content_size: 114,
    char_count: 114,
    word_count: 14,
    line_count: 4,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: true,
    is_sensitive: false,
    sensitive_type: null,
    source_app: 'DBeaver',
    created_at: Date.now() - 1000 * 60 * 300,
    last_copied_at: Date.now() - 1000 * 60 * 300,
    copy_count: 3,
  },
  {
    id: 'mock-5',
    content_type: 'text',
    content: 'Antigravity Windows Clipboard Manager Sprint Planning:\n1. Finalize SQLite FTS5 search\n2. Verify global shortcut conflict fallbacks\n3. Polish Quick Access acrylic window',
    preview: 'Antigravity Windows Clipboard Manager Sprint Planning: 1. Finalize SQLite FTS5 search...',
    html_content: null,
    content_hash: 'hash-text-112233',
    content_size: 168,
    char_count: 168,
    word_count: 22,
    line_count: 4,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: false,
    is_sensitive: false,
    sensitive_type: null,
    source_app: 'Notes',
    created_at: Date.now() - 1000 * 60 * 600,
    last_copied_at: Date.now() - 1000 * 60 * 600,
    copy_count: 1,
  },
  {
    id: 'mock-6',
    content_type: 'text',
    content: '948201',
    preview: '•••••••••••••••• (Protected Content)',
    html_content: null,
    content_hash: 'hash-otp-445566',
    content_size: 6,
    char_count: 6,
    word_count: 1,
    line_count: 1,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: false,
    is_sensitive: true,
    sensitive_type: 'otp',
    source_app: 'SMS App',
    created_at: Date.now() - 1000 * 60 * 900,
    last_copied_at: Date.now() - 1000 * 60 * 900,
    copy_count: 1,
  },
];

export function setupBrowserMockApi(): void {
  if (typeof window === 'undefined' || window.electronApi) {
    return;
  }

  const listeners = {
    clipboardChanged: new Set<(item: ClipboardItem) => void>(),
    monitoringToggled: new Set<(enabled: boolean) => void>(),
    settingsChanged: new Set<(settings: AppSettings) => void>(),
    quickAccessVisibility: new Set<(visible: boolean) => void>(),
    maximizeChanged: new Set<(isMaximized: boolean) => void>(),
  };

  let mockIsMaximized = false;

  const mockApi: NativeApi = {
    getItems: async (filter?: FilterOptions) => {
      let result = [...mockItems];

      if (filter?.query?.trim()) {
        const q = filter.query.toLowerCase().trim();
        result = result.filter(
          (i) => i.content.toLowerCase().includes(q) || i.preview.toLowerCase().includes(q)
        );
      }

      if (filter?.type && filter.type !== 'all') {
        result = result.filter((i) => i.content_type === filter.type);
      }

      if (filter?.pinnedOnly) {
        result = result.filter((i) => i.is_pinned);
      }

      if (filter?.sortBy === 'oldest') {
        result.sort((a, b) => a.last_copied_at - b.last_copied_at);
      } else if (filter?.sortBy === 'most_copied') {
        result.sort((a, b) => b.copy_count - a.copy_count);
      } else {
        result.sort((a, b) => b.last_copied_at - a.last_copied_at);
      }

      return result;
    },

    getItemById: async (id: string) => {
      return mockItems.find((i) => i.id === id) || null;
    },

    copyToClipboard: async (id: string) => {
      const item = mockItems.find((i) => i.id === id);
      if (!item) return false;

      item.last_copied_at = Date.now();
      item.copy_count += 1;

      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(item.content);
        }
      } catch (e) {
        // Fallback for browsers
      }

      for (const cb of listeners.clipboardChanged) {
        cb(item);
      }
      return true;
    },

    copyTextDirect: async (text: string) => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
        }
      } catch (e) {
        // Fallback
      }
      return true;
    },

    togglePin: async (id: string) => {
      const item = mockItems.find((i) => i.id === id);
      if (!item) return false;
      item.is_pinned = !item.is_pinned;

      for (const cb of listeners.clipboardChanged) {
        cb(item);
      }
      return true;
    },

    deleteItem: async (id: string) => {
      mockItems = mockItems.filter((i) => i.id !== id);
      return true;
    },

    clearHistory: async () => {
      mockItems = mockItems.filter((i) => i.is_pinned);
      return true;
    },

    isMonitoring: async () => {
      return mockSettings.monitoring_enabled;
    },

    setMonitoring: async (enabled: boolean) => {
      mockSettings.monitoring_enabled = enabled;
      for (const cb of listeners.monitoringToggled) {
        cb(enabled);
      }
      return enabled;
    },

    getSettings: async () => {
      return { ...mockSettings };
    },

    updateSettings: async (settings: Partial<AppSettings>) => {
      mockSettings = { ...mockSettings, ...settings };
      for (const cb of listeners.settingsChanged) {
        cb(mockSettings);
      }
      return { ...mockSettings };
    },

    getStats: async () => {
      return {
        total_items: mockItems.length,
        pinned_items: mockItems.filter((i) => i.is_pinned).length,
        text_items: mockItems.filter((i) => i.content_type === 'text').length,
        code_items: mockItems.filter((i) => i.content_type === 'code').length,
        url_items: mockItems.filter((i) => i.content_type === 'url').length,
        image_items: mockItems.filter((i) => i.content_type === 'image').length,
        db_size_bytes: 48 * 1024,
      };
    },

    closeWindow: async () => {
      console.log('[Window] closeWindow requested');
    },

    minimizeWindow: async () => {
      console.log('[Window] minimizeWindow requested');
    },

    maximizeWindow: async () => {
      mockIsMaximized = !mockIsMaximized;
      console.log('[Window] maximizeWindow requested, now:', mockIsMaximized);
      for (const cb of listeners.maximizeChanged) {
        cb(mockIsMaximized);
      }
      return mockIsMaximized;
    },

    isWindowMaximized: async () => mockIsMaximized,

    hideQuickAccess: async () => {
      console.log('[Window] hideQuickAccess requested');
      for (const cb of listeners.quickAccessVisibility) {
        cb(false);
      }
    },

    openMainWindow: async () => {
      window.location.hash = '';
    },

    openExternalUrl: async (url: string) => {
      window.open(url, '_blank');
    },

    onClipboardChanged: (cb) => {
      listeners.clipboardChanged.add(cb);
      return () => listeners.clipboardChanged.delete(cb);
    },

    onMonitoringToggled: (cb) => {
      listeners.monitoringToggled.add(cb);
      return () => listeners.monitoringToggled.delete(cb);
    },

    onSettingsChanged: (cb) => {
      listeners.settingsChanged.add(cb);
      return () => listeners.settingsChanged.delete(cb);
    },

    onQuickAccessVisibilityChanged: (cb) => {
      listeners.quickAccessVisibility.add(cb);
      return () => listeners.quickAccessVisibility.delete(cb);
    },

    onMaximizeChanged: (cb) => {
      listeners.maximizeChanged.add(cb);
      return () => listeners.maximizeChanged.delete(cb);
    },
  };

  window.electronApi = mockApi;
}
