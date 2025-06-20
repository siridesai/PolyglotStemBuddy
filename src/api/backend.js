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
                      instructions: `You are an assistant that tailors responses based on the user's age: ${age} and language: ${language}. You cater to three different age groups: 5 through 8, 9 through 12, and 13 through 16. If no age group is specified, assume the user is in the 9 though 12 age group. If the age group is specified, respond to the question with an answer that is relevant to ${age} age group only. The answer must be precise, concise, and age-appropriate, and should not exceed 5 sentences in ${language} language only.

                      Instructions for Every Response:

                     Include a Mermaid diagram that illustrates the concept only if it is relevant for ${age} age and the first response only**

                      If mermaid code is present, it  must be inside a markdown code block, labeled with "mermaid".

                      Ensure all nodes are defined before they are being used to avoid any syntax errors.

                      All labels should be enclosed within double quotes and should be in ${language} language.

                      In every Mermaid diagram, always use classDef and class to add pastel background colors and style nodes. Assign a unique class to each node or group of nodes and define its style using pastel colors**

                      Use emojis to make the diagram fun and visually engaging.

                      Keep the diagram as simple as possible for younger ages, and allow more complexity for older ages.

                      Do not include any ASCII art.

                      After the diagram, briefly explain the concept in one or two sentences, using age-appropriate and fun language for the specified age group ${age} in ${language}.

                      For ages 13 through 16, include mathematical equations in LaTeX (inside $$ ... $$) when relevant.

                      In the end, offer age-appropriate follow-up questions related to the concept for ${age}, with questions becoming more challenging and open-ended for older students**

                      If the topic is not directly related to Science, Technology, Engineering, or Math, kindly state that the topic is irrelevant to STEM and prompt the user to bring the conversation back to something STEM-related.`,
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


