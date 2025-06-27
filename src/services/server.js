import express from 'express';
import generateQuestionsRouter from './routes/generateQuestions.js';
import generateSummaryRouter from './routes/generateSummary.js';
import cancelAssistantRunRouter from './routes/cancelAssistantRun.js';
import getSpeechTokenRouter from './routes/getSpeechToken.js';
import deleteThreadRouter from './routes/deleteThread.js';
import threadIDRouter from './routes/threadID.js';

import cors from 'cors';
import dotenv from 'dotenv';
import { runAssistantBackend } from '../services/runAssistant.js';
import { getOrCreateThread } from '../services/threadManager.js';
import { getAssistantClient, initializeAssistantClient } from '../services/assistantClient.js';
import { getAssistant, initializeAssistant } from '../services/assistant.js';
import axios from 'axios';
import 'dotenv/config';

dotenv.config();
const app = express();
const port = 3000;
const speechKey = process.env.VITE_SPEECH_KEY;
const speechRegion = process.env.VITE_SPEECH_REGION;

const POLL_INTERVAL = 3000;  // Reduced polling frequency
const RUN_TIMEOUT = 30000;    // 30s timeout (down from 60s)
const MAX_MESSAGE_LENGTH = 1500;  // Truncate long messages

app.use(cors());
app.use(express.json());

const sessionRunMap = new Map();

app.post('/runAssistant', async (req, res) => {
    try {
        const { message, threadId, age, language, sessionId } = req.body;
        console.log("Session id in server.js is: " + sessionId);
        const { result, runId } = await runAssistantBackend(
            message,
            threadId,
            age,
            language,
            sessionId
        );
        sessionRunMap.set(sessionId, { threadId, runId });
        
        res.json({ result, runId }); // Return both values
    } catch (error) {
        console.error("Backend API error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.use('/', generateQuestionsRouter);

app.use('/', deleteThreadRouter);

// Generate new thread ID if none exists
app.use('/', threadIDRouter);

initializeAssistantClient();
initializeAssistant();

app.use('/', getSpeechTokenRouter);

app.use('/', generateSummaryRouter);

app.use('/', cancelAssistantRunRouter);

console.log("Initialization complete");

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


