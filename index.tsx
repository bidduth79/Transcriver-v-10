
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

window.addEventListener('error', (event) => {
  if (event.message === 'Script error.') {
      event.preventDefault(); // Suppress cross-origin script errors (often extensions)
      return;
  }
  // Suppress specific React errors from bubbling up to the browser console as uncaught if needed
  if (event.message.includes('Maximum update depth exceeded') || event.message.includes('Should not already be working')) {
      console.warn('Caught React Rendering Error:', event.message);
      // We don't preventDefault here because React already crashed the component tree, but we can log it.
  }
  console.log('GLOBAL_ERROR:', event.message, event.filename, event.lineno, event.colno);
  if (event.error) {
    console.log('GLOBAL_ERROR_STACK:', event.error.stack);
  }
});

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
