// --- You may need to import these from your data files ---
import { getTranslation } from '../data/translations';
import { availableLanguages } from '../data/languages.ts';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import { Message, ChildSettings } from './assistantMessageType';
import { getTokenOrRefresh } from './speechTokenUtils';
import { removeMermaidCode } from './mermaidCodeUtils.ts';
import { appInsights } from './appInsightsForReact.ts'; // Adjust the path as needed

// Utility: Clean LaTeX for TTS (removes math delimiters, subscripts, arrows, etc.)
export function cleanLaTeXForTTS(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/_({)?(\d+)(})?/g, '$2')
    .replace(/\\rightarrow|→/g, ' goes to ')
    .replace(/\\ /g, ' ')
    .replace(/\\text\s*{([^}]*)}/g, '$1')
    .replace(/[{}]/g, '');
}

// Utility: Get the age group label based on age and language
export function getAgeGroupLabel(age: number, language: string = 'en'): string {
  if (age >= 5 && age <= 8) return getTranslation(language, 'earlyExplorer');
  if (age >= 9 && age <= 12) return getTranslation(language, 'juniorScientist');
  return getTranslation(language, 'teenResearcher');
}

// Utility: Get the native name of the current language
export function getCurrentLanguageName(language: string): string {
  const languageObj = availableLanguages.find(lang => lang.code === language);
  return languageObj ? languageObj.nativeName : language;
}

// Utility: Create SSML markup for TTS
export function createSSML(text: string, lang: string, voice: string): string {
  return `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
      <voice name="${voice}">${text}</voice>
    </speak>
  `;
}

// Map language code to recommended neural voice
export const voiceMap: Record<string, string> = {
  "hi-IN": "hi-IN-SwaraNeural",
  "mr-IN": "mr-IN-AarohiNeural",
  "kn-IN": "kn-IN-SapnaNeural",
  "en-US": "en-US-JennyNeural",
  "es-ES": "es-ES-ElviraNeural",
};

// Utility: Find the correct TTS language code
export function findRightLanguageForTTS(langGiven: string): string {
  if (langGiven === 'es') return 'es-ES';
  if (langGiven === 'hi') return 'hi-IN';
  if (langGiven === 'kn') return 'kn-IN';
  if (langGiven === 'mr') return 'mr-IN';
  return 'en-US';
}

export function extractMainAndQuestions(text: string) {
  const pattern = /```followUpQuestions\s*([\s\S]*?)```/g;
  const questions: string[] = [];

  // Extract all followUpQuestions blocks
  let match;
  while ((match = pattern.exec(text)) !== null) {
    // Split block into lines, strip numbering, and trim
    const qs = match[1]
      .split('\n')
      .map(q => q.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    questions.push(...qs);
  }

  // Remove all followUpQuestions blocks from main text
  const main = text.replace(pattern, '').trim();
  return {
    main,
    questions,
  };
}

// Utility: Insert SSML breaks after chemical equations in text
export function insertBreaksAfterEquations(text: string): string {
  // Matches full chemical equations (multiple terms with +, →, =, etc.)
  const equationPattern = /((?:\d*[A-Z][a-z]?\d*(?:\([^)]*\))?\s*[+\-=→⇌]\s*)+(?:\d*[A-Z][a-z]?\d*(?:\([^)]*\))?)+)/g;
  return text.replace(equationPattern, (equation) => `${equation}<break time="500ms"/>`);
}


export function hasUserStartedConversation(messages: Message[], welcomeMessage: string): boolean {
  const normalizedWelcome = welcomeMessage.trim().toLowerCase();
  const hasUser = messages.some(
    m =>
      m.type === 'user' &&
      m.content.trim().toLowerCase() !== normalizedWelcome
  );
  const hasAssistant = messages.some(
    m =>
      m.type === 'assistant' &&
      m.content.trim().toLowerCase() !== normalizedWelcome
  );
  return hasUser && hasAssistant;
}

export function sanitizeText(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')         // Replace non-breaking spaces
    .replace(/&nbsp;/g, ' ')         // Replace HTML-encoded NBSP
    .replace(/\s+/g, ' ')            // Collapse multiple spaces/tabs/newlines
    .trim();
}

