export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
  fontFamily?: string;
}

// Language groups for better organization
export const languageGroups = {
  popular: ['en', 'es', 'hi'],
  asian: ['zh', 'ja', 'ko'],
  european: ['fr', 'de', 'it'],
  // Add more groups as needed
};

export const availableLanguages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif"
  },
  // New languages can be added here
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch'
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    fontFamily: "'Noto Sans SC', system-ui, sans-serif"
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    fontFamily: "'Noto Sans Arabic', system-ui, sans-serif"
  }
];

export const getLanguageGroups = () => {
  const groups: { [key: string]: Language[] } = {};
  
  Object.entries(languageGroups).forEach(([groupName, codes]) => {
    groups[groupName] = availableLanguages.filter(lang => 
      codes.includes(lang.code)
    );
  });
  
  return groups;
};

export const getLanguageByCode = (code: string): Language | undefined => {
  return availableLanguages.find(lang => lang.code === code);
};

export const getFontFamilyForLanguage = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.fontFamily || 'Quicksand, system-ui, sans-serif';
};

export const getTextDirectionForLanguage = (code: string): 'ltr' | 'rtl' => {
  const language = getLanguageByCode(code);
  return language?.direction || 'ltr';
};