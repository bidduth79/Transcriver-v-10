import React from 'react';

interface SpeakerArchiveTabProps {
  dbStats: any;
  isDark: boolean;
  mentions: any[];
  parseTimestampToSeconds: (ts?: string) => number | null;
  onSeek?: (seconds: number) => void;
}

export const SpeakerArchiveTab: React.FC<SpeakerArchiveTabProps> = ({
  dbStats,
  isDark,
  mentions,
  parseTimestampToSeconds,
  onSeek
}) => {
  return (
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
          mentions.map((m: any, idx: number) => (
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
  );
};
