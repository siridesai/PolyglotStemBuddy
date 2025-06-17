export interface ChildSettings {
  age: number;
  language: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mermaidCode?: string; 
}

export interface Prompt {
  id: string;
  title: string;
  question: string;
  description: string;
  icon: string;
  category: 'science' | 'technology' | 'engineering' | 'math';
  ageRange: {
    min: number;
    max: number;
  };
  translations: {
    [key: string]: {
      title: string;
      question: string;
      description: string;
    };
  };
}

export interface ChatSession {
  id: string;
  prompt: Prompt;
  messages: Message[];
}