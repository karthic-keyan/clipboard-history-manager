import React from 'react';
import { useClipboardStore } from '../stores/useClipboardStore';
import { CheckCircle2 } from 'lucide-react';

export const Toast: React.FC = () => {
  const toastMessage = useClipboardStore((s) => s.toastMessage);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-neutral-900/90 text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md animate-slide-down">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="text-sm font-medium tracking-wide">{toastMessage}</span>
    </div>
  );
};
