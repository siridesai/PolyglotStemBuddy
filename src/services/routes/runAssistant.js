import express from 'express';
import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';
import { getAssistantClient } from '../assistantClient.js';
import { getAssistant } from '../assistant.js';
import { getOrCreateThread } from '../threadManager.js';
import { Mutex } from 'async-mutex';
import { emitEvent } from '../appInsights.js'


const router = express.Router();

router.post('/runAssistant', async (req, res) => {
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
        emitEvent(
        "ChatEvent",
        {
          p_question: message,
          p_age: age,
          p_language: language,
          p_sessionId: sessionId, 
          p_threadId: threadId,
          p_status: "success"
        },
        req.telemetryContext 
      )

        res.json({ result, runId });

    } catch (error) {
        console.error("Backend API error:", error);
        emitEvent(
          "ChatEvent",
          {
            p_question: message,
            p_age: age,
            p_language: language,
            p_sessionId: sessionId, 
            p_threadId: threadId,
            p_status: "failure"
          },
          req.telemetryContext
        )
        res.status(500).json({ error: error.message });
    }
});


// Session-thread mapping with concurrency control
const sessionThreadMap = new Map();
const mapMutex = new Mutex();
const sessionRunMap = new Map();

export const runAssistantBackend = async (
  message,
  threadId,
  age,
  language = 'en',
  sessionId
) => {
  try {
    console.log("Received message: " + message);
    console.log("Received age: " + age);
    console.log("Received language: " + language);
    console.log("Received sessionId: " + sessionId);
    console.log("Received threadId: " + threadId);

    const assistantsClient = getAssistantClient();
    const assistant = getAssistant();

    // Get or create a dedicated chat thread per session
    const chatThreadId = await getOrCreateThread(sessionId);
    console.log("Using chat thread id: " + chatThreadId);

    // Add user's message
    await assistantsClient.beta.threads.messages.create(chatThreadId, {
      role: "user",
      content: message,
    });

    // Run assistant
    const run = await assistantsClient.beta.threads.runs.create(chatThreadId, {
      assistant_id: assistant.id,
      instructions: `Respond to ${message} as if you are an assistant that tailors responses based on the user's age: ${age} and language: ${language}.

      You support three distinct age groups:
      - 5-8
      - 9-12 (default)
      - 13-16

      The response must be:
      - Precise, concise, and age-appropriate
      - No longer than 5 sentences
      - Answer strictly in ${language}

      1. Context and Continuity:
      - Always use prior conversation context to maintain continuity.
      - Never use the chatbot-generated response in ${message} as a question.
      - Do not generate random answers to incomplete or ambiguous questions.
      - If the intent is unclear, infer using the most recent context.
      - If the context is missing, ask for clarification and reference the last known topic.
      - Never treat any message in isolation.

      2. Topic Restrictions (Blacklist):
      - Avoid non-STEM topics (e.g., emotions, characters, preferences, entertainment).
      - Acceptable STEM-adjacent topics: physical games, exercises, video games.
      - Politely redirect off-topic input toward related STEM content.

    3. Mermaid Diagrams:
      - Include a Mermaid diagram only if helpful and only in the first response for that concept.
      - Mermaid diagrams must use valid Mermaid syntax inside a code block labeled \`\`\`mermaid.
      - Only include the Mermaid code block itself in the output, not an explanation of it.
      - All labels and math must be written in ${language}.
      - Inside Mermaid: 
          - Node and edge labels must be in ${language}; node labels quoted, edge labels unquoted.
          - Math expressions inside nodes must be enclosed with double dollar signs: $$...$$.
          - All LaTeX commands (e.g. \\frac) must be double-escaped (i.e. \\\\frac) in JSON strings.
          - Do not use parentheses around LaTeX (e.g., do not write (\frac{1}{2})).
          - Example: A["Improper Fraction: $$\\\\frac{9}{4}$$"]
      
    4. LaTeX Rules:
      - Inline math must use $...$, e.g. $\\\\frac{2}{3}$
      - For block math, use: 
        $$
        \\\\frac{2}{3} + \\\\frac{1}{3} = 1
        $$
      - Use only supported KaTeX syntax.
      - Do not use: \\\\div, triple backslashes \\\\\\\\, or malformed escape sequences.
      - Do not use partial/dangling backslashes.
        

      5. Follow-Up Questions:
      - Generate exactly 3 factual, concise, STEM-based questions per unique concept.
      - Wrap each in its own code block labeled  inside a code block labeled \`\`\'followUpQuestions
      - Example:
      
      - Do not use imaginative, open-ended, or personal questions.
      - Do not include any introduction like: 'Here are some questions'.

      6. Ending Behavior:
      - If the user says “thanks”, “bye”, or responds positively: Reply with a short message like “You're welcome!” and stop.
      - If the user gives negative feedback: Apologize politely and offer one helpful suggestion.
      - Do not continue explanations unless asked to.

      7. Language Usage:
      - Use ${language} for all text output, including LaTeX, diagrams, and questions.
      - Do not switch to English if another language is specified.
      - All syntax must be compatible with KaTeX and Mermaid.
      - Strictly follow escaping and formatting conventions for all STEM explanations.

      Strictly follow all rules for LaTeX, Mermaid, JSON structure, formatting, age, and language targeting. Any invalid escape sequence or deviation may cause rendering errors.`,
            
      model: assistant.model,
      temperature: 0.1
    });

    // Store run info for potential cancellation
    sessionRunMap.set(sessionId, { threadId: chatThreadId, runId: run.id });

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

    // Return both result and runId
    if (runStatus === 'completed') {
      const messages = await assistantsClient.beta.threads.messages.list(chatThreadId);
      const latestAssistantMsg = messages.data.find(m => m.role === 'assistant');
      const result = latestAssistantMsg?.content?.[0]?.text?.value ?? "(No response)";
      
      
      return { 
        result, 
        runId: run.id 
      };
    } else {
      throw new Error(`Run failed with status: ${runStatus}`);
    }
  } catch (error) {
    console.error(`Error running assistant: ${error.message}`);
    throw error;
  }
};

export default router;