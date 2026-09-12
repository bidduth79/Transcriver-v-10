import React, { useState } from 'react';
import { SpeakerProfile, SpeakerCustomNote } from '../../types/speaker';
import { useAppTheme } from '../../hooks/useAppTheme';

interface SpeakerProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  speakerName: string;
  profile: SpeakerProfile | null;
  isLoading: boolean;
  error: string;
  onRefresh?: () => void;
  onUpdateCustomNote?: (note: SpeakerCustomNote) => void;
  onSeek?: (seconds: number) => void;
}

export const SpeakerProfileSidebar: React.FC<SpeakerProfileSidebarProps> = ({
  isOpen,
  onClose,
  speakerName,
  profile,
  isLoading,
  error,
  onRefresh,
  onUpdateCustomNote,
  onSeek
}) => {
  const { isDark, appLang } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'archive' | 'notes' | 'research'>('profile');

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteRole, setNoteRole] = useState(profile?.customNote?.roleOrDesignation || '');
  const [noteText, setNoteText] = useState(profile?.customNote?.notes || '');
  const [noteTags, setNoteTags] = useState<string[]>(profile?.customNote?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Sync state when profile opens or changes
  React.useEffect(() => {
    if (profile?.customNote) {
      setNoteRole(profile.customNote.roleOrDesignation || '');
      setNoteText(profile.customNote.notes || '');
      setNoteTags(profile.customNote.tags || []);
    } else {
      setNoteRole('');
      setNoteText('');
      setNoteTags([]);
    }
    setIsEditingNote(false);
  }, [profile?.name, profile?.customNote]);

  if (!isOpen) return null;

  const handleSaveNote = () => {
    if (!onUpdateCustomNote) return;
    const updated: SpeakerCustomNote = {
      speakerName: profile?.name || speakerName,
      roleOrDesignation: noteRole.trim(),
      notes: noteText.trim(),
      tags: noteTags,
      updatedAt: new Date().toLocaleDateString('bn-BD')
    };
    onUpdateCustomNote(updated);
    setIsEditingNote(false);
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || newTagInput).trim();
    if (tag && !noteTags.includes(tag)) {
      setNoteTags([...noteTags, tag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNoteTags(noteTags.filter(t => t !== tagToRemove));
  };

  const dbStats = profile?.databaseStats;
  const mentions = dbStats?.mentions || [];

  // Parse [MM:SS] timestamp to seconds
  const parseTimestampToSeconds = (ts?: string): number | null => {
    if (!ts) return null;
    const parts = ts.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  };

  const encodedName = encodeURIComponent(profile?.name || speakerName);
  const searchGoogleUrl = `https://www.google.com/search?q=${encodedName}+%E0%A6%AC%E0%A6%BF%E0%A6%9C%E0%A6%BF%E0%A6%AC%E0%A6%BF`;
  const searchGoogleNewsUrl = `https://www.google.com/search?q=${encodedName}&tbm=nws`;
  const searchYouTubeUrl = `https://www.youtube.com/results?search_query=${encodedName}+%E0%A6%AC%E0%A6%BF%E0%A6%9C%E0%A6%BF%E0%A6%AC%E0%A6%BF`;
  const searchFacebookUrl = `https://www.facebook.com/search/top?q=${encodedName}`;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:max-w-lg shadow-2xl z-[99999] transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 text-slate-100 border-l border-slate-700' : 'bg-white text-slate-800 border-l border-slate-200'} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className={`p-4 flex justify-between items-center border-b shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-white/90'} backdrop-blur-md`}>
          <div className="flex items-center gap-2.5 truncate pr-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="truncate">
              <h2 className="text-base font-bold tracking-wide truncate">
                {isLoading ? (appLang === 'bn' ? 'তথ্য খোঁজা হচ্ছে...' : 'Fetching Profile...') : profile?.name || speakerName}
              </h2>
              {profile?.customNote?.roleOrDesignation && (
                <p className="text-xs text-indigo-400 font-medium truncate">{profile.customNote.roleOrDesignation}</p>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 items-center">
            {profile && (
              <button 
                onClick={() => {
                  const summaryText = `${profile.name}\n\nপরিচয়:\n${profile.description}\n\nবিজিবি关于:\n${profile.bgbViews}\n\nডাটাবেজে উল্লেখ: ${dbStats?.bgbMentionCount || 0} বার`;
                  navigator.clipboard.writeText(summaryText);
                  const btn = document.getElementById('copy-profile-btn');
                  if (btn) {
                    const original = btn.innerHTML;
                    btn.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
                    setTimeout(() => { btn.innerHTML = original; }, 2000);
                  }
                }}
                id="copy-profile-btn"
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                title="কপি করুন"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            )}
            {onRefresh && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors ${isLoading ? 'opacity-50' : ''} ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
                title="রিফ্রেশ করুন"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            )}
            <button 
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`px-4 pt-2 border-b flex gap-1 shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'}`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            মূল পরিচিতি
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 relative ${activeTab === 'archive' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            বিজিবি হিস্টোরি
            {dbStats && dbStats.bgbMentionCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                {dbStats.bgbMentionCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'notes' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            কাস্টম নোট
            {profile?.customNote?.notes && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'research' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            ওপেন রিসার্চ
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto transcript-scrollbar">
          {isLoading && (
            <div className="w-full animate-pulse p-6 space-y-6">
              <div className={`w-full aspect-[16/9] rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              <div className="space-y-3">
                <div className={`h-4 w-28 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                <div className={`h-3 w-full rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                <div className={`h-3 w-5/6 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              </div>
              <div className="space-y-3">
                <div className={`h-4 w-32 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                <div className={`h-16 w-full rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && profile && (
            <div className="pb-8 animate-in fade-in duration-300">
              
              {/* TAB 1: MAIN PROFILE */}
              {activeTab === 'profile' && (
                <div>
                  {/* Photo & Quick Banner */}
                  <div className="w-full aspect-[16/9] relative bg-slate-800 overflow-hidden shrink-0">
                    <img 
                      src={profile.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=400&background=random`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=400&background=random`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-5 right-5">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {profile.customNote?.tags?.map(t => (
                          <span key={t} className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/80 text-white uppercase tracking-wider backdrop-blur-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                      <h1 className="text-2xl font-black text-white drop-shadow-md">{profile.name}</h1>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className={`grid grid-cols-3 divide-x text-center py-2.5 border-b text-xs ${isDark ? 'bg-slate-800/40 border-slate-800 divide-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 divide-slate-200 text-slate-600'}`}>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">ডাটাবেজে উপস্থিতি</p>
                      <p className="text-base font-black text-indigo-500 mt-0.5">{dbStats?.totalAppearances || 0} টি ফাইলে</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">বিজিবি উল্লেখ</p>
                      <p className={`text-base font-black mt-0.5 ${(dbStats?.bgbMentionCount || 0) > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {dbStats?.bgbMentionCount || 0} বার
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">বিজিবি মনোভাব</p>
                      <p className="text-xs font-bold mt-1">
                        {dbStats?.overallStance === 'supportive' && <span className="text-emerald-500">🟢 ইতিবাচক</span>}
                        {dbStats?.overallStance === 'critical' && <span className="text-rose-500">🔴 সমালোচনামূলক</span>}
                        {dbStats?.overallStance === 'neutral' && <span className="text-amber-500">🟡 নিরপেক্ষ</span>}
                        {(!dbStats || dbStats.overallStance === 'none') && <span className="text-slate-400">অজ্ঞাত</span>}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-6">
                    <section>
                      <h3 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        সংক্ষিপ্ত পরিচয় ও জীবনী
                      </h3>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {profile.description}
                      </p>
                    </section>

                    <section>
                      <h3 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        কর্মজীবন ও পরিচিতি
                      </h3>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {profile.career}
                      </p>
                    </section>

                    <section>
                      <h3 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        বিজিবি ও সীমান্ত সংক্রান্ত সার্বিক দৃষ্টিভঙ্গি
                      </h3>
                      <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
                        <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {profile.bgbViews}
                        </p>
                      </div>
                    </section>

                    {/* Co-Speakers Network */}
                    {dbStats && dbStats.coSpeakers.length > 0 && (
                      <section>
                        <h3 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          যৌথ আলোচনা বা সহ-বক্তা (Co-Speakers)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {dbStats.coSpeakers.map(cs => (
                            <span key={cs.name} className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1.5 ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                              <span className="font-semibold">{cs.name}</span>
                              <span className="text-[10px] opacity-60 font-mono">({cs.count} বার)</span>
                            </span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DATABASE ARCHIVE & BGB HISTORY */}
              {activeTab === 'archive' && (
                <div className="p-5 space-y-6">
                  {/* Stance Header */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">বিজিবি সংক্রান্ত স্ট্যান্স (Stance)</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        dbStats?.overallStance === 'supportive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        dbStats?.overallStance === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        dbStats?.overallStance === 'neutral' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {dbStats?.overallStance === 'supportive' ? '🟢 সমর্থনমূলক/ইতিবাচক' :
                         dbStats?.overallStance === 'critical' ? '🔴 সমালোচনামূলক/নেতিবাচক' :
                         dbStats?.overallStance === 'neutral' ? '🟡 নিরপেক্ষ/পর্যবেক্ষণ' : 'কোনো তথ্য নেই'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      আপনার স্টুডিওর পূর্ববর্তী সকল ট্রান্সক্রিপ্ট ও অডিও ফাইল ঘেঁটে পাওয়া তথ্য:
                    </p>
                  </div>

                  {/* List of Quotes */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                      <span>সংরক্ষিত বক্তব্যের উদ্ধৃতি ({mentions.length})</span>
                      <span className="text-[10px] text-indigo-400">স্বয়ংক্রিয় ম্যাচ</span>
                    </h3>

                    {mentions.length === 0 ? (
                      <div className={`p-8 rounded-xl border text-center ${isDark ? 'border-slate-800 bg-slate-800/20' : 'border-slate-200 bg-slate-50'}`}>
                        <svg className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-sm font-medium text-slate-400">আপনার সংরক্ষিত ফাইলে এই স্পীকারের বিজিবি বিষয়ে কোনো বক্তব্য পাওয়া যায়নি।</p>
                        <p className="text-xs text-slate-500 mt-1">ভবিষ্যতে এই স্পীকারের কোনো ফাইলে বিজিবি কথাটি আসলে তা এখানে যুক্ত হবে।</p>
                      </div>
                    ) : (
                      mentions.map((m, idx) => (
                        <div key={idx} className={`p-3.5 rounded-xl border transition-all ${isDark ? 'bg-slate-800/30 border-slate-700/80 hover:border-slate-600' : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'}`}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-indigo-400 truncate max-w-[200px]" title={m.fileName}>
                              📁 {m.fileName}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {m.timestamp && (
                                <button
                                  onClick={() => {
                                    const sec = parseTimestampToSeconds(m.timestamp);
                                    if (sec !== null && onSeek) {
                                      onSeek(sec);
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-mono cursor-pointer transition-colors"
                                  title="অডিও এই টাইমে নিয়ে যান"
                                >
                                  ⏱️ [{m.timestamp}]
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400">{m.date}</span>
                            </div>
                          </div>
                          <p className={`text-sm leading-relaxed italic ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            "{m.quote}"
                          </p>
                          <div className="mt-2.5 flex items-center justify-between text-[11px]">
                            <span className={`px-2 py-0.5 rounded font-medium ${
                              m.sentiment === 'supportive' ? 'bg-emerald-500/10 text-emerald-400' :
                              m.sentiment === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {m.sentiment === 'supportive' ? 'ইতিবাচক মনোভাব' :
                               m.sentiment === 'critical' ? 'সমালোচনামূলক' : 'নিরপেক্ষ তথ্য'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM TEAM NOTES & TAGS */}
              {activeTab === 'notes' && (
                <div className="p-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold">টিম নোট ও ডসিয়ার (Custom Notes)</h3>
                      <p className="text-xs text-slate-400">এই স্পীকার সম্পর্কে আপনার নিজস্ব পর্যবেক্ষণ বা রেকর্ড সেভ রাখুন</p>
                    </div>
                    {!isEditingNote && (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                      >
                        এডিট করুন
                      </button>
                    )}
                  </div>

                  {isEditingNote ? (
                    <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">পদবি / পেশাগত ভূমিকা</label>
                        <input
                          type="text"
                          value={noteRole}
                          onChange={(e) => setNoteRole(e.target.value)}
                          placeholder="যেমন: নিরাপত্তা বিশ্লেষক / সাংবাদিক"
                          className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-600'}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">ট্যাগসমূহ (Tags)</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {noteTags.map(t => (
                            <span key={t} className="px-2 py-0.5 text-xs rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              {t}
                              <button onClick={() => handleRemoveTag(t)} className="hover:text-red-400">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            placeholder="ট্যাগ লিখে এন্টার চাপুন..."
                            className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag()}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/50"
                          >
                            যোগ
                          </button>
                        </div>
                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {['সাংবাদিক', 'নিরাপত্তা বিশ্লেষক', 'সামরিক বিশেষজ্ঞ', 'সীমান্ত পর্যবেক্ষক', 'রাজনীতিবিদ', 'ইউটিউবার'].map(sg => (
                            <button
                              key={sg}
                              type="button"
                              onClick={() => handleAddTag(sg)}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-700/40 text-slate-300 hover:bg-slate-700"
                            >
                              + {sg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">বিস্তারিত নোট</label>
                        <textarea
                          rows={4}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="এই স্পীকার সম্পর্কে গুরুত্বপূর্ণ কোনো মন্তব্য, ব্যাকগ্রাউন্ড বা তথ্য..."
                          className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-600'}`}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setIsEditingNote(false)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800"
                        >
                          বাতিল
                        </button>
                        <button
                          onClick={handleSaveNote}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-md"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.customNote ? (
                        <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                          {profile.customNote.roleOrDesignation && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">পদবি/ভূমিকা</span>
                              <p className="text-sm font-semibold text-indigo-400">{profile.customNote.roleOrDesignation}</p>
                            </div>
                          )}
                          {profile.customNote.tags && profile.customNote.tags.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">ক্যাটাগরি ট্যাগ</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {profile.customNote.tags.map(t => (
                                  <span key={t} className="px-2 py-0.5 text-xs font-medium rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {profile.customNote.notes && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">নোটস</span>
                              <p className={`text-sm leading-relaxed mt-1 whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {profile.customNote.notes}
                              </p>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500 text-right pt-2 border-t border-slate-800">
                            সর্বশেষ আপডেট: {profile.customNote.updatedAt}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-xl border text-center ${isDark ? 'border-slate-800 bg-slate-800/20' : 'border-slate-200 bg-slate-50'}`}>
                          <p className="text-sm text-slate-400">কোনো কাস্টম নোট এখনো যুক্ত করা হয়নি।</p>
                          <button
                            onClick={() => setIsEditingNote(true)}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                          >
                            + নতুন নোট যোগ করুন
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: OPEN RESEARCH & DEEP SEARCH */}
              {activeTab === 'research' && (
                <div className="p-5 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold mb-1">ওয়ান-ক্লিক ওপেন রিসার্চ (Quick OSINT)</h3>
                    <p className="text-xs text-slate-400">সরাসরি এই ব্যক্তির নাম ও বিজিবি সংক্রান্ত অনলাইন তথ্য যাচাই করুন</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={searchGoogleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isDark ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-sm">
                        G
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">Google Search</p>
                        <p className="text-[10px] text-slate-400 truncate">ব্যক্তি + বিজিবি</p>
                      </div>
                    </a>

                    <a
                      href={searchGoogleNewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isDark ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                        📰
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">Google News</p>
                        <p className="text-[10px] text-slate-400 truncate">সাম্প্রতিক সংবাদ</p>
                      </div>
                    </a>

                    <a
                      href={searchYouTubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isDark ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-sm">
                        ▶️
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">YouTube</p>
                        <p className="text-[10px] text-slate-400 truncate">টকশো ও ভিডিও</p>
                      </div>
                    </a>

                    <a
                      href={searchFacebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isDark ? 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                        f
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">Facebook</p>
                        <p className="text-[10px] text-slate-400 truncate">পাবলিক পোস্ট</p>
                      </div>
                    </a>
                  </div>

                  {/* Dual-Language Wikipedia Extracted Summaries */}
                  {(profile.wikiSummaryBn || profile.wikiSummaryEn) && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">উইকিপিডিয়া সারাংশ (Wikipedia Extract)</h4>
                      {profile.wikiSummaryBn && (
                        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <span className="font-bold text-indigo-400 block mb-1">বাংলা উইকিপিডিয়া:</span>
                          <p>{profile.wikiSummaryBn}</p>
                        </div>
                      )}
                      {profile.wikiSummaryEn && (
                        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${isDark ? 'bg-slate-800/20 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <span className="font-bold text-indigo-400 block mb-1">English Wikipedia:</span>
                          <p>{profile.wikiSummaryEn}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
};
