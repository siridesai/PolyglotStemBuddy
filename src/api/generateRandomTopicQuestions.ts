

export const generateRandomTopicQuestions = async function generateRandomTopicQuestions(
  topic: string, 
  threadId: string,
  age: number,
  language: string = 'en',
  sessionId: string = '1234'
): Promise<string[]> {
   console.log(topic);
  const response = await fetch('/api/generateRandomTopicQuestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, threadId, age, language, sessionId })
  });
  const data  = await response.json();

  return (data && Array.isArray(data.topicQuestions))
    ? data.topicQuestions
    : [];
};
