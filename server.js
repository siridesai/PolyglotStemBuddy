import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAssistantBackend } from './src/api/backend.js';
import { initializeAssistantClient } from './src/assistantClient.js';
import { initializeAssistant } from './src/assistant.js';



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


initializeAssistantClient();
initializeAssistant();

console.log("Initialization complete") ;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});