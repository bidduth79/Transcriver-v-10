import { useModalStore } from './useModalStore';

export const useAppModals = () => {
  const isSidebarOpen = useModalStore(state => state.isSidebarOpen);
  const setIsSidebarOpen = useModalStore(state => state.setIsSidebarOpen);
  
  const isInformationOpen = useModalStore(state => state.isInformationOpen);
  const setIsInformationOpen = useModalStore(state => state.setIsInformationOpen);
  
  const isActivityLogOpen = useModalStore(state => state.isActivityLogOpen);
  const setIsActivityLogOpen = useModalStore(state => state.setIsActivityLogOpen);
  
  const isReportOpen = useModalStore(state => state.isReportOpen);
  const setIsReportOpen = useModalStore(state => state.setIsReportOpen);
  
  const isSettingsOpen = useModalStore(state => state.isSettingsOpen);
  const setIsSettingsOpen = useModalStore(state => state.setIsSettingsOpen);
  
  const activeTool = useModalStore(state => state.activeTool);
  const setActiveTool = useModalStore(state => state.setActiveTool);
  
  const isToolsMinimized = useModalStore(state => state.isToolsMinimized);
  const setIsToolsMinimized = useModalStore(state => state.setIsToolsMinimized);

  return {
    isSidebarOpen, setIsSidebarOpen,
    isInformationOpen, setIsInformationOpen,
    isActivityLogOpen, setIsActivityLogOpen,
    isReportOpen, setIsReportOpen,
    isSettingsOpen, setIsSettingsOpen,
    activeTool, setActiveTool,
    isToolsMinimized, setIsToolsMinimized
  };
};
