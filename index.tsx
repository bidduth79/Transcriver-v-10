
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n.ts';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

window.addEventListener('error', (event) => {
  if (event.message === 'Script error.') {
      event.preventDefault(); 
      return;
  }
  if (event.message.includes('Maximum update depth exceeded') || event.message.includes('Should not already be working')) {
      console.warn('Caught React Rendering Error:', event.message);
  }
  console.log('GLOBAL_ERROR:', event.message, event.filename, event.lineno, event.colno);
  if (event.error) {
    console.log('GLOBAL_ERROR_STACK:', event.error.stack);
  }
});

const FallbackComponent = ({ error, resetErrorBoundary }: any) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-red-500/30">
        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          Rendering Error Detected
        </h2>
        <p className="text-sm text-slate-300 mb-6 font-mono bg-black/50 p-4 rounded-lg break-words">
          {error.message}
        </p>
        <p className="text-sm text-slate-400 mb-6">
          The application encountered an unexpected loop or memory issue. 
          Please refresh the page to continue.
        </p>
        <button 
          onClick={resetErrorBoundary}
          className="w-full py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-bold transition-all"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary FallbackComponent={FallbackComponent} onReset={() => window.location.reload()}>
        <App />
        <Toaster position="top-center" richColors theme="system" />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
