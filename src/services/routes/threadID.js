import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
import { getOrCreateThread } from '../threadManager.js';
const router = express.Router();

router.get('/threadId', (req, res) => {
  const sessionId = req.query.sessionId;
  
   getOrCreateThread(sessionId)
    .then(threadId => {
      res.json({ threadId });
    })
    .catch(error => {
      console.error("Error generating thread ID:", error);
      res.status(500).json({ error: 'Failed to generate thread ID.' });
    });
});

export default router;