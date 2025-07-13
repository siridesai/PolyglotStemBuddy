import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CookiesProvider } from 'react-cookie';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { reactPlugin } from './utils/appInsightsForReact.ts';
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';

const enableAppInsights = import.meta.env.VITE_ENABLE_APPINSIGHTS === 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookiesProvider>
      <BrowserRouter>
        {enableAppInsights && reactPlugin ? (
          <AppInsightsContext.Provider value={reactPlugin}>
            <App />
          </AppInsightsContext.Provider>
        ) : (
          <App />
        )}
      </BrowserRouter>
    </CookiesProvider>
  </StrictMode>
);
