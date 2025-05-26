import React, { useState, useRef, useEffect } from 'react';
import { Message, Prompt, ChildSettings } from '../types';
import { getLocalizedPromptContent } from '../data/prompts';
import { getTranslation } from '../data/translations';
import { ArrowLeft, Send, BookOpen, Brain, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import QuizModal from './ui/QuizModal';
import SummaryModal from './ui/SummaryModal';
import { runAssistant } from '../api/runAssistant';

interface ChatInterfaceProps {
  prompt: Prompt;
  settings: ChildSettings;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ prompt, settings, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localizedContent = getLocalizedPromptContent(prompt, settings.language);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAgeAppropriateContent = (topic: string) => {
    const lang = settings.language;
    
    if (settings.age <= 8) {
      if (lang === 'es') {
        return {
          content: `¡Vamos a aprender sobre ${topic} de una manera divertida!`
        };
      } else if (lang === 'hi') {
        return {
          content: `आइए ${topic} के बारे में मजेदार तरीके से जानें!`
        };
      }
      return {
        content: `Let's learn about ${topic} in a fun way!`
      };
    }

    return {
      content: `Let's explore ${topic} together!`
    };
  };

  useEffect(() => {
    const topic = localizedContent.title.toLowerCase();
    let welcomeMessage = '';
    
    if (settings.age <= 8) {
      welcomeMessage = `${getTranslation(settings.language, 'earlyLearnerResponse')} ${topic}!`;
    } else if (settings.age <= 12) {
      welcomeMessage = `${getTranslation(settings.language, 'juniorLearnerResponse')} ${topic}!`;
    } else {
      welcomeMessage = `${getTranslation(settings.language, 'teenLearnerResponse')} ${topic}!`;
    }

    const ageAppropriateContent = getAgeAppropriateContent(topic);

    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'assistant',
        content: ageAppropriateContent.content,
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await runAssistant(input, settings.age, settings.language);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>{getTranslation(settings.language, 'back')}</span>
            </button>
            <h2 className="font-semibold text-gray-800">{localizedContent.title}</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {/* Handle additional resources */}}
              variant="secondary"
              size="small"
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{getTranslation(settings.language, 'additionalResources')}</span>
            </Button>
            <Button
              onClick={() => setShowQuiz(true)}
              variant="secondary"
              size="small"
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">{getTranslation(settings.language, 'readyForQuiz')}</span>
            </Button>
            <Button
              onClick={() => setShowSummary(true)}
              variant="secondary"
              size="small"
              className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{getTranslation(settings.language, 'learnSomethingElse')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white shadow-md text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={getTranslation(settings.language, 'typeMessage')}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="primary"
              size="medium"
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Sending...' : getTranslation(settings.language, 'send')}
            </Button>
          </div>
        </div>
      </div>

      {showQuiz && (
        <QuizModal
          onClose={() => setShowQuiz(false)}
          settings={settings}
          topic={localizedContent.title}
        />
      )}

      {showSummary && (
        <SummaryModal
          onClose={() => {
            setShowSummary(false);
            onBack();
          }}
          messages={messages}
          settings={settings}
          topic={localizedContent.title}
        />
      )}
    </div>
  );
};

export default ChatInterface;