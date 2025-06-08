
export const fetchThreadID = async (sessionId: string) => {
  try {
    const res = await fetch(`/api/threadId?sessionId=${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch thread ID');
    const data = await res.json();
    return data.threadId;
  } catch (error) {
    console.error('Failed to fetch thread ID:', error);
  }
  return null; // Return null if fetching fails
};


