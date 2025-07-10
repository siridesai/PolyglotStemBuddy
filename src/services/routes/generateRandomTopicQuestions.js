import express from 'express';
import { getAssistantClient } from '../assistantClient.js';
import { getAssistant } from '../assistant.js';
import { emitEvent } from '../appInsights.js';

const router = express.Router();
const sessionRunMap = new Map();

router.post('/generateRandomTopicQuestions', async (req, res) => {
  const { topic, threadId,age, language, sessionId } = req.body;

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
        "GenerateTopicsEvent",
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

  // Construct the prompt for the AI
  const instructions = `Generate three engaging, age-appropriate topic single line prompts 
  for a student interested in ${topic}, in ${language}, for age group ${age}.
  Each topic should inspire curiosity and help the student choose a specific area to explore. Use topics that have a focused topic
  and you are not too broad. You should be able to answer these questions.
  The output format should be - 
  {"topicQuestions":["topicQuestion1", "topicQuestion2", "topicQuestion3"]}.`;

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
            "GenerateTopicsEvent",
            {
              p_age: age,
              p_language: language,
              p_sessionId: sessionId,
              p_threadId: threadId,
              p_status: "failure",
              p_errcode: "GenerateTopicsFailed"
            }, req.telemetryContext
          );
          return res.status(500).json({ error: 'Topic generation failed.' });
        }
        // Get the assistant's message
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data.find(
      m => m.run_id === run.id && m.role === 'assistant'
    );

    if (!lastMessage?.content?.[0]?.text?.value) {
      emitEvent(
        "GenerateTopicsEvent",
        {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "NoTopicsGenerated"
        }, req.telemetryContext
      );
      return res.status(500).json({ error: 'No topics generated.' });
    }

    // Robustly parse the assistant's output with safe unescaping of backslashes
    let topics;
    let textValue = lastMessage.content[0].text.value;

    console.log(`Received topics: ${textValue}`);

    try {
      // Double any backslash not followed by a valid JSON escape character
      textValue = textValue.replace(/\\(?![\\\/bfnrtu"])/g, '\\\\');

      // Attempt to parse JSON
      topics = JSON.parse(textValue);

      // Handle stringified JSON inside the title property
      while (typeof topics === 'string') {
        topics = JSON.parse(topics);
      }
    } catch (err) {
      emitEvent(
        "GenerateTopicsEvent",
        {
          p_age: age,
          p_language: language,
          p_sessionId: sessionId,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: "TopicParsingFailed"
        }, req.telemetryContext
      );
      return res.status(500).json({ error: 'Failed to parse topics.' });
    }

    // Successfully generated topics
    emitEvent(
      "GenerateTopicsEvent",
      {
        p_age: age,
        p_language: language,
        p_sessionId: sessionId,
        p_threadId: threadId,
        p_status: "success",
        p_topics: topics
      }, req.telemetryContext
    );

    return res.status(200).json({ topics });
  });
  export default router;