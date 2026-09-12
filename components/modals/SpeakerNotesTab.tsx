import React from 'react';
import { SpeakerProfile } from '../../types/speaker';

interface SpeakerNotesTabProps {
  profile: SpeakerProfile;
  isEditingNote: boolean;
  setIsEditingNote: (editing: boolean) => void;
  noteRole: string;
  setNoteRole: (role: string) => void;
  noteTags: string[];
  handleRemoveTag: (tag: string) => void;
  newTagInput: string;
  setNewTagInput: (input: string) => void;
  handleAddTag: (tag?: string) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  handleSaveNote: () => void;
  isDark: boolean;
}

export const SpeakerNotesTab: React.FC<SpeakerNotesTabProps> = ({
  profile,
  isEditingNote,
  setIsEditingNote,
  noteRole,
  setNoteRole,
  noteTags,
  handleRemoveTag,
  newTagInput,
  setNewTagInput,
  handleAddTag,
  noteText,
  setNoteText,
  handleSaveNote,
  isDark
}) => {
  return (
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
              {noteTags.map((t: string) => (
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
                    {profile.customNote.tags.map((t: string) => (
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
            <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-slate-800/20' : 'bg-slate-50'}`}>
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
  );
};
