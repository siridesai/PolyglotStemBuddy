import React, { useState, useRef, useEffect } from 'react';
import { Message, Prompt, ChildSettings, MessageMedia } from '../types';
import { getLocalizedPromptContent } from '../data/prompts';
import { getTranslation } from '../data/translations';
import { ArrowLeft, Send } from 'lucide-react';
import Button from './ui/Button';
import Diagram from './ui/Diagram';

interface ChatInterfaceProps {
  prompt: Prompt;
  settings: ChildSettings;
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ prompt, settings, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
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
          content: `¡Vamos a aprender sobre ${topic} de una manera divertida!`,
          media: [
            {
              type: 'image' as const,
              url: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
              caption: '¡Descubriendo la ciencia!'
            },
            {
              type: 'diagram' as const,
              caption: 'Conceptos básicos',
              diagramData: {
                nodes: [
                  { id: '1', label: topic, x: 200, y: 150, color: '#4F46E5' },
                  { id: '2', label: '¡Diversión!', x: 100, y: 100, color: '#059669' },
                  { id: '3', label: 'Aprendizaje', x: 300, y: 100, color: '#DC2626' }
                ],
                edges: [
                  { from: '1', to: '2', label: 'es' },
                  { from: '1', to: '3', label: 'para' }
                ]
              }
            }
          ]
        };
      } else if (lang === 'hi') {
        return {
          content: `आइए ${topic} के बारे में मजेदार तरीके से जानें!`,
          media: [
            {
              type: 'image' as const,
              url: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
              caption: 'विज्ञान की खोज!'
            },
            {
              type: 'diagram' as const,
              caption: 'मूल अवधारणाएं',
              diagramData: {
                nodes: [
                  { id: '1', label: topic, x: 200, y: 150, color: '#4F46E5' },
                  { id: '2', label: 'मज़ा', x: 100, y: 100, color: '#059669' },
                  { id: '3', label: 'सीखना', x: 300, y: 100, color: '#DC2626' }
                ],
                edges: [
                  { from: '1', to: '2', label: 'है' },
                  { from: '1', to: '3', label: 'के लिए' }
                ]
              }
            }
          ]
        };
      }
      return {
        content: `Let's learn about ${topic} in a fun way!`,
        media: [
          {
            type: 'image' as const,
            url: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            caption: 'Discovering science!'
          },
          {
            type: 'diagram' as const,
            caption: 'Basic concepts',
            diagramData: {
              nodes: [
                { id: '1', label: topic, x: 200, y: 150, color: '#4F46E5' },
                { id: '2', label: 'Fun', x: 100, y: 100, color: '#059669' },
                { id: '3', label: 'Learning', x: 300, y: 100, color: '#DC2626' }
              ],
              edges: [
                { from: '1', to: '2', label: 'is' },
                { from: '1', to: '3', label: 'for' }
              ]
            }
          }
        ]
      };
    }

    // Add similar content for other age groups...
    return {
      content: `Let's explore ${topic} together!`,
      media: [
        {
          type: 'image' as const,
          url: 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          caption: 'Learning together'
        }
      ]
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
        media: ageAppropriateContent.media,
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      {
        id: Date.now().toString(),
        type: 'user',
        content: input,
        timestamp: new Date()
      }
    ];

    setMessages(newMessages);
    setInput('');

    setTimeout(() => {
      const response = getAgeAppropriateContent(localizedContent.title.toLowerCase());
      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.content,
          media: response.media,
          timestamp: new Date()
        }
      ]);
    }, 1000);
  };

  const renderMedia = (media: MessageMedia) => {
    if (media.type === 'diagram' && media.diagramData) {
      return (
        <div className="relative rounded-lg overflow-hidden bg-white p-4">
          <Diagram
            width={400}
            height={300}
            data={media.diagramData}
          />
          {media.caption && (
            <div className="mt-2 text-sm text-gray-600 text-center">
              {media.caption}
            </div>
          )}
        </div>
      );
    }
    
    if (media.type === 'image' && media.url) {
      return (
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={media.url} 
            alt={media.caption || 'Shared image'} 
            className="w-full h-auto object-cover rounded-lg"
            loading="lazy"
          />
          {media.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
              {media.caption}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>{getTranslation(settings.language, 'back')}</span>
          </button>
          <h2 className="ml-4 font-semibold text-gray-800">{localizedContent.title}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-2 ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white shadow-md text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.media && message.media.length > 0 && (
                <div className="space-y-4 mt-3">
                  {message.media.map((media, index) => (
                    <div key={index} className="relative">
                      {renderMedia(media)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={getTranslation(settings.language, 'typeMessage')}
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            variant="primary"
            size="medium"
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {getTranslation(settings.language, 'send')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;