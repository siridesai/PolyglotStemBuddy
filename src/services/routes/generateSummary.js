import express from 'express';
import { getAssistantClient } from '../assistantClient.js';
import { getAssistant } from '../assistant.js';
import { emitEvent } from '../appInsights.js';

const router = express.Router();
const sessionRunMap = new Map();

router.post('/generateSummary', async (req, res) => {
  try {
    const { message, threadId, age, language, sessionId } = req.body;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Validate thread exists
    const assistantClient = getAssistantClient();
    const assistant = getAssistant();
    try {
      await assistantClient.beta.threads.retrieve(threadId);
    } catch (err) {
      emitEvent(
        "SummaryEvent",
        {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "ThreadNotFound"
        }, req.telemetryContext
      );
      return res.status(404).json({ error: `Thread ${threadId} not found` });
    }

    const instructions = `Generate a summary based on the conversation relating to: "${message}". The user is ${age} years old and prefers the ${language} language. The summary must be precise, complete, age-appropriate, and use Markdown formatting in ${language}. Use scientific vocabulary appropriate to the age group. Output strictly in a valid, minified JSON object with the format: {"title": "Title - ${formattedDate}", "summaryExplanation": "..."}
      Rules:
      1. The summary title must include the main topic(s) discussed in the native script of the ${language}, formatted like: "Photosynthesis - ${formattedDate}".
      2. The "summaryExplanation" must:
        - Be comprehensive and cover every key concept in the full conversation, not just the latest interaction.
        - Be written clearly for a ${age}-year-old in ${language}, using simple yet precise scientific language.
        - Include a Mermaid diagram (only in the *first* summary response), if the concept benefits from visualization.
        - Mermaid diagrams must use valid Mermaid syntax inside a code block labeled \`\`\`mermaid.
        - Only include the Mermaid code block itself in the output, not an explanation of it.
        - Inside Mermaid: 
          - Node and edge labels must be in ${language}; node labels quoted, edge labels unquoted.
          - Math expressions inside nodes must be enclosed with double dollar signs: $$...$$.
          - All LaTeX commands (e.g. \\frac) must be double-escaped (i.e. \\\\frac) in JSON strings.
          - Do not use parentheses around LaTeX (e.g., do not write (\frac{1}{2})).
          - Example: A["Improper Fraction: $$\\\\frac{9}{4}$$"]

      3. LaTeX rules:
        - Inline math must use $...$, e.g. $\\\\frac{2}{3}$
        - For block math, use: 
          $$
          \\\\frac{2}{3} + \\\\frac{1}{3} = 1
          $$
        - Use only supported KaTeX syntax.
        -  Do not use: \\\\div, triple backslashes \\\\\\\\, or malformed escape sequences.
        - Do not use partial/dangling backslashes.

      4. Output Restrictions:
        - The JSON object must only contain the "title" and "summaryExplanation" keys.
        - Do NOT return stringified JSON. Do NOT wrap in code blocks or markdown.
        - The content inside "summaryExplanation" may include LaTeX, Markdown elements (bold, italic, etc.), and Mermaid code.
        - Do NOT include follow-up questions.
        - Do NOT mention that the diagram is in Mermaid syntax.

      5. Escaping Rules:
        - Each backslash used in LaTeX must be escaped **as \\\\** in the JSON string.
        - e.g., \\\\frac{a}{b}, \\\\rightarrow
        - DO NOT use: \\\\div, \\\\\\, \\\\text{light \\\\ energy}, or any malformed JSON escape sequences.
        - Any deviation (triple backslashes, malformed objects, or misescaped LaTeX) will be considered invalid.

      6. Example valid output:
      {"title": "Photosynthesis - ${formattedDate}", "summaryExplanation": "**Photosynthesis Equation**\\nThe process of photosynthesis...\\n\\n\`\`\`mermaid\\ngraph TD\\n  A[\\"Sunlight: $$\\\\text{energy}$$\\"] --> B[\\"Carbon Dioxide\\"]\\n  B --> C[\\"Glucose: $$\\\\frac{6H_2O}{CO_2}$$\\"]\\n\`\`\`"}

      Strictly follow all rules for LaTeX, Mermaid, JSON structure, formatting, age, and language targeting. Any invalid escape sequence or deviation may cause rendering errors.`;

    // Create the run
    const run = await assistantClient.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
      model: assistant.model,
      temperature: 0.1,
      instructions,
      tools: [{ type: "code_interpreter" }],
      metadata: {
        age_optimization: age.toString(),
        language_constraints: `${language}-only`
      }
    });
    sessionRunMap.set(sessionId, { threadId, runId: run.id });

    // Poll for completion
    let runStatus;
    do {
      await new Promise(r => setTimeout(r, 1500));
      runStatus = await assistantClient.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status === 'queued' || runStatus.status === 'in_progress');

    if (runStatus.status === 'failed') {
      emitEvent(
        "SummaryEvent",
        {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "SummaryGenFailed"
        }, req.telemetryContext
      );
      return res.status(500).json({ error: 'Summary generation failed.' });
    }

    // Get the assistant's message
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data.find(
      m => m.run_id === run.id && m.role === 'assistant'
    );

    if (!lastMessage?.content?.[0]?.text?.value) {
      emitEvent(
        "SummaryEvent",
        {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "NoSummaryGenerated"
        }, req.telemetryContext
      );
      return res.status(500).json({ error: 'No summary generated.' });
    }

    // Robustly parse the assistant's output with safe unescaping of backslashes
    let summary;
    let textValue = lastMessage.content[0].text.value;

    try {
      // Double any backslash not followed by a valid JSON escape character
      textValue = textValue.replace(/\\\\\\(?=\s)/g, '\\\\');
      textValue = textValue.replace(/\\(?![\\\/bfnrtu"])/g, '\\\\');
      textValue = textValue.replace(/\\(?![\\/"bfnrtu])/g, '\\\\');

      // Attempt to parse JSON
      summary = JSON.parse(textValue);

      // Handle stringified JSON inside the title property
      while (typeof summary === 'string') {
        summary = JSON.parse(summary);
      }
      if (
        typeof summary.title === 'string' &&
        summary.title.includes('"summaryExplanation"')
      ) {
        summary = JSON.parse(summary.title);
      }

      if (
        typeof summary !== 'object' ||
        !summary.title ||
        !summary.summaryExplanation
      ) {
        throw new Error('Invalid summary structure');
      }
    } catch (error) {
      console.error("Summary parse error:", error, "textValue:", textValue);

      // Try to extract JSON substring from text (handles JSON embedded in markdown/text)
      const match = typeof textValue === 'string' && textValue.match(/{[\s\S]*?"title"\s*:\s*".+?[\s\S]*?"summaryExplanation"\s*:\s*".+?"[\s\S]*?}/);
      if (match) {
        try {
          let safeMatch = match[0].replace(/\\(?![\\\/bfnrtu"])/g, '\\\\');
          summary = JSON.parse(safeMatch);
          if (
            typeof summary.title === 'string' &&
            summary.title.includes('"summaryExplanation"')
          ) {
            summary = JSON.parse(summary.title);
          }
        } catch (e) {
          summary = null;
        }
      }

      // Final fallback: return error message
      if (!summary || !summary.title || !summary.summaryExplanation) {
        summary = {
          title: "Summary Error",
          summaryExplanation: "Could not parse summary. Please try again."
        };
      }
    }

    emitEvent(
      "SummaryEvent",
      {
        p_age: age,
        p_language: language,
        p_sessionId: sessionId,
        p_threadId: threadId,
        p_status: "success"
      }, req.telemetryContext
    );
    return res.json(summary);

  } catch (error) {
    emitEvent(
      "SummaryEvent",
      {
        p_age: req.body.age,
        p_language: req.body.language,
        p_sessionId: req.body.sessionId,
        p_threadId: req.body.threadId,
        p_status: "failure",
        p_errcode: "UnknownError"
      }, req.telemetryContext
    );
    return res.json({
      title: "Summary Error",
      summaryExplanation: "Could not generate summary. Please try again."
    });
  }
});

export default router;
