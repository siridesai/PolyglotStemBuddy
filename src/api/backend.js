import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';
import { getAssistantClient } from '../assistantClient.js';
import { getAssistant } from '../assistant.js';
import { Mutex } from 'async-mutex';

// Session-thread mapping with concurrency control
const sessionThreadMap = new Map();
const mapMutex = new Mutex();

// Create or retrieve thread for session
export async function getOrCreateThread(sessionId) {
  const release = await mapMutex.acquire();
  
  try {
    if (sessionThreadMap.has(sessionId)) {
        console.log("Using existing thread");
        return sessionThreadMap.get(sessionId);
    }

    // Get assistant client
    const assistantsClient = getAssistantClient();

    const thread = await assistantsClient.beta.threads.create({});
    console.log("Creating new thread");
    // Store worker reference and thread ID
    sessionThreadMap.set(sessionId, thread.id );

    // TBD logic to clean session thread map
    /*worker.on('exit', () => {
      sessionThreadMap.delete(sessionId);
    }); */

    return sessionThreadMap.get(sessionId);
  } finally {
    release();
  }
}




export const runAssistantBackend = async (message, age, language = 'en', sessionId) => {
    try {
        console.log("Received message: " + message);
        console.log("Received age: " + age);
        console.log("Received language: " + language);
        console.log("Received sessionId: " + sessionId);
        
        // Get assistant client
        const assistantsClient = getAssistantClient();
        console.log("Got assistant client") ;
        // Create or retrieve existing thread
        const threadID = await getOrCreateThread(sessionId) ;
        console.log("Using thread id: " + threadID) ;
        
        // Add the user's message to the thread
        await assistantsClient.beta.threads.messages.create(threadID, {
            role: "user",
            content: message,
        });

        // Get the specific assistant to use with the thread
        const assistant = getAssistant() ;

        // Run the thread
        const run = await assistantsClient.beta.threads.runs.create(threadID, {
            assistant_id: assistant.id,
        });

        // Poll for completion
        let runStatus = run.status;
        while (runStatus === 'queued' || runStatus === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const runStatusResponse = await assistantsClient.beta.threads.runs.retrieve(
                threadID,
                run.id
            );
            runStatus = runStatusResponse.status;
        }

        // Get the messages once complete
        if (runStatus === 'completed') {
            const messages = await assistantsClient.beta.threads.messages.list(threadID);
            return messages.data[0].content[0].text.value;
        } else {
            throw new Error(`Run failed with status: ${runStatus}`);
        }
    } catch (error) {
        console.error(`Error running assistant: ${error.message}`);
        throw error;
    }
};


