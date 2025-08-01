import express from 'express';
import { getAssistantClient } from '../assistantClient.js';
import { getAssistant } from '../assistant.js';
import { emitEvent } from '../appInsights.js';

const router = express.Router();

// Helper: Recursively escape backslashes in all strings in the object
function escapeBackslashesInString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\\/g, '\\\\');
}

function recursivelyEscapeBackslashes(obj) {
  if (Array.isArray(obj)) {
    return obj.map(recursivelyEscapeBackslashes);
  } else if (obj && typeof obj === 'object') {
    const escapedObj = {};
    for (const key in obj) {
      escapedObj[key] = recursivelyEscapeBackslashes(obj[key]);
    }
    return escapedObj;
  } else if (typeof obj === 'string') {
    return escapeBackslashesInString(obj);
  }
  return obj;
}

// Helper: Robustly parse summary JSON with fallback extraction from messy text
function parseSummary(rawText) {
  let summary = null;

  // Attempt direct parse, unwrap nested JSON strings if needed
  try {
    summary = JSON.parse(rawText);

    while (typeof summary === 'string') {
      summary = JSON.parse(summary);
    }

    if (
      typeof summary === 'object' &&
      typeof summary.title === 'string' &&
      summary.title.includes('"summaryExplanation"')
    ) {
      summary = JSON.parse(summary.title);
    }

    if (!summary || !summary.title || !summary.summaryExplanation) {
      throw new Error('Invalid summary structure');
    }

    return summary;
  } catch {

    console.log("JSON parse error: ", rawText);
    // Fix LaTeX backslash escaping inside $...$ or $$...$$ math delimiters,
    // doubling only single backslashes to avoid over-escaping
    const fixedText = rawText.replace(/(\${1,2})(.+?)\1/g, (match, delim, inner) => {
      const escapedInner = inner.replace(/(?<!\\)\\(?!\\)/g, '\\\\');
      
      return delim + escapedInner + delim;
    });
     
    console.log("Fixed text: ", fixedText);
     const jsonRegex = /{[\s\S]*?"title"\s*:\s*".*?"[\s\S]*?"summaryExplanation"\s*:\s*".*?"[\s\S]*?}/;
     const match = typeof fixedText === 'string' ? fixedText.match(jsonRegex) : null;

    if (match) {
      try {
        summary = JSON.parse(match[0]);

        // Handle potential double-stringified JSON case inside 'title'
        if (
          typeof summary === 'object' &&
          typeof summary.title === 'string' &&
          summary.title.includes('"summaryExplanation"')
        ) {
          summary = JSON.parse(summary.title);
        }

        // Confirm that summary structure looks valid
        if (summary && summary.title && summary.summaryExplanation) {
          return summary;  // Successfully parsed fallback summary
        }
  } catch {
    // Final fallback summary if parsing fails
   return {
    title: "Summary Error",
    summaryExplanation: "Could not parse summary. Please try again."
  };
  }
 }
}

  
}

