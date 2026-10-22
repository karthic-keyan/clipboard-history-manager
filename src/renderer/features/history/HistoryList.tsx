import React, { useState, useMemo, useCallback } from 'react';
import { useClipboardStore } from '../../stores/useClipboardStore';
import { ClipboardCard } from './ClipboardCard';
import { ClipboardItem } from '../../../shared/types';
import {
  ClipboardList,
  SearchX,
  Loader2,
  Star,
  Code2,
  Link2,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronRight,
  FolderTree,
  ChevronsUpDown,
} from 'lucide-react';

interface CategoryGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconBg: string;
  badgeClass: string;
  items: ClipboardItem[];
}

export const HistoryList: React.FC = () => {
  const items = useClipboardStore((s) => s.items);
  const isLoading = useClipboardStore((s) => s.isLoading);
  const filter = useClipboardStore((s) => s.filter);
  const settings = useClipboardStore((s) => s.settings);
  const setSearchQuery = useClipboardStore((s) => s.setSearchQuery);
  const setTypeFilter = useClipboardStore((s) => s.setTypeFilter);
  const setPinnedOnly = useClipboardStore((s) => s.setPinnedOnly);

  // Category collapse state
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = useCallback((id: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Group items into categories if enabled
  const categorizedGroups = useMemo<CategoryGroup[]>(() => {
    if (!settings.group_by_category) return [];

    const pinned: ClipboardItem[] = [];
    const code: ClipboardItem[] = [];
    const url: ClipboardItem[] = [];
    const image: ClipboardItem[] = [];
    const html: ClipboardItem[] = [];
    const text: ClipboardItem[] = [];

    for (const item of items) {
      if (item.is_pinned) {
        pinned.push(item);
      } else if (item.content_type === 'code') {
        code.push(item);
      } else if (item.content_type === 'url') {
        url.push(item);
      } else if (item.content_type === 'image') {
        image.push(item);
      } else if (item.content_type === 'html') {
        html.push(item);
      } else {
        text.push(item);
      }
    }

    const groups: CategoryGroup[] = [
      {
        id: 'pinned',
        name: 'Pinned & Favorites',
        icon: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />,
        iconBg: 'bg-amber-500/10 border-amber-500/20',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        items: pinned,
      },
      {
        id: 'code',
        name: 'Code & Snippets',
        icon: <Code2 className="w-3.5 h-3.5 text-purple-400" />,
        iconBg: 'bg-purple-500/10 border-purple-500/20',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        items: code,
      },
      {
        id: 'url',
        name: 'Links & URLs',
        icon: <Link2 className="w-3.5 h-3.5 text-cyan-400" />,
        iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        items: url,
      },
      {
        id: 'image',
        name: 'Images & Screenshots',
        icon: <ImageIcon className="w-3.5 h-3.5 text-rose-400" />,
        iconBg: 'bg-rose-500/10 border-rose-500/20',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        items: image,
      },
      {
        id: 'html',
        name: 'Rich Content',
        icon: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        items: html,
      },
      {
        id: 'text',
        name: 'Text & Notes',
        icon: <FileText className="w-3.5 h-3.5 text-blue-400" />,
        iconBg: 'bg-blue-500/10 border-blue-500/20',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        items: text,
      },
    ];

    // Only return categories that have items matching current filters
    return groups.filter((g) => g.items.length > 0);
  }, [items, settings.group_by_category]);

  const allCollapsed = useMemo(() => {
    if (categorizedGroups.length === 0) return false;
    return categorizedGroups.every((g) => collapsedCategories[g.id]);
  }, [categorizedGroups, collapsedCategories]);

  const toggleAllCategories = useCallback(() => {
    if (allCollapsed) {
      setCollapsedCategories({});
    } else {
      const all: Record<string, boolean> = {};
      categorizedGroups.forEach((g) => {
        all[g.id] = true;
      });
      setCollapsedCategories(all);
    }
  }, [allCollapsed, categorizedGroups]);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <span className="text-sm">Loading clipboard history...</span>
      </div>
    );
  }

  if (items.length === 0) {
    const isFiltered = Boolean(filter.query || filter.type !== 'all' || filter.pinnedOnly || filter.dateRange !== 'all');

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        {isFiltered ? (
          <div className="flex flex-col items-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center mb-3 text-neutral-400">
              <SearchX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200 mb-1">No matching items found</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Try adjusting your search terms or clearing your filters to see more results.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setPinnedOnly(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors border border-neutral-700/60"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3 text-blue-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200 mb-1">Clipboard History is Empty</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Copy any text, links, code snippets or images with{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px] border border-neutral-700/50">
                Ctrl+C
              </kbd>
              . They will automatically be captured and organized here!
            </p>
          </div>
        )}
      </div>
    );
  }

  // If categorization is disabled, render standard flat list as-is
  if (!settings.group_by_category) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.map((item) => (
          <ClipboardCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  // If categorization is enabled, render categorized sections
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Category Overview Bar */}
      <div className="flex items-center justify-between px-1 pb-1 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <FolderTree className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium text-neutral-300">
            Categorized View ({categorizedGroups.length} {categorizedGroups.length === 1 ? 'category' : 'categories'})
          </span>
        </div>
        <button
          onClick={toggleAllCategories}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors px-2 py-0.5 rounded-md hover:bg-neutral-800"
        >
          <ChevronsUpDown className="w-3 h-3" />
          <span>{allCollapsed ? 'Expand All' : 'Collapse All'}</span>
        </button>
      </div>

      {/* Render each active category */}
      {categorizedGroups.map((group) => {
        const isCollapsed = Boolean(collapsedCategories[group.id]);

        return (
          <div key={group.id} className="space-y-2">
            {/* Category Section Header */}
            <button
              type="button"
              onClick={() => toggleCategory(group.id)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-neutral-700/80 transition-all select-none group text-left shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="text-neutral-500 group-hover:text-neutral-300 transition-colors">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${group.iconBg}`}>
                  {group.icon}
                </div>
                <span className="text-xs font-semibold text-neutral-200 tracking-wide truncate">
                  {group.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${group.badgeClass}`}>
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </button>

            {/* Category Content Items */}
            {!isCollapsed && (
              <div className="space-y-2.5 pl-2 border-l-2 border-neutral-800/70 ml-2.5 animate-fade-in">
                {group.items.map((item) => (
                  <ClipboardCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
