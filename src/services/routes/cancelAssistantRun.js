import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
const router = express.Router();

router.post('/cancelAssistantRun', async (req, res) => {
  const { threadId, runId, sessionId } = req.body;
  
  try {
    const assistantsClient = getAssistantClient();
    
    // 1. Check if run exists and is cancellable
    let runStatus;
    try {
      runStatus = await assistantsClient.beta.threads.runs.retrieve(threadId, runId);
    } catch (err) {
      return res.json({ 
        success: true, 
        message: 'Run not found - already completed or expired' 
      });
    }

    // 2. Only cancel if run is active
    if (['queued', 'in_progress', 'requires_action'].includes(runStatus.status)) {
      await assistantsClient.beta.threads.runs.cancel(threadId, runId);
    }
    
    // 3. Always clear from session map
    sessionRunMap.delete(sessionId);
    
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;