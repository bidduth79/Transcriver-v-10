import { useState, useEffect } from 'react';
import { SpeakerProfile, SpeakerCustomNote } from '../../../types/speaker';

export const useSpeakerProfileSidebarLogic = (
  speakerName: string,
  profile: SpeakerProfile | null,
  onUpdateCustomNote?: (note: SpeakerCustomNote) => void
) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'archive' | 'notes' | 'research'>('profile');

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteRole, setNoteRole] = useState(profile?.customNote?.roleOrDesignation || '');
  const [noteText, setNoteText] = useState(profile?.customNote?.notes || '');
  const [noteTags, setNoteTags] = useState<string[]>(profile?.customNote?.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Sync state when profile opens or changes
  useEffect(() => {
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

  return {
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
  };
};
