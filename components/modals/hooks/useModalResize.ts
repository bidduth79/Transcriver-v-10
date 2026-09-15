import { useState, useRef } from 'react';

export const useModalResize = (initialWidth = 1000, initialHeight = 800, containerId = 'summary-modal-container') => {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const isResizing = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const modalElement = document.getElementById(containerId);
    if (modalElement) {
      const rect = modalElement.getBoundingClientRect();
      setSize({
        width: Math.max(600, e.clientX - rect.left),
        height: Math.max(400, e.clientY - rect.top)
      });
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResizing);
  };

  return {
    size,
    setSize,
    isMinimized,
    setIsMinimized,
    isMaximized,
    setIsMaximized,
    startResizing
  };
};
