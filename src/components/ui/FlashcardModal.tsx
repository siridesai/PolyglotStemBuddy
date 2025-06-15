import React, { useState } from 'react';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardModalProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ flashcards, onClose }) => {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg">
          <h3 className="text-xl font-bold mb-4">No flashcards available</h3>
          <button onClick={onClose} className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-base font-semibold shadow hover:bg-indigo-700 transition">Close</button>
        </div>
      </div>
    );
  }

  const handlePrev = () => {
    setFlipped(false);
    setCurrent((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
  };

  const handleNext = () => {
    setFlipped(false);
    setCurrent((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 relative flex flex-col items-center">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-indigo-600 text-2xl font-bold shadow transition"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        {/* Flashcard */}
        <div
          className="w-full max-w-xs sm:max-w-sm h-48 sm:h-56 perspective mb-8"
          onClick={() => setFlipped((f) => !f)}
          style={{ cursor: 'pointer' }}
        >
          <div className={`relative w-full h-full duration-500 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-indigo-100 rounded-xl text-lg sm:text-xl font-semibold text-center px-4 py-4 shadow-md">
              <span className="block w-full">{flashcards[current].question}</span>
            </div>
            {/* Back */}
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-indigo-100 rounded-xl text-lg sm:text-xl font-semibold text-center px-4 py-4 shadow-md transform rotate-y-180">
              <span className="block w-full">{flashcards[current].answer}</span>
            </div>
          </div>
        </div>
        {/* Controls */}
        <div className="flex justify-between items-center w-full max-w-xs sm:max-w-sm mt-2 gap-2">
          <button
            onClick={handlePrev}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-base font-medium transition w-1/3"
          >
            Prev
          </button>
          <span className="text-gray-600 text-base font-semibold w-1/3 text-center">{current + 1} / {flashcards.length}</span>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-base font-medium transition w-1/3"
          >
            Next
          </button>
        </div>
        <div className="mt-6 text-sm text-gray-500 text-center">Tap the card to flip</div>
      </div>
      {/* Inline styles for 3D flip */}
      <style>{`
        .perspective { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardModal;
