import React, { useState, useRef, useEffect } from 'react';
import { Message, ChildSettings } from '../../utils/assistantMessageType.ts';
import { getTranslation } from '../../data/translations.ts';
import type { TranslationKey } from '../../data/translations.ts';
import { ArrowLeft, Send, BookOpen, Brain, Sparkles } from 'lucide-react';
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
import { v4 as uuidv4 } from 'uuid';

import {
  getAgeGroupLabel,
  getCurrentLanguageName,
  findRightLanguageForTTS,
  hasUserStartedConversation,
  sttFromMic,
  handleSynthesisComplete,
  handleSynthesisError,
  extractMainAndQuestions,
  textToSpeechWithHtmlAudio,
  stopCurrentPlaybackWithAudio,
} from '../../utils/chatUtils.ts';
import robot from '../../../public/images/robot.svg';
import user from '../../../public/images/user.svg';
import { appInsights } from '../../utils/appInsightsForReact.ts';
import { generateRandomTopicQuestions } from '../../api/generateRandomTopicQuestions.ts';
import LatexRender from './LatexCodeRender.tsx';

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
  const synthesizerRef = useRef<any>(null);
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [currentTTS, setCurrentTTS] = useState<string | null>(null);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [recording, setRecording] = useState(false);
  const [exitLessonFeedback, setShowExitLessonFeedback] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
 

  const welcomeMessage = getWelcomeMessage(settings.language);
  const buttonsEnabled = hasUserStartedConversation(messages, welcomeMessage) && !isLoading;

  // Scroll to bottom helper
  const messagesEndRef = useRef<HTMLDivElement>(null);
 

  const [showTopicPills, setShowTopicPills] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicQuestions, setTopicQuestions] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [sessionReady, setSessionReady] = useState(false);

  const BROAD_TOPICS = [
  { key: 'science', translationKey: 'science' },
  { key: 'technology', translationKey: 'technology' },
  { key: 'engineering', translationKey: 'engineering' },
  { key: 'math', translationKey: 'math' },
  { key: 'surprise', translationKey: 'surprise' }
];

function shuffle(array: any[]) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const [randomizedTopics, setRandomizedTopics] = useState<{ key: string; translationKey: string }[]>([]);


useEffect(() => {
  setRandomizedTopics(BROAD_TOPICS);
}, []);

  useEffect(() => {
    if (appInsights) {
      appInsights.trackPageView({ name: 'ChatInterface' });
    }
  }, []);

  useEffect(() => {
  requestAnimationFrame(() => {
    scrollToBottom();
  });
}, []);

  function generateSessionId(): string {
    let id='';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
       id = crypto.randomUUID();
    } else {
       id = uuidv4();
    }
  return id;
}
  // Set cookie if missing
  useEffect(() => {
    if (!cookies[COOKIE_NAME]) {
      const id = generateSessionId(); // ← Use your custom generator here
      setCookie(COOKIE_NAME, id, { path: '/', maxAge: 3600 });
    } else {
      setSessionReady(true);
    }
  }, [cookies, setCookie]);


  // Fetch thread ID if needed
  useEffect(() => {
    if (sessionReady && cookies[COOKIE_NAME] && !threadId) {
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
  }, [sessionReady, cookies, threadId]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up <audio> element
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.currentTime = 0;
        } catch {}
      }
      // Clean up SpeechSynthesizer
      if (synthesizerRef.current) {
        try {
          synthesizerRef.current.close();
        } catch {}
        synthesizerRef.current = null;
      }
      setTtsStatus('idle');
      setCurrentTTS(null);
    };
  }, []);

  // Handlers
  const handleBack = async () => {
    stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
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

  const handleSend = async (q?: any) => {
    setIsSending(true);
    setTopicQuestions([]);
    setSelectedTopic(null);
    //Hide the topic pills
    setShowTopicPills(false);
    const messageToSend = typeof q === 'string' ? q : input.trim();
    if (!messageToSend || isLoading) return;
    

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    

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
      const { main, questions } = extractMainAndQuestions(result);
      setSuggestedQuestions(
        questions.filter(
          (q) => q && ![...messages, userMessage].some(m => m.content === q)
      )
);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant" as const,
          content: main,
          timestamp: new Date(),
          mermaidCode: extractMermaidCode(main),
        }
      ]);
    } finally {
      setIsSending(false);
      setCurrentRunId(null);
    }
  };

  function numberToWords(num: number): string {
  // Simple rules for 0-20 and fallback numbers
  const map: Record<number, string> = {
    0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four',
    5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine',
    10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen',
    14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 
    17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty'
  };
  return map[num] || num.toString();
}

