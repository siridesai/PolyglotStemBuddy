import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAssistantBackend } from './src/api/backend.js';
import { getOrCreateThread } from './src/api/backend.js';
import { getAssistantClient, initializeAssistantClient } from './src/assistantClient.js';
import { getAssistant, initializeAssistant } from './src/assistant.js';



dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/runAssistant', async (req, res) => {
    try {
        //const sessionId = req.sessionID;
        const { message, age, language, sessionId } = req.body;
        console.log("Session id in server.js is: " + sessionId) ; 
        const result = await runAssistantBackend(message, age, language, sessionId);
        res.json({ result });
    } catch (error) {
        console.error("Backend API error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/generateQuestions', async (req, res) => {
  try {
    const { context, language } = req.body;
    if (!context || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const assistantClient = getAssistantClient();
    const assistant = getAssistant();
    const sessionId = req.headers['x-session-id'];

    const threadID = await getOrCreateThread(sessionId) ;
     // Start a run on the existing thread using your assistant
    const run = await assistantClient.beta.threads.runs.create(
       threadID,
       {
        assistant_id: assistant.id,
        model: assistant.model,
        tools: [],
        instructions: `Generate 3 multiple-choice quiz questions for a young learner in ${language} based on ${context}. Format as JSON: [{question: "...", options: ["..."], correctAnswer: 0, explanation: "..."}]. Return only a JSON array, do not include any Markdown code blocks or triple backticks.`
      });
   
    // Poll for run completion (simplified example)
    let runStatus = await assistantClient.beta.threads.runs.retrieve(run.thread_id, run.id);
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
      await new Promise(r => setTimeout(r, 1000));
      runStatus = await assistantClient.beta.threads.runs.retrieve(run.thread_id, run.id);
    }
    if (runStatus.status === 'failed') {
      throw new Error('Assistant run failed');
    }

    // Get the assistant's response message(s)
    const messages = await assistantClient.beta.threads.messages.list(run.thread_id);
    // Find the latest assistant message
    const assistantMsg = messages.data.find(m => m.role === 'assistant');
    // Parse the content as JSON
    const questions = JSON.parse(assistantMsg.content[0].text.value);

    res.json({ result: questions });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});



initializeAssistantClient();
initializeAssistant();

console.log("Initialization complete") ;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});