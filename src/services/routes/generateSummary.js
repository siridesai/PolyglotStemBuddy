import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
import { emitEvent } from '../../utils/appInsights.js'

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

    console.log(`[generateSummary] sessionId: ${sessionId}, threadId: ${threadId}`);

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
        }
      )
      return res.status(404).json({ error: `Thread ${threadId} not found` });
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
    1. Generate title strictly based on the main topics in format: "[ALL MAIN TOPICS DISCUSSED] - ${formattedDate}" and return in JSON as title with first letter capitalized**
    2. Provide a comprehensive summary explanation of the entire conversation, covering all key points discussed in ${message}. Return this as the "summaryExplanation" property in the JSON. The summary should:
      - Be written in ${language}, appropriate for a ${age}-year-old.
      - Include any relevant markdown formatting.
      - Use mermaid markdown code in ${message} to render the diagram. Do **NOT** include the mermaid markdown text in the summary explanation. Do not just describe the diagram in text or with emojis. ALWAYS INCLUDE THE DIAGRAM IN THE SUMMARY. **
      - Separate multiple topics with bolded headers if more than one topic is discussed. For example, if 2+ topics are discussed, separate each with a clear header describing each topic.
      - **Do not** include the mermaid markdown diagram text in the summary explanation.
      - **Do not** include follow-up questions at the end.
    3. Ensure the JSON is **flat** (not nested inside another object) and contains only the "title" and "summaryExplanation" properties.
    4. Return **only** valid, minified JSON (no extra whitespace, no markdown code blocks, no additional commentary).
    5. Cover every key topic discussed in the conversation; do not summarize only the first or last message.
    6. The output format must be:

    {"title": "Topic - ${formattedDate}", "summaryExplanation": "..."}

    **Strictly follow these rules. Any deviation will be considered an error.**`;

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
      emitEvent(
        "SummaryEvent",
         {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId, 
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "SummaryGenFailed"
        }
      )
      return res.status(500).json({ error: 'Summary generation failed.' });
    }

    // Process response
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data
      .find(m => m.run_id === run.id && m.role === 'assistant');

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
        }
      )
      return res.status(500).json({ error: 'No summary generated.' });
    }

    try {
      // Parse JSON response
      const summary = JSON.parse(lastMessage.content[0].text.value);
      emitEvent(
        "SummaryEvent",
         {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId, 
          p_threadId: threadId,
          p_status: "success"
        }
      )
      return res.json(summary);
    } catch (error) {
      // Fallback for text-based response
      const [title, ...summaryParts] = lastMessage.content[0].text.value.split('\n\n');
      emitEvent(
        "SummaryEvent",
         {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId, 
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "JSONParseError"
        }
      )
      return res.json({
        title: title.replace('Title: ', '').trim(),
        summaryExplanation: summaryParts.join('\n\n').trim()
      });
    }

  } catch (error) {
    emitEvent(
      "SummaryEvent",
       {
        p_age: age,
        p_language: language,
        p_sessionId: sessionId, 
        p_threadId: threadId,
        p_status: "failure",
        p_errcode: "UnknownError"
      }
    )
    return res.json({
    title: "Summary Error",
    summaryExplanation: "Could not generate summary. Please try again."
  });
  }
});

export default router;