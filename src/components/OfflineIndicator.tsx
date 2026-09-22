import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-4 z-50 flex items-center gap-2 rounded-full bg-amber-500 pl-2 pr-4 py-1.5 text-xs font-medium text-white shadow-lg animate-in slide-in-from-bottom-5">
      <div className="bg-white/20 p-1.5 rounded-full">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      Offline Mode — Cached data is being used.
    </div>
  );
};