export async function sttFromMic(
  setRecording: (rec: boolean) => void,
  setInput: (input: string) => void,
  handleSend: () => void,
  settings: ChildSettings
) {
  setRecording(true);
  const tokenObj = await getTokenOrRefresh();
  const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);

  if (settings.language === 'es') speechConfig.speechRecognitionLanguage = 'es-ES';
  else if (settings.language === 'hi') speechConfig.speechRecognitionLanguage = 'hi-IN';
  else if (settings.language === 'kn') speechConfig.speechRecognitionLanguage = 'kn-IN';
  else if (settings.language === 'mr') speechConfig.speechRecognitionLanguage = 'mr-IN';
  else speechConfig.speechRecognitionLanguage = 'en-US';

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizeOnceAsync((result: { reason: ResultReason; text: any; }) => {
    setRecording(false);
    if (result.reason === ResultReason.RecognizedSpeech) {
      setInput(result.text);
      handleSend();
    } else {
      console.log(`ERROR: ${result.reason}`);
    }
 
  // Track the event
  if (appInsights) {
    appInsights.trackEvent({
      name: 'SpeechToTextUsed',
      properties: {
        language: settings.language,
        ageGroup: settings.age
      }
    });
  }
    
  });
}

export async function textToSpeech(
  text: string,
  lang: string,
  playerRef: React.MutableRefObject<SpeechSDK.SpeakerAudioDestination | null>,
  synthesizerRef: React.MutableRefObject<SpeechSDK.SpeechSynthesizer | null>,
  ttsStatus: string,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  currentTTS: string | null,
  setCurrentTTS: (content: string | null) => void,
  stopCurrentPlayback: () => void,
  handleSynthesisComplete: () => void,
  handleSynthesisError: (error: any) => void
) {
  const noMermaid = removeMermaidCode(text);
  const cleanLaTeX = cleanLaTeXForTTS(noMermaid);
  const cleanedText = cleanLaTeX.replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{M}\+\-=]/gu, '');

  // Handle same-text playback control
  if (currentTTS === cleanedText && playerRef.current) {
    switch (ttsStatus) {
      case 'playing':
        playerRef.current.pause();
        setTtsStatus('paused');
        return;
      case 'paused':
        playerRef.current.resume();
        setTtsStatus('playing');
        return;
    }
  }

  stopCurrentPlayback();
  setCurrentTTS(cleanedText);
  setTtsStatus('playing');

  // Track the event
  if (appInsights) {
    appInsights.trackEvent({
      name: 'TextToSpeechUsed',
      properties: {
        language: lang
      }
    });
  }  

  try {
    const tokenObj = await getTokenOrRefresh();
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
    speechConfig.speechSynthesisLanguage = lang;
    speechConfig.speechSynthesisVoiceName = voiceMap[lang];

    const myPlayer = new SpeechSDK.SpeakerAudioDestination();
    playerRef.current = myPlayer;
    const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(myPlayer);
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    synthesizerRef.current = synthesizer;

    setTtsStatus('playing');
    const ssml = createSSML(cleanedText, lang, voiceMap[lang]);

    synthesizer.speakSsmlAsync(
      ssml,
      () => handleSynthesisComplete(),
      (error) => handleSynthesisError(error)
    );
  } catch (error) {
    handleSynthesisError(error);
  }
}

export async function textToSpeechWithHtmlAudio(
  text: string,
  lang: string,
  audioRef: React.RefObject<HTMLAudioElement>,
  synthesizerRef: React.MutableRefObject<SpeechSDK.SpeechSynthesizer | null>,
  ttsStatus: string,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  currentTTS: string | null,
  setCurrentTTS: (content: string | null) => void,
  stopCurrentPlayback: () => void,
  handleSynthesisComplete: () => void,
  handleSynthesisError: (error: any) => void
) {
  const noMermaid = removeMermaidCode(text);
  const cleanLaTeX = cleanLaTeXForTTS(noMermaid);
  const cleanedText = cleanLaTeX.replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{M}\+\-=]/gu, '');

  // Handle same-text playback toggle
  if (currentTTS === cleanedText && audioRef.current) {
    switch (ttsStatus) {
      case 'playing':
        audioRef.current.pause();
        setTtsStatus('paused');
        return;
      case 'paused':
        audioRef.current.play();
        setTtsStatus('playing');
        return;
    }
  }

  // Stop any current playback
  stopCurrentPlayback();
  setCurrentTTS(cleanedText);
  setTtsStatus('playing');

  // Track usage
  if (appInsights) {
    appInsights.trackEvent({
      name: 'TextToSpeechUsed',
      properties: { language: lang }
    });
  }

  try {
    const tokenObj = await getTokenOrRefresh();
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      tokenObj.authToken,
      tokenObj.region
    );
    speechConfig.speechSynthesisLanguage = lang;
    speechConfig.speechSynthesisVoiceName = voiceMap[lang];

    // Set audio format suitable for browser playback
    speechConfig.speechSynthesisOutputFormat =
      SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Use SSML
    const ssml = createSSML(cleanedText, lang, voiceMap[lang]);

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
    synthesizerRef.current = synthesizer;

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          const audioData = result.audioData;
          const blob = new Blob([audioData], { type: 'audio/mpeg' });
          if (blob.size === 0) {
            handleSynthesisError(new Error("Synthesized audio data is empty."));
            setTtsStatus('idle');
            return;
          }
          const audioUrl = URL.createObjectURL(blob);

          const audio = audioRef.current;
          if (audio) {
            audio.src = audioUrl;
            audio.onended = () => {
              if (audioUrl) URL.revokeObjectURL(audioUrl);
              handleSynthesisComplete();
              setTtsStatus('idle');
              setCurrentTTS(null);
            };
            audio.onerror = (e) => { 
              if (audio.src === "" || audio.src !== audioUrl) {
                // Likely triggered by cleanup/reset, safe to ignore
                return;
              }
              if (audio.src === audioUrl) {
                URL.revokeObjectURL(audioUrl);
              }
              audio.pause();
              audio.load();
              audio.removeAttribute('src');
              const error = audio.error;
              if (error) {
                const code = error.code;
                const message = {
                  1: "MEDIA_ERR_ABORTED: Playback was aborted.",
                  2: "MEDIA_ERR_NETWORK: A network error occurred.",
                  3: "MEDIA_ERR_DECODE: Audio decoding failed.",
                  4: "MEDIA_ERR_SRC_NOT_SUPPORTED: Unsupported format or missing source.",
                }[code] || "Unknown audio error";

                console.error("TTS Error:", message, error);
                handleSynthesisError(new Error(message));
              } else {
                handleSynthesisError(new Error("Unknown audio playback error"));
              }
              setTtsStatus('idle');
            };

            audio.play().catch(error => {
              audio.pause();
              audio.removeAttribute('src');
              audio.load();

              if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
              }
              handleSynthesisError(error);
              setTtsStatus('idle');
            });
          }
        } else {
          handleSynthesisError(result.errorDetails);
          setTtsStatus('idle');
        }

        synthesizer.close();
        synthesizerRef.current = null;
      },
      (error) => {
        handleSynthesisError(error);
        setTtsStatus('idle');
        synthesizer.close();
        synthesizerRef.current = null;
      }
    );
  } catch (error) {
    handleSynthesisError(error);
    setTtsStatus('idle');
  }
}



export function stopCurrentPlayback(
  playerRef: React.MutableRefObject<SpeechSDK.SpeakerAudioDestination | null>,
  synthesizerRef: React.MutableRefObject<SpeechSDK.SpeechSynthesizer | null>,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  setCurrentTTS: (content: string | null) => void
) {
  if (playerRef.current && typeof playerRef.current.pause === 'function') {
    try { playerRef.current.pause(); } catch {}
    playerRef.current = null;
  }
  if (synthesizerRef.current) {
    try { synthesizerRef.current.close(); } catch {}
    synthesizerRef.current = null;
  }
  setTtsStatus('idle');
  setCurrentTTS(null);
}
export function handleSynthesisComplete(
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  setCurrentTTS: (content: string | null) => void
) {
  setTtsStatus('idle');
  setCurrentTTS(null);
}

export function stopCurrentPlaybackWithAudio(
  audioRef: React.RefObject<HTMLAudioElement>,
  synthesizerRef: React.MutableRefObject<SpeechSDK.SpeechSynthesizer | null>,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  setCurrentTTS: (content: string | null) => void
) {
  if (audioRef.current) {
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    } catch {}
  }

  if (synthesizerRef.current) {
    try {
      synthesizerRef.current.close();
    } catch {}
    synthesizerRef.current = null;
  }

  setTtsStatus('idle');
  setCurrentTTS(null);
}

export const cleanupTTSWithAudio = (
  audioRef: React.RefObject<HTMLAudioElement>,
  synthesizerRef: React.MutableRefObject<SpeechSDK.SpeechSynthesizer | null>,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  setCurrentTTS: (content: string | null) => void
) => {
  if (audioRef.current) {
    try {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.currentTime = 0;
    } catch {}
  }

  if (synthesizerRef.current) {
    try {
      synthesizerRef.current.close();
    } catch {}
    synthesizerRef.current = null;
  }

  setTtsStatus('idle');
  setCurrentTTS(null);
};
export function handleSynthesisError(
  error: any,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void
) {
  console.error('TTS Error:', error);
  setTtsStatus('idle');
}


export function cleanupTTS(
  playerRef: React.MutableRefObject<any>,
  synthesizerRef: React.MutableRefObject<any>,
  setTtsStatus: (status: 'idle' | 'playing' | 'paused') => void,
  setCurrentTTS: (content: string | null) => void
) {
  if (playerRef.current && typeof playerRef.current.pause === 'function') {
    try { playerRef.current.pause(); } catch {}
    playerRef.current = null;
  }
  if (synthesizerRef.current) {
    try { synthesizerRef.current.close(); } catch {}
    synthesizerRef.current = null;
  }
  setTtsStatus('idle');
  setCurrentTTS(null);
}

