import React, { useState, useEffect } from 'react';
import { useClipboardStore } from '../stores/useClipboardStore';
import {
  Clipboard,
  Minus,
  Square,
  X,
  Settings,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';

export const TitleBar: React.FC = () => {
  const isMonitoring = useClipboardStore((s) => s.isMonitoring);
  const toggleMonitoring = useClipboardStore((s) => s.toggleMonitoring);
  const openSettings = useClipboardStore((s) => s.openSettings);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronApi?.isWindowMaximized) {
      window.electronApi.isWindowMaximized().then((max) => setIsMaximized(Boolean(max)));
    }
    if (window.electronApi?.onMaximizeChanged) {
      const cleanup = window.electronApi.onMaximizeChanged((max) => {
        setIsMaximized(max);
      });
      return cleanup;
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronApi) {
      window.electronApi.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronApi?.maximizeWindow) {
      const max = await window.electronApi.maximizeWindow();
      setIsMaximized(Boolean(max));
    }
  };

  const handleClose = () => {
    if (window.electronApi) {
      window.electronApi.closeWindow();
    }
  };

  return (
    <header
      onDoubleClick={handleMaximize}
      className="h-10 w-full bg-[#1e1e1e] border-b border-neutral-800/80 flex items-center justify-between px-3 select-none titlebar-drag z-40"
    >
      {/* Left: App Branding */}
      <div className="flex items-center gap-2.5 titlebar-nodrag">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
          <Clipboard className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-neutral-200">
          Clipboard History Manager
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">
          v1.0
        </span>
      </div>

      {/* Center: Live Monitoring Status Badge (Clickable) */}
      <div className="titlebar-nodrag">
        <button
          onClick={() => toggleMonitoring()}
          title={isMonitoring ? 'Click to pause monitoring' : 'Click to resume monitoring'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            isMonitoring
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMonitoring ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          {isMonitoring ? (
            <>
              <span>Monitoring Active</span>
              <Pause className="w-2.5 h-2.5 opacity-60 ml-0.5" />
            </>
          ) : (
            <>
              <span>Monitoring Paused</span>
              <Play className="w-2.5 h-2.5 opacity-60 ml-0.5" />
            </>
          )}
        </button>
      </div>

      {/* Right: Quick Access toggle, Settings and Windows Window Controls */}
      <div className="flex items-center gap-1 titlebar-nodrag">
        <button
          onClick={() => {
            window.location.hash = window.location.hash.includes('quick-access')
              ? ''
              : 'quick-access';
          }}
          title="Toggle Quick Access Overlay View (Win+V style)"
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/50 transition-colors mr-1"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Access</span>
        </button>

        <button
          onClick={openSettings}
          title="Settings"
          className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          title="Minimize"
          className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-1"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore Button */}
        <button
          onClick={handleMaximize}
          title={isMaximized ? 'Restore Down' : 'Maximize'}
          className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          {isMaximized ? (
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="4.5" y="1.5" width="9.5" height="9.5" rx="1" />
              <path d="M2 5v8a1 1 0 001 1h8" strokeLinecap="round" />
            </svg>
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          title="Close (Hide to Tray)"
          className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-rose-600/80 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
