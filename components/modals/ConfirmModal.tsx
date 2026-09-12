import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSecondaryAction?: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  secondaryText?: string;
  isDark: boolean;
  activeColors: any;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSecondaryAction,
  title,
  message,
  confirmText,
  cancelText,
  secondaryText,
  isDark,
  activeColors
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${
            isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
          </div>
          
          <p className={`mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {message}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cancelText}
            </button>
            
            {secondaryText && onSecondaryAction && (
              <button
                onClick={() => {
                  onSecondaryAction();
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                  isDark ? 'border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {secondaryText}
              </button>
            )}
            
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${activeColors.primary} ${activeColors.hover}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