router.post('/generateSummary', async (req, res) => {
  try {
    const { message, threadId, age, language, sessionId } = req.body;

    // Validate required parameters
    if (!threadId || !language) {
      emitEvent(
        "SummaryEvent",
        {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "MissingParams"
        },
        req.telemetryContext
      );
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    // Format date string YYYY-MM-DD for title
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Get assistant client and assistant object
    const assistantClient = getAssistantClient();
    const assistant = await getAssistant();

    // Verify thread exists
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
        },
        req.telemetryContext
      );
      return res.status(404).json({ error: `Thread ${threadId} not found` });
    }

    const instructions = `Generate a summary based on the conversation relating to: ${message}. The user is ${age} years old and prefers the ${language} language. The summary must be precise, complete, age-appropriate, and use Markdown formatting in ${language}. Output strictly as a valid, minified JSON object with this format:
    {"title": "Title - ${formattedDate}", "summaryExplanation": "..."}

    Rules for the summary:
     Title

      Must include the main topic(s) discussed in the native script of ${language}.

      Format example: "Photosynthesis - ${formattedDate}".

      Content in "summaryExplanation"

      Must consicely cover every key concept discussed in the entire conversation, not only the last message. DO not exceed more than 5 sentences.

      Written clearly and precisely for a ${age}-year-old audience in ${language}, using suitable scientific vocabulary without unnecessary complexity.

      Include a Mermaid diagram only if visualization helps understanding the concept.Use only when absoultely necessary.

      Mermaid diagrams must:

      Use valid Mermaid syntax, inside a code block labeled \`\`\`mermaid (no extra text or descriptions).

      Use node and edge labels in ${language}, with node labels quoted and edge labels unquoted.

      Enclose all math expressions inside nodes with double dollar signs $$...$$.

      Use double-escaped LaTeX commands inside Mermaid, e.g., \\frac, never single backslash \.

      Not use parentheses around formulas (e.g., write $$\\frac{1}{2}$$, not ($$\\frac{1}{2}$$)).

      LaTeX and Math Expressions

      Inline math: Use single dollar signs $...$; e.g. $\\frac{2}{3}$.

      Crucially, an expression like $T_{\mu\nu}$ **must be written as** $T_{\mu\nu}$ in the JSON string.

      Block math: Use double dollar signs; e.g.,
      $$
      \\frac{2}{3} + \\frac{1}{3} = 1
      $$
      Use only supported KaTeX syntax (no unsupported commands).

      Never use partial, dangling, or malformed backslashes:

      Do not use \\\\div, \\\\\\, or \\\\text{light \\\\ energy} etc.

      Always double-escape LaTeX backslashes:

      Every single backslash \ in LaTeX commands (such as \frac, \sqrt, \sum) and Greek letters (like \mu, \nu, \pi, \rho, etc.) must be replaced with a double backslash \\ inside JSON strings.

      Example:

      LaTeX command \mu → \\mu in JSON string.

      Expression $T_{\mu\nu}$ → $T_{\\mu\\nu}$ in JSON.

      This ensures correct rendering after JSON parsing, as JSON uses \ as an escape character.

      Never put LaTeX formulas inside parentheses or other delimiters besides $...$ or $$...$$.

      For ages 13-16, always include relevant equations following these rules.

      For mixed fractions, write without spaces or parentheses:

      Inline: $3\\frac{1}{4}$

      Block:
      $$
      3\\frac{1}{4}
      $$
      These rules apply uniformly in all languages you output.

    Output Restrictions

      JSON object must only contain "title" and "summaryExplanation" keys.

      Do not return stringified JSON, do not wrap output in code blocks or markdown—raw minified JSON only.

      "summaryExplanation" can contain Markdown formatting (bold, italics, lists, etc.), LaTeX math, and Mermaid code blocks (with the above rules).

      Do not include follow-up questions or any explanations about Mermaid diagrams or escaping.

      Escaping Rules Summary

      Each backslash used in LaTeX commands and Greek letters must be escaped as double backslash \\ inside the JSON string.

      Examples:

      \frac{a}{b} → \\frac{a}{b}

      \mu → \\mu

      \rightarrow → \\rightarrow

      Expression $T_{\mu\nu}$ → $T_{\\mu\\nu}$

      Do not use triple backslashes \\\, malformed sequences, or incorrect escaping like \\\\div or \\\\\\.

      Verify every LaTeX expression has properly doubled backslashes before JSON serialization to avoid parsing errors.

      Example valid JSON output (minified, partial):
      {"title":"Photosynthesis - ${formattedDate}",
      "summaryExplanation":"**Photosynthesis Equation**\nThe process of photosynthesis...\n\n"}

      Important Instructions:

        Return the output strictly as a valid, minified JSON object with exactly two keys:

        "title"

        "summaryExplanation"

        Do NOT include any code fences, markdown delimiters, explanations, or any extra text outside the JSON object.

        Every single backslash \ in LaTeX commands (e.g., \frac, \sqrt, \sum) and Greek letters (e.g., \mu, \nu, \pi, \rho) must be escaped as double backslashes \\ inside the JSON strings.
        This applies to all LaTeX code inside the JSON values, including inline math, block math, subscripts, superscripts, and concatenated formulas.

        Examples of correct escaping inside the JSON string:

        \frac{3}{4} → \\frac{3}{4}

        \mu → \\mu

        $T_{\mu\nu}$ → $T_{\\mu\\nu}$

        $G_{\mu\nu}$ → $G_{\\mu\\nu}$

        Do NOT use triple or quadruple backslashes (e.g., \\\, \\\\) or malformed sequences like \\div or \\text{} with inconsistent backslashes.

        Use inline math with single dollar signs $...$ and block math with double dollar signs $$...$$, without extra parentheses or delimiters.

        The JSON returned must be parseable by any standard JSON parser without error.

        Example of valid JSON output your response must match:

        text
        {
          "title": "Einstein's General Relativity - YYYY-MM-DD",
          "summaryExplanation": "**Einstein's General Relativity** describes gravity as the curvature of spacetime $G_{\mu\nu}$ → $G_{\\mu\\nu}$.\n\nThe famous equation is:\n$$\nG_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}\n$$"
        }
        Strictly follow these instructions to guarantee valid JSON output and proper LaTeX backslash escaping for downstream parsing and rendering. If generating the JSON programmatically, ensure all backslashes inside math expressions are replaced as described prior to JSON serialization.`;

    // Create run to generate summary
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

    // Poll for run completion
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
        },
        req.telemetryContext
      );
      return res.status(500).json({ error: 'Summary generation failed.' });
    }

    // Retrieve assistant message
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
        },
        req.telemetryContext
      );
      return res.status(500).json({ error: 'No summary generated.' });
    }

    const textValue = lastMessage.content[0].text.value;

    // Parse JSON summary robustly
    const summary = parseSummary(textValue);

    // Escape backslashes inside all strings in the summary (LaTeX escaping)
    const safeSummary = recursivelyEscapeBackslashes(summary);

    emitEvent(
      "SummaryEvent",
      {
        p_age: age,
        p_language: language,
        p_sessionId: sessionId,
        p_threadId: threadId,
        p_status: "success"
      },
      req.telemetryContext
    );

    return res.json(safeSummary);
  } catch (error) {
    console.error("Unexpected error in /generateSummary:", error);

    emitEvent(
      "SummaryEvent",
      {
        p_age: req.body.age,
        p_language: req.body.language,
        p_sessionId: req.body.sessionId,
        p_threadId: req.body.threadId,
        p_status: "failure",
        p_errcode: "UnknownError"
      },
      req.telemetryContext
    );

    return res.status(500).json({
      title: "Summary Error",
      summaryExplanation: "Could not generate summary. Please try again."
    });
  }
});

export default router;





    
    