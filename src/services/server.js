import express from 'express';
import path from 'path';
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
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;  // Use environment variable for port

// Initialize assistants first
initializeAssistantClient();
initializeAssistant();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Session tracking
const sessionRunMap = new Map();

// API Routes (MUST COME BEFORE STATIC FILES)
app.post('/api/runAssistant', async (req, res) => {
    try {
        const { message, threadId, age, language, sessionId } = req.body;
        console.log("Session id:", sessionId);
        const { result, runId } = await runAssistantBackend(
            message,
            threadId,
            age,
            language,
            sessionId
        );
        sessionRunMap.set(sessionId, { threadId, runId });
        res.json({ result, runId });
    } catch (error) {
        console.error("Backend API error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Mount all routers under /api
app.use('/api', generateQuestionsRouter);
app.use('/api', deleteThreadRouter);
app.use('/api', threadIDRouter);
app.use('/api', getSpeechTokenRouter);
app.use('/api', generateSummaryRouter);
app.use('/api', cancelAssistantRunRouter);

// Static files (MUST COME AFTER API ROUTES)
app.use(express.static(path.join(__dirname, '../../dist')));

// SPA catch-all (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
