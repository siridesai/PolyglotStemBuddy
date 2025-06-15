import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAssistantBackend } from './src/api/backend.js';
import { getOrCreateThread } from './src/api/backend.js';
import { getAssistantClient, initializeAssistantClient } from './src/assistantClient.js';
import { getAssistant, initializeAssistant } from './src/assistant.js';
import axios from 'axios';
import 'dotenv/config';

dotenv.config();
const app = express();
const port = 3000;
const speechKey = process.env.VITE_SPEECH_KEY;
const speechRegion = process.env.VITE_SPEECH_REGION;
const minQuestions = 2;
const maxQuestions = 5;

app.use(cors());
app.use(express.json());

const threadLocks = new Map(); 

app.post('/runAssistant', async (req, res) => {
    try {
        //const sessionId = req.sessionID;
        const {  message,threadId, age, language, sessionId} = req.body;
        console.log("Session id in server.js is: " + sessionId) ; 
        const result = await runAssistantBackend(message,threadId, age, language, sessionId);
        res.json({ result });
    } catch (error) {
        console.error("Backend API error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/generateQuestions', async (req, res) => {
  
  const threadId = req.body.threadId;
  const lockKey = `thread_${threadId}`;

  // Prevent concurrent requests for same thread
  if (threadLocks.has(lockKey)) {
    return res.status(429).json({ error: 'Quiz generation already in progress' });
  }
  threadLocks.set(lockKey, true);

  try {
    const { message, threadId, age, language } = req.body;
    
    if (!threadId || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const assistantClient = getAssistantClient();
    const assistant = getAssistant();

   

    // 2. Wait for cancellation completion
    let runsStillActive = true;
    while (runsStillActive) {
      const currentRuns = await assistantClient.beta.threads.runs.list(threadId, {
        status: ["queued", "in_progress", "requires_action"]
      });
      runsStillActive = currentRuns.data.length > 0;
      if (runsStillActive) await new Promise(r => setTimeout(r, 1000));
    }

     const runs = Array.isArray(runsStillActive?.data) ? runsStillActive.data : [];
     await Promise.all(
       runs.map(async (run) => {
         try {
           await assistantClient.beta.threads.runs.cancel(threadId, run.id);
         } catch (error) {
           if (!error.message.includes('Cannot cancel run with status')) {
             throw error;
           }
         }
       })
     );


    // 3. Create a run to generate quiz questions in the same thread
    const run = await assistantClient.beta.threads.runs.create(threadId, {
       assistant_id: assistant.id,
        model: assistant.model,
        tools: [],
        temperature: 0,
        instructions: ` **User Requirements**
        - Age group: ${age} years old
        - Language: ${language}
        - Context: ${message}
        
        **Response Rules**
        1. Based on the following passage, generate between ${minQuestions} and ${maxQuestions} multiple-choice questions that directly relate to and are EXCLUSIVELY ABOUT: "${message}"
        2. Use ${language} suitable for age ${age}
        3. Questions should be strictly age appropriate only relevant to ${age}.
        4. Include fun facts or interesting information related to the questions.
        5. Format response as: 
           [{
             question: "...", 
             options: ["...", "...", "...", "..."], 
             correctAnswer: 0-3, 
             explanation: "..."
           }]
        6. NO MARKDOWN FORMATTING - return only pure JSON
        7. No open-ended or "what's next" questions
        8. Questions must test understanding of core concepts
    `,
    tools: [{
        type: "code_interpreter" // Required for JSON parsing
    }],
    metadata: {
        age_optimization: age,
        language_constraints: `${language}-only`,
        strict_context: "enabled"
        
    }
    });

    // 4. Poll for run completion
    let runStatus;
    do {
       await new Promise(r => setTimeout(r, 1500));
      runStatus = await assistantClient.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status === 'queued' || runStatus.status === 'in_progress');

    // 5. Process results
    if (runStatus.status === 'failed') {
      return res.status(500).json({ error: 'Quiz generation failed' });
    }

    const messages = await assistantClient.beta.threads.messages.list(threadId);

    // 5. Retrieve the assistant's response message
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data
      .filter(m => m.run_id === run.id && m.role === 'assistant')
      .pop();

    let quizQuestions = [];
    if (lastMessage) {
      try {
        const content = lastMessage.content[0]?.text?.value || '';
        quizQuestions = JSON.parse(content);
      } catch (err) {
        return res.status(500).json({ error: 'Failed to parse quiz JSON.' });
      }
    }

    return res.json({ result: quizQuestions });
  } catch (error) {
    console.error('Error in /generateQuestions:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    threadLocks.delete(lockKey);
  }
});


app.delete('/deleteThread/:threadId', async (req, res) => {

  const { threadId } = req.params;
  try {
    const assistantClient = getAssistantClient();
    console.log('Deleting thread for Thread ID:', threadId);
    await assistantClient.beta.threads.del(threadId);
    console.log('Thread deleted successfully');
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  // Generate new thread ID if none exists
app.get('/threadId', (req, res) => {
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

initializeAssistantClient();
initializeAssistant();

console.log("Initialization complete");

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/getSpeechToken', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});