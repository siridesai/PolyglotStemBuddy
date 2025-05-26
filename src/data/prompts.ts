import { Prompt } from '../types';

export const availablePrompts: Prompt[] = [
  // Early Explorers (5-8)
  {
    id: 'colors-light',
    title: 'Colors and Light',
    question: "Why do we see different colors in a rainbow?",
    description: "Let's explore colors and light through fun experiments!",
    icon: 'Sun',
    category: 'science',
    ageRange: { min: 5, max: 8 },
    translations: {
      es: {
        title: 'Colores y Luz',
        question: '¿Por qué vemos diferentes colores en un arcoíris?',
        description: '¡Exploremos los colores y la luz a través de experimentos divertidos!'
      },
      hi: {
        title: 'रंग और प्रकाश',
        question: 'इंद्रधनुष में हम अलग-अलग रंग क्यों देखते हैं?',
        description: 'मजेदार प्रयोगों के माध्यम से रंग और प्रकाश की खोज करें!'
      }
    }
  },
  {
    id: 'simple-machines',
    title: 'Simple Machines',
    question: "How do simple machines help us move things?",
    description: "Discover how levers, pulleys, and wheels make work easier.",
    icon: 'Tool',
    category: 'technology',
    ageRange: { min: 5, max: 8 },
    translations: {
      es: {
        title: 'Máquinas Simples',
        question: '¿Cómo nos ayudan las máquinas simples a mover cosas?',
        description: 'Descubre cómo las palancas, poleas y ruedas facilitan el trabajo.'
      },
      hi: {
        title: 'सरल मशीनें',
        question: 'सरल मशीनें चीजों को हिलाने में कैसे मदद करती हैं?',
        description: 'जानें कैसे लीवर, पुली और पहिए काम को आसान बनाते हैं।'
      }
    }
  },
  {
    id: 'bridge-building',
    title: 'Building Bridges',
    question: "Can you design a bridge using household items?",
    description: "Learn about different types of bridges and build your own!",
    icon: 'Home',
    category: 'engineering',
    ageRange: { min: 5, max: 8 },
    translations: {
      es: {
        title: 'Construyendo Puentes',
        question: '¿Puedes diseñar un puente usando objetos del hogar?',
        description: '¡Aprende sobre diferentes tipos de puentes y construye el tuyo!'
      },
      hi: {
        title: 'पुल बनाना',
        question: 'क्या आप घरेलू सामान से पुल बना सकते हैं?',
        description: 'विभिन्न प्रकार के पुलों के बारे में जानें और अपना खुद का बनाएं!'
      }
    }
  },
  {
    id: 'counting-patterns',
    title: 'Number Patterns',
    question: "Can you find patterns in numbers around you?",
    description: "Explore counting, shapes, and patterns in everyday life.",
    icon: 'Hash',
    category: 'math',
    ageRange: { min: 5, max: 8 },
    translations: {
      es: {
        title: 'Patrones Numéricos',
        question: '¿Puedes encontrar patrones en los números a tu alrededor?',
        description: 'Explora el conteo, las formas y los patrones en la vida cotidiana.'
      },
      hi: {
        title: 'संख्या पैटर्न',
        question: 'क्या आप अपने आसपास संख्याओं में पैटर्न ढूंढ सकते हैं?',
        description: 'दैनिक जीवन में गिनती, आकृतियों और पैटर्न की खोज करें।'
      }
    }
  },

  // Junior Scientists (9-12)
  {
    id: 'chemical-reactions',
    title: 'Kitchen Chemistry',
    question: "What chemical reactions happen in your kitchen?",
    description: "Explore safe and fun chemical reactions using kitchen ingredients.",
    icon: 'Flask',
    category: 'science',
    ageRange: { min: 9, max: 12 },
    translations: {
      es: {
        title: 'Química en la Cocina',
        question: '¿Qué reacciones químicas ocurren en tu cocina?',
        description: 'Explora reacciones químicas seguras y divertidas usando ingredientes de cocina.'
      },
      hi: {
        title: 'रसोई का विज्ञान',
        question: 'आपकी रसोई में कौन सी रासायनिक प्रतिक्रियाएं होती हैं?',
        description: 'रसोई की सामग्री का उपयोग करके सुरक्षित और मजेदार रासायनिक प्रतिक्रियाओं की खोज करें।'
      }
    }
  },
  {
    id: 'coding-games',
    title: 'Code Your Game',
    question: "How would you design your own computer game?",
    description: "Learn basic programming concepts by creating simple games.",
    icon: 'Code',
    category: 'technology',
    ageRange: { min: 9, max: 12 },
    translations: {
      es: {
        title: 'Programa tu Juego',
        question: '¿Cómo diseñarías tu propio juego de computadora?',
        description: 'Aprende conceptos básicos de programación creando juegos simples.'
      },
      hi: {
        title: 'अपना गेम बनाएं',
        question: 'आप अपना कंप्यूटर गेम कैसे डिजाइन करेंगे?',
        description: 'सरल गेम बनाकर बेसिक प्रोग्रामिंग सीखें।'
      }
    }
  },
  {
    id: 'robot-helper',
    title: 'Robot Helper',
    question: "Can you design a robot to solve a problem?",
    description: "Design and plan a robot that could help people in daily life.",
    icon: 'Tool',
    category: 'engineering',
    ageRange: { min: 9, max: 12 },
    translations: {
      es: {
        title: 'Robot Ayudante',
        question: '¿Puedes diseñar un robot para resolver un problema?',
        description: 'Diseña y planifica un robot que pueda ayudar a las personas en la vida diaria.'
      },
      hi: {
        title: 'रोबोट सहायक',
        question: 'क्या आप किसी समस्या को हल करने के लिए रोबोट डिजाइन कर सकते हैं?',
        description: 'एक ऐसा रोबोट डिजाइन करें जो दैनिक जीवन में लोगों की मदद कर सके।'
      }
    }
  },
  {
    id: 'math-puzzles',
    title: 'Math Mysteries',
    question: "Can you solve these mathematical puzzles?",
    description: "Challenge yourself with fun math problems and brain teasers.",
    icon: 'Hash',
    category: 'math',
    ageRange: { min: 9, max: 12 },
    translations: {
      es: {
        title: 'Misterios Matemáticos',
        question: '¿Puedes resolver estos acertijos matemáticos?',
        description: 'Desafíate con problemas matemáticos divertidos y rompecabezas mentales.'
      },
      hi: {
        title: 'गणित के रहस्य',
        question: 'क्या आप इन गणितीय पहेलियों को हल कर सकते हैं?',
        description: 'मजेदार गणित की समस्याओं और दिमागी कसरत से खुद को चुनौती दें।'
      }
    }
  },

  // Teen Researchers (13-15)
  {
    id: 'dna-exploration',
    title: 'DNA and Genetics',
    question: "How does DNA make us who we are?",
    description: "Explore the basics of genetics and DNA structure.",
    icon: 'Dna',
    category: 'science',
    ageRange: { min: 13, max: 15 },
    translations: {
      es: {
        title: 'ADN y Genética',
        question: '¿Cómo nos hace el ADN ser quienes somos?',
        description: 'Explora los fundamentos de la genética y la estructura del ADN.'
      },
      hi: {
        title: 'डीएनए और आनुवंशिकी',
        question: 'डीएनए हमें कौन बनाता है?',
        description: 'आनुवंशिकी और डीएनए संरचना की मूल बातें जानें।'
      }
    }
  },
  {
    id: 'ai-basics',
    title: 'AI Fundamentals',
    question: "How do computers learn and make decisions?",
    description: "Discover the basics of artificial intelligence and machine learning.",
    icon: 'Code',
    category: 'technology',
    ageRange: { min: 13, max: 15 },
    translations: {
      es: {
        title: 'Fundamentos de IA',
        question: '¿Cómo aprenden y toman decisiones las computadoras?',
        description: 'Descubre los fundamentos de la inteligencia artificial y el aprendizaje automático.'
      },
      hi: {
        title: 'एआई की मूल बातें',
        question: 'कंप्यूटर कैसे सीखते और निर्णय लेते हैं?',
        description: 'कृत्रिम बुद्धिमत्ता और मशीन लर्निंग की मूल बातें जानें।'
      }
    }
  },
  {
    id: 'renewable-energy',
    title: 'Clean Energy',
    question: "How can we create and use clean energy?",
    description: "Explore renewable energy sources and their impact on our planet.",
    icon: 'Zap',
    category: 'engineering',
    ageRange: { min: 13, max: 15 },
    translations: {
      es: {
        title: 'Energía Limpia',
        question: '¿Cómo podemos crear y usar energía limpia?',
        description: 'Explora las fuentes de energía renovable y su impacto en nuestro planeta.'
      },
      hi: {
        title: 'स्वच्छ ऊर्जा',
        question: 'हम स्वच्छ ऊर्जा कैसे बना और उपयोग कर सकते हैं?',
        description: 'नवीकरणीय ऊर्जा स्रोतों और हमारे ग्रह पर उनके प्रभाव का पता लगाएं।'
      }
    }
  },
  {
    id: 'data-analysis',
    title: 'Data Science',
    question: "How can we use math to understand big data?",
    description: "Learn how to collect, analyze, and visualize data to solve problems.",
    icon: 'Hash',
    category: 'math',
    ageRange: { min: 13, max: 15 },
    translations: {
      es: {
        title: 'Ciencia de Datos',
        question: '¿Cómo podemos usar las matemáticas para entender los grandes datos?',
        description: 'Aprende a recolectar, analizar y visualizar datos para resolver problemas.'
      },
      hi: {
        title: 'डेटा विज्ञान',
        question: 'बड़े डेटा को समझने के लिए हम गणित का उपयोग कैसे कर सकते हैं?',
        description: 'समस्याओं को हल करने के लिए डेटा एकत्र, विश्लेषण और विज़ुअलाइज़ करना सीखें।'
      }
    }
  }
];

export const getPromptsForAge = (age: number): Prompt[] => {
  return availablePrompts.filter(
    prompt => age >= prompt.ageRange.min && age <= prompt.ageRange.max
  );
};

export const getPromptsByCategory = (prompts: Prompt[]): Record<string, Prompt[]> => {
  return prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);
};

export const getPromptById = (id: string): Prompt | undefined => {
  return availablePrompts.find(prompt => prompt.id === id);
};

export const getLocalizedPromptContent = (prompt: Prompt, language: string) => {
  if (language === 'en') {
    return {
      title: prompt.title,
      question: prompt.question,
      description: prompt.description
    };
  }
  
  return prompt.translations[language] || {
    title: prompt.title,
    question: prompt.question,
    description: prompt.description
  };
};