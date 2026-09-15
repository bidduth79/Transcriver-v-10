import Swal from 'sweetalert2';

export const showAlreadyDownloadedAlert = (
  appLang: 'en' | 'bn',
  onConfirm: () => void
) => {
  Swal.fire({
    html: `
      <div style="display: flex; flex-direction: column; padding: 16px 20px; min-width: 320px; max-width: 420px; gap: 16px;">
        <div style="display: flex; align-items: center; width: 100%; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <svg style="width: 22px; height: 22px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
            <span style="font-weight: 600; color: white; font-size: 16px; line-height: 1.3;">${appLang === 'bn' ? 'ইতিমধ্যেই ডাউনলোড করা হয়েছে!' : 'Already Downloaded!'}</span>
            <span style="color: rgba(255,255,255,0.9); font-size: 13px; margin-top: 4px; line-height: 1.4;">${appLang === 'bn' ? 'আপনি কি এটি পুনরায় ডাউনলোড করতে চান?' : 'Do you want to download it again?'}</span>
          </div>
        </div>
        <div style="display: flex; gap: 12px; width: 100%; margin-top: 4px;">
          <button id="swal-custom-confirm" style="flex: 1; background-color: white; color: #3b82f6; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'হ্যাঁ, শুরু করুন' : 'Yes, start'}</button>
          <button id="swal-custom-cancel" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'না, বাতিল' : 'No, cancel'}</button>
        </div>
      </div>
    `,
    toast: false,
    position: 'center',
    showConfirmButton: false,
    showCloseButton: false,
    background: '#3b82f6',
    padding: 0,
    customClass: {
      container: 'custom-centered-modal-container',
      popup: 'custom-centered-modal-popup',
      htmlContainer: 'custom-centered-modal-html-container'
    },
    didOpen: () => {
      const confirmBtn = document.getElementById('swal-custom-confirm');
      const cancelBtn = document.getElementById('swal-custom-cancel');
      
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          Swal.close();
          onConfirm();
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          Swal.close();
        });
      }
    }
  });
};
