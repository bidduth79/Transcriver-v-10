
import React, { useState, useEffect, useMemo } from 'react';
import { DEFAULT_SHORTCUTS, SHORTCUT_CATEGORIES, getSavedShortcuts, saveShortcut, resetShortcuts } from '../../services/ShortcutConfig';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeColors: any;
  appLang: 'bn' | 'en';
}

export const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose, isDark, activeColors, appLang }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [customMap, setCustomMap] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomMap(getSavedShortcuts());
      setSearchTerm('');
      setEditingId(null);
    }
  }, [isOpen]);

  const getDisplayKey = (id: string, defaultKey: string) => {
    return customMap[id] || defaultKey;
  };

  const filteredShortcuts = useMemo(() => {
    if (!searchTerm) return DEFAULT_SHORTCUTS;
    const lower = searchTerm.toLowerCase();
    return DEFAULT_SHORTCUTS.filter(s => 
      s.label.toLowerCase().includes(lower) || 
      s.description.toLowerCase().includes(lower) ||
      getDisplayKey(s.id, s.defaultKeys).toLowerCase().includes(lower)
    );
  }, [searchTerm, customMap]);

  // Group by Category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof DEFAULT_SHORTCUTS> = {};
    SHORTCUT_CATEGORIES.forEach(cat => groups[cat] = []);
    filteredShortcuts.forEach(s => {
      if (groups[s.category]) groups[s.category].push(s);
    });
    return groups;
  }, [filteredShortcuts]);

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all shortcuts to default?')) {
      resetShortcuts();
      setCustomMap({});
    }
  };

  const startEditing = (id: string) => {
    setEditingId(id);
  };

  const saveEdit = (id: string, newKeyStr: string) => {
    saveShortcut(id, newKeyStr);
    setCustomMap(prev => ({ ...prev, [id]: newKeyStr }));
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingId) return;
    e.preventDefault();
    e.stopPropagation();

    // Block only modifier keys from being saved alone
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.metaKey) keys.push('Meta');

    let char = e.key;
    if (char === ' ') char = 'Space';
    if (char.length === 1) char = char.toUpperCase();
    if (char === 'ArrowUp') char = 'ArrowUp';
    if (char === 'ArrowDown') char = 'ArrowDown';
    
    keys.push(char);
    const keyStr = keys.join('+');

    // Conflict Check
    const conflict = DEFAULT_SHORTCUTS.find(s => {
       const currentKey = customMap[s.id] || s.defaultKeys;
       return currentKey === keyStr && s.id !== editingId;
    });

    if (conflict) {
       if (!confirm(`Shortcut "${keyStr}" is already used by "${conflict.label}". Overwrite?`)) {
         return;
       }
    }

    saveEdit(editingId, keyStr);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-4xl h-[85vh] rounded-[2.5rem] border shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 group">
            <div className={`w-12 h-12 ${activeColors.primary} rounded-2xl flex items-center justify-center shadow-lg rotate-3 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
              <svg className="w-6 h-6 text-white transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight font-stylish-bn transition-colors group-hover:text-white/90">Keyboard Shortcuts</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">POWER USER CONTROLS</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all border border-white/10 group">
             <svg className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs & Search */}
        <div className={`px-8 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
           <div className="flex gap-4">
              <button onClick={() => setActiveTab('view')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'view' ? `${activeColors.primary} text-white shadow-lg` : 'hover:bg-black/5 opacity-60 hover:opacity-100'}`}>Cheat Sheet</button>
              <button onClick={() => setActiveTab('edit')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? `${activeColors.primary} text-white shadow-lg` : 'hover:bg-black/5 opacity-60 hover:opacity-100'}`}>Customize</button>
           </div>
           
           <div className="flex items-center gap-4 flex-1 justify-end">
              {activeTab === 'edit' && (
                <button onClick={handleResetAll} className="text-xs font-bold text-red-500 hover:underline uppercase tracking-wider">Reset Defaults</button>
              )}
              <div className={`relative flex items-center bg-white border rounded-xl px-3 py-2 w-64 ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-200'}`}>
                 <svg className="w-4 h-4 opacity-50 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                 <input 
                   type="text" 
                   placeholder="Search shortcuts..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="bg-transparent border-none outline-none text-xs font-bold w-full"
                 />
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
           {editingId && (
             <div className="fixed inset-0 z-[210] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center cursor-default" onClick={() => setEditingId(null)}>
                <div className="bg-slate-950 p-10 rounded-[2rem] border border-white/20 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                   <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Press New Keys</h3>
                   <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-8">Type the combination you want to use</p>
                   <input 
                     autoFocus 
                     readOnly 
                     onKeyDown={handleKeyDown} 
                     className="bg-transparent border-none outline-none text-center text-transparent w-full h-0"
                   />
                   <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest hover:underline">Cancel</button>
                </div>
             </div>
           )}

           <div className="grid grid-cols-1 gap-8">
              {SHORTCUT_CATEGORIES.map(cat => {
                 const items = groupedShortcuts[cat];
                 if (!items || items.length === 0) return null;

                 return (
                   <div key={cat} className="space-y-4">
                      <div className="flex items-center gap-4">
                         <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                         <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{cat}</span>
                         <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {items.map(item => {
                           const currentKey = getDisplayKey(item.id, item.defaultKeys);
                           const isModified = currentKey !== item.defaultKeys;

                           return (
                             <div key={item.id} className={`p-4 rounded-2xl border flex items-center justify-between group hover:border-indigo-500/30 transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <div>
                                   <p className={`text-xs font-black uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.label}</p>
                                   <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{item.description}</p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                   <kbd className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border shadow-sm min-w-[80px] text-center ${isDark ? 'bg-slate-800 border-slate-600 text-indigo-300' : 'bg-slate-100 border-slate-200 text-slate-700'} ${isModified ? 'ring-1 ring-indigo-500/50' : ''}`}>
                                      {currentKey}
                                   </kbd>
                                   
                                   {activeTab === 'edit' && (
                                     <button 
                                       onClick={() => startEditing(item.id)}
                                       className="p-2 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-slate-400"
                                       title="Edit Shortcut"
                                     >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                     </button>
                                   )}
                                </div>
                             </div>
                           );
                         })}
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};
