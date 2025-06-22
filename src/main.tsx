import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CookiesProvider } from 'react-cookie';
import App from './App.tsx';
import './index.css';


/*createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookiesProvider>
      <App />
    </CookiesProvider>
  </StrictMode>
  
 
);*/

createRoot(document.getElementById('root')!).render(
  <CookiesProvider>
  <App /> </CookiesProvider>
);
