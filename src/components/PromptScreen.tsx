import React, { useState, useEffect } from 'react';
import { ChildSettings, Prompt } from '../types';
import { getPromptsForAge, getLocalizedPromptContent } from '../data/prompts';
import { ArrowLeft } from 'lucide-react';
import SearchBar from './ui/SearchBar';
import { getTranslation } from '../data/translations';
import { availableLanguages } from '../data/languages';
import ChatInterface from './ChatInterface';

interface PromptScreenProps {
  settings: ChildSettings;
  onBackToHome: () => void;
}

const PromptScreen: React.FC<PromptScreenProps> = ({ settings, onBackToHome }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const ageAppropriatePrompts = getPromptsForAge(settings.age);
    setPrompts(ageAppropriatePrompts);
  }, [settings.age]);

  const getAgeGroupLabel = (age: number) => {
    if (age >= 5 && age <= 8) return getTranslation(settings.language, 'earlyExplorer');
    if (age >= 9 && age <= 12) return getTranslation(settings.language, 'juniorScientist');
    return getTranslation(settings.language, 'teenResearcher');
  };

  const getCurrentLanguageName = () => {
    const language = availableLanguages.find(lang => lang.code === settings.language);
    return language ? language.nativeName : settings.language;
  };

  const filteredPrompts = prompts.filter(prompt => {
    const localizedContent = getLocalizedPromptContent(prompt, settings.language);
    const searchLower = searchQuery.toLowerCase();
    return (
      localizedContent.title.toLowerCase().includes(searchLower) ||
      localizedContent.description.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    const matchingPrompts = prompts.filter(prompt => {
      const localizedContent = getLocalizedPromptContent(prompt, settings.language);
      return localizedContent.title.toLowerCase().includes(query.toLowerCase());
    });

    if (matchingPrompts.length > 0) {
      setSelectedPrompt(matchingPrompts[0]);
    } else {
      const customPrompt: Prompt = {
        id: `custom-${Date.now()}`,
        title: query,
        question: `What would you like to know about ${query}?`,
        description: `Learn about ${query}`,
        icon: 'Search',
        category: 'science',
        ageRange: { min: settings.age, max: settings.age },
        translations: {}
      };
      setSelectedPrompt(customPrompt);
    }
  };

  if (selectedPrompt) {
    return (
      <ChatInterface
        prompt={selectedPrompt}
        settings={settings}
        onBack={() => setSelectedPrompt(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={onBackToHome}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-lg font-medium">{getTranslation(settings.language, 'back')}</span>
          </button>
          <div className="text-sm text-gray-600">
            {getAgeGroupLabel(settings.age)} | {getCurrentLanguageName()}
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            language={settings.language}
          />
        </div>

        <div className="flex flex-col gap-3 items-center">
          {filteredPrompts.map(prompt => {
            const localizedContent = getLocalizedPromptContent(prompt, settings.language);
            return (
              <button
                key={prompt.id}
                onClick={() => setSelectedPrompt(prompt)}
                className="bg-white px-6 py-3 rounded-full shadow-sm border border-indigo-100 
                          hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200
                          flex items-center gap-2 group w-full max-w-xl text-left"
              >
                <span className="text-gray-500 text-sm">
                  {getTranslation(settings.language, 'wantToLearnAbout')}
                </span>
                <span className="text-gray-800 font-medium group-hover:text-indigo-700">
                  {localizedContent.title.toLowerCase()}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default PromptScreen;