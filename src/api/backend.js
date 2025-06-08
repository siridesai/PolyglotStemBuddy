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
        console.log("Using existing thread: " + sessionThreadMap.get(sessionId));
        return sessionThreadMap.get(sessionId);
    }

    // Get assistant client
    const assistantsClient = getAssistantClient();

    const thread = await assistantsClient.beta.threads.create({});
    console.log("Creating new thread: " + thread.id);
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

export async function deleteCurrentThread(sessionId) {
  const release = await mapMutex.acquire();
  
  try {
    if (sessionThreadMap.has(sessionId)) {
        console.log("Using existing thread");
        return sessionThreadMap.delete(sessionId);
    }
  } finally {
    release();
  }
}




export const runAssistantBackend = async (message, threadId, age, language = 'en', sessionId) => {
    try {
    console.log("Received message: " + message);
    console.log("Received age: " + age);
    console.log("Received language: " + language);
    console.log("Received sessionId: " + sessionId);
    console.log("Received threadId: " + threadId);

    const assistantsClient = getAssistantClient();
    const assistant = getAssistant();

    // Get or create a dedicated chat thread per session
    const chatThreadId = await getOrCreateThread(sessionId);  // <- make this distinct from quiz generation
    console.log("Using chat thread id: " + chatThreadId);

    // Add user's message
    await assistantsClient.beta.threads.messages.create(chatThreadId, {
        role: "user",
        content: message,
    });

    // Run assistant
    const run = await assistantsClient.beta.threads.runs.create(chatThreadId, {
        assistant_id: assistant.id,
        instructions: `You are an assistant that tailors responses based on the user's age: ${age} and language: ${language}.The answer must be precise and concise and should be fun. Offer age appropriate follow-up prompt suggestions. By default use English as the language for responses. If the user specifies a different language preference, only then use that language. Include ASCII art diagrams in the response to explain the concept. Render the ASCII art diagram so it shows as a readable image.Use emojis wherever appropriate If the topic is not directly related to Science, Technology, Engineering, or Math, then please state that the topic is irrelevant to STEM (kindly) and prompt the user to bring the conversation back to something STEM-related.`,
        model: assistant.model
    });

    // Poll for completion
    let runStatus = run.status;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const runStatusResponse = await assistantsClient.beta.threads.runs.retrieve(
            chatThreadId,
            run.id
        );
        runStatus = runStatusResponse.status;
    }

    // Return latest assistant message
    if (runStatus === 'completed') {
        const messages = await assistantsClient.beta.threads.messages.list(chatThreadId);
        const latestAssistantMsg = messages.data.find(m => m.role === 'assistant');
        return latestAssistantMsg?.content?.[0]?.text?.value ?? "(No response)";
    } else {
        throw new Error(`Run failed with status: ${runStatus}`);
    }
} catch (error) {
    console.error(`Error running assistant: ${error.message}`);
    throw error;
}
};


