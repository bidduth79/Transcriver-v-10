import React, { useState } from 'react';
import { SpeakerProfile, SpeakerCustomNote } from '../../types/speaker';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSpeakerProfileSidebarLogic } from './hooks/useSpeakerProfileSidebarLogic';
import { SpeakerProfileTab } from './SpeakerProfileTab';
import { SpeakerArchiveTab } from './SpeakerArchiveTab';
import { SpeakerNotesTab } from './SpeakerNotesTab';
import { SpeakerResearchTab } from './SpeakerResearchTab';

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
  
  const {
    activeTab, setActiveTab,
    isEditingNote, setIsEditingNote,
    noteRole, setNoteRole,
    noteText, setNoteText,
    noteTags, setNoteTags,
    newTagInput, setNewTagInput,
    handleSaveNote,
    handleAddTag,
    handleRemoveTag,
    parseTimestampToSeconds,
    searchGoogleUrl,
    searchGoogleNewsUrl,
    searchYouTubeUrl,
    searchFacebookUrl
  } = useSpeakerProfileSidebarLogic(speakerName, profile, onUpdateCustomNote);

  const dbStats = profile?.databaseStats;
  const mentions = dbStats?.mentions || [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
              <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
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
                <SpeakerProfileTab 
                  profile={profile} 
                  dbStats={dbStats} 
                  isDark={isDark} 
                />
              )}

              {/* TAB 2: DATABASE ARCHIVE & BGB HISTORY */}
              {activeTab === 'archive' && (
                <SpeakerArchiveTab 
                  dbStats={dbStats} 
                  isDark={isDark} 
                  mentions={mentions} 
                  parseTimestampToSeconds={parseTimestampToSeconds} 
                  onSeek={onSeek} 
                />
              )}

              {/* TAB 3: CUSTOM TEAM NOTES & TAGS */}
              {activeTab === 'notes' && (
                <SpeakerNotesTab 
                  profile={profile}
                  isEditingNote={isEditingNote}
                  setIsEditingNote={setIsEditingNote}
                  noteRole={noteRole}
                  setNoteRole={setNoteRole}
                  noteTags={noteTags}
                  handleRemoveTag={handleRemoveTag}
                  newTagInput={newTagInput}
                  setNewTagInput={setNewTagInput}
                  handleAddTag={handleAddTag}
                  noteText={noteText}
                  setNoteText={setNoteText}
                  handleSaveNote={handleSaveNote}
                  isDark={isDark}
                />
              )}

              {/* TAB 4: OPEN RESEARCH & DEEP SEARCH */}
              {activeTab === 'research' && (
                <SpeakerResearchTab 
                  searchGoogleUrl={searchGoogleUrl}
                  searchGoogleNewsUrl={searchGoogleNewsUrl}
                  searchYouTubeUrl={searchYouTubeUrl}
                  searchFacebookUrl={searchFacebookUrl}
                  profile={profile}
                  isDark={isDark}
                />
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
};
