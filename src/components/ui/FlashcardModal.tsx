import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChildSettings, Message } from '../../utils/assistantMessageType.ts';
import { generateQuestions } from '../../api/generateQuestions';
import { getTranslation } from '../../data/translations';
import { appInsights } from '../../utils/appInsightsForReact.ts';
import LatexRender from './LatexCodeRender.tsx';


interface FlashcardModalProps {
  onClose: () => void;
  settings: ChildSettings;
  messages: Message[];
  threadId: string;
  cookie: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({
  onClose,
  settings,
  messages,
  threadId,
  cookie,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noValidContent, setNoValidContent] = useState(false);
  const hasFetched = useRef(false);

  // Filter out initial prompt messages
  const filterMessages = useCallback(() => {
    const initialPrompts = [
      "what do you want to learn about today",
      "what would you like to learn about today",
      "what topic would you like to explore"
    ];

    return messages.filter(message => {
      const content = message.content.trim().toLowerCase();
      return !initialPrompts.some(prompt => content.includes(prompt));
    });
  }, [messages]);

  // Fetch questions when modal opens
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoValidContent(false);
    
    try {
      const filteredMessages = filterMessages();
      
      // Check if we have valid messages after filtering
      if (filteredMessages.length === 0) {
        setNoValidContent(true);
        setQuestions([]);
        return;
      }

      const qs = await generateQuestions(
        filteredMessages,  // Use filtered messages
        threadId,
        settings.age,
        settings.language,
        cookie
      );
      
      if (!qs || qs.length === 0) {
        
        setError(getTranslation(settings.language,'noQuestionsAvailable'));
        setQuestions([]);
      } else {
        setQuestions(qs);
      }
    } catch (err) {
      setError(getTranslation(settings.language,'failedToLoadFlashcards'));
      console.error('Flashcard error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterMessages, threadId, settings.age, settings.language, cookie]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchQuestions();
  }, [fetchQuestions]);

  // Log App Insights page usage
  useEffect(() => {
    if (appInsights) {
      appInsights.trackPageView({ name: 'FlashCardModal' });
    }
  }, );

  // Navigation handlers
  const handlePrev = () => {
    setFlipped(false);
    setCurrent(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setFlipped(false);
    setCurrent(prev => (prev < (questions?.length || 0) - 1 ? prev + 1 : prev));
  };

  // Convert questions to flashcards
  const flashcards = questions
    ? questions.map(q => ({ question: q.question, answer: q.explanation }))
    : [];

  // Render states
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg animate-pulse">
          <div className="h-8 w-3/4 bg-gray-200 rounded mx-auto mb-6"></div>
          <div className="h-40 bg-gray-100 rounded-xl mb-6"></div>
          <div className="h-10 w-32 bg-gray-300 rounded-lg mx-auto"></div>
        </div>
      </div>
    );
  }

  if (noValidContent) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h3 className="text-xl font-bold mb-4">{getTranslation(settings.language,'noLessonContent')}</h3>
          <p className="text-gray-600 mb-6">
             {getTranslation(settings.language,'startLearning')}
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition"
          >
            {getTranslation(settings.language,'startLearning')}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-red-600">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition"
          >
            {getTranslation(settings.language,'close')}
          </button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h3 className="text-xl font-bold mb-4">{getTranslation(settings.language,'noFlashcardAvailable')}</h3>
          <p className="text-gray-600 mb-6">
            {getTranslation(settings.language,'completeLesson')}
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition"
          >
            {getTranslation(settings.language,'continueLearning')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{getTranslation(settings.language,'studyFlashcards')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="text-center mb-4 text-sm text-gray-600">
          {getTranslation(settings.language,'card')} {current + 1} of {flashcards.length}
        </div>
        
        {/* Flashcard */}
        <div 
          className="w-full h-64 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl shadow-md mb-8 relative cursor-pointer border-2 border-indigo-100 overflow-hidden"
          onClick={() => setFlipped(!flipped)}
        >
          {/* Front Side */}
          <div
            className={`absolute inset-0 flex items-center justify-center px-6 text-center text-lg font-medium transition-opacity duration-500 ${
              flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
           <LatexRender content={flashcards[current].question} />
          </div>
          {/* Back Side */}
          <div
            className={`absolute inset-0 flex items-center justify-center px-6 text-center text-lg font-medium transition-opacity duration-500 ${
              flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
           <LatexRender content={flashcards[current].answer} />
          </div>
        </div>

        {/* Hint */}
        <div className="text-center text-sm text-gray-500 mb-6">
          {getTranslation(settings.language,'clickToFlip')}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={current === 0}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              current === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {getTranslation(settings.language,'previous')}
          </button>
          
          <button
            onClick={handleNext}
            disabled={current === flashcards.length - 1}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              current === flashcards.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {getTranslation(settings.language,'next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardModal;
