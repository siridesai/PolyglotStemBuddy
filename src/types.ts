export interface ChildSettings {
  age: number;
  language: string;
}

export interface MessageMedia {
  type: 'image' | 'diagram';
  url?: string;
  caption?: string;
  diagramData?: {
    nodes: Array<{
      id: string;
      label: string;
      x: number;
      y: number;
      color?: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      label?: string;
    }>;
  };
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  media?: MessageMedia[];
  timestamp: Date;
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