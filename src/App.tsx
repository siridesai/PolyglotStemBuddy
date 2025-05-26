import React, { useState } from 'react';
import { ChildSettings } from './types';
import { Sparkles } from 'lucide-react';
import LandingPage from './components/LandingPage';
import PromptScreen from './components/PromptScreen';

function App() {
  const [settings, setSettings] = useState<ChildSettings | null>(null);

  const handleStartLearning = (newSettings: ChildSettings) => {
    setSettings(newSettings);
  };

  const handleBackToHome = () => {
    setSettings(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      {!settings ? (
        <LandingPage onStartLearning={handleStartLearning} />
      ) : (
        <PromptScreen settings={settings} onBackToHome={handleBackToHome} />
      )}
    </div>
  );
}

export default App;