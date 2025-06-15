interface Summary {
  title: string;
  summaryExplanation: string;
}

export const generateSummary = async (
  message: string,
  threadId: string,
  age: number,
  language: string = 'en',
  sessionId: string = '1234'
): Promise<Summary> => {
  try {
    const response = await fetch('/api/generateSummary', {
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
