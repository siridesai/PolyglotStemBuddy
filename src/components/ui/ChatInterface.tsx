import React, { useState, useRef, useEffect } from 'react';
import { Message, ChildSettings } from '../../utils/assistantMessageType.ts';
import { getTranslation } from '../../data/translations.ts';
import { ArrowLeft, Send, BookOpen, Brain } from 'lucide-react';
import Button from './Button.tsx';
import QuizModal from './QuizModal.tsx';
import { fetchThreadID } from '../../api/fetchThreadID.ts';
import { runAssistant } from '../../api/runAssistant.ts';
import { useCookies } from 'react-cookie';
import { deleteThread } from '../../api/deleteThread.ts';
import FlashcardModal from './FlashcardModal.tsx';
import SummaryModal from './SummaryModal.tsx';
import ExitLessonModal from './ExitLessonModal.tsx';
import MessageContent from './MessageContent.tsx';
import { extractMermaidCode, removeMermaidCode } from '../../utils/mermaidCodeUtils.ts';
import {
  getAgeGroupLabel,
  getCurrentLanguageName,
  findRightLanguageForTTS,
  hasUserStartedConversation,
  sttFromMic,
  textToSpeech,
  stopCurrentPlayback,
  handleSynthesisComplete,
  handleSynthesisError,
} from '../../utils/chatUtils.ts';
import robot from '../../../public/images/robot.svg';
import user from '../../../public/images/user.svg';

const COOKIE_NAME = 'my_cookie';

interface ChatInterfaceProps {
  settings: ChildSettings;
  onBack: () => void;
}

