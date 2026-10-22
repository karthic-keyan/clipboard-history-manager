import React, { useRef, useEffect } from 'react';
import { useClipboardStore } from '../../stores/useClipboardStore';
import { ContentType, SortOrder, DateRange } from '../../../shared/types';
import {
  Search,
  X,
  Star,
  FileText,
  Code2,
  Link2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  FolderTree,
} from 'lucide-react';

export const SearchBar: React.FC = () => {
  const filter = useClipboardStore((s) => s.filter);
  const items = useClipboardStore((s) => s.items);
  const setSearchQuery = useClipboardStore((s) => s.setSearchQuery);
  const setTypeFilter = useClipboardStore((s) => s.setTypeFilter);
  const setPinnedOnly = useClipboardStore((s) => s.setPinnedOnly);
  const setDateRange = useClipboardStore((s) => s.setDateRange);
  const setSortBy = useClipboardStore((s) => s.setSortBy);
  const settings = useClipboardStore((s) => s.settings);
  const toggleGroupByCategory = useClipboardStore((s) => s.toggleGroupByCategory);

  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+F / Cmd+F shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filterTabs: { label: string; icon: React.ReactNode; type: ContentType | 'all' | 'pinned' }[] = [
    { label: 'All', icon: <Layers className="w-3.5 h-3.5" />, type: 'all' },
    { label: 'Pinned', icon: <Star className="w-3.5 h-3.5" />, type: 'pinned' },
    { label: 'Text', icon: <FileText className="w-3.5 h-3.5" />, type: 'text' },
    { label: 'Code', icon: <Code2 className="w-3.5 h-3.5" />, type: 'code' },
    { label: 'Links', icon: <Link2 className="w-3.5 h-3.5" />, type: 'url' },
    { label: 'Images', icon: <ImageIcon className="w-3.5 h-3.5" />, type: 'image' },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#1e1e1e]/60 border-b border-neutral-800/80 backdrop-blur-md">
      {/* Top Search Input Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={filter.query || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clipboard history... (Ctrl+F)"
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-neutral-900/80 border border-neutral-700/60 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          {filter.query && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Shortcut Hint Tag */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/50 border border-neutral-700/40 text-[11px] text-neutral-400 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Access:</span>
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-200 border border-neutral-700/60 font-mono text-[10px]">
            {settings.global_shortcut.replace('CommandOrControl', 'Ctrl')}
          </kbd>
        </div>
      </div>

      {/* Filter Tabs & Sorting Row */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {filterTabs.map((tab) => {
            const isActive =
              tab.type === 'pinned'
                ? filter.pinnedOnly
                : !filter.pinnedOnly && filter.type === tab.type;

            return (
              <button
                key={tab.label}
                onClick={() => {
                  if (tab.type === 'pinned') {
                    setPinnedOnly(true);
                  } else {
                    setPinnedOnly(false);
                    setTypeFilter(tab.type);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-800/70 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort, Date and Categorize Controls */}
        <div className="flex items-center gap-2">
          {/* Categorization Toggle Button */}
          <button
            onClick={() => toggleGroupByCategory()}
            title={
              settings.group_by_category
                ? 'Categorization is ON (Click to show as flat list)'
                : 'Categorization is OFF (Click to group items by category)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              settings.group_by_category
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm hover:bg-blue-600/30'
                : 'bg-neutral-900/80 border-neutral-700/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categorize</span>
            {settings.group_by_category && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>

          {/* Date Range Selector */}
          <select
            value={filter.dateRange || 'all'}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="bg-neutral-900/80 border border-neutral-700/60 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>

          {/* Sort Order Selector */}
          <select
            value={filter.sortBy || 'recent'}
            onChange={(e) => setSortBy(e.target.value as SortOrder)}
            className="bg-neutral-900/80 border border-neutral-700/60 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="most_copied">Most Copied</option>
          </select>

          <span className="text-[11px] text-neutral-400 font-mono pl-1">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>
    </div>
  );
};
