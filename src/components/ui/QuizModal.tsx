import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { getTranslation } from '../../data/translations';
import { ChildSettings, Message } from '../../types';
import { generateQuestions } from '../../api/generateQuestions';


interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizModalProps {
  onClose: (questions?: QuizQuestion[]) => void;
  settings: ChildSettings;
  threadId: string;
  userId: string;
  messages: Message[];
}

const QuizModal: React.FC<QuizModalProps> = ({ onClose, settings, threadId, userId, messages }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const hasGenerated = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  console.log("QuizModal mounted");

  useEffect(() => {
  console.log("QuizModal useEffect running");
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);

    let isMounted = true;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchQuestions = async () => {
      if (hasGenerated.current) return;
      hasGenerated.current = true;
      
      setIsLoading(true);
      setError(null);
      try {
        const contextForQuiz = messages.map(m => m.content).join('\n');
        const generatedQuestions = await generateQuestions(
          contextForQuiz,
          threadId,
          settings.age,
          settings.language,
          userId,
          { signal: abortController.signal } // Pass abort signal
        );
        if (isMounted) setQuestions(generatedQuestions);
        
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          setError('Failed to generate quiz');
          setError(getTranslation(settings.language, 'quizGenerationFailed') || 'Failed to generate quiz.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuestions();
    return () => {
      abortController.abort();
      hasGenerated.current = false;
    };
  }, [threadId, userId, settings.age, settings.language]);

  


  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-xl font-bold mb-4">
            {getTranslation(settings.language, 'generatingQuiz') || 'Generating your quiz...'}
          </h3>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-xl font-bold mb-4">{error}</h3>
          <Button onClick={() => onClose()} variant="primary">
            {getTranslation(settings.language, 'close') || 'Close'}
          </Button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center">
          <h3 className="text-xl font-bold mb-4">
            {getTranslation(settings.language, 'noQuestionsAvailable') || 'No questions available'}
          </h3>
          <Button onClick={() => onClose()} variant="primary">
            {getTranslation(settings.language, 'close') || 'Close'}
          </Button>
        </div>
      </div>
    );
  }

  // Quiz logic
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "Perfect score! You're amazing! 🌟";
    if (percentage >= 75) return "Great job! You've learned a lot! 🎉";
    if (percentage >= 50) return "Good effort! Keep learning! 📚";
    return "Keep practicing! You're getting better! 💪";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {quizComplete ? "Quiz Complete!" : `Question ${currentQuestion + 1} of ${questions.length}`}
            </h2>
            <button
              onClick={() => onClose(questions)}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors text-xl"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {!quizComplete ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-700 font-medium">
                {questions[currentQuestion].question}
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
                    {option}
                  </button>
                ))}
              </div>

              {showExplanation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800">
                    {questions[currentQuestion].explanation}
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
                    {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-gray-800">
                Your Score: {score}/{questions.length}
              </h3>
              <p className="text-lg text-gray-600">{getScoreMessage()}</p>
              <div className="pt-4">
                <Button onClick={() => onClose(questions)} variant="primary" size="large">
                  Continue Learning
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