const getWelcomeMessage = (lang: string) => {
  switch (lang) {
    case 'es': return '¡Hola! ¿Qué quieres aprender hoy?';
    case 'hi': return 'नमस्ते! आज आप क्या सीखना चाहते हैं?';
    case 'kn': return 'ನಮಸ್ಕಾರ! ನೀವು ಇಂದು ಏನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?';
    case 'mr': return 'नमस्कार! आज तुम्हाला काय शिकायचे आहे?';
    default:   return 'Hello! What do you want to learn today?';
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ settings, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies([COOKIE_NAME]);
  const [threadId, setThreadId] = useState<string>('');
  const playerRef = useRef<any>(null);
  const synthesizerRef = useRef<any>(null);
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [currentTTS, setCurrentTTS] = useState<string | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [recording, setRecording] = useState(false);
  const [exitLessonFeedback, setShowExitLessonFeedback] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const welcomeMessage = getWelcomeMessage(settings.language);
  const buttonsEnabled = hasUserStartedConversation(messages, welcomeMessage) && !isLoading;

  // Scroll to bottom helper
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Set cookie if missing
  useEffect(() => {
    if (!cookies[COOKIE_NAME]) {
      setCookie(COOKIE_NAME, crypto.randomUUID(), { path: '/', maxAge: 3600 });
    }
  }, [cookies, setCookie]);

  // Fetch thread ID if needed
  useEffect(() => {
    if (cookies[COOKIE_NAME] && !threadId) {
      const getThreadId = async () => {
        try {
          const id = await fetchThreadID(cookies[COOKIE_NAME]);
          if (id) setThreadId(id);
        } catch (err) {
          console.error('Failed to fetch thread ID:', err);
        }
      };
      getThreadId();
    }
  }, [cookies, threadId]);

  // Set welcome message on mount
  useEffect(() => {
    setMessages([
      {
        id: '1',
        type: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
    // eslint-disable-next-line
  }, [settings.language]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthesizerRef.current) {
        synthesizerRef.current.close();
        synthesizerRef.current = null;
      }
      playerRef.current = null;
    };
  }, []);

  // Handlers
  const handleBack = async () => {
    const threadId = await fetchThreadID(cookies[COOKIE_NAME]);
    if (threadId) {
      try {
        await deleteThread(threadId);
        removeCookie(COOKIE_NAME, { path: '/' });
      } catch (err) {
        console.error('Failed to delete thread:', err);
      }
    }
    onBack();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const threadId = await fetchThreadID(cookies[COOKIE_NAME]);
      const response = await runAssistant(
        messageToSend,
        threadId,
        settings.age,
        settings.language,
        cookies[COOKIE_NAME]
      );

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: getTranslation(settings.language, 'tooManyRequests'),
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const { result, runId } = response;
      setCurrentRunId(runId);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result,
          timestamp: new Date(),
          mermaidCode: extractMermaidCode(result),
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentRunId(null);
    }
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-sketch-doodles">
      {/* Header */}
      <div className="bg-white shadow-sm w-full p-2 rounded-b-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
          {/* Header Left */}
          <div className="flex flex-row items-center gap-2">
            <button
              onClick={handleBack}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 mr-1 sm:mr-2" />
            </button>
            <h2 className="font-bold font-[Baloo_2,sans-serif] text-indigo-700 text-[4vw] sm:text-[4vw] md:text-lg lg:text-xl xl:text-2xl whitespace-nowrap drop-shadow">
              Polyglot STEM Buddy
            </h2>
          </div>

          {/* Header Right */}
          <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end w-full sm:w-auto">
            <Button
              onClick={() => setShowFlashcards(true)}
              variant="secondary"
              size="medium"
              disabled={!buttonsEnabled}
              className={`flex items-center gap-1 flex-shrink-0
                ${buttonsEnabled
                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"}
              `}
            >
              {/* Flashcards SVG */}
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="13" height="10" rx="2" />
                <rect x="8" y="3" width="13" height="10" rx="2" />
              </svg>
              <span className="hidden sm:inline">{getTranslation(settings.language, 'generateFlashcards')}</span>
            </Button>
            <Button
              onClick={() => setShowSummary(true)}
              variant="secondary"
              size="medium"
              disabled={!buttonsEnabled}
              className={`flex items-center gap-1 flex-shrink-0
                ${buttonsEnabled
                  ? "bg-blue-50 hover:bg-blue-100 text-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"}
              `}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">{getTranslation(settings.language, 'summarize')}</span>
            </Button>
            <Button
              onClick={() => setShowQuiz(true)}
              variant="secondary"
              size="medium"
              disabled={!buttonsEnabled}
              className={`flex items-center gap-1 flex-shrink-0
                ${buttonsEnabled
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"}
              `}
            >
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"  // Keep the standard viewBox
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Clip */}
              <rect x="8" y="3" width="8" height="3" rx="1" />
              {/* Make the clipboard longer by extending the height and moving it up */}
              <rect x="4" y="5" width="16" height="16" rx="2" />
              {/* Checkmark (move it lower to fit the longer board) */}
              <path d="M9.5 15.5l2 2 3-3" />
            </svg>
              <span className="hidden sm:inline">{getTranslation(settings.language, 'readyForQuiz')}</span>
            </Button>
            <Button
              onClick={() => setShowExitLessonFeedback(true)}
              variant="secondary"
              size="medium"
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 flex-shrink-0"
            >
              {/* Exit SVG */}
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 16l-4-4 4-4" />
                <path d="M5 12h12" />
                <path d="M19 5v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span className="hidden sm:inline">{getTranslation(settings.language, 'exitLesson')}</span>
            </Button>
            <div className="ml-auto text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {getAgeGroupLabel(settings.age)} | {getCurrentLanguageName(settings.language)}
            </div>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Assistant Avatar */}
            {message.type === 'assistant' && (
              <img
                src={robot}
                alt="Robot"
                className="w-12 h-12 mr-2 rounded-full bg-white border border-indigo-100 shadow"
                style={{ boxShadow: '0 2px 8px #e0e7ff' }}
              />
            )}
            {/* Message Bubble */}
            <div
              className={`max-w-[80%] rounded-3xl px-5 py-4 shadow-lg border-2 ${
                message.type === 'user'
                  ? 'bg-indigo-100 border-indigo-200 text-indigo-900'
                  : 'bg-white border-indigo-100 text-gray-800'
              }`}
              style={{
                borderStyle: 'dashed',
                boxShadow: '0 4px 16px 0 rgba(60, 72, 100, 0.14), 0 2px 8px 0 #a5b4fc',
                transform: 'translateY(-2px) scale(1.01)',
              }}
            >
              <MessageContent content={message.content} />
            </div>
            {/* User Avatar */}
            {message.type === 'user' && (
              <img
                src={user}
                alt="You"
                className="w-12 h-12 ml-2 rounded-full bg-white border border-indigo-100 shadow"
                style={{ boxShadow: '0 2px 8px #e0e7ff' }}
              />
            )}
            {/* TTS Button for Assistant */}
            {message.type === 'assistant' && (
              <button
                className="ml-2 p-1 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                title={
                  currentTTS === removeMermaidCode(message.content)
                    ? ttsStatus === 'playing'
                      ? "Pause audio"
                      : ttsStatus === 'paused'
                      ? "Resume audio"
                      : "Read aloud"
                    : "Read aloud"
                }
                onClick={() =>
                  textToSpeech(
                    removeMermaidCode(message.content),
                    findRightLanguageForTTS(settings.language),
                    playerRef,
                    synthesizerRef,
                    ttsStatus,
                    setTtsStatus,
                    currentTTS,
                    setCurrentTTS,
                    () => stopCurrentPlayback(playerRef, synthesizerRef, setTtsStatus),
                    () => handleSynthesisComplete(setTtsStatus, setCurrentTTS),
                    (error) => handleSynthesisError(error, setTtsStatus)
                  )
                }
              >
                {/* Speaker SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-indigo-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5.882V18.12a1 1 0 01-1.707.707L5.586 15H3a1 1 0 01-1-1V10a1 1 0 011-1h2.586l3.707-3.828A1 1 0 0111 5.882zm6.364 1.757a9 9 0 010 8.722M17.657 8.343a5 5 0 010 7.314"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t p-4 rounded-t-3xl">
        <div className="max-w-12xl max-w-full mx-auto">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={getTranslation(settings.language, 'typeMessage')}
              className="placeholder:text-sm sm:placeholder:text-base md:placeholder:text-lg lg:placeholder:text-xl flex-1 min-w-[150px] border-2 border-gray-200 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-indigo-500"
              disabled={isLoading}
            />
            <Button
              onClick={() => sttFromMic(setRecording, setInput, handleSend, settings)}
              variant="secondary"
              size="medium"
              className={`flex items-center gap-1 flex-shrink-0 transition-all duration-200
                ${recording ? "bg-red-100 hover:bg-red-200 text-red-700 scale-110" : "bg-blue-50 hover:bg-blue-100 text-blue-700"}
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={recording ? "#dc2626" : "currentColor"}
                stroke="none"
                className="tabler-icon tabler-icon-microphone-filled"
              >
                <path d="M19 9a1 1 0 0 1 1 1a8 8 0 0 1 -6.999 7.938l-.001 2.062h3a1 1 0 0 1 0 2h-8a1 1 0 0 1 0 -2h3v-2.062a8 8 0 0 1 -7 -7.938a1 1 0 1 1 2 0a6 6 0 0 0 12 0a1 1 0 0 1 1 -1m-7 -8a4 4 0 0 1 4 4v5a4 4 0 1 1 -8 0v-5a4 4 0 0 1 4 -4"></path>
              </svg>
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="primary"
              size="medium"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              {isLoading ? getTranslation(settings.language, 'sending') : getTranslation(settings.language, 'send')}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQuiz && (
        <QuizModal
          onClose={() => setShowQuiz(false)}
          settings={settings}
          messages={messages}
          threadId={threadId}
          cookie={cookies[COOKIE_NAME]}
        />
      )}
      {showFlashcards && (
        <FlashcardModal
          onClose={() => setShowFlashcards(false)}
          settings={settings}
          messages={messages}
          threadId={threadId}
          cookie={cookies[COOKIE_NAME]}
        />
      )}
      {showSummary && (
        <SummaryModal
          onClose={() => setShowSummary(false)}
          settings={settings}
          messages={messages}
          threadId={threadId}
          cookie={cookies[COOKIE_NAME]}
        />
      )}
      {exitLessonFeedback && (
        <ExitLessonModal
          onClose={() => setShowExitLessonFeedback(false)}
          onBack={handleBack}
          settings={{
            age:
              settings.age >= 5 && settings.age <= 8
                ? 'Early Explorer'
                : settings.age >= 9 && settings.age <= 12
                ? 'Junior Scientist'
                : 'Teen Researcher',
            language:
              settings.language === 'en'
                ? 'English'
                : settings.language === 'es'
                ? 'Español'
                : settings.language === 'hi'
                ? 'हिंदी'
                : settings.language === 'kn'
                ? 'ಕನ್ನಡ'
                : settings.language === 'mr'
                ? 'मराठी'
                : 'English',
          }}
        />
      )}
    </div>
  );
};

export default ChatInterface;
