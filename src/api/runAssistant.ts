
export const runAssistant = async (
  message: string,
  threadId: string,
  age?: number,
  language: string = 'en',
  sessionId: string = '1234'
): Promise<{ result: string; runId: string }> => {
  try {
    const response = await fetch('/api/runAssistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, threadId, age, language, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();;
    return { result: data.result, runId: data.runId };
  } catch (error) {
    console.error('Error calling backend API:', error);
    throw error;
  }
};

export const cancelAssistant = async (
  threadId: string,
  runId: string
): Promise<{ success: boolean } | { error: string }> => {
  try {
    console.log("cancelling run for ", runId);
    const response = await fetch('/api/cancelAssistantRun', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ threadId, runId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling assistant run:', error);
    throw error;
  }
};
