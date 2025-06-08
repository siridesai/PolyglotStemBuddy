

export const deleteThread = async (threadId: string) => {
  try {
      console.log('Deleting current thread');
      await fetch(`/api/deleteThread/${threadId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Failed to delete thread:', error);
  }
};