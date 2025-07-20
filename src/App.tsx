import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ChildSettings } from './utils/assistantMessageType.ts';
import LandingPage from './components/ui/LandingPage';
import ChatInterface from './components/ui/ChatInterface';
import About from "./About";
import 'katex/dist/katex.min.css';

function App() {
  const [settings, setSettings] = useState<ChildSettings | null>(null);

  const handleStartLearning = (newSettings: ChildSettings) => {
    setSettings(newSettings);
  };

  const handleBackToHome = () => {
    setSettings(null);
  };

 useEffect(() => {
  const setAppHeight = () => {
    const vh = window.innerHeight * 0.01;
    const padding = 10; // Amount of padding in pixels
    document.documentElement.style.setProperty('--app-height', `calc(${vh * 100}px - ${padding}px)`);
  };

  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  return () => window.removeEventListener('resize', setAppHeight);
}, []);


 return (
  <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
    <Routes>
      <Route
        path="/"
        element={
          !settings ? (
            <LandingPage onStartLearning={handleStartLearning} />
          ) : (
            <ChatInterface settings={settings} onBack={handleBackToHome} />
          )
        }
      />
      <Route path="/about" element={<About />} />
    </Routes>
  </div>
);
}

export default App;