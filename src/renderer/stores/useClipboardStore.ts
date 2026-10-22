import { create } from 'zustand';
import {
  ClipboardItem,
  FilterOptions,
  AppSettings,
  ClipboardStats,
  ContentType,
  DateRange,
  SortOrder,
} from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants/defaults';

interface ClipboardState {
  items: ClipboardItem[];
  filter: FilterOptions;
  selectedItemId: string | null;
  activeItemForDetail: ClipboardItem | null;
  settings: AppSettings;
  stats: ClipboardStats | null;
  isMonitoring: boolean;
  isLoading: boolean;
  toastMessage: string | null;
  isSettingsOpen: boolean;
  quickAccessSelectedIndex: number;

  // Actions
  fetchItems: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: ContentType | 'all') => void;
  setPinnedOnly: (pinned: boolean) => void;
  setDateRange: (dateRange: DateRange) => void;
  setSortBy: (sortBy: SortOrder) => void;
  copyItem: (id: string) => Promise<boolean>;
  copyTextDirect: (text: string) => Promise<boolean>;
  togglePin: (id: string) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  clearHistory: () => Promise<boolean>;
  toggleMonitoring: () => Promise<boolean>;
  toggleGroupByCategory: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  showToast: (msg: string) => void;
  hideToast: () => void;
  openDetail: (item: ClipboardItem) => void;
  closeDetail: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  handleItemUpdated: (item: ClipboardItem) => void;
  setQuickAccessSelectedIndex: (index: number) => void;
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  items: [],
  filter: {
    query: '',
    type: 'all',
    pinnedOnly: false,
    dateRange: 'all',
    sortBy: 'recent',
    limit: 200,
  },
  selectedItemId: null,
  activeItemForDetail: null,
  settings: DEFAULT_SETTINGS,
  stats: null,
  isMonitoring: true,
  isLoading: false,
  toastMessage: null,
  isSettingsOpen: false,
  quickAccessSelectedIndex: 0,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      if (window.electronApi) {
        const items = await window.electronApi.getItems(get().filter);
        set({ items, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      set({ isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      if (window.electronApi) {
        const settings = await window.electronApi.getSettings();
        set({ settings, isMonitoring: settings.monitoring_enabled });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  },

  fetchStats: async () => {
    try {
      if (window.electronApi) {
        const stats = await window.electronApi.getStats();
        set({ stats });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  },

  setSearchQuery: (query: string) => {
    set((state) => ({ filter: { ...state.filter, query }, quickAccessSelectedIndex: 0 }));
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = null;
    }
    // Instant fetch when clearing query for snappy UX
    if (!query) {
      get().fetchItems();
      return;
    }
    searchDebounceTimer = setTimeout(() => {
      get().fetchItems();
    }, 150);
  },

  setTypeFilter: (type: ContentType | 'all') => {
    set((state) => ({ filter: { ...state.filter, type }, quickAccessSelectedIndex: 0 }));
    get().fetchItems();
  },

  setPinnedOnly: (pinnedOnly: boolean) => {
    set((state) => ({ filter: { ...state.filter, pinnedOnly }, quickAccessSelectedIndex: 0 }));
    get().fetchItems();
  },

  setDateRange: (dateRange: DateRange) => {
    set((state) => ({ filter: { ...state.filter, dateRange }, quickAccessSelectedIndex: 0 }));
    get().fetchItems();
  },

  setSortBy: (sortBy: SortOrder) => {
    set((state) => ({ filter: { ...state.filter, sortBy }, quickAccessSelectedIndex: 0 }));
    get().fetchItems();
  },

  copyItem: async (id: string) => {
    try {
      if (window.electronApi) {
        const success = await window.electronApi.copyToClipboard(id);
        if (success) {
          get().showToast('Copied to clipboard');
          get().fetchStats();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to copy item:', err);
    }
    return false;
  },

  copyTextDirect: async (text: string) => {
    try {
      if (window.electronApi) {
        const success = await window.electronApi.copyTextDirect(text);
        if (success) {
          get().showToast('Copied to clipboard');
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to direct copy:', err);
    }
    return false;
  },

  togglePin: async (id: string) => {
    try {
      if (window.electronApi) {
        const success = await window.electronApi.togglePin(id);
        if (success) {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, is_pinned: !item.is_pinned } : item
            ),
          }));
          get().fetchStats();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
    return false;
  },

  deleteItem: async (id: string) => {
    try {
      if (window.electronApi) {
        const success = await window.electronApi.deleteItem(id);
        if (success) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
            activeItemForDetail:
              state.activeItemForDetail?.id === id ? null : state.activeItemForDetail,
          }));
          get().showToast('Item deleted');
          get().fetchStats();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
    return false;
  },

  clearHistory: async () => {
    try {
      if (window.electronApi) {
        const success = await window.electronApi.clearHistory();
        if (success) {
          await get().fetchItems();
          await get().fetchStats();
          get().showToast('History cleared (pinned items preserved)');
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
    return false;
  },

  toggleMonitoring: async () => {
    try {
      const next = !get().isMonitoring;
      if (window.electronApi) {
        await window.electronApi.setMonitoring(next);
        set({ isMonitoring: next });
        get().showToast(next ? 'Clipboard monitoring resumed' : 'Clipboard monitoring paused');
        return next;
      }
    } catch (err) {
      console.error('Failed to toggle monitoring:', err);
    }
    return get().isMonitoring;
  },

  toggleGroupByCategory: async () => {
    const current = Boolean(get().settings.group_by_category);
    const next = !current;
    await get().updateSettings({ group_by_category: next });
    get().showToast(next ? 'Categorized view enabled' : 'Categorized view disabled');
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    try {
      if (window.electronApi) {
        const updated = await window.electronApi.updateSettings(partial);
        set({ settings: updated, isMonitoring: updated.monitoring_enabled });
        get().showToast('Settings saved');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  },

  showToast: (msg: string) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toastMessage: msg });
    toastTimer = setTimeout(() => {
      set({ toastMessage: null });
      toastTimer = null;
    }, 2200);
  },

  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toastMessage: null });
  },
  openDetail: (item: ClipboardItem) => set({ activeItemForDetail: item }),
  closeDetail: () => set({ activeItemForDetail: null }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  handleItemUpdated: (updatedItem: ClipboardItem) => {
    set((state) => {
      const existingIdx = state.items.findIndex((i) => i.id === updatedItem.id);
      let newItems = [...state.items];
      if (existingIdx >= 0) {
        newItems.splice(existingIdx, 1);
        newItems.unshift(updatedItem); // Move to top
      } else {
        newItems.unshift(updatedItem);
      }
      return { items: newItems };
    });
    get().fetchStats();
  },

  setQuickAccessSelectedIndex: (index: number) => {
    set({ quickAccessSelectedIndex: index });
  },
}));
