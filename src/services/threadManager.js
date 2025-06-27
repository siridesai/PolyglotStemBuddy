import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';
import { getAssistantClient } from './assistantClient.js';
import { getAssistant } from './assistant.js';
import { Mutex } from 'async-mutex';

// Session-thread mapping with concurrency control
const sessionThreadMap = new Map();
const mapMutex = new Mutex();
const sessionRunMap = new Map();

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



