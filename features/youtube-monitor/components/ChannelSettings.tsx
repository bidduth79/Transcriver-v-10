import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, X, Plus, Trash2 } from 'lucide-react';
import { YouTubeChannel } from '../../../types/youtube';

interface ChannelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  appLang: 'en' | 'bn';
  channels: YouTubeChannel[];
  newChannelTitle: string;
  setNewChannelTitle: (val: string) => void;
  newChannelId: string;
  setNewChannelId: (val: string) => void;
  handleAddChannel: () => void;
  editingChannelId: string | null;
  setEditingChannelId: (id: string | null) => void;
  editChannelTitle: string;
  setEditChannelTitle: (val: string) => void;
  editChannelValue: string;
  setEditChannelValue: (val: string) => void;
  handleSaveChannel: (id: string) => void;
  removeChannel: (id: string) => void;
}

export const ChannelSettings: React.FC<ChannelSettingsProps> = ({
  isOpen,
  onClose,
  appLang,
  channels,
  newChannelTitle,
  setNewChannelTitle,
  newChannelId,
  setNewChannelId,
  handleAddChannel,
  editingChannelId,
  setEditingChannelId,
  editChannelTitle,
  setEditChannelTitle,
  editChannelValue,
  setEditChannelValue,
  handleSaveChannel,
  removeChannel
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 overflow-hidden z-50"
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              {appLang === 'bn' ? 'চ্যানেল সেটিংস' : 'Channel Settings'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="text"
                value={newChannelTitle}
                onChange={(e) => setNewChannelTitle(e.target.value)}
                placeholder={appLang === 'bn' ? 'চ্যানেলের নাম' : 'Channel Name'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <input
                type="text"
                value={newChannelId}
                onChange={(e) => setNewChannelId(e.target.value)}
                placeholder={appLang === 'bn' ? 'চ্যানেল আইডি (যেমন: UC...)' : 'Channel ID (e.g. UC...)'}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={handleAddChannel}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 cursor-pointer text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> {appLang === 'bn' ? 'যোগ করুন' : 'Add Channel'}
              </button>
            </div>
            <div className="space-y-2">
              {channels.map(channel => (
                <div key={channel.id} className="p-3 rounded-lg border border-gray-200 flex items-center justify-between bg-gray-50">
                  {editingChannelId === channel.id ? (
                    <div className="flex-1 flex flex-col gap-2 mr-2">
                      <input 
                        type="text"
                        value={editChannelTitle}
                        onChange={(e) => setEditChannelTitle(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input 
                        type="text"
                        value={editChannelValue}
                        onChange={(e) => setEditChannelValue(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveChannel(channel.id)} className="flex-1 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 cursor-pointer">
                          Save
                        </button>
                        <button onClick={() => setEditingChannelId(null)} className="flex-1 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex-1 cursor-pointer overflow-hidden" 
                      onClick={() => {
                        setEditingChannelId(channel.id);
                        setEditChannelTitle(channel.title);
                        setEditChannelValue(channel.channelId);
                      }}
                    >
                      <h4 className="font-medium text-gray-900 text-sm truncate">{channel.title}</h4>
                      <p className="text-[10px] font-mono text-gray-500 truncate">{channel.channelId}</p>
                    </div>
                  )}
                  {editingChannelId !== channel.id && (
                    <button onClick={() => removeChannel(channel.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer flex-shrink-0 ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
