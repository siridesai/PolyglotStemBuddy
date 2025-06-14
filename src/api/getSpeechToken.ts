export const getSpeechToken = async () => {
    const response = await fetch('/api/getSpeechToken');
    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw new Error('Invalid JSON in speech token response');
    }
    if (!response.ok) {
        throw new Error(data?.error || data || 'Failed to fetch speech token');
    }
    return { token: data.token, region: data.region };
};
