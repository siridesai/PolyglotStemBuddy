import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
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
      return res.status(404).json({ error: `Thread ${threadId} not found` });
    }

    /*Check for active run - handle undefined case
    const runInfo = sessionRunMap.get(sessionId);
    console.log(`[generateSummary] runInfo: ${JSON.stringify(runInfo)}`);
    
    if (runInfo && runInfo.threadId === threadId) {
      try {
        // Check run status before cancellation
        const runStatus = await assistantClient.beta.threads.runs.retrieve(
          runInfo.threadId, 
          runInfo.runId
        );
        
        if (['queued', 'in_progress'].includes(runStatus.status)) {
          console.log(`Cancelling active run ${runInfo.runId}`);
          await assistantClient.beta.threads.runs.cancel(
            runInfo.threadId, 
            runInfo.runId
          );
          // Wait for cancellation to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (cancelError) {
        console.warn('Run cancellation failed (possibly already completed):', cancelError.message);
      }
    }*/

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
    1. Generate title strictly based on the topic in format: "[Topic] - ${formattedDate}" and return in JSON as title with first letter capitalized**
    2. Display entire content strictly discussed ${message}; return in JSON as summaryExplanation including any markdown **
    3. Use ${language} for age ${age}
    5. Ensure the JSON is not nested inside another JSON object
    6. Exclude the follow up questions asked at the end.
    7. Use mermaid markdown code in ${message} to render the diagram. Do not include the mermaid markdown text in the summary explanation **
    8. Remember to cover every key topic in the discussion. (For example, **do not** just talk about the first or last message - summarize the entire conversation.)
    9. Return ONLY valid, minified JSON. DO NOT use json markdown
      

{"title": "Topic - ${formattedDate}", "summaryExplanation": "..."}

Conversation:
${message.substring(0, 1500)}
`;

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
      return res.status(500).json({ error: 'Summary generation failed.' });
    }

    // Process response
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data
      .find(m => m.run_id === run.id && m.role === 'assistant');

    if (!lastMessage?.content?.[0]?.text?.value) {
      return res.status(500).json({ error: 'No summary generated.' });
    }

    try {
      // Parse JSON response
      const summary = JSON.parse(lastMessage.content[0].text.value);
      return res.json(summary);
    } catch (error) {
      // Fallback for text-based response
      const [title, ...summaryParts] = lastMessage.content[0].text.value.split('\n\n');
      return res.json({
        title: title.replace('Title: ', '').trim(),
        summaryExplanation: summaryParts.join('\n\n').trim()
      });
    }

  } catch (error) {
    return res.json({
    title: "Summary Error",
    summaryExplanation: "Could not generate summary. Please try again."
  });
  }
});

export default router;