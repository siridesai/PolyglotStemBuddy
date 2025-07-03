// --- You may need to import these from your data files ---
import { getTranslation } from '../data/translations';
import { availableLanguages } from '../data/languages.ts';

// Utility: Clean LaTeX for TTS (removes math delimiters, subscripts, arrows, etc.)
export function cleanLaTeXForTTS(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/_({)?(\d+)(})?/g, '$2')
    .replace(/\\rightarrow|→/g, ' goes to ')
    .replace(/\\ /g, ' ')
    .replace(/\\text\s*{([^}]*)}/g, '$1')
    .replace(/[{}]/g, '');
}

// Utility: Get the age group label based on age and language
export function getAgeGroupLabel(age: number, language: string = 'en'): string {
  if (age >= 5 && age <= 8) return getTranslation(language, 'earlyExplorer');
  if (age >= 9 && age <= 12) return getTranslation(language, 'juniorScientist');
  return getTranslation(language, 'teenResearcher');
}

// Utility: Get the native name of the current language
export function getCurrentLanguageName(language: string): string {
  const languageObj = availableLanguages.find(lang => lang.code === language);
  return languageObj ? languageObj.nativeName : language;
}

// Utility: Create SSML markup for TTS
export function createSSML(text: string, lang: string, voice: string): string {
  return `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
      <voice name="${voice}">${text}</voice>
    </speak>
  `;
}

// Map language code to recommended neural voice
export const voiceMap: Record<string, string> = {
  "hi-IN": "hi-IN-SwaraNeural",
  "mr-IN": "mr-IN-AarohiNeural",
  "kn-IN": "kn-IN-SapnaNeural",
  "en-US": "en-US-JennyNeural",
  "es-ES": "es-ES-ElviraNeural",
};

// Utility: Find the correct TTS language code
export function findRightLanguageForTTS(langGiven: string): string {
  if (langGiven === 'es') return 'es-ES';
  if (langGiven === 'hi') return 'hi-IN';
  if (langGiven === 'kn') return 'kn-IN';
  if (langGiven === 'mr') return 'mr-IN';
  return 'en-US';
}

// Utility: Insert SSML breaks after chemical equations in text
export function insertBreaksAfterEquations(text: string): string {
  // Matches full chemical equations (multiple terms with +, →, =, etc.)
  const equationPattern = /((?:\d*[A-Z][a-z]?\d*(?:\([^)]*\))?\s*[+\-=→⇌]\s*)+(?:\d*[A-Z][a-z]?\d*(?:\([^)]*\))?)+)/g;
  return text.replace(equationPattern, (equation) => `${equation}<break time="500ms"/>`);
}
