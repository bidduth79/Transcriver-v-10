import { useState } from 'react';

export const useAppModals = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInformationOpen, setIsInformationOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isToolsMinimized, setIsToolsMinimized] = useState(false);

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
