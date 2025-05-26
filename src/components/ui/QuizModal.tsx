import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import { getTranslation } from '../../data/translations';
import { ChildSettings } from '../../types';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizModalProps {
  onClose: () => void;
  settings: ChildSettings;
  topic: string;
}

const QuizModal: React.FC<QuizModalProps> = ({ onClose, settings, topic }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const getAgeAppropriateQuestions = (age: number, topic: string): QuizQuestion[] => {
    if (age <= 8) {
      return [
        {
          question: `What do you see when light passes through water droplets in the sky?`,
          options: ['A rainbow', 'A cloud', 'The sun', 'The moon'],
          correctAnswer: 0,
          explanation: 'When sunlight passes through water droplets, it splits into different colors, creating a beautiful rainbow!'
        },
        {
          question: 'Which color is at the top of a rainbow?',
          options: ['Red', 'Blue', 'Green', 'Yellow'],
          correctAnswer: 0,
          explanation: 'Red is always at the top of a rainbow, followed by orange, yellow, green, blue, and violet.'
        }
      ];
    } else if (age <= 12) {
      return [
        {
          question: 'What causes the different colors in a rainbow?',
          options: [
            'Light refraction and reflection',
            'Clouds painting the sky',
            'The wind blowing colors',
            'The sun heating the air'
          ],
          correctAnswer: 0,
          explanation: 'When light enters a water droplet, it bends (refracts) and reflects, splitting into different wavelengths that we see as colors.'
        },
        {
          question: 'Which color has the longest wavelength?',
          options: ['Red', 'Green', 'Blue', 'Violet'],
          correctAnswer: 0,
          explanation: 'Red light has the longest wavelength of visible light, which is why it bends the least and appears at the top of a rainbow.'
        }
      ];
    } else {
      return [
        {
          question: 'What is the relationship between a light wave\'s frequency and its wavelength?',
          options: [
            'They are inversely proportional',
            'They are directly proportional',
            'They have no relationship',
            'They are always equal'
          ],
          correctAnswer: 0,
          explanation: 'As frequency increases, wavelength decreases, and vice versa. This inverse relationship is key to understanding light behavior.'
        },
        {
          question: 'Why do we see white light as white?',
          options: [
            'It contains all visible wavelengths',
            'It has no wavelength',
            'It has the shortest wavelength',
            'It has the longest wavelength'
          ],
          correctAnswer: 0,
          explanation: 'White light contains all visible wavelengths of light. When all these colors combine, our eyes perceive it as white.'
        }
      ];
    }
  };

  const questions = getAgeAppropriateQuestions(settings.age, topic);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
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
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                <Button onClick={onClose} variant="primary" size="large">
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