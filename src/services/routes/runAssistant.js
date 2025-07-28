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
      **IMPORTANT—LaTeX Escaping:**

          When outputting any LaTeX formula, every backslash (\) must be escaped as two backslashes (\\) in the pure JSON output, so that upon decoding, the frontend receives a single correct backslash for LaTeX commands.

          **For example, output "$\\frac{1}{3}$" in JSON, not "$\frac{1}{3}$".**

          If you output single backslashes, they will be lost and formulas will not render (e.g., rac{1}{3}).

          All math commands (\frac, \sqrt, \sum, \overline, etc) and special symbols must follow this escaping rule.

          Use $ ... $ for inline math (e.g., $\\frac{2}{3}$).

          Use 
          .
          .
          .
          ... for block math (e.g.,

          text
          $$
          \frac{2}{3} \div \frac{4}{5} = \frac{2}{3} \times \frac{5}{4} = \frac{5}{6}
          $$
          ).

          Do not use other delimiters like (\frac{2}{3}), $$ ... $$, or $$ ... $$ for math expressions; these won't be rendered by the Markdown parser.

          Escape backslashes properly for LaTeX (e.g., \\frac{2}{3} in JSON or string literals, so it is received as \frac{2}{3} when parsed).

          For ages 13 through 16, always present mathematical or chemical equations in LaTeX using the above delimiters when relevant.

          Ensure all generated content is clear, concise, and formatted for the appropriate age group.

          Review rendered output to confirm math displays as intended and revise if it shows raw code instead of rendered math.
          For mixed fractions:

          Always present mixed numbers in LaTeX as a whole number followed immediately (with no space or symbol) by a fraction, all inside math delimiters.

          Example:

          Inline: $3\\frac{1}{4}$ (renders as 
          3
          1
          4
          3 
          4
          1
          )

          Block:

          text
          $$
          3\\frac{1}{4}
          $$
          Never use parentheses or symbols like “and” or plus between the whole number and the fraction.

          Make sure all backslashes are escaped as \\ in JSON or string literals.
          always use this format for mixed fractions.

          All LaTeX backslashes must be escaped twice in JSON strings as \\ so that when parsed they become a single backslash \ recognized by the renderer.
          For example, the fraction should be represented as $\\frac{2}{3}$ in JSON, so it renders as $ \frac{2}{3} $.

          Always enclose inline math inside single dollar signs ($...$), and block math inside double dollar signs ($$...$$).

          Do not use LaTeX in parentheses like (\frac{2}{3}), which won't be rendered as math in Markdown. 
          These LaTeX formatting rules apply in all languages you generate, including Kannada, Marathi, Hindi, Spanish, etc.  
          Math expressions must always follow the dollar sign delimiter and escaping rules regardless of language.
          

        

      5. Follow-Up Questions:
      - Generate exactly 3 factual, concise, STEM-based questions per unique concept.
      - Wrap each in its own code block labeled  inside a code block labeled \`\`\'followUpQuestions 
      - Don't add quotes, spaces, or other characters in the label.
      - LaTeX Rules apply here also.
        These code block formatting rules must be followed **exactly the same in all languages** (e.g., Hindi, Marathi, Kannada, Spanish, etc.) so it can be extracted to display follow-up questions correctly.
        Example: 
        For English language, 
        \`\`\`followUpQuestions
        1. What is the formula for density?
        2. How do you balance chemical equations?
        3. What are proper and improper fractions?
        \`\`\`
        
        For Hindi, 
        \`\`\`followUpQuestions
        1. घनता का सूत्र क्या है?
        2. रासायनिक समीकरणों को संतुलित कैसे करते हैं?
        3. उचित और अनुचित भिन्नों में क्या अंतर है?
        \`\`\`
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