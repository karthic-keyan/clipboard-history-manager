import React, { useState } from 'react';
import { useClipboardStore } from '../../stores/useClipboardStore';
import {
  X,
  Copy,
  Check,
  Star,
  Trash2,
  Lock,
  ExternalLink,
  Code2,
  FileText,
  Link2,
  Image as ImageIcon,
  WrapText,
  Hash,
} from 'lucide-react';

export const DetailModal: React.FC = () => {
  const activeItem = useClipboardStore((s) => s.activeItemForDetail);
  const closeDetail = useClipboardStore((s) => s.closeDetail);
  const copyItem = useClipboardStore((s) => s.copyItem);
  const togglePin = useClipboardStore((s) => s.togglePin);
  const deleteItem = useClipboardStore((s) => s.deleteItem);

  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);

  if (!activeItem) return null;

  const handleCopy = async () => {
    const success = await copyItem(activeItem.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const handleTogglePin = () => {
    togglePin(activeItem.id);
  };

  const handleDelete = () => {
    deleteItem(activeItem.id);
    closeDetail();
  };

  const handleOpenUrl = () => {
    if (activeItem.content_type === 'url' && window.electronApi) {
      window.electronApi.openExternalUrl(activeItem.content);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Clipboard Item Details
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-800 text-neutral-400 border border-neutral-700/50">
              {activeItem.content_type.toUpperCase()}
            </span>
            {activeItem.is_sensitive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Lock className="w-2.5 h-2.5" />
                <span>Sensitive</span>
              </span>
            )}
          </div>

          <button
            onClick={closeDetail}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeItem.content_type === 'image' && activeItem.image_path ? (
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <img
                src={`file://${activeItem.image_path}`}
                alt="Captured visual"
                className="max-h-80 object-contain rounded-lg shadow-md"
              />
              <span className="text-xs text-neutral-400 mt-3 font-mono">
                Resolution: {activeItem.image_width} × {activeItem.image_height} px
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Content Body</span>
                <div className="flex items-center gap-2">
                  {activeItem.content_type === 'url' && (
                    <button
                      onClick={handleOpenUrl}
                      className="flex items-center gap-1 text-cyan-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Link in Browser</span>
                    </button>
                  )}
                  <button
                    onClick={() => setWordWrap(!wordWrap)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <WrapText className="w-3 h-3" />
                    <span>Wrap: {wordWrap ? 'On' : 'Off'}</span>
                  </button>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 select-text overflow-x-auto max-h-72 ${
                  wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                } ${activeItem.content_type === 'code' ? 'font-mono' : 'font-sans'}`}
              >
                {activeItem.content}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-700/40">
              <span className="text-neutral-400 block text-[10px]">Characters</span>
              <span className="font-semibold text-neutral-200 font-mono">{activeItem.char_count}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-700/40">
              <span className="text-neutral-400 block text-[10px]">Words</span>
              <span className="font-semibold text-neutral-200 font-mono">{activeItem.word_count}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-700/40">
              <span className="text-neutral-400 block text-[10px]">Lines</span>
              <span className="font-semibold text-neutral-200 font-mono">{activeItem.line_count}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-700/40">
              <span className="text-neutral-400 block text-[10px]">Size</span>
              <span className="font-semibold text-neutral-200 font-mono">
                {(activeItem.content_size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>

          {/* Timestamps & Hash */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-800/30 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
            <div>
              <span className="text-neutral-500">Captured At:</span>{' '}
              {new Date(activeItem.created_at).toLocaleString()}
            </div>
            <div>
              <span className="text-neutral-500">Last Copied:</span>{' '}
              {new Date(activeItem.last_copied_at).toLocaleString()} (Copied {activeItem.copy_count}×)
            </div>
            <div className="truncate">
              <span className="text-neutral-500">SHA-256 Hash:</span> {activeItem.content_hash}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800 bg-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeItem.is_pinned
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeItem.is_pinned ? 'fill-amber-400' : ''}`} />
              <span>{activeItem.is_pinned ? 'Pinned' : 'Pin Item'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={closeDetail}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
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
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
