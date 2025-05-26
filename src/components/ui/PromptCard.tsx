import React from 'react';
import { getTranslation } from '../../data/translations';
import { getLocalizedPromptContent } from '../../data/prompts';
import { Prompt } from '../../types';

interface PromptCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  language: string;
  prompt: Prompt;
}

const PromptCard: React.FC<PromptCardProps> = ({
  icon,
  onClick,
  language,
  prompt
}) => {
  const localizedContent = getLocalizedPromptContent(prompt, language);

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden text-left transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
    >
      <div className="p-6">
        <div className="w-16 h-16 mb-4 p-3 bg-blue-100 rounded-xl text-blue-600">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{localizedContent.title}</h3>
        <p className="text-gray-600">{localizedContent.description}</p>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-3 px-6">
        <span className="text-white font-medium">
          {getTranslation(language, 'exploreTopicButton')}
        </span>
      </div>
    </button>
  );
};

export default PromptCard;