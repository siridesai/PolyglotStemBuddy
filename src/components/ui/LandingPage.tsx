import React, { useState } from 'react';
import { ChildSettings } from '../../utils/assistantMessageType.ts';
import { availableLanguages } from '../../data/languages';
import { Sparkles } from 'lucide-react';
import Button from './Button';
import AgeSelector from './AgeSelector';
import LanguageSelector from './LanguageSelector';
import { getTranslation } from '../../data/translations';

interface LandingPageProps {
  onStartLearning: (settings: ChildSettings) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning }) => {
  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const handleStartClick = () => {
    if (selectedAge) {
      onStartLearning({
        age: selectedAge,
        language: selectedLanguage
      });
    }
  };

  return (
    <div className="bg-sketch-doodles min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-lg">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-8 px-6 md:px-10 rounded-t-3xl">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center">
              <Sparkles className="w-10 h-10 text-yellow-300 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Polyglot STEM Buddy</h1>
              <span className="text-yellow-300 ml-3 text-2xl">✧</span>
            </div>
            <p className="text-center text-blue-100 text-lg mt-2">
              STEM learning made simple
            </p>
          </div>
        </div>
        
        <div className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Age Selection */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                {getTranslation(selectedLanguage, 'selectAgeGroup')}
              </h2>
              <AgeSelector 
                ageGroups={[
                  { 
                    label: getTranslation(selectedLanguage, 'earlyExplorer'),
                    range: getTranslation(selectedLanguage, 'earlyExplorerRange'),
                    minAge: 5 
                  },
                  { 
                    label: getTranslation(selectedLanguage, 'juniorScientist'),
                    range: getTranslation(selectedLanguage, 'juniorScientistRange'),
                    minAge: 9 
                  },
                  { 
                    label: getTranslation(selectedLanguage, 'teenResearcher'),
                    range: getTranslation(selectedLanguage, 'teenResearcherRange'),
                    minAge: 13 
                  }
                ]}
                selectedAge={selectedAge}
                onSelectAge={setSelectedAge}
                language={selectedLanguage}
              />
            </div>
            
            {/* Language Selection */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                {getTranslation(selectedLanguage, 'chooseLanguage')}
              </h2>
              <LanguageSelector
                languages={availableLanguages}
                selectedLanguage={selectedLanguage}
                onSelectLanguage={setSelectedLanguage}
              />
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleStartClick} 
              disabled={!selectedAge}
              size="large"
              variant="primary"
            >
              {getTranslation(selectedLanguage, 'startLearning')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;