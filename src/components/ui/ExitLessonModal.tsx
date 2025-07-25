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


const VALUE_MAP = {
  age: {
    'Early Explorer': '%22Early%20Explorer%20(Ages%205-8)%22',
    'Junior Scientist': '%22Junior%20Scientist%20(Ages%209-12)%22',
    'Teen Researcher': '%22Teen%20Researcher%20(Ages%2013-15)%22'
  },
  language: {
    'English': '%22English%20(English)%22',
    'Español': '%22Espa%C3%B1ol%20(Spanish)%22',
    'हिंदी': '%22%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A5%80%20(Hindi)%22',
    'ಕನ್ನಡ': '%22%E0%B2%95%E0%B2%A8%E0%B3%8D%E0%B2%A8%E0%B2%A1%20(Kannada)%22',
    'मराठी': '%22%E0%A4%AE%E0%A4%B0%E0%A4%BE%E0%A4%A0%E0%A5%80%20(Marathi)%22'
  }
};

const ExitLessonModal: React.FC<ExitLessonProps> = ({  onBack, settings }) => { 

  const formUrl = `${FORM_BASE_URL}&${FIELD_LANGUAGE}=${VALUE_MAP.language[settings.language]}&${FIELD_AGE_GROUP}=${VALUE_MAP.age[settings.age]}`;
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
