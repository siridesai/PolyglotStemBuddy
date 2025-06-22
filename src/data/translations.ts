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
  | 'generateFlashcards'
  | 'studyFlashcards'
  | 'noLessonContent'
  | 'noFlashcardAvailable'
  | 'summarize'
  | 'exitLesson'
  | 'readyForQuiz'
  | 'loadingQuiz'
  | 'learnSomethingElse'
  | 'lessonSummary'
  | 'summaryGenerationFailed'
  | 'generatingSummary'
  | 'downloadPDF'
  | 'noSummaryAvailable'
  | 'failedToLoadFlashcards'
  | 'noQuestionsAvailable'
  | 'cardProgress'
  | 'clickToFlip'
  | 'previous'
  | 'next'
  | 'error'
  | 'close'
  | 'continueLearning'
  | 'startConversation'
  | 'completeLesson'
  | 'card'
  ;

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
    generateFlashcards: 'Generate Flashcards',
    studyFlashcards: 'Study Flashcards',
    noFlashcardAvailable: 'No flashcards available right now.',
    noLessonContent: 'No lesson content available.',
    summarize: 'Summarize',
    exitLesson: 'Exit Lesson',
    readyForQuiz: 'Ready for Quiz?',
    loadingQuiz: 'Loading quiz',
    learnSomethingElse: 'Learn Something Else',
    lessonSummary: 'Lesson Summary',
    summaryGenerationFailed: 'Failed to generate summary.',
    generatingSummary: 'Generating summary...',
    downloadPDF: 'Download PDF',
    noSummaryAvailable: 'No summary available right now.',
    failedToLoadFlashcards: 'Failed to load flashcards. Please try again later.',
    noQuestionsAvailable: 'No questions available. Try completing a lesson first!',
    cardProgress: 'Card {{current}} of {{total}}',
    clickToFlip: 'Click the card to flip',
    previous: 'Previous',
    next: 'Next',
    error: 'Error',
    close: 'Close',
    continueLearning: 'Continue Learning',
    startConversation: 'Start a conversation to generate study materials!',
    completeLesson: 'Complete a lesson to generate study materials!',
    card: 'Card'
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
    generateFlashcards: 'Generar Tarjetas Didácticas',
    studyFlashcards: 'Estudiar Tarjetas',
    noFlashcardAvailable: 'No hay tarjetas disponibles en este momento.',
    noLessonContent: 'No hay contenido de lección disponible.',
    summarize: 'Resumir',
    exitLesson: 'Salir de la Lección',
    readyForQuiz: '¿Listo para el Quiz?',
    loadingQuiz: 'Cargando cuestionario',
    learnSomethingElse: 'Aprender Algo Nuevo',
    lessonSummary: 'Resumen de la Lección',
    summaryGenerationFailed: 'No se pudo generar el resumen.',
    generatingSummary: 'Generando resumen...',
    downloadPDF: 'Descargar PDF',
    noSummaryAvailable: 'No hay resumen disponible en este momento.',
    failedToLoadFlashcards: 'No se pudieron cargar las tarjetas didácticas. Por favor, inténtalo de nuevo más tarde.',
    noQuestionsAvailable: 'No hay preguntas disponibles. ¡Intenta completar una lección primero!',
    cardProgress: 'Tarjeta {{current}} de {{total}}',
    clickToFlip: 'Haz clic en la tarjeta para voltear',
    previous: 'Anterior',
    next: 'Siguiente',
    error: 'Error',
    close: 'Cerrar',
    continueLearning: 'Continuar aprendiendo',
    startConversation: '¡Inicia una conversación para generar materiales de estudio!',
    completeLesson: '¡Completa una lección para generar materiales de estudio!',
    card: 'Tarjeta',
  
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
    generateFlashcards: 'फ्लैशकार्ड बनाएं',
    studyFlashcards: 'फ्लैशकार्ड पढ़ें',
    noFlashcardAvailable: 'अभी कोई फ्लैशकार्ड उपलब्ध नहीं है।',
    noLessonContent: 'कोई पाठ सामग्री उपलब्ध नहीं है।',
    summarize: 'सारांश बनाएं',
    exitLesson: 'पाठ से बाहर निकलें',
    readyForQuiz: 'क्विज़ के लिए तैयार?',
    loadingQuiz: 'क्विज़ लोड हो रहा है',
    learnSomethingElse: 'कुछ और सीखें',
    lessonSummary: 'पाठ सारांश',
    summaryGenerationFailed: 'सारांश उत्पन्न करने में विफल रहा।',
    generatingSummary: 'सारांश उत्पन्न हो रहा है...',
    downloadPDF: 'पीडीएफ डाउनलोड करें',
    noSummaryAvailable: 'अभी कोई सारांश उपलब्ध नहीं है।',
    failedToLoadFlashcards: 'फ्लैशकार्ड्स लोड करने में विफल। कृपया बाद में पुनः प्रयास करें।',
    noQuestionsAvailable: 'कोई प्रश्न उपलब्ध नहीं हैं। पहले एक पाठ पूरा करने का प्रयास करें!',
    cardProgress: '{{total}} में से {{current}} कार्ड',
    clickToFlip: 'कार्ड पलटने के लिए क्लिक करें',
    previous: 'पिछला',
    next: 'अगला',
    error: 'त्रुटि',
    close: 'बंद करें',
    continueLearning: 'सीखना जारी रखें',
    startConversation: 'अध्ययन सामग्री उत्पन्न करने के लिए बातचीत शुरू करें!',
    completeLesson: 'अध्ययन सामग्री तैयार करने के लिए एक पाठ पूरा करें!',
    card: 'कार्ड',

  },
  mr: {
    selectAgeGroup: 'वय गट निवडा',
    chooseLanguage: 'भाषा निवडा',
    startLearning: 'शिकायला सुरुवात करा!',
    chooseAdventure: 'शिकण्याचा प्रवास निवडा!',
    backToTopics: 'विषयांकडे परत जा',
    thinkAboutIt: 'विचार करा: तुम्हाला या विषयाबद्दल आधी काय माहिती आहे?',
    exploreTopicButton: 'हा विषय शोधा →',
    earlyExplorer: 'प्रारंभिक अन्वेषक',
    juniorScientist: 'कनिष्ठ शास्त्रज्ञ',
    teenResearcher: 'किशोर संशोधक',
    earlyExplorerRange: 'वय: ५-८',
    juniorScientistRange: 'वय: ९-१२',
    teenResearcherRange: 'वय: १३-१५',
    language: 'भाषा',
    searchPrompts: 'विषय शोधा...',
    science: 'विज्ञान',
    technology: 'तंत्रज्ञान',
    engineering: 'अभियांत्रिकी',
    math: 'गणित',
    searchPlaceholder: 'आज तुम्हाला काय शिकायचं आहे?',
    wantToLearnAbout: 'याबद्दल शिकायचं आहे...',
    typeMessage: 'तुमचा संदेश टाइप करा...',
    send: 'पाठवा',
    earlyLearnerResponse: 'छान विषय! चला शोधूया',
    juniorLearnerResponse: 'छान विषय! चला थोडं खोलात जाऊया',
    teenLearnerResponse: 'छान विषय! चला तपासून पाहूया',
    generateFlashcards: 'फ्लॅशकार्ड तयार करा',
    studyFlashcards: 'फ्लॅशकार्डचा अभ्यास करा',
    noFlashcardAvailable: 'सध्या कोणतेही फ्लॅशकार्ड उपलब्ध नाहीत.',
    noLessonContent: 'कोणतीही पाठ्य सामग्री उपलब्ध नाही.',
    summarize: 'सारांश तयार करा',
    exitLesson: 'पाठातून बाहेर पडा',
    readyForQuiz: 'क्विझसाठी तयार आहात का?',
    loadingQuiz: 'क्विझ लोड करत आहे',
    learnSomethingElse: 'काहीतरी नवीन शिका',
    lessonSummary: 'पाठाचा सारांश',
    summaryGenerationFailed: 'सारांश तयार करण्यात अयशस्वी.',
    generatingSummary: 'सारांश तयार केला जात आहे...',
    downloadPDF: 'पीडीएफ डाउनलोड करा',
    noSummaryAvailable: 'आताच सारांश उपलब्ध नाही.',
    failedToLoadFlashcards: 'फ्लॅशकार्ड लोड करण्यात अयशस्वी. कृपया नंतर पुन्हा प्रयत्न करा.',
    noQuestionsAvailable: 'कोणतेही प्रश्न उपलब्ध नाहीत. कृपया प्रथम एक धडा पूर्ण करा!',
    cardProgress: '{{total}} पैकी {{current}} कार्ड',
    clickToFlip: 'कार्ड पलटण्यासाठी क्लिक करा',
    previous: 'मागील',
    next: 'पुढील',
    error: 'त्रुटी',
    close: 'बंद करा',
    continueLearning: 'शिकणे सुरू ठेवा',
    startConversation: 'अध्ययन सामग्री तयार करण्यासाठी संभाषण सुरू करा!',
    completeLesson: 'अभ्यास साहित्य तयार करण्यासाठी एक धडा पूर्ण करा!',
    card: 'कार्ड',

  },
  kn: {
    selectAgeGroup: 'ವಯೋಮಿತಿ ಆಯ್ಕೆಮಾಡಿ',
    chooseLanguage: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    startLearning: 'ಕಲಿಯಲು ಪ್ರಾರಂಭಿಸಿ!',
    chooseAdventure: 'ಕಲಿಕೆಯ ಪ್ರಯಾಣ ಆಯ್ಕೆಮಾಡಿ!',
    backToTopics: 'ವಿಷಯಗಳಿಗೆ ಹಿಂದಿರುಗಿ',
    thinkAboutIt: 'ಯೋಚಿಸಿ: ಈ ವಿಷಯದ ಬಗ್ಗೆ ನಿಮಗೆ ಈಗಾಗಲೇ ಏನು ಗೊತ್ತು?',
    exploreTopicButton: 'ಈ ವಿಷಯವನ್ನು ಅನ್ವೇಷಿಸಿ →',
    earlyExplorer: 'ಆರಂಭಿಕ ಅನ್ವೇಷಕ',
    juniorScientist: 'ಜೂನಿಯರ್ ವೈಜ್ಞಾನಿಕ',
    teenResearcher: 'ತೀನೇಜ್ ಸಂಶೋಧಕ',
    earlyExplorerRange: 'ವಯಸ್ಸು: ೫-೮',
    juniorScientistRange: 'ವಯಸ್ಸು: ೯-೧೨',
    teenResearcherRange: 'ವಯಸ್ಸು: ೧೩-೧೫',
    language: 'ಭಾಷೆ',
    searchPrompts: 'ವಿಷಯ ಹುಡುಕಿ...',
    science: 'ವಿಜ್ಞಾನ',
    technology: 'ತಂತ್ರಜ್ಞಾನ',
    engineering: 'ಅಭಿಯಾಂತ್ರಿಕೆ',
    math: 'ಗಣಿತ',
    searchPlaceholder: 'ಇಂದು ನೀವು ಏನು ಕಲಿಯಲು ಇಚ್ಛಿಸುತ್ತೀರಿ?',
    wantToLearnAbout: 'ಇದಿನ ಬಗ್ಗೆ ಕಲಿಯಲು ಇಚ್ಛೆ...',
    typeMessage: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಬರೆಯಿರಿ...',
    send: 'ಕಳುಹಿಸಿ',
    earlyLearnerResponse: 'ಉತ್ತಮ ವಿಷಯ! ನೋಡೋಣ ಏನು ಇದೆ',
    juniorLearnerResponse: 'ಅದ್ಭುತ ವಿಷಯ! ಇನ್ನೂ ಒಳಗೆ ಹೋಗೋಣ',
    teenLearnerResponse: 'ದೊಡ್ಡ ವಿಷಯ! ಪರಿಶೀಲನೆ ಮಾಡೋಣ',
    generateFlashcards: 'ಫ್ಲಾಶ್‌ಕಾರ್ಡ್‌ಗಳನ್ನು ರಚಿಸಿ',
    studyFlashcards: 'ಫ್ಲಾಶ್‌ಕಾರ್ಡ್‌ಗಳನ್ನು ಅಧ್ಯಯನ ಮಾಡಿ',
    noFlashcardAvailable: 'ಈಗ ಯಾವುದೇ ಫ್ಲಾಶ್‌ಕಾರ್ಡ್ ಲಭ್ಯವಿಲ್ಲ.',
    noLessonContent: 'ಪಾಠದ ವಿಷಯ ಲಭ್ಯವಿಲ್ಲ.',
    summarize: 'ಸಾರಾಂಶ ರಚಿಸಿ',
    exitLesson: 'ಪಾಠದಿಂದ ಹೊರಬರಲು',
    readyForQuiz: 'ಪ್ರಶ್ನೆೋತ್ತರಕ್ಕಾಗಿ ಸಿದ್ಧವೆ?',
    loadingQuiz: 'ಕ್ವಿಜ್ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ',
    learnSomethingElse: 'ಬೇರೇನು ಕಲಿಯಿರಿ',
    lessonSummary: 'ಪಾಠದ ಸಾರಾಂಶ',
    summaryGenerationFailed: 'ಸಾರಾಂಶ ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ.',
    generatingSummary: 'ಸಾರಾಂಶ ರಚಿಸಲಾಗುತ್ತಿದೆ...',
    downloadPDF: 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    noSummaryAvailable: 'ಈಗಾಗಲೇ ಯಾವುದೇ ಸಾರಾಂಶ ಲಭ್ಯವಿಲ್ಲ.',
    failedToLoadFlashcards: 'ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    noQuestionsAvailable: 'ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳು ಲಭ್ಯವಿಲ್ಲ. ಮೊದಲು ಪಾಠವನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಪ್ರಯತ್ನಿಸಿ!',
    cardProgress: '{{total}} ರಲ್ಲಿ {{current}} ಕಾರ್ಡ್',
    clickToFlip: 'ಕಾರ್ಡ್ ಪಲ್ಟಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
    previous: 'ಹಿಂದಿನದು',
    next: 'ಮುಂದಿನದು',
    error: 'ದೋಷ',
    close: 'ಮುಚ್ಚಿ',
    continueLearning: 'ಅಭ್ಯಾಸ ಮುಂದುವರಿಸಿ',
    startConversation: 'ಅಧ್ಯಯನ ಸಾಮಗ್ರಿಗಳನ್ನು ರಚಿಸಲು ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ!',
    completeLesson: 'ಅಧ್ಯಯನ ಸಾಮಗ್ರಿಗಳನ್ನು ರಚಿಸಲು ಪಾಠವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ!',
    card: 'ಕಾರ್ಡ್',

  }
};

export const getTranslation = (language: string, key: TranslationKey): string => {
  return translations[language]?.[key] || translations['en'][key];
};