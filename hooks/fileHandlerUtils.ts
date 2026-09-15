import Swal from 'sweetalert2';
import { FileMeta, HistoryItem, TranscriptMeta } from '../types';

export const showFolderUploadModal = (
    appLang: string, 
    supportedFilesCount: number,
    onConfirm: () => void,
    onCancel: () => void
) => {
    Swal.fire({
        html: `
          <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 12px; flex-direction: column;">
            <div style="display: flex; align-items: center; width: 100%; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background-color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 14px; line-height: 1.2;">${appLang === 'bn' ? 'ফোল্ডার আপলোড' : 'Folder Upload'}</span>
                <span style="color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 2px; line-height: 1.3;">${appLang === 'bn' ? `মোট ${supportedFilesCount} টি ফাইল পাওয়া গেছে। আপনি কি ব্যাচ প্রসেসিং শুরু করতে চান?` : `Found ${supportedFilesCount} files. Do you want to start batch processing?`}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
              <button id="swal-folder-confirm" style="flex: 1; background-color: white; color: #064e3b; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'শুরু করুন' : 'Start'}</button>
              <button id="swal-folder-cancel" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'বাতিল' : 'Cancel'}</button>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        showCloseButton: false,
        background: '#064e3b',
        padding: 0,
        customClass: {
          container: 'custom-centered-modal-container',
          popup: 'custom-centered-modal-popup',
          htmlContainer: 'custom-centered-modal-html-container'
        },
        didOpen: () => {
          const confirmBtn = document.getElementById('swal-folder-confirm');
          const cancelBtn = document.getElementById('swal-folder-cancel');
          
          if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
              Swal.close();
              onConfirm();
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              Swal.close();
              onCancel();
            });
          }
        }
    });
};

export const showNoFilesFoundModal = (appLang: string) => {
    Swal.fire({
        html: `
          <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 12px; flex-direction: column;">
            <div style="display: flex; align-items: center; width: 100%; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background-color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 14px; line-height: 1.2;">${appLang === 'bn' ? 'কোনো অডিও/ভিডিও ফাইল পাওয়া যায়নি' : 'No Audio/Video Files Found'}</span>
              </div>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        timer: 3000,
        background: '#7f1d1d',
        padding: 0,
        customClass: {
          container: 'custom-centered-modal-container',
          popup: 'custom-centered-modal-popup',
          htmlContainer: 'custom-centered-modal-html-container'
        }
    });
};

export const showFileAlreadyTranscribedModal = (
    appLang: string,
    onConfirm: () => void,
    onCancel: () => void
) => {
    Swal.fire({
        html: `
          <div style="display: flex; align-items: center; padding: 12px 16px; min-width: 300px; max-width: 400px; gap: 12px; flex-direction: column;">
            <div style="display: flex; align-items: center; width: 100%; gap: 12px;">
              <div style="flex-shrink: 0; width: 32px; height: 32px; background-color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <svg style="width: 18px; height: 18px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div style="display: flex; flex-direction: column; text-align: left; flex-grow: 1;">
                <span style="font-weight: 600; color: white; font-size: 14px; line-height: 1.2;">${appLang === 'bn' ? 'ফাইলটি ইতিমধ্যে ট্রান্সক্রাইব করা হয়েছে!' : 'File Already Transcribed!'}</span>
                <span style="color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 2px; line-height: 1.3;">${appLang === 'bn' ? 'আপনি কি নতুন করে আবার ট্রান্সক্রাইব করতে চান, নাকি আগের রেজাল্ট দেখতে চান?' : 'Do you want to transcribe it again, or view the previous result?'}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; width: 100%; margin-top: 4px;">
              <button id="swal-custom-confirm" style="flex: 1; background-color: white; color: #002752; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'নতুন করে করুন' : 'Transcribe Again'}</button>
              <button id="swal-custom-cancel" style="flex: 1; background-color: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); padding: 6px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.2s ease;">${appLang === 'bn' ? 'আগেরটি দেখুন' : 'View Existing'}</button>
            </div>
          </div>
        `,
        toast: false,
        position: 'center',
        showConfirmButton: false,
        showCloseButton: false,
        background: '#002752',
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
              onCancel();
            });
          }
        }
    });
};
