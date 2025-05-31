export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
  fontFamily?: string;
}

// Language groups for better organization
export const languageGroups = {
  popular: ['en', 'es'],
  asian: ['hi', 'kn', 'mr'],
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
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ'
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी'
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