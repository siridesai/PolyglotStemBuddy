export const runAssistant = async (message: string, age?: number, language: string = 'en', sessionId: string ='1234') => {
    try {
        console.log("session id in runAssistant.ts is: " + sessionId);
        const response = await fetch('/api/runAssistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, age, language, sessionId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error calling backend API:', error);
        throw error;
    }
};