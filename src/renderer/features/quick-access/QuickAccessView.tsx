import React, { useEffect, useRef, useState } from 'react';
import { useClipboardStore } from '../../stores/useClipboardStore';
import {
  Search,
  Check,
  Star,
  ExternalLink,
  Code2,
  Link2,
  FileText,
  Image as ImageIcon,
  Lock,
} from 'lucide-react';

export const QuickAccessView: React.FC = () => {
  const items = useClipboardStore((s) => s.items);
  const filter = useClipboardStore((s) => s.filter);
  const setSearchQuery = useClipboardStore((s) => s.setSearchQuery);
  const copyItem = useClipboardStore((s) => s.copyItem);
  const togglePin = useClipboardStore((s) => s.togglePin);
  const fetchItems = useClipboardStore((s) => s.fetchItems);
  const selectedIndex = useClipboardStore((s) => s.quickAccessSelectedIndex);
  const setSelectedIndex = useClipboardStore((s) => s.setQuickAccessSelectedIndex);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto focus and refresh on show
  useEffect(() => {
    fetchItems();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }

    if (window.electronApi) {
      const unsub = window.electronApi.onQuickAccessVisibilityChanged((visible) => {
        if (visible) {
          fetchItems();
          setSearchQuery('');
          setSelectedIndex(0);
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 50);
        }
      });
      return unsub;
    }
  }, []);

  // Keyboard navigation: Up, Down, Enter, Escape, P (Pin), 1-9 (Quick Copy)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.electronApi?.hideQuickAccess();
        return;
      }

      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(items.length - 1, selectedIndex + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[selectedIndex];
        if (selected) {
          await handleCopyItem(selected.id);
        }
      } else if ((e.ctrlKey || e.metaKey) && !isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= 9) {
        // Quick copy item 1..9
        e.preventDefault();
        const targetIndex = Number(e.key) - 1;
        if (items[targetIndex]) {
          await handleCopyItem(items[targetIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex]);

  // Keep highlighted item visible in scroll view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleCopyItem = async (id: string) => {
    setCopiedId(id);
    await copyItem(id);
    setTimeout(() => {
      window.electronApi?.hideQuickAccess();
      setCopiedId(null);
    }, 280);
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(id);
  };

  const handleOpenMainApp = () => {
    window.location.hash = '';
    window.electronApi?.hideQuickAccess();
    window.electronApi?.openMainWindow();
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'url':
        return <Link2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="w-full h-full p-2 flex flex-col select-none">
      <div className="flex-1 flex flex-col rounded-2xl bg-[#1c1c1c]/95 border border-neutral-700/80 shadow-fluent-dialog backdrop-blur-2xl overflow-hidden animate-scale-in">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-[#232323]">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={filter.query || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type to search clipboard history..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700/60">
            Esc to hide
          </kbd>
        </div>

        {/* History Items Scroll List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 text-xs">
              <span>No clipboard history matches your search.</span>
            </div>
          ) : (
            items.slice(0, 50).map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleCopyItem(item.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm'
                      : 'hover:bg-neutral-800/60 text-neutral-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Index shortcut indicator (1..9) */}
                    {idx < 9 ? (
                      <span className="w-4 text-[10px] font-mono text-neutral-500 text-center">
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="w-4" />
                    )}

                    {/* Format icon */}
                    <div className="shrink-0">{getItemIcon(item.content_type)}</div>

                    {/* Preview Text */}
                    <span
                      className={`text-xs truncate ${
                        item.content_type === 'code' ? 'font-mono text-neutral-200' : ''
                      }`}
                    >
                      {item.preview}
                    </span>

                    {/* Sensitive Tag */}
                    {item.is_sensitive && (
                      <Lock className="w-3 h-3 text-rose-400 shrink-0 ml-1" />
                    )}
                  </div>

                  {/* Actions & Pin */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.is_pinned && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}

                    {isCopied ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleTogglePin(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-amber-400 transition-opacity"
                        title={item.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Access Footer Hotkey Hints */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-neutral-800/80 bg-[#1e1e1e] text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono text-[9px] border border-neutral-700/60">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono text-[9px] border border-neutral-700/60">
                ↵ Enter
              </kbd>
              <span>Copy</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono text-[9px] border border-neutral-700/60">
                Ctrl+1..9
              </kbd>
              <span>Instant Copy</span>
            </span>
          </div>

          <button
            onClick={handleOpenMainApp}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <span>Open Full App</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
