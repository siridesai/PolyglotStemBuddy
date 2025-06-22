import React, { useState, useEffect } from 'react';
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

  // Fetch questions when modal opens or dependencies change
  useEffect(() => {
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
          setError('No questions available. Try completing a lesson first!');
          setQuestions([]);
        } else {
          setQuestions(qs);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load quiz questions.');
        setLoading(false);
      });
  }, [messages, threadId, settings.age, settings.language, cookie]);

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
    if (percentage === 100) return "Perfect score! You're amazing! 🌟";
    if (percentage >= 75) return "Great job! You've learned a lot! 🎉";
    if (percentage >= 50) return "Good effort! Keep learning! 📚";
    return "Keep practicing! You're getting better! 💪";
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
                ? "Quiz Complete!"
                : `Question ${currentQuestion + 1} of ${questions.length}`}
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
                    {currentQuestion < questions.length - 1
                      ? 'Next Question'
                      : 'Finish Quiz'}
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
