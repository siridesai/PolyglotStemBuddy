export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mermaidCode?: string; 
}

// Enhanced generateQuestions.ts
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
export const generateQuestions = async (
  message: Message[],
  threadId: string,
  age: number,
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
          message,
          threadId,
          age,
          language
        }),
      });
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
};




