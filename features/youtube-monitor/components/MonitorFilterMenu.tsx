import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { YouTubeChannel } from '../../../types/youtube';

interface MonitorFilterMenuProps {
  showFilterMenu: boolean;
  selectedChannelFilter: string;
  setSelectedChannelFilter: (val: string) => void;
  selectedDurationFilter: string;
  setSelectedDurationFilter: (val: string) => void;
  selectedDateFilter: string;
  setSelectedDateFilter: (val: string) => void;
  selectedTimeFilter: string;
  setSelectedTimeFilter: (val: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (val: string) => void;
  channels: YouTubeChannel[];
  isDark?: boolean;
}

export const MonitorFilterMenu: React.FC<MonitorFilterMenuProps> = ({
  showFilterMenu,
  selectedChannelFilter,
  setSelectedChannelFilter,
  selectedDurationFilter,
  setSelectedDurationFilter,
  selectedDateFilter,
  setSelectedDateFilter,
  selectedTimeFilter,
  setSelectedTimeFilter,
  selectedStatusFilter,
  setSelectedStatusFilter,
  channels,
  isDark
}) => {
  return (
    <AnimatePresence>
      {showFilterMenu && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border overflow-hidden z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="p-4 space-y-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>চ্যানেল (Channel)</label>
              <select 
                value={selectedChannelFilter}
                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                className={`w-full text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="all">সব চ্যানেল (All)</option>
                {channels.map(c => (
                  <option key={c.id} value={c.channelId}>{c.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ডিউরেশন (Duration)</label>
              <select 
                value={selectedDurationFilter}
                onChange={(e) => setSelectedDurationFilter(e.target.value)}
                className={`w-full text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="all">সব (All)</option>
                <option value="short">ছোট (&lt; 5 min)</option>
                <option value="medium">মাঝারি (5-20 min)</option>
                <option value="long">বড় (&gt; 20 min)</option>
              </select>
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ডেট (Date)</label>
              <select 
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className={`w-full text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="all">সব (All)</option>
                <option value="today">আজ (Today)</option>
                <option value="yesterday">গতকাল (Yesterday)</option>
                <option value="this_week">এই সপ্তাহ (This Week)</option>
              </select>
            </div>
            
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>সময় (Time)</label>
              <select 
                value={selectedTimeFilter}
                onChange={(e) => setSelectedTimeFilter(e.target.value)}
                className={`w-full text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="all">সব (All)</option>
                <option value="morning">সকাল (Morning)</option>
                <option value="afternoon">দুপুর (Afternoon)</option>
                <option value="evening">সন্ধ্যা (Evening)</option>
                <option value="night">রাত (Night)</option>
              </select>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>স্ট্যাটাস (Status)</label>
              <select 
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className={`w-full text-sm border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="all">সব (All)</option>
                <option value="live">লাইভ (Live)</option>
                <option value="downloaded">ডাউনলোড (Downloaded)</option>
                <option value="error">ইরর (Error)</option>
                <option value="visited">ভিজিটেড (Visited)</option>
                <option value="link_copied">লিংক কপিড (Link Copied)</option>
              </select>
            </div>

            {(selectedChannelFilter !== 'all' || selectedDurationFilter !== 'all' || selectedDateFilter !== 'all' || selectedTimeFilter !== 'all' || selectedStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedChannelFilter('all');
                  setSelectedDurationFilter('all');
                  setSelectedDateFilter('all');
                  setSelectedTimeFilter('all');
                  setSelectedStatusFilter('all');
                }}
                className={`w-full py-2 mt-2 text-sm font-medium rounded-md transition-colors ${
                  isDark 
                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                ক্লিয়ার করুন (Clear Filters)
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
