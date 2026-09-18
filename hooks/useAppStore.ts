import { create } from 'zustand';

interface AppState {
  // Global Error state
  appError: string | null;
  setAppError: (error: string | null) => void;

  // Store update triggers (used to force re-renders or refetching)
  storeUpdates: Record<string, number>;
  triggerStoreUpdate: (storeName: string) => void;

  // Specific Event Triggers
  sensitiveKeywordsUpdated: number;
  triggerSensitiveKeywordsUpdate: () => void;

  activeApiKeyChanged: number;
  triggerActiveApiKeyChanged: () => void;

  apiCallLogged: number;
  triggerApiCallLogged: () => void;

  ytSettingsChanged: number;
  triggerYtSettingsChanged: () => void;

  jarvisLinksUpdated: number;
  triggerJarvisLinksUpdated: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  appError: null,
  setAppError: (error) => set({ appError: error }),

  storeUpdates: {},
  triggerStoreUpdate: (storeName) =>
    set((state) => ({
      storeUpdates: {
        ...state.storeUpdates,
        [storeName]: (state.storeUpdates[storeName] || 0) + 1,
      },
    })),

  sensitiveKeywordsUpdated: 0,
  triggerSensitiveKeywordsUpdate: () =>
    set((state) => ({ sensitiveKeywordsUpdated: state.sensitiveKeywordsUpdated + 1 })),

  activeApiKeyChanged: 0,
  triggerActiveApiKeyChanged: () =>
    set((state) => ({ activeApiKeyChanged: state.activeApiKeyChanged + 1 })),

  apiCallLogged: 0,
  triggerApiCallLogged: () =>
    set((state) => ({ apiCallLogged: state.apiCallLogged + 1 })),

  ytSettingsChanged: 0,
  triggerYtSettingsChanged: () =>
    set((state) => ({ ytSettingsChanged: state.ytSettingsChanged + 1 })),

  jarvisLinksUpdated: 0,
  triggerJarvisLinksUpdated: () =>
    set((state) => ({ jarvisLinksUpdated: state.jarvisLinksUpdated + 1 })),
}));
