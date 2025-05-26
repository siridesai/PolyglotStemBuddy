import React, { useState, useRef, useEffect } from 'react';
import { Language, getLanguageGroups } from '../../data/languages';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  languages: Language[];
  selectedLanguage: string;
  onSelectLanguage: (languageCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguage,
  onSelectLanguage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageGroups = getLanguageGroups();
  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, languageCode: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectLanguage(languageCode);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 flex items-center justify-between px-4 bg-white border-2 
                 border-indigo-100 rounded-xl hover:border-indigo-300 transition-all
                 duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span className="font-medium truncate text-base">
            {selectedLang?.nativeName}
            <span className="text-gray-500 text-sm ml-2">
              ({selectedLang?.name})
            </span>
          </span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg 
                   border border-gray-200"
          role="listbox"
        >
          <div 
            className="overflow-y-auto"
            style={{
              maxHeight: '240px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#94A3B8 #E2E8F0'
            }}
          >
            {Object.entries(languageGroups).map(([groupName, groupLanguages]) => (
              <div key={groupName} className="px-2">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider sticky top-0 bg-white">
                  {groupName}
                </div>
                {groupLanguages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => {
                      onSelectLanguage(language.code);
                      setIsOpen(false);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, language.code)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between
                      transition-colors duration-150 outline-none text-base
                      ${language.code === selectedLanguage 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'hover:bg-gray-50 focus:bg-gray-50'
                      }
                    `}
                    role="option"
                    aria-selected={language.code === selectedLanguage}
                    style={{
                      fontFamily: language.fontFamily,
                      direction: language.direction || 'ltr'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{language.nativeName}</span>
                      <span className="text-sm text-gray-500">
                        ({language.name})
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;