
export const SHORTCUT_CATEGORIES = [
  'File Upload',
  'Audio Control',
  'Video Control',
  'Converter',
  'History/Search/Report',
  'UI & View',
  'Text Output Control'
];

export const DEFAULT_SHORTCUTS = [
  // 1. File Upload
  { id: 'file.upload', label: 'File Upload', defaultKeys: 'Ctrl+U', category: 'File Upload', description: 'Open file picker' },
  { id: 'file.import_fb', label: 'Import Facebook', defaultKeys: 'Ctrl+Shift+F', category: 'File Upload', description: 'Open Facebook import tool' },

  // 2. Audio Control
  { id: 'audio.play_pause', label: 'Play / Pause', defaultKeys: 'Space', category: 'Audio Control', description: 'Toggle audio playback' },
  { id: 'audio.vol_up', label: 'Volume Up', defaultKeys: 'Ctrl+ArrowUp', category: 'Audio Control', description: 'Increase volume' },
  { id: 'audio.vol_down', label: 'Volume Down', defaultKeys: 'Ctrl+ArrowDown', category: 'Audio Control', description: 'Decrease volume' },
  { id: 'audio.cut', label: 'Audio Cutter', defaultKeys: 'Ctrl+A', category: 'Audio Control', description: 'Open audio cutting tool' },
  { id: 'audio.join', label: 'Audio Joiner', defaultKeys: 'Ctrl+Shift+A', category: 'Audio Control', description: 'Open audio merger tool' },

  // 3. Video Control
  { id: 'video.cut', label: 'Video Cutter', defaultKeys: 'Ctrl+V', category: 'Video Control', description: 'Open video cutting tool' },
  { id: 'video.join', label: 'Video Joiner', defaultKeys: 'Ctrl+Shift+V', category: 'Video Control', description: 'Open video merger tool' },
  { id: 'ui.fullscreen', label: 'Toggle Fullscreen', defaultKeys: 'F', category: 'Video Control', description: 'Toggle fullscreen mode' },

  // 4. Converter
  { id: 'tools.converter', label: 'Converter', defaultKeys: 'Ctrl+C', category: 'Converter', description: 'Open media converter' },

  // 5. History / Search
  { id: 'view.history', label: 'History Panel', defaultKeys: 'Ctrl+H', category: 'History/Search/Report', description: 'Expand history view' },
  { id: 'view.search', label: 'Focus Search', defaultKeys: 'Ctrl+F', category: 'History/Search/Report', description: 'Focus transcript search' },
  { id: 'view.report', label: 'Report Dashboard', defaultKeys: 'Ctrl+R', category: 'History/Search/Report', description: 'Open report generator' },

  // 6. UI & View
  { id: 'ui.theme', label: 'Day/Night Mode', defaultKeys: 'Ctrl+D', category: 'UI & View', description: 'Toggle light/dark theme' },
  { id: 'ui.lang', label: 'Switch Language', defaultKeys: 'Ctrl+L', category: 'UI & View', description: 'Toggle BN/EN language' },
  { id: 'ui.refresh', label: 'Refresh View', defaultKeys: 'Ctrl+Shift+R', category: 'UI & View', description: 'Reload the application' },
  { id: 'ui.sidebar', label: 'Toggle Sidebar', defaultKeys: 'Ctrl+B', category: 'UI & View', description: 'Collapse/Expand sidebar' },

  // 7. Text Output
  { id: 'text.zoom_in', label: 'Increase Font', defaultKeys: 'Ctrl++', category: 'Text Output Control', description: 'Increase transcript font size' },
  { id: 'text.zoom_out', label: 'Decrease Font', defaultKeys: 'Ctrl+-', category: 'Text Output Control', description: 'Decrease transcript font size' },
  { id: 'text.download', label: 'Download Text', defaultKeys: 'Ctrl+S', category: 'Text Output Control', description: 'Open download menu' },
  { id: 'text.clear', label: 'Clear Text', defaultKeys: 'Delete', category: 'Text Output Control', description: 'Clear current transcript' }
];

const STORAGE_KEY = 'app.shortcuts.v1';

export const getSavedShortcuts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

export const saveShortcut = (actionId, keys) => {
  const current = getSavedShortcuts();
  current[actionId] = keys;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
};

export const resetShortcuts = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getActiveShortcut = (actionId) => {
  const saved = getSavedShortcuts();
  if (saved[actionId]) return saved[actionId];
  const def = DEFAULT_SHORTCUTS.find(a => a.id === actionId);
  return def ? def.defaultKeys : '';
};

export const matchesShortcut = (e, shortcutStr) => {
  if (!shortcutStr) return false;
  
  const parts = shortcutStr.toLowerCase().split('+').map(p => p.trim());
  
  const ctrl = parts.includes('ctrl') || parts.includes('control');
  const shift = parts.includes('shift');
  const alt = parts.includes('alt');
  const meta = parts.includes('meta') || parts.includes('cmd') || parts.includes('command');
  
  const mainKey = parts.filter(p => !['ctrl', 'control', 'shift', 'alt', 'meta', 'cmd', 'command'].includes(p))[0];

  if (e.ctrlKey !== ctrl) return false;
  if (e.shiftKey !== shift) return false;
  if (e.altKey !== alt) return false;
  if (e.metaKey !== meta) return false;

  if (!mainKey) return false;

  let eventKey = e.key.toLowerCase();
  if (eventKey === ' ') eventKey = 'space';
  if (eventKey === 'arrowup') eventKey = 'arrowup'; 
  
  if (mainKey === '+' && (e.key === '+' || e.key === '=')) return true; 

  return eventKey === mainKey;
};