function denominatorToWords(den: number, num: number): string {
  // Singular/plural special cases for denominator words
  const isSingular = num === 1;
  switch (den) {
    case 2: return isSingular ? 'half' : 'halves';
    case 3: return isSingular ? 'third' : 'thirds';
    case 4: return isSingular ? 'fourth' : 'fourths';
    case 5: return isSingular ? 'fifth' : 'fifths';
    case 6: return isSingular ? 'sixth' : 'sixths';
    default: return isSingular ? `${den}th` : `${den}ths`;
  }
}

function convertLatexToSpeech(latexText: string): string {
  if (!latexText) return '';

  let text = latexText;

  // 1. Convert mixed fractions like 3\frac{1}{4} to "three and one fourth"
  text = text.replace(/(\d+)\\frac\s*{(\d+)}\s*{(\d+)}/g, (_, whole, num, den) => {
    const wholeWord = numberToWords(parseInt(whole));
    const fractionWord = `${numberToWords(parseInt(num))} ${denominatorToWords(parseInt(den), parseInt(num))}`;
    return `${wholeWord} and ${fractionWord}`;
  });

  // 2. Convert simple fractions like \frac{3}{4} to "three fourths"
  text = text.replace(/\\frac\s*{(\d+)}\s*{(\d+)}/g, (_, num, den) => {
    return `${numberToWords(parseInt(num))} ${denominatorToWords(parseInt(den), parseInt(num))}`;
  });

  // 3. Convert superscripts like x^2 to "x squared"
  text = text.replace(/([a-zA-Z0-9])\^\{?([^}]*)\}?/g, (_, base, exponent) => {
    if (exponent === '2') return `${base} squared`;
    if (exponent === '3') return `${base} cubed`;
    return `${base} to the ${exponent}`;
  });

  // 4. Replace arrows with words
  text = text.replace(/\\rightarrow/g, 'yields');

  // 5. Remove leftover backslashes
  text = text.replace(/\\/g, '');

  // 6. Remove math delimiters $ and $$
  text = text.replace(/\$\$?([\s\S]*?)\$\$?/g, '$1');

  return text.trim();
}

  const handleTTSClick = (messageContent: string) => {
    let cleanedText = removeMermaidCode(messageContent);
    cleanedText = convertLatexToSpeech(cleanedText);

    const isPlayingThis = currentTTS === cleanedText && ttsStatus === 'playing';

    if (isPlayingThis) {
      // Stop the audio
      stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
    } else {
      // Play using HTMLAudioElement
      textToSpeechWithHtmlAudio(
        cleanedText,
        findRightLanguageForTTS(settings.language),
        audioRef,
        synthesizerRef,
        ttsStatus,
        setTtsStatus,
        currentTTS,
        setCurrentTTS,
        () => stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS),
        () => handleSynthesisComplete(setTtsStatus, setCurrentTTS),
        (error) => handleSynthesisError(error, setTtsStatus)
      );
    }
  };

  const lastUserMessageIdx = [...messages].reverse().findIndex(m => m.type === 'user');
  const lastUserMessageIndex = lastUserMessageIdx === -1 ? -1 : messages.length - 1 - lastUserMessageIdx;

  async function handleTopicPillClick(topicKey: string) {
  setIsLoading(true);
  let chosenTopic = topicKey;
  
  const STEM_TOPICS = BROAD_TOPICS.filter(t => t.key !== 'surprise');
  
  // If 'surprise' is selected, pick a random STEM topic
  if (topicKey === 'surprise') {
    const shuffled = shuffle([...STEM_TOPICS]);
    const randomIndex = Math.floor(Math.random() * shuffled.length);
    chosenTopic = shuffled[randomIndex].key;
    
  }
  setSelectedTopic(chosenTopic);

  // Call backend to get AI-generated questions
  console.log(`Topic chosen: ${chosenTopic}`);
  const randomTopicQuestions = await generateRandomTopicQuestions(chosenTopic, threadId, settings.age, settings.language, cookies[COOKIE_NAME]);
  setTopicQuestions(randomTopicQuestions);
  setShowTopicPills(false);
  setIsLoading(false);

};

const scrollContainerRef = useRef<HTMLDivElement>(null);
function isUserNearBottom() {
  const el = scrollContainerRef.current;
  if (!el) return false;
  return el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
}

// Scroll to bottom smoothly
function scrollToBottom() {
  const el = scrollContainerRef.current;
  if (el) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }
}
const wasNearBottomRef = useRef(true);

useEffect(() => {
  // Save if user was near bottom before update
  wasNearBottomRef.current = isUserNearBottom();
  
}, [messages])

