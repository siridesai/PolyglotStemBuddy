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

app.use(cors());
app.use(express.json());

const sessionRunMap = new Map();

app.post('/runAssistant', async (req, res) => {
    try {
        const { message, threadId, age, language, sessionId } = req.body;
        console.log("Session id in server.js is: " + sessionId);
        
        
        // Modify runAssistantBackend to return both result and runId
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

app.post('/generateQuestions', async (req, res) => {
  try {
    const { message, threadId, age, language } = req.body;

    if (!threadId || !language) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const assistantClient = getAssistantClient();
    const assistant = getAssistant(); // <-- Get the assistant object
    const contextString = message.map(m => m.content).join('\n\n');


    // 3. Create a run to generate quiz questions in the same thread
    const run = await assistantClient.beta.threads.runs.create(threadId, {
       assistant_id: assistant.id,
        model: assistant.model,
        temperature: 0.1,
        instructions: ` **User Requirements**
        - Age group: ${age} years old
        - Language: ${language}
        - Context: ${contextString}
        
        **Response Rules**
        1. Create 3 multiple-choice questions that directly relate to and are EXCLUSIVELY ABOUT ALL OF: "${contextString}". The questions **cannot** be subjective; for example, do not ask any questions like, "What's your favorite color?". Ensure that the questions generated are not the same as the ones that are asked by the chatbot in ${contextString}. **
        2. Use ${language} suitable for age ${age}.
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
    `,
    tools: [{
        type: "code_interpreter" // Required for JSON parsing
    }],
    metadata: {
        age_optimization: age.toString(),
        language_constraints: `${language}-only`,
        strict_context: "enabled"
        
    }
    });

    // 4. Poll for run completion
    let runStatus;
    do {
      await new Promise(r => setTimeout(r, 1500));
      runStatus = await assistantClient.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

    if (runStatus.status === 'failed') {
      return res.status(500).json({ error: 'Quiz generation failed.' });
    }

    // 5. Retrieve the assistant's response message
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data
      .filter(m => m.run_id === run.id && m.role === 'assistant')
      .pop();

    let quizQuestions = [];
    // Backend: /generateQuestions endpoint
    if (lastMessage) {
      try {
        // Correct content extraction:
        const content = lastMessage.content.find(c => c.type === 'text')?.text?.value || '';
        quizQuestions = JSON.parse(content);
      } catch (err) {
        console.error('JSON parse error:', err, 'Content:', content);
        return res.status(500).json({ error: 'Failed to parse quiz JSON.' });
      }
    }

    return res.json({ result: quizQuestions });
  } catch (error) {
    console.error('Error in /generateQuestions:', error);
    return res.status(500).json({ error: 'Internal server error.' });
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

app.post('/generateSummary', async (req, res) => {
  try {
    const { message, threadId, age, language, sessionId } = req.body;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    console.log(`[generateSummary] sessionId: ${sessionId}, threadId: ${threadId}`);

    // Validate thread exists
    const assistantClient = getAssistantClient();
    const assistant = getAssistant();
    try {
      await assistantClient.beta.threads.retrieve(threadId);
    } catch (err) {
      return res.status(404).json({ error: `Thread ${threadId} not found` });
    }

    // Check for active run - handle undefined case
    const runInfo = sessionRunMap.get(sessionId);
    console.log(`[generateSummary] runInfo: ${JSON.stringify(runInfo)}`);
    
    if (runInfo && runInfo.threadId === threadId) {
      try {
        // Check run status before cancellation
        const runStatus = await assistantClient.beta.threads.runs.retrieve(
          runInfo.threadId, 
          runInfo.runId
        );
        
        if (['queued', 'in_progress'].includes(runStatus.status)) {
          console.log(`Cancelling active run ${runInfo.runId}`);
          await assistantClient.beta.threads.runs.cancel(
            runInfo.threadId, 
            runInfo.runId
          );
          // Wait for cancellation to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (cancelError) {
        console.warn('Run cancellation failed (possibly already completed):', cancelError.message);
      }
    }

    // Get conversation context
    const messages = await assistantClient.beta.threads.messages.list(threadId, {
      order: 'asc'
    });
    console.log(message);

    // Create enhanced instructions
    const instructions = `**User Requirements**
    - Age group: ${age} years old
    - Language: ${language}
    - Message: ${message}

    **Response Rules**
    1. Generate title strictly based on the topic in format: "[Topic] - ${formattedDate}" and return in JSON as title
    2. Display entire content strictly discussed ${message}; return in JSON as summaryExplanation including any markdown **
    3. Use ${language} for age ${age}
    5. Ensure the JSON is not nested inside another JSON object
    6. Exclude the follow up questions asked at the end.
    7. Remember to include diagrams in ${message}. Only include the extracted, rendered mermaid diageam, not the mermaid code. **
    8. Remember to cover every key topic in the discussion. (For example, **do not** just talk about the first or last message - summarize the entire conversation.)
  
    {
      "title": "...",
      "summaryExplanation": "..."
    }`;

    // Create the run
    const run = await assistantClient.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
      model: assistant.model,
      temperature: 0.1,
      instructions: instructions,
      tools: [{ type: "code_interpreter" }],
      metadata: {
        age_optimization: age.toString(),
        language_constraints: `${language}-only`
      }
    });
    sessionRunMap.set(sessionId, { threadId, runId: run.id });
    console.log(`Set new run in sessionRunMap: ${sessionId} -> ${run.id}`);

    // Poll for completion
    let runStatus;
    do {
      await new Promise(r => setTimeout(r, 1500));
      runStatus = await assistantClient.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status === 'queued' || runStatus.status === 'in_progress');

    if (runStatus.status === 'failed') {
      return res.status(500).json({ error: 'Summary generation failed.' });
    }

    // Process response
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data
      .find(m => m.run_id === run.id && m.role === 'assistant');

    if (!lastMessage?.content?.[0]?.text?.value) {
      return res.status(500).json({ error: 'No summary generated.' });
    }

    try {
      // Parse JSON response
      const summary = JSON.parse(lastMessage.content[0].text.value);
      console.log("SUmmary is " , summary);
      return res.json(summary);
    } catch (error) {
      // Fallback for text-based response
      const [title, ...summaryParts] = lastMessage.content[0].text.value.split('\n\n');
      return res.json({
        title: title.replace('Title: ', '').trim(),
        summaryExplanation: summaryParts.join('\n\n').trim()
      });
    }

  } catch (error) {
    return res.json({
    title: "Summary Error",
    summaryExplanation: "Could not generate summary. Please try again."
  });
  }
});

app.post('/cancelAssistantRun', async (req, res) => {
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
