import { Language } from './languages';

type TranslationKey = 
  | 'selectAgeGroup'
  | 'chooseLanguage'
  | 'startLearning'
  | 'chooseAdventure'
  | 'backToTopics'
  | 'thinkAboutIt'
  | 'exploreTopicButton'
  | 'earlyExplorer'
  | 'juniorScientist'
  | 'teenResearcher'
  | 'earlyExplorerRange'
  | 'juniorScientistRange'
  | 'teenResearcherRange'
  | 'back'
  | 'language'
  | 'searchPrompts'
  | 'science'
  | 'technology'
  | 'engineering'
  | 'math'
  | 'searchPlaceholder'
  | 'wantToLearnAbout'
  | 'typeMessage'
  | 'send'
  | 'earlyLearnerResponse'
  | 'juniorLearnerResponse'
  | 'teenLearnerResponse'
  | 'additionalResources'
  | 'readyForQuiz'
  | 'learnSomethingElse';

type Translations = {
  [key in TranslationKey]: string;
};

type TranslationSet = {
  [key: string]: Translations;
};

export const translations: TranslationSet = {
  en: {
    selectAgeGroup: 'Select age group',
    chooseLanguage: 'Choose language',
    startLearning: 'Start Learning!',
    chooseAdventure: 'Choose a learning adventure!',
    backToTopics: 'Back to Topics',
    thinkAboutIt: 'Think about it: What do you already know about this topic?',
    exploreTopicButton: 'Explore this topic →',
    earlyExplorer: 'Early Explorer',
    juniorScientist: 'Junior Scientist',
    teenResearcher: 'Teen Researcher',
    earlyExplorerRange: 'Ages 5-8',
    juniorScientistRange: 'Ages 9-12',
    teenResearcherRange: 'Ages 13-15',
    back: 'Back',
    language: 'Language',
    searchPrompts: 'Search topics...',
    science: 'Science',
    technology: 'Technology',
    engineering: 'Engineering',
    math: 'Mathematics',
    searchPlaceholder: 'What do you want to learn about today?',
    wantToLearnAbout: 'Want to learn about...',
    typeMessage: 'Type your message...',
    send: 'Send',
    earlyLearnerResponse: "That's a great topic! Let's explore",
    juniorLearnerResponse: "That's a great topic! Let's dive deeper into",
    teenLearnerResponse: "That's a great topic! Let's investigate",
    additionalResources: 'Additional Resources',
    readyForQuiz: 'Ready for Quiz?',
    learnSomethingElse: 'Learn Something Else'
  },
  es: {
    selectAgeGroup: 'Selecciona grupo de edad',
    chooseLanguage: 'Elige idioma',
    startLearning: '¡Empieza a Aprender!',
    chooseAdventure: '¡Elige una aventura de aprendizaje!',
    backToTopics: 'Volver a los Temas',
    thinkAboutIt: 'Piensa: ¿Qué sabes ya sobre este tema?',
    exploreTopicButton: 'Explora este tema →',
    earlyExplorer: 'Explorador Inicial',
    juniorScientist: 'Científico Junior',
    teenResearcher: 'Investigador Teen',
    earlyExplorerRange: 'Edad: 5-8',
    juniorScientistRange: 'Edad: 9-12',
    teenResearcherRange: 'Edad: 13-15',
    back: 'Volver',
    language: 'Idioma',
    searchPrompts: 'Buscar temas...',
    science: 'Ciencia',
    technology: 'Tecnología',
    engineering: 'Ingeniería',
    math: 'Matemáticas',
    searchPlaceholder: '¿Qué quieres aprender hoy?',
    wantToLearnAbout: 'Quiero aprender sobre...',
    typeMessage: 'Escribe tu mensaje...',
    send: 'Enviar',
    earlyLearnerResponse: '¡Excelente tema! Vamos a explorar',
    juniorLearnerResponse: '¡Excelente tema! Profundicemos en',
    teenLearnerResponse: '¡Excelente tema! Investigemos',
    additionalResources: 'Recursos Adicionales',
    readyForQuiz: '¿Listo para el Quiz?',
    learnSomethingElse: 'Aprender Algo Nuevo'
  },
  hi: {
    selectAgeGroup: 'आयु वर्ग चुनें',
    chooseLanguage: 'भाषा चुनें',
    startLearning: 'सीखना शुरू करें!',
    chooseAdventure: 'एक सीखने की यात्रा चुनें!',
    backToTopics: 'विषयों पर वापस जाएं',
    thinkAboutIt: 'सोचें: आप इस विषय के बारे में पहले से क्या जानते हैं?',
    exploreTopicButton: 'इस विषय की खोज करें →',
    earlyExplorer: 'प्रारंभिक खोजकर्ता',
    juniorScientist: 'जूनियर वैज्ञानिक',
    teenResearcher: 'किशोर शोधकर्ता',
    earlyExplorerRange: 'आयु: 5-8',
    juniorScientistRange: 'आयु: 9-12',
    teenResearcherRange: 'आयु: 13-15',
    back: 'वापस',
    language: 'भाषा',
    searchPrompts: 'विषय खोजें...',
    science: 'विज्ञान',
    technology: 'प्रौद्योगिकी',
    engineering: 'अभियांत्रिकी',
    math: 'गणित',
    searchPlaceholder: 'आज आप क्या सीखना चाहते हैं?',
    wantToLearnAbout: 'इसके बारे में जानना चाहते हैं...',
    typeMessage: 'अपना संदेश लिखें...',
    send: 'भेजें',
    earlyLearnerResponse: 'बहुत अच्छा विषय! चलो खोजते हैं',
    juniorLearnerResponse: 'बहुत अच्छा विषय! चलो गहराई से जानते हैं',
    teenLearnerResponse: 'बहुत अच्छा विषय! चलो जांच करते हैं',
    additionalResources: 'अतिरिक्त संसाधन',
    readyForQuiz: 'क्विज़ के लिए तैयार?',
    learnSomethingElse: 'कुछ और सीखें'
  }
};

export const getTranslation = (language: string, key: TranslationKey): string => {
  return translations[language]?.[key] || translations['en'][key];
};