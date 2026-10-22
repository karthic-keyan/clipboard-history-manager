import React, { useState } from 'react';
import { ClipboardItem } from '../../../shared/types';
import { useClipboardStore } from '../../stores/useClipboardStore';
import {
  Copy,
  Check,
  Star,
  Trash2,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Code2,
  Link2,
  FileText,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';

interface Props {
  item: ClipboardItem;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Badge icon and color based on content type (pure function hoisted outside render cycle)
function getTypeBadge(contentType: string) {
  switch (contentType) {
    case 'url':
      return {
        icon: <Link2 className="w-3 h-3 text-cyan-400" />,
        label: 'URL',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      };
    case 'code':
      return {
        icon: <Code2 className="w-3 h-3 text-purple-400" />,
        label: 'Code',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      };
    case 'image':
      return {
        icon: <ImageIcon className="w-3 h-3 text-amber-400" />,
        label: 'Image',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    case 'html':
      return {
        icon: <FileText className="w-3 h-3 text-emerald-400" />,
        label: 'Rich Text',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    default:
      return {
        icon: <FileText className="w-3 h-3 text-blue-400" />,
        label: 'Text',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
  }
}

const ClipboardCardComponent: React.FC<Props> = ({ item }) => {
  const copyItem = useClipboardStore((s) => s.copyItem);
  const togglePin = useClipboardStore((s) => s.togglePin);
  const deleteItem = useClipboardStore((s) => s.deleteItem);
  const openDetail = useClipboardStore((s) => s.openDetail);

  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyItem(item.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteItem(item.id);
  };

  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetail(item);
  };

  const typeBadge = getTypeBadge(item.content_type);

  // Handle sensitive masked text
  const displayContent = item.is_sensitive && !revealed ? item.preview : item.content;

  return (
    <div
      onClick={handleOpenDetail}
      className="group relative flex flex-col gap-2 p-3.5 rounded-xl fluent-acrylic-card hover:bg-neutral-800/90 transition-all cursor-pointer shadow-sm hover:shadow-md animate-fade-in"
    >
      {/* Top Header: Badge, Time, Sensitive indicator, Pin indicator */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${typeBadge.badgeClass}`}
          >
            {typeBadge.icon}
            <span>{typeBadge.label}</span>
          </span>

          {item.is_sensitive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Lock className="w-2.5 h-2.5" />
              <span>{item.sensitive_type ? item.sensitive_type.replace('_', ' ') : 'Sensitive'}</span>
            </span>
          )}

          {item.copy_count > 1 && (
            <span className="text-[10px] text-neutral-400 font-mono px-1.5 py-0.5 rounded bg-neutral-800/60 border border-neutral-700/40">
              {item.copy_count}× copied
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span>{formatRelativeTime(item.last_copied_at)}</span>

          {item.is_pinned && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 ml-1" />
          )}
        </div>
      </div>

      {/* Main Content Preview */}
      <div className="py-0.5">
        {item.content_type === 'image' && item.image_path ? (
          <div className="flex items-center gap-3">
            <img
              src={`file://${item.image_path}`}
              alt="Clipboard image"
              className="h-20 max-w-[200px] object-cover rounded-lg border border-neutral-700/60 bg-neutral-900/50"
            />
            <div className="flex flex-col text-xs text-neutral-400">
              <span className="font-medium text-neutral-200">{item.preview}</span>
              <span>Dimensions: {item.image_width} × {item.image_height}</span>
            </div>
          </div>
        ) : (
          <div
            className={`text-xs leading-relaxed line-clamp-3 select-text ${
              item.content_type === 'code'
                ? 'font-mono text-neutral-300 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/80 whitespace-pre-wrap'
                : 'text-neutral-200'
            }`}
          >
            {displayContent}
          </div>
        )}
      </div>

      {/* Footer Info & Quick Action Buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {item.char_count > 0 && <span>{item.char_count} chars</span>}
          {item.word_count > 0 && <span>• {item.word_count} words</span>}
          {item.line_count > 1 && <span>• {item.line_count} lines</span>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {item.is_sensitive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(!revealed);
              }}
              title={revealed ? 'Hide sensitive content' : 'Reveal content'}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/60 transition-colors"
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={handleTogglePin}
            title={item.is_pinned ? 'Unpin item' : 'Pin item'}
            className={`p-1 rounded-md transition-colors ${
              item.is_pinned
                ? 'text-amber-400 hover:bg-amber-500/20'
                : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-700/60'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${item.is_pinned ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenDetail}
            title="Inspect / Full View"
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700/60 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDelete}
            title="Delete item"
            className="p-1 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copy back to clipboard"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClipboardCard = React.memo(ClipboardCardComponent);
