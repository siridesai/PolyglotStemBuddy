// Enhanced generateQuestions.ts
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
export const generateQuestions = async (
message: string, threadId: string, age: number, language: string = 'en', sessionId: string = '1234', p0: { signal: AbortSignal; }): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch('/api/generateQuestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        message: message,
        threadId: threadId,
        age: age.toString(),
        language
      }),
      signal: p0.signal
    });
    // Add validation
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error generating questions:', error);
    return []; // Return empty array as fallback
  }
};



