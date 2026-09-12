import React from 'react';
import { SpeakerProfile } from '../../types/speaker';

interface SpeakerResearchTabProps {
  searchGoogleUrl: string;
  searchGoogleNewsUrl: string;
  searchYouTubeUrl: string;
  searchFacebookUrl: string;
  profile: SpeakerProfile;
  isDark: boolean;
}

export const SpeakerResearchTab: React.FC<SpeakerResearchTabProps> = ({
  searchGoogleUrl,
  searchGoogleNewsUrl,
  searchYouTubeUrl,
  searchFacebookUrl,
  profile,
  isDark
}) => {
  return (
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
  );
};
