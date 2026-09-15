import React from 'react';
import { List, Sparkles, Clock } from 'lucide-react';

interface MonitorStatusFiltersProps {
  isDark: boolean;
  appLang: 'en' | 'bn';
  monitorFilter: 'all' | 'unread' | 'archive';
  setMonitorFilter: (val: 'all' | 'unread' | 'archive') => void;
}

export const MonitorStatusFilters: React.FC<MonitorStatusFiltersProps> = ({
  isDark,
  appLang,
  monitorFilter,
  setMonitorFilter
}) => {
  return (
    <div className={`flex p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <button 
        onClick={() => setMonitorFilter('all')}
        title={appLang === 'bn' ? 'সব ভিডিও' : 'All Videos'}
        className={`p-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          monitorFilter === 'all' 
            ? (isDark ? 'bg-gray-700 shadow-sm text-gray-100' : 'bg-white shadow-sm text-gray-900') 
            : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
        }`}
      >
        <List className="w-4 h-4" />
      </button>
      <button 
        onClick={() => setMonitorFilter('unread')}
        title={appLang === 'bn' ? 'নতুন ভিডিও' : 'New Videos'}
        className={`p-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          monitorFilter === 'unread' 
            ? (isDark ? 'bg-gray-700 shadow-sm text-gray-100' : 'bg-white shadow-sm text-gray-900') 
            : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
        }`}
      >
        <Sparkles className="w-4 h-4" />
      </button>
      <button 
        onClick={() => setMonitorFilter('archive')}
        title={appLang === 'bn' ? 'পুরাতন ভিডিও' : 'Old Videos'}
        className={`p-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          monitorFilter === 'archive' 
            ? (isDark ? 'bg-gray-700 shadow-sm text-gray-100' : 'bg-white shadow-sm text-gray-900') 
            : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')
        }`}
      >
        <Clock className="w-4 h-4" />
      </button>
    </div>
  );
};
