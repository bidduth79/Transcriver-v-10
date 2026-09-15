const fs = require('fs');
let content = fs.readFileSync('C:/Transcriver-v-10/components/modals/SpeakerProfileSidebar.tsx', 'utf8');
const lines = content.split('\n');

const newTabs = `              {/* TAB 1: MAIN PROFILE */}
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
              )}`;

lines.splice(193, 617 - 194 + 1, newTabs);

content = lines.join('\n');

const logicReplacement = `  const { isDark, appLang } = useAppTheme();
  
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
  const mentions = dbStats?.mentions || [];`;

content = content.replace(/  const \{ isDark, appLang \} = useAppTheme\(\);[\s\S]*?  const searchFacebookUrl = [^\n]*;/m, logicReplacement);

// Add Imports
content = content.replace(/import \{ useAppTheme \} from '\.\.\/\.\.\/hooks\/useAppTheme';/, `import { useAppTheme } from '../../hooks/useAppTheme';
import { useSpeakerProfileSidebarLogic } from './hooks/useSpeakerProfileSidebarLogic';
import { SpeakerProfileTab } from './SpeakerProfileTab';
import { SpeakerArchiveTab } from './SpeakerArchiveTab';
import { SpeakerNotesTab } from './SpeakerNotesTab';
import { SpeakerResearchTab } from './SpeakerResearchTab';`);

fs.writeFileSync('C:/Transcriver-v-10/components/modals/SpeakerProfileSidebar.tsx', content, 'utf8');
console.log('Success');
