import React from 'react';

interface ExitLessonProps {
  onClose: () => void;
  onBack: () => void;
}

const ExitLessonModal: React.FC<ExitLessonProps> = ({ onClose, onBack }) => {
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
        <h3 className="text-xl font-bold mb-4">Feedback Survey</h3>
        <iframe
          width="640px"
          height="480px"
          src="https://forms.office.com/r/mDj6rK4F8S?embed=true"
          frameBorder="0"
          marginWidth={0}
          marginHeight={0}
          style={{ border: 'none', maxWidth: '100%', maxHeight: '100vh' }}
          allowFullScreen={true}
        />
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-base font-semibold shadow hover:bg-indigo-700 transition"
        >
          Exit Lesson
        </button>
      </div>
    </div>
  );
};

export default ExitLessonModal;
