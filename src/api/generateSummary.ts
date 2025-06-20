interface Summary {
  title: string;
  summaryExplanation: string;
}

export const generateSummary = async (
  message: string,
  threadId: string,
  age: number,
  language: string = 'en',
  sessionId: string = '1234',
  signal?: AbortSignal // Add abort signal
): Promise<Summary> => {
  try {
    const response = await fetch('/api/generateSummary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, threadId, age, language, sessionId }),
      signal // Pass to fetch
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Summary = await response.json();
    return data;

  } catch (error) {
    console.error('Error generating summary:', error);
    const errorSummary: Summary = {
        title: "",
        summaryExplanation: ""
    }
    return errorSummary; // Return empty string as fallback
  }
};
