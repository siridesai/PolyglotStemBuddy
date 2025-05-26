export const runAssistant = async (message: string, age?: number, language: string = 'en') => {
    try {
        const response = await fetch('/api/runAssistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, age, language }),
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