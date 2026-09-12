import React from 'react';
import { SpeakerProfile } from '../../types/speaker';

interface SpeakerProfileTabProps {
  profile: SpeakerProfile;
  dbStats: any;
  isDark: boolean;
}

export const SpeakerProfileTab: React.FC<SpeakerProfileTabProps> = ({ profile, dbStats, isDark }) => {
  return (
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
              {dbStats.coSpeakers.map((cs: any) => (
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
  );
};
