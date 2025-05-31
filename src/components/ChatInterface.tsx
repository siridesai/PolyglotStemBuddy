import React, { useState, useRef, useEffect } from 'react';
import { Message, ChildSettings } from '../types';
import { getTranslation } from '../data/translations';
import { ArrowLeft, Send, BookOpen, Brain } from 'lucide-react';
import Button from './ui/Button';
import QuizModal from './ui/QuizModal';
import { runAssistant } from '../api/runAssistant';
import { useCookies } from 'react-cookie';
import { availableLanguages } from '../data/languages';


const COOKIE_NAME = 'my_cookie';

interface ChatInterfaceProps {
  settings: ChildSettings;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({settings, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cookies, setCookie] = useCookies([COOKIE_NAME]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAgeGroupLabel = (age: number) => {
    if (age >= 5 && age <= 8) return getTranslation(settings.language, 'earlyExplorer');
    if (age >= 9 && age <= 12) return getTranslation(settings.language, 'juniorScientist');
    return getTranslation(settings.language, 'teenResearcher');
  };

  const getCurrentLanguageName = () => {
    const language = availableLanguages.find(lang => lang.code === settings.language);
    return language ? language.nativeName : settings.language;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const lang = settings.language;
    let welcomeMessage = '';
    if (lang === 'es') {
      welcomeMessage = `¡Hola! ¿Qué quieres aprender hoy?`
    } else if (lang === 'hi') {
      welcomeMessage = 'नमस्ते! आज आप क्या सीखना चाहते हैं?'
    } else if (lang == 'kn') {
      welcomeMessage = 'ನಮಸ್ಕಾರ! ನೀವು ಇಂದು ಏನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?'
    } else if (lang == 'mr') {
      welcomeMessage = 'नमस्कार! आज तुम्हाला काय शिकायचे आहे?'
    }
    else {
      welcomeMessage =`Hello! What do you want to learn today?`
    };
    
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if the cookie exists
    if (!cookies[COOKIE_NAME]) {
      // Set the cookie if missing
      setCookie(COOKIE_NAME, String(Math.floor(Math.random() * 100) + 1), { path: '/', maxAge: 3600 });
    }
    // You can now use cookies[COOKIE_NAME] as the value
    console.log('Cookie value:', cookies[COOKIE_NAME]);
  }, [cookies, setCookie]);


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
      const response = await runAssistant(input, settings.age, settings.language, cookies[COOKIE_NAME] );
      
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
        <div className="max-w-12xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>{getTranslation(settings.language, 'back')}</span>
            </button>
            <h2 className="font-semibold text-gray-800">{"Polyglot STEM Buddy"}</h2>
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
            <div className="text-sm text-gray-600">
              {getAgeGroupLabel(settings.age)} | {getCurrentLanguageName()}
            </div>
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
        <div className="max-w-12x1 mx-auto">
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
          topic={"hey"}
        />
      )}
    </div>
  );
};

export default ChatInterface;