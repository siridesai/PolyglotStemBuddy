import React, { useState, useEffect, useRef} from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { getTranslation } from '../../data/translations';
import { ChildSettings, Message } from '../../utils/assistantMessageType.ts';
import { generateQuestions } from '../../api/generateQuestions';
import { appInsights } from '../../utils/appInsightsForReact.ts';
import LatexRender from './LatexCodeRender.tsx';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizModalProps {
  onClose: () => void;
  settings: ChildSettings;
  messages: Message[];
  threadId: string;
  cookie: string;
}

const QuizModal: React.FC<QuizModalProps> = ({
  onClose,
  settings,
  messages,
  threadId,
  cookie,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const contextString = messages
  .filter(m => m.type === 'assistant')
  .map(m => m.content)
  .join('\n\n');

  // Fetch questions when modal opens or dependencies change
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    setLoading(true);
    setError(null);
    generateQuestions(
      messages,
      threadId,
      settings.age,
      settings.language,
      cookie
    )
      .then((qs) => {
        if (!qs || !Array.isArray(qs) || qs.length === 0) {
          getTranslation(settings.language,'noQuestionsAvailable');
          setQuestions([]);
        } else {
          setQuestions(qs);
        }
        setLoading(false);
      })
      .catch(() => {
        getTranslation(settings.language,'noQuestionsAvailable');
        setLoading(false);
      });
  }, [messages, threadId, settings.age, settings.language, cookie]);

  // Log App Insights page usage
  useEffect(() => {
    if (appInsights) {
      appInsights.trackPageView({ name: 'QuizModal' });
    }
  }, );


  // Reset quiz state when new questions are loaded
  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  }, [questions]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    if (
      questions &&
      answerIndex === questions[currentQuestion].correctAnswer
    ) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (questions && currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const getScoreMessage = () => {
    if (!questions || questions.length === 0) return '';
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return getTranslation(settings.language, 'perfectScore');
    if (percentage >= 75) return getTranslation(settings.language, 'greatJob');
    if (percentage >= 50) return getTranslation(settings.language, 'goodEffort');
    return getTranslation(settings.language, 'keepPracticing');
  };

  // UI RENDERING

    // --- INSERTED LOADING SCREEN ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">
            {getTranslation(settings.language, 'readyForQuiz') || 'Generating quiz...'}
          </p>
        </div>
      </div>
    );
  }
  // --- END LOADING SCREEN ---

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-xl font-bold mb-4">{getTranslation(settings.language, 'error') || 'Error'}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onClose} variant="primary">
            {getTranslation(settings.language, 'close') || 'Close'}
          </Button>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-xl font-bold mb-4">{getTranslation(settings.language,'noQuestionsAvailable')}</h3>
          <p className="text-gray-600 mb-4">{getTranslation(settings.language,'completeLesson')}</p>
          <Button onClick={onClose} variant="primary">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {quizComplete
                ? getTranslation(settings.language, 'quizComplete')
                : `${getTranslation(settings.language, 'question')} ${currentQuestion + 1} ${getTranslation(settings.language, 'of')}  ${questions.length}`}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {!quizComplete ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 font-medium">
                <LatexRender content={questions[currentQuestion].question} />
              </p>

              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedAnswer === null
                        ? 'hover:bg-indigo-50 border-2 border-gray-200'
                        : index === questions[currentQuestion].correctAnswer
                        ? 'bg-green-50 border-2 border-green-500'
                        : selectedAnswer === index
                        ? 'bg-red-50 border-2 border-red-500'
                        : 'border-2 border-gray-200'
                    }`}
                  >
                  <LatexRender content={option} />
                  </button>
                ))}
              </div>

              {showExplanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800">
                    <LatexRender content={questions[currentQuestion].explanation} />
                  </p>
                </div>
              )}

              {selectedAnswer !== null && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleNextQuestion}
                    variant="primary"
                    size="medium"
                  >
                    {currentQuestion < questions.length - 1
                      ? getTranslation(settings.language, 'nextQuestion')
                      : getTranslation(settings.language, 'finishQuiz')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-gray-800">
                {getTranslation(settings.language, 'yourScore')}: {score}/{questions.length}
              </h3>
              <p className="text-lg text-gray-600">{getScoreMessage()}</p>
              <div className="pt-4">
                <Button onClick={onClose} variant="primary" size="large">
                  {getTranslation(settings.language,'continueLearning')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
