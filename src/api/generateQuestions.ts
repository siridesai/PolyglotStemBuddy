// Enhanced generateQuestions.ts
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Helper functions
const getAgeGroup = (age: number) => {
  if (age <= 8) return 'basic';
  if (age <= 12) return 'intermediate';
  return 'advanced';
};
export const generateQuestions = async (
  message: string,
  age?: number,
  language: string = 'en',
  sessionId: string = '1234'
): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch('/api/generateQuestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        context: message,
        ageGroup: getAgeGroup(age || 7),
        language
      }),
    });

    // Add validation
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error generating questions:', error);
    return []; // Return empty array as fallback
  }
};



