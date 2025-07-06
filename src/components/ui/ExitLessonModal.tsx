import React, { useEffect } from 'react';
import { getTranslation } from '../../data/translations';
import { appInsights } from '../../utils/appInsightsForReact.ts';

interface ExitLessonProps {
  onClose: () => void;
  onBack: () => void;
  settings: {
    age: 'Early Explorer' | 'Junior Scientist' | 'Teen Researcher';
    language: 'English' | 'Español' | 'हिंदी' | 'ಕನ್ನಡ' | 'मराठी';
  };
}

const FORM_BASE_URL = import.meta.env.VITE_FEEDBACK_FORM_BASE_URL;
const FIELD_LANGUAGE = import.meta.env.VITE_FEEDBACK_FORM_FIELD_LANGUAGE;
const FIELD_AGE_GROUP = import.meta.env.VITE_FEEDBACK_FORM_FIELD_AGE_GROUP;


// Value mappings
const VALUE_MAP = {
  age: {
    'Early Explorer': 'Early%20Explorer%20(Ages%205-8)',
    'Junior Scientist': 'Junior%20Scientist%20(Ages%209-12)',
    'Teen Researcher': 'Teen%20Researcher%20(Ages%2013-15)'
  },
  language: {
    'English': 'English%20(English)',
    'Español': 'Espa%C3%B1ol%20(Spanish)',
    'हिंदी': '%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A5%80%20(Hindi)',
    'ಕನ್ನಡ': '%E0%B2%95%E0%B2%A8%E0%B3%8D%E0%B2%A8%E0%B2%A1%20(Kannada)',
    'मराठी': '%E0%A4%AE%E0%A4%B0%E0%A4%BE%E0%A4%A0%E0%A5%80%20(Marathi)'
  }
};

const ExitLessonModal: React.FC<ExitLessonProps> = ({  onBack, settings }) => { 

  const formUrl = `${FORM_BASE_URL}&${FIELD_LANGUAGE}=%22${VALUE_MAP.language[settings.language]}%22&${FIELD_AGE_GROUP}=%22${VALUE_MAP.age[settings.age]}%22`;
  const exitLesson = getTranslation(settings.language, 'exitLesson');
  console.log(settings.language);
  console.log(exitLesson);

  // Log App Insights page usage
  useEffect(() => {
    if (appInsights) {
      appInsights.trackPageView({ name: 'ExitModal' });
    }
  }, []);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl p-6 sm:p-8 relative flex flex-col items-center">
        <iframe
            src={formUrl}
            frameBorder="0"
            marginWidth={0}
            marginHeight={0}
            style={{
              width: '100%',
              height: '85vh', 
              minHeight: 320,
              border: 'none',
              maxWidth: '100%',
              maxHeight: '100vh'
            }}
            allowFullScreen={true}
            title="Feedback Form"
        />
        
        <button
          onClick={onBack}
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-base font-semibold shadow hover:bg-indigo-700 transition"
        >
          {exitLesson}
        </button>
      </div>
    </div>
  );
};

export default ExitLessonModal;
