

export const generateRandomTopicQuestions = async function generateRandomTopicQuestions(
  topic: string, 
  threadId: string,
  age: number,
  language: string = 'en',
  sessionId: string = '1234'
): Promise<string[]> {
  const response = await fetch('/api/generateRandomTopicQuestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, threadId, age, language, sessionId })
  });
  const data  = await response.json();
  return (data && data.topics && Array.isArray(data.topics.topicQuestions))
    ? data.topics.topicQuestions
    : [];
};
