const fs = require('fs');
const path = require('path');

const files = [
  'features/youtube-monitor/hooks/useYouTubeQueue.ts',
  'features/youtube-monitor/hooks/useYouTubeSelection.ts',
  'features/youtube-monitor/hooks/useQueueProcessor.ts',
  'features/youtube-monitor/hooks/useQueueDownload.ts',
  'features/youtube-monitor/components/MonitorSettings.tsx',
  'features/youtube-monitor/components/YouTubeVideoCardActions.tsx'
];

const basePath = 'c:/Transcriver-v-10';

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  
  // Replace app-error
  content = content.replace(/window\.dispatchEvent\(\s*new\s*CustomEvent\(\s*['`]app-error['`]\s*,\s*\{\s*detail:\s*\{\s*message:\s*(.+?)\s*\}\s*\}\s*\)\s*\)/g, 'useAppStore.getState().setAppError($1)');
  
  // Replace yt_settings_changed
  content = content.replace(/window\.dispatchEvent\(\s*new\s*Event\(\s*['`]yt_settings_changed['`]\s*\)\s*\)/g, 'useAppStore.getState().triggerYtSettingsChanged()');

  // Replace jarvis_links_updated
  content = content.replace(/window\.dispatchEvent\(\s*new\s*Event\(\s*['`]jarvis_links_updated['`]\s*\)\s*\)/g, 'useAppStore.getState().triggerJarvisLinksUpdated()');

  // Add import if modified
  if (content !== original) {
    if (!content.includes('useAppStore')) {
      content = `import { useAppStore } from '@/hooks/useAppStore';\n` + content;
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
