import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
import { emitEvent } from '../../utils/appInsights.js'

const router = express.Router();

router.delete('/deleteThread/:threadId', async (req, res) => {
  const { threadId } = req.params;
  try {
    const assistantClient = getAssistantClient();
    console.log('Deleting thread for Thread ID:', threadId);
    await assistantClient.beta.threads.del(threadId);
    console.log('Thread deleted successfully');
    emitEvent(
      "ThreadDeleteEvent",
      {
        p_threadId: threadId,
        p_status: "success",
      }
    )
    res.status(200).json({ success: true });
  } catch (error) {
    emitEvent(
      "ThreadDeleteEvent",
      {
        p_threadId: threadId,
        p_status: "failure"
      }
    )
    res.status(500).json({ error: error.message });
  }
});

export default router;