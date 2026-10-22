import React, { useState, useEffect } from 'react';
import { useClipboardStore } from '../../stores/useClipboardStore';
import { AppSettings } from '../../../shared/types';
import {
  X,
  Sliders,
  Shield,
  Database,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  Laptop,
  Clock,
  Sparkles,
  KeyRound,
  EyeOff,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useClipboardStore((s) => s.isSettingsOpen);
  const closeSettings = useClipboardStore((s) => s.closeSettings);
  const settings = useClipboardStore((s) => s.settings);
  const updateSettings = useClipboardStore((s) => s.updateSettings);
  const stats = useClipboardStore((s) => s.stats);
  const fetchStats = useClipboardStore((s) => s.fetchStats);
  const clearHistory = useClipboardStore((s) => s.clearHistory);

  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'storage'>('general');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    setFormData(settings);
    if (isSettingsOpen) {
      fetchStats();
    }
  }, [settings, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    updateSettings({ [key]: value });
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setConfirmClearOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#1e1e1e]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">Application Settings</h2>
          </div>
          <button
            onClick={closeSettings}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-5 bg-neutral-900/50">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>General & Shortcuts</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Sensitive Data</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>History & Storage</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Monitoring Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Clipboard Monitoring</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Capture copied text, links, code, and images automatically in the background.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.monitoring_enabled}
                  onChange={(e) => handleChange('monitoring_enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                />
              </div>

              {/* Polling Interval */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Polling Interval</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    How frequently the monitor checks the Windows clipboard (500ms recommended).
                  </p>
                </div>
                <select
                  value={formData.polling_interval}
                  onChange={(e) => handleChange('polling_interval', Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:border-blue-500"
                >
                  <option value={250}>250 ms (Ultra-fast)</option>
                  <option value={500}>500 ms (Balanced)</option>
                  <option value={1000}>1000 ms (Eco)</option>
                  <option value={2000}>2000 ms (Battery saver)</option>
                </select>
              </div>

              {/* Global Shortcut */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Quick Access Shortcut</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Global keyboard shortcut to toggle the floating clipboard window.
                  </p>
                </div>
                <input
                  type="text"
                  value={formData.global_shortcut}
                  onChange={(e) => handleChange('global_shortcut', e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 font-mono text-center w-48 focus:border-blue-500"
                />
              </div>

              {/* Start at Login & Close to Tray */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                  <div>
                    <h4 className="font-medium text-neutral-200">Start with Windows</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Launch automatically on system startup to maintain your history.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.start_at_login}
                    onChange={(e) => handleChange('start_at_login', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                  <div>
                    <h4 className="font-medium text-neutral-200">Close to System Tray</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Closing the window minimizes to tray so clipboard monitoring continues.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.close_to_tray}
                    onChange={(e) => handleChange('close_to_tray', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                  <div>
                    <h4 className="font-medium text-neutral-200">Group by Category</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Organize clipboard history into collapsible categories (Favorites, Code, Links, Images, Text).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(formData.group_by_category)}
                    onChange={(e) => handleChange('group_by_category', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {/* Privacy Notice Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold block text-blue-200">100% Offline & Local Only</span>
                  Clipboard History Manager operates completely locally on your Windows device. Your
                  copied items are never uploaded to any cloud server, telemetry service, or analytics
                  provider.
                </div>
              </div>

              {/* Sensitive Data Detection */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Detect Sensitive Content</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Recognize API keys, tokens, passwords, credit cards, and OTP verification codes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.detect_sensitive_data}
                  onChange={(e) => handleChange('detect_sensitive_data', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                />
              </div>

              {/* Mask Passwords in Preview */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Mask Passwords in Preview</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Hide sensitive items behind bullet dots in the list until clicked.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.mask_passwords_in_preview}
                  onChange={(e) => handleChange('mask_passwords_in_preview', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                />
              </div>

              {/* Never Store Sensitive Content */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Ignore Sensitive Content</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Automatically discard detected passwords, JWTs, and keys so they are never saved to SQLite.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.ignore_sensitive_content}
                  onChange={(e) => handleChange('ignore_sensitive_content', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Storage Stats Card */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-neutral-800/30 border border-neutral-800">
                  <div className="p-2 rounded-lg bg-neutral-900/60 text-center">
                    <span className="text-[10px] text-neutral-400 block">Total Items</span>
                    <span className="text-sm font-semibold text-white font-mono">{stats.total_items}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/60 text-center">
                    <span className="text-[10px] text-neutral-400 block">Pinned Items</span>
                    <span className="text-sm font-semibold text-amber-400 font-mono">{stats.pinned_items}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/60 text-center">
                    <span className="text-[10px] text-neutral-400 block">Images</span>
                    <span className="text-sm font-semibold text-white font-mono">{stats.image_items}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-900/60 text-center">
                    <span className="text-[10px] text-neutral-400 block">Database Size</span>
                    <span className="text-sm font-semibold text-neutral-200 font-mono">
                      {(stats.db_size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              )}

              {/* Max History Items */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Maximum History Limit</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Automatically prune oldest non-pinned items when exceeded.
                  </p>
                </div>
                <select
                  value={formData.max_history_items}
                  onChange={(e) => handleChange('max_history_items', Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:border-blue-500"
                >
                  <option value={100}>100 items</option>
                  <option value={250}>250 items</option>
                  <option value={500}>500 items (Recommended)</option>
                  <option value={1000}>1,000 items</option>
                  <option value={5000}>5,000 items</option>
                </select>
              </div>

              {/* Retention Days */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">History Retention Period</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Automatically remove items older than this period (pinned items are preserved).
                  </p>
                </div>
                <select
                  value={formData.retention_days}
                  onChange={(e) => handleChange('retention_days', Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:border-blue-500"
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days (Recommended)</option>
                  <option value={90}>90 Days</option>
                  <option value={0}>Keep Forever</option>
                </select>
              </div>

              {/* Image capture toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/40 border border-neutral-800">
                <div>
                  <h4 className="font-medium text-neutral-200">Capture Clipboard Images</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Store screenshots and copied images in local app directory.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.save_images}
                  onChange={(e) => handleChange('save_images', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-neutral-900 border-neutral-700 cursor-pointer"
                />
              </div>

              {/* Clear History Danger Section */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-rose-300">Clear Clipboard History</h4>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">
                    Delete unpinned history entries and stored images immediately.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800 bg-[#1e1e1e]">
          <span className="text-[11px] text-neutral-500">Settings save automatically</span>
          <button
            onClick={closeSettings}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clear History */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-semibold text-sm text-white">Clear Clipboard History?</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              This action will permanently delete all unpinned clipboard items. Pinned items will be
              preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition-colors"
              >
                Yes, Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
