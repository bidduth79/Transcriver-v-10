import * as React from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Headphones, Zap, Layers, Video, FileAudio } from 'lucide-react';

interface MonitorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  appLang: 'en' | 'bn';
  isDark?: boolean;
}

export const MonitorSettings: React.FC<MonitorSettingsProps> = ({ isOpen, onClose, appLang, isDark }) => {
  const [bitrate, setBitrate] = React.useState(localStorage.getItem('yt_default_bitrate') || '16');
  const [channels, setChannels] = React.useState(localStorage.getItem('yt_default_channels') || '1');
  const [samplerate, setSamplerate] = React.useState(localStorage.getItem('yt_default_samplerate') || '16000');
  const [downloadType, setDownloadType] = React.useState<'video' | 'audio'>((localStorage.getItem('yt_default_download_type') as 'video' | 'audio') || 'audio');
  const [audioFormat, setAudioFormat] = React.useState(localStorage.getItem('yt_default_audio_format') || 'audio');
  const [videoFormat, setVideoFormat] = React.useState(localStorage.getItem('yt_default_video_format') || '720p');
  const [keywords, setKeywords] = React.useState(localStorage.getItem('yt_monitor_keywords') || 'টকশো, সীমান্ত, বিজিবি, বিজিবি মহাপরিচালক, ডিজি বিজিবি, বিএসএফ, বর্ডার, পুশইন, সীমান্ত হত্যা');

  const ytSettingsChanged = useAppStore(state => state.ytSettingsChanged);

  React.useEffect(() => {
    const handleSettingsChange = () => {
      setBitrate(localStorage.getItem('yt_default_bitrate') || '16');
      setChannels(localStorage.getItem('yt_default_channels') || '1');
      setSamplerate(localStorage.getItem('yt_default_samplerate') || '16000');
      setDownloadType((localStorage.getItem('yt_default_download_type') as 'video' | 'audio') || 'audio');
      setAudioFormat(localStorage.getItem('yt_default_audio_format') || 'audio');
      setVideoFormat(localStorage.getItem('yt_default_video_format') || '720p');
      setKeywords(localStorage.getItem('yt_monitor_keywords') || 'টকশো, সীমান্ত, বিজিবি, বিজিবি মহাপরিচালক, ডিজি বিজিবি, বিএসএফ, বর্ডার, পুশইন, সীমান্ত হত্যা');
    };
    handleSettingsChange();
  }, [ytSettingsChanged]);

  const handleSave = () => {
    localStorage.setItem('yt_default_bitrate', bitrate);
    localStorage.setItem('yt_default_channels', channels);
    localStorage.setItem('yt_default_samplerate', samplerate);
    localStorage.setItem('yt_default_download_type', downloadType);
    localStorage.setItem('yt_default_audio_format', audioFormat);
    localStorage.setItem('yt_default_video_format', videoFormat);
    localStorage.setItem('yt_monitor_keywords', keywords);
    useAppStore.getState().triggerYtSettingsChanged();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`absolute top-full right-0 mt-2 w-80 rounded-xl shadow-2xl border z-[100] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <Headphones className="w-4 h-4 text-red-500" />
              {appLang === 'bn' ? 'ডাউনলোড সেটিংস' : 'Download Settings'}
            </h3>
            <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Download Type Selection */}
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Layers className="w-3 h-3" /> {appLang === 'bn' ? 'ডাউনলোডের ধরণ' : 'Download Type'}
              </label>
              <div className={`flex p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setDownloadType('audio')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${downloadType === 'audio' ? (isDark ? 'bg-gray-600 shadow-sm text-pink-400' : 'bg-white shadow-sm text-pink-600') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}
                >
                  <FileAudio className="w-4 h-4" /> {appLang === 'bn' ? 'অডিও' : 'Audio'}
                </button>
                <button
                  onClick={() => setDownloadType('video')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${downloadType === 'video' ? (isDark ? 'bg-gray-600 shadow-sm text-blue-400' : 'bg-white shadow-sm text-blue-600') : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900')}`}
                >
                  <Video className="w-4 h-4" /> {appLang === 'bn' ? 'ভিডিও' : 'Video'}
                </button>
              </div>
            </div>

            {/* Format Selection based on Type */}
            {downloadType === 'audio' ? (
              <div className={`space-y-4 p-3 rounded-lg border ${isDark ? 'bg-pink-900/20 border-pink-800/50' : 'bg-pink-50/50 border-pink-100'}`}>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 flex items-center gap-1 ${isDark ? 'text-pink-400' : 'text-pink-700'}`}>
                    <Headphones className="w-3 h-3" /> {appLang === 'bn' ? 'অডিও ফরম্যাট' : 'Audio Format'}
                  </label>
                  <select 
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none ${isDark ? 'bg-gray-800 border-pink-800/50 text-gray-200' : 'bg-white border-pink-200 text-gray-900'}`}
                  >
                    <option value="audio">Opus 16kHz (16 bit, 1 channel)</option>
                    <option value="opus">Opus HQ</option>
                    <option value="mp3">MP3 128k</option>
                    <option value="64k">MP3 64k</option>
                    <option value="32k">MP3 32k</option>
                    <option value="16k">MP3 16k</option>
                    <option value="m4a">M4A</option>
                    <option value="wav">WAV</option>
                    <option value="audio_best">Best Available</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1.5 flex items-center gap-1 ${isDark ? 'text-pink-400' : 'text-pink-700'}`}>
                      <Zap className="w-3 h-3" /> {appLang === 'bn' ? 'বিটরেট (kbps)' : 'Bitrate (kbps)'}
                    </label>
                    <input 
                      type="number"
                      value={bitrate}
                      onChange={(e) => setBitrate(e.target.value)}
                      className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none ${isDark ? 'bg-gray-800 border-pink-800/50 text-gray-200' : 'bg-white border-pink-200 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase mb-1.5 ${isDark ? 'text-pink-400' : 'text-pink-700'}`}>
                      {appLang === 'bn' ? 'চ্যানেল' : 'Channels'}
                    </label>
                    <select 
                      value={channels}
                      onChange={(e) => setChannels(e.target.value)}
                      className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none ${isDark ? 'bg-gray-800 border-pink-800/50 text-gray-200' : 'bg-white border-pink-200 text-gray-900'}`}
                    >
                      <option value="1">Mono (Smallest)</option>
                      <option value="2">Stereo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 ${isDark ? 'text-pink-400' : 'text-pink-700'}`}>
                    {appLang === 'bn' ? 'স্যাম্পল রেট (Hz)' : 'Sample Rate (Hz)'}
                  </label>
                  <select 
                    value={samplerate}
                    onChange={(e) => setSamplerate(e.target.value)}
                    className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none ${isDark ? 'bg-gray-800 border-pink-800/50 text-gray-200' : 'bg-white border-pink-200 text-gray-900'}`}
                  >
                    <option value="8000">8000 Hz</option>
                    <option value="16000">16000 Hz (Recommended)</option>
                    <option value="22050">22050 Hz</option>
                    <option value="44100">44100 Hz</option>
                    <option value="48000">48000 Hz</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className={`space-y-4 p-3 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50/50 border-blue-100'}`}>
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1.5 flex items-center gap-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    <Video className="w-3 h-3" /> {appLang === 'bn' ? 'ভিডিও ফরম্যাট' : 'Video Format'}
                  </label>
                  <select 
                    value={videoFormat}
                    onChange={(e) => setVideoFormat(e.target.value)}
                    className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDark ? 'bg-gray-800 border-blue-800/50 text-gray-200' : 'bg-white border-blue-200 text-gray-900'}`}
                  >
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="480p">480p (SD)</option>
                    <option value="360p">360p (Low)</option>
                    <option value="240p">240p (Lowest)</option>
                    <option value="best">Best Available</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className={`block text-xs font-bold uppercase mb-1.5 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {appLang === 'bn' ? 'কীওয়ার্ড ফিল্টার (কমা দিয়ে আলাদা করুন)' : 'Keyword Filter (comma separated)'}
              </label>
              <textarea 
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="টকশো, সীমান্ত, বিজিবি..."
                className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none h-20 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
              <p className={`mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {appLang === 'bn' ? 'ফাঁকা রাখলে সব ভিডিও আসবে। কীওয়ার্ড থাকলে শুধুমাত্র সেই ভিডিওগুলো আসবে।' : 'Leave empty to allow all videos. Enter keywords to only fetch matching videos.'}
              </p>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Save className="w-4 h-4" />
              {appLang === 'bn' ? 'সেভ করুন' : 'Save Settings'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
