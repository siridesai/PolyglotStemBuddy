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

    // Compose instructions for the LLM
    const instructions = `**User Requirements**
    - Age group: ${age} years old
    - Language: ${language}
    - Message: ${message}

    **Response Rules**
    1. Generate title strictly based on the main topics in format: "[ALL MAIN TOPICS DISCUSSED] - ${formattedDate}" and return in JSON as title with first letter capitalized.
    2. Provide a comprehensive summary explanation of the entire conversation, covering all key points discussed in ${message}. Return this as the "summaryExplanation" property in the JSON. The summary should:
      - Be written in ${language}, appropriate for a ${age}-year-old.
      - Include any relevant markdown formatting.
      - Use mermaid markdown code in ${message} to render the diagram. Do **NOT** include the mermaid markdown text in the summary explanation. Do not just describe the diagram in text or with emojis. ALWAYS INCLUDE THE DIAGRAM IN THE SUMMARY.
      - Separate multiple topics with bolded headers if more than one topic is discussed. For example, if 2+ topics are discussed, separate each with a clear header describing each topic.
      - **Do not** include the mermaid markdown diagram text in the summary explanation.
      - **Do not** include follow-up questions at the end.
    3. Ensure the JSON is **flat** (not nested inside another object) and contains only the "title" and "summaryExplanation" properties. **Do not** return JSON as a string. Return a flat JSON object only.
    4. Return **only** valid, minified JSON (no extra whitespace, no markdown code blocks, no additional commentary).
    5. Cover **every key topic** discussed in the conversation; do not summarize only the first or last message.
    6. For ages 13 through 16, always use mathematical or chemical equations in LaTeX.
        When generating answers with math, always use Markdown with standard LaTeX math delimiters: $ ... $ for inline math, and $$ ... $$ for block math.
        Never use parentheses (e.g., (\frac{2}{3})); only use dollar sign delimiters.
        For all mathematical or chemical expressions, use Markdown with standard LaTeX math delimiters.

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

        Always present mathematical or chemical equations in LaTeX using the above delimiters when relevant.

        Ensure all generated content is clear, concise, and formatted for the appropriate age group.

        Review rendered output to confirm math displays as intended and revise if it shows raw code instead of rendered math.

        IMPORTANT: In JSON, you must escape ALL LaTeX backslashes as '\\\\''. 
        - Use '\\\\frac{2}{3}', not '\\frac{2}{3}'.
        - Use '\\\\div', not '\\div'.

        Do not send malformed characters like '\\\div' or unescaped LaTeX.

        Return the output as minified JSON. Example:
        {"title":"Fractions - 2025-07-18","summaryExplanation":"...$$\\\\frac{8}{12}$$..."}
      . The output format must be:

      {"title": "Topic - ${formattedDate}", "summaryExplanation": "..."}
      Example valid json 
      {
        "title": "Photosynthesis - ${formattedDate}",
        "summaryExplanation": "**Photosynthesis Equation**\nThe photosynthesis equation...\n\n$$\n6CO_2 + 6H_2O + light \\\\ energy \\\\rightarrow C_6H_{12}O_6 + 6O_2\n$$"
      }

    **Strictly follow these rules. Any deviation will be considered an error.**`;

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
      textValue = textValue.replace(/\\(?![\\\/bfnrtu"])/g, '\\\\');

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