useEffect(() => {
  // Wait for next paint/render (including math, diagrams),
  // then scroll to bottom if user was near bottom before
  if (wasNearBottomRef.current) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { // run twice to wait layout stabilization
        scrollToBottom();
      });
    });
  }
  // else don't scroll, user likely scrolled up so preserve scroll pos
}, [messages]);


  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-sketch-doodles" style={{ height: 'var(--app-height)'}}>

      <audio ref={audioRef} hidden preload="auto" />
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
              onClick={() => {
                stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
                setShowFlashcards(true)}}
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
              onClick={() => {
                stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
                setShowSummary(true)}}
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
              onClick={() => {
                 stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
                 setShowQuiz(true)}}
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
              onClick={() => {
                stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
                setShowExitLessonFeedback(true)}}
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
              <span className="hidden sm:inline">{getTranslation(settings.language, 'feedback')}</span>
            </Button>
            <div className="ml-auto text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {getAgeGroupLabel(settings.age, settings.language)} | {getCurrentLanguageName(settings.language)}
            </div>
          </div>
        </div>
      </div>


    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
  {messages.map((message, idx) => {
    // Check if this is the first question bubble
    const isFirstQuestion =
      message.type === 'question' &&
      (idx === 0 || messages[idx - 1].type !== 'question');

    const isFirstAssistant =
    message.type === 'assistant' &&
    messages.findIndex(m => m.type === 'assistant') === idx;  

    return (
     <React.Fragment key={message.id}>
  {/* Assistant/User Message Bubbles */}
  {(message.type === 'assistant' || message.type === 'user') && (
    <div
      className={`flex items-end ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {/* Assistant Avatar */}
      {message.type === 'assistant' && (
        <img
          src={robot}
          alt="Robot"
          className="w-12 h-12 mr-2 rounded-full bg-gray-100 border border-indigo-100 shadow"
          style={{ boxShadow: '0 2px 8px #e0e7ff' }}
        />
      )}
      {/* Message Bubble */}
      <div
        className={`max-w-[80%] rounded-3xl px-5 py-4 shadow-lg border-2 ${
          message.type === 'user'
            ? 'bg-indigo-100 border-indigo-200 text-indigo-900'
            : 'bg-gray-100 border-indigo-100 text-gray-800'
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
        <button className="ml-2 p-1 rounded-full hover:bg-gray-100 transition flex-shrink-0"
          title={
            currentTTS === removeMermaidCode(message.content) && ttsStatus === 'playing'
              ? "Stop audio"
              : "Read aloud"
          }
          onClick={() => handleTTSClick(message.content)}
        >
          {/* Speaker Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
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
  )}



  {/* --- Topic Pills: Only after first assistant message and at the start --- */}
  {isFirstAssistant && showTopicPills && (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
      {randomizedTopics.map(topic => (
        <button
          key={topic.key}
          className="w-full sm:w-40 flex-shrink-0 rounded-full bg-indigo-100 border border-indigo-200 text-black-500 px-5 py-2 text-base font-semibold shadow hover:bg-indigo-200 transition text-center "
          onClick={(e) => {
            e.stopPropagation();
            setIsLoading(true);
            handleTopicPillClick(topic.key);
          }}
          tabIndex={0}
          aria-label={`Choose ${getTranslation(settings.language, topic.translationKey as TranslationKey)}`}
        >
          {getTranslation(settings.language, topic.translationKey as TranslationKey)}
        </button>
      ))}
    </div>
  )}
  {isLoading && showTopicPills && (
     <div className="flex justify-center items-center mt-6 mb-6">
    <div className="flex flex-col items-center bg-indigo-50 rounded-xl px-6 py-4 shadow-md">
      <div
        className="loader border-4 border-indigo-500 border-t-transparent rounded-full w-10 h-10 animate-spin shadow"
        role="status"
        aria-label="Loading topics"
      ></div>
      <span className="mt-3 text-indigo-700 font-medium text-base animate-pulse">
        {getTranslation(settings.language, "loadingTopics")}
      </span>
    </div>
  </div>
  )}

  {/* --- Question Pills: After topic is picked and questions loaded --- */}
  {isFirstAssistant && !showTopicPills && topicQuestions.length > 0 && (
    <>
    
    <div className="w-auto bg-gray-100 flex flex-wrap ml-7 mt-2 mb-1 text-black-900 font-semibold text-lg justify-start sm:text-base md:text-lg lg:text-xl xl:text-2xl">
      <Sparkles className="w-8 h-8 text-yellow-500 mr-3 font-bold sm:text-sm md:text-base lg:text-lg xl:text-xl justify-start" />
      <span className="sm:text-sm md:text-base lg:text-lg xl:text-xl">{getTranslation(settings.language, 'searchPrompts')}  </span>
      <span className="text-yellow-500 ml-3 text-2xl font-bold sm:text-sm md:text-base lg:text-lg xl:text-xl">✧</span>
    </div>
    <div className="flex flex-wrap gap-2 mt-3 mb-2 ml-14 sm:text-base md:text-lg lg:text-xl xl:text-2xl">
      {topicQuestions.map((question, idx) => (
        <button
          key={idx}
          className="rounded-full bg-indigo-100 border border-indigo-200 text-indigo-900 px-5 py-2 text-lg text-black-900 font-medium shadow hover:bg-indigo-200 transition"
          onClick={(e) => {
            e.stopPropagation();
            setTopicQuestions([]);
            setSelectedTopic(null);
            handleSend(question);
          }}
          tabIndex={0}
          aria-label={`Ask: ${question}`}
        >
          <LatexRender content={question} />
        </button>
      ))}
    </div>
     </>
  )}

  {/* Suggested Follow-Up Questions Label */}
  {isFirstQuestion && (
    <div className="w-auto text-sm font-semibold text-black-600 mb-2 ml-7 justify-start sm:text-base md:text-lg lg:text-xl xl:text-2xl">
      <span className="sm:text-sm md:text-base lg:text-lg xl:text-xl">{getTranslation(settings.language, 'followUpQuestions')}
      </span>
    </div>
  )}

  {/* Follow-up Questions (if any) */}
  {message.type === 'assistant' &&
    idx === messages.length - 1 &&
    suggestedQuestions.length > 0 && (
      <>
        <div className="w-auto bg-gray-100 flex flex-wrap ml-7 mt-2 mb-1 text-black-900 font-semibold text-lg justify-start sm:text-base md:text-lg lg:text-xl xl:text-2xl">
          <Sparkles className="justify-start w-8 h-8 text-yellow-500 mr-3 font-bold sm:text-sm md:text-base lg:text-lg xl:text-xl" />
          <span className="sm:text-sm md:text-base lg:text-lg xl:text-xl">{getTranslation(settings.language, 'followUpQuestions')} </span>
          <span className="text-yellow-500 ml-3 text-2xl font-bold sm:text-sm md:text-base lg:text-lg xl:text-xl">✧</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 mb-2 ml-14 sm:text-base text-black-900 md:text-lg lg:text-xl xl:text-2xl">
          {suggestedQuestions.map((question, idx) => (
            <button
              key={idx}
              className="rounded-full bg-indigo-100 border border-indigo-200 text-indigo-900 px-5 py-2 text-lg font-medium shadow hover:bg-indigo-200 transition"
              onClick={() => {
                stopCurrentPlaybackWithAudio(audioRef, synthesizerRef, setTtsStatus, setCurrentTTS);
                setSuggestedQuestions([]);
                handleSend(question);
              }}
              tabIndex={0}
              role="button"
              aria-label={`Ask: ${question}`}
            >
             <LatexRender content={question} />
            </button>
          ))}
        </div>
      </>
    )}
    {isSending && 
      idx === lastUserMessageIndex &&
      // Only show if the last message is from the user and no assistant message has been rendered after
      (idx === messages.length - 1 || messages.slice(idx + 1).every(m => m.type !== 'assistant')) && (
        <div style={{ marginRight: '25%' }} className="flex justify-end items-center mt-2 mb-2 ml-14">
          <div className="loader border-4 border-indigo-500 border-t-transparent rounded-full w-8 h-8 animate-spin sm:text-base md:text-lg lg:text-xl xl:text-2xl"></div>
        </div>
      )
    }
    
</React.Fragment>
    );
  })}
  <div ref={messagesEndRef} />
</div>


<div className="bg-white border-t p-4 rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
  <div className="max-w-12xl max-w-full mx-auto">
    <div className="flex flex-nowrap gap-2 items-center w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder={getTranslation(settings.language, 'typeMessage')}
        className="min-w-0 flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-base sm:text-lg placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:border-indigo-500"
        disabled={isLoading}
      />
      {/* Mic Button */}
      <button
        type="button"
        onClick={() => sttFromMic(setRecording, setInput, handleSend, settings)}
        className={`
          w-12 h-12 flex items-center justify-center rounded-full
          transition-all duration-200
          ${recording ? "bg-red-100 hover:bg-red-200 text-red-700 scale-110" : "bg-blue-50 hover:bg-blue-100 text-blue-700"}
        `}
        aria-label="Record"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill={recording ? "#dc2626" : "currentColor"}
          stroke="none"
        >
          <path d="M19 9a1 1 0 0 1 1 1a8 8 0 0 1 -6.999 7.938l-.001 2.062h3a1 1 0 0 1 0 2h-8a1 1 0 0 1 0 -2h3v-2.062a8 8 0 0 1 -7 -7.938a1 1 0 1 1 2 0a6 6 0 0 0 12 0a1 1 0 0 1 1 -1m-7 -8a4 4 0 0 1 4 4v5a4 4 0 1 1 -8 0v-5a4 4 0 0 1 4 -4"></path>
        </svg>
      </button>
      {/* Send Button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-all duration-200 disabled:opacity-50"
        aria-label="Send"
      >
        <Send className="w-5 h-5" />
      </button>
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
