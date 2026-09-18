import React from 'react';
import { motion } from 'framer-motion';

export const SuspenseFallback: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 space-y-6">
      {/* Skeleton Pulse Wrapper */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-2xl bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50"
      >
        <div className="flex gap-4 items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6 animate-pulse"></div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24 animate-pulse"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
        </div>
      </motion.div>
      
      {/* Loading Text */}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase"
      >
        Loading component...
      </motion.div>
    </div>
  );
};
