import Swal from 'sweetalert2';
import { useCallback } from 'react';

export const useToast = (appLang: string) => {
  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const title = appLang === 'bn' 
      ? (type === 'success' ? 'সফল' : type === 'error' ? 'ত্রুটি' : type === 'warning' ? 'সতর্কতা' : 'তথ্য')
      : (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info');
      
    // Define colors based on type
    let bgColor, iconBg, svgPath;
    
    if (type === 'success') {
      bgColor = '#064e3b'; // Dark green
      iconBg = '#059669';  // Lighter green
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else if (type === 'error') {
      bgColor = '#7f1d1d'; // Dark red
      iconBg = '#dc2626';  // Lighter red
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else if (type === 'warning') {
      bgColor = '#78350f'; // Dark yellow/brown
      iconBg = '#d97706';  // Yellow
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
    } else {
      bgColor = '#002752'; // Dark blue
      iconBg = '#2563eb';  // Blue
      svgPath = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    }

    const htmlContent = `
      <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 16px;">
        <!-- Icon -->
        <div style="flex-shrink: 0; width: 36px; height: 36px; background-color: ${iconBg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            ${svgPath}
          </svg>
        </div>
        
        <!-- Text -->
        <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
          <span style="font-weight: 600; color: white; font-size: 15px; line-height: 1.3;">${title}</span>
          <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.4;">${msg}</span>
        </div>

        <!-- Close Button -->
        <button class="custom-toast-close-btn" style="flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.4); background: transparent; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.8)';" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='rgba(255,255,255,0.4)';">
          <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: false,
      timer: 3000,
      timerProgressBar: false,
      html: htmlContent,
      background: bgColor,
      padding: 0,
      customClass: {
        container: 'custom-toast-container',
        popup: 'custom-toast-popup',
        htmlContainer: 'custom-toast-html-container'
      },
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
        const closeBtn = toast.querySelector('.custom-toast-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => Swal.close());
        }
      }
    });
  }, [appLang]);

  return { addToast };
};
