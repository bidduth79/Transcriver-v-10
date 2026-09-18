import { create } from 'zustand';

interface ModalState {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  
  isInformationOpen: boolean;
  setIsInformationOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  
  isActivityLogOpen: boolean;
  setIsActivityLogOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  
  isReportOpen: boolean;
  setIsReportOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  
  activeTool: string | null;
  setActiveTool: (tool: string | null | ((prev: string | null) => string | null)) => void;
  
  isToolsMinimized: boolean;
  setIsToolsMinimized: (isMinimized: boolean | ((prev: boolean) => boolean)) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isSidebarOpen: true,
  setIsSidebarOpen: (isOpen) => set((state) => ({ 
    isSidebarOpen: typeof isOpen === 'function' ? isOpen(state.isSidebarOpen) : isOpen 
  })),
  
  isInformationOpen: false,
  setIsInformationOpen: (isOpen) => set((state) => ({ 
    isInformationOpen: typeof isOpen === 'function' ? isOpen(state.isInformationOpen) : isOpen 
  })),
  
  isActivityLogOpen: false,
  setIsActivityLogOpen: (isOpen) => set((state) => ({ 
    isActivityLogOpen: typeof isOpen === 'function' ? isOpen(state.isActivityLogOpen) : isOpen 
  })),
  
  isReportOpen: false,
  setIsReportOpen: (isOpen) => set((state) => ({ 
    isReportOpen: typeof isOpen === 'function' ? isOpen(state.isReportOpen) : isOpen 
  })),
  
  isSettingsOpen: false,
  setIsSettingsOpen: (isOpen) => set((state) => ({ 
    isSettingsOpen: typeof isOpen === 'function' ? isOpen(state.isSettingsOpen) : isOpen 
  })),
  
  activeTool: null,
  setActiveTool: (tool) => set((state) => ({ 
    activeTool: typeof tool === 'function' ? tool(state.activeTool) : tool 
  })),
  
  isToolsMinimized: false,
  setIsToolsMinimized: (isMinimized) => set((state) => ({ 
    isToolsMinimized: typeof isMinimized === 'function' ? isMinimized(state.isToolsMinimized) : isMinimized 
  }))
}));
