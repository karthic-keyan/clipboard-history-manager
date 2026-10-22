import React, { useEffect } from 'react';
import { useClipboardStore } from './stores/useClipboardStore';
import { TitleBar } from './components/TitleBar';
import { SearchBar } from './features/search/SearchBar';
import { HistoryList } from './features/history/HistoryList';
import { DetailModal } from './features/history/DetailModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { Toast } from './components/Toast';
import { QuickAccessView } from './features/quick-access/QuickAccessView';

export const App: React.FC = () => {
  const [currentHash, setCurrentHash] = React.useState(
    () => window.location.hash || window.location.search
  );

  React.useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || window.location.search);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  const isQuickAccess =
    currentHash.includes('quick-access');

  const fetchItems = useClipboardStore((s) => s.fetchItems);
  const fetchSettings = useClipboardStore((s) => s.fetchSettings);
  const fetchStats = useClipboardStore((s) => s.fetchStats);
  const handleItemUpdated = useClipboardStore((s) => s.handleItemUpdated);

  useEffect(() => {
    fetchItems();
    fetchSettings();
    fetchStats();

    // Listen to real-time clipboard change events from main process
    if (window.electronApi) {
      const unsubClipboard = window.electronApi.onClipboardChanged((item) => {
        handleItemUpdated(item);
      });

      const unsubSettings = window.electronApi.onSettingsChanged((settings) => {
        useClipboardStore.setState({ settings, isMonitoring: settings.monitoring_enabled });
      });

      const unsubMonitoring = window.electronApi.onMonitoringToggled((enabled) => {
        useClipboardStore.setState({ isMonitoring: enabled });
      });

      return () => {
        unsubClipboard();
        unsubSettings();
        unsubMonitoring();
      };
    }
  }, []);

  if (isQuickAccess) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent">
        <QuickAccessView />
        <Toast />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#191919] text-white overflow-hidden">
      <TitleBar />
      <SearchBar />
      <HistoryList />
      <DetailModal />
      <SettingsModal />
      <Toast />
    </div>
  );
};
