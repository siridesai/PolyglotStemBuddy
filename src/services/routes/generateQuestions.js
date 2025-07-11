import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
import { emitEvent } from '../appInsights.js'

const router = express.Router();

router.post('/generateQuestions', async (req, res) => {
  try {
    const { message, threadId, age, language } = req.body;

    if (!threadId || !language) {
      emitEvent("QuestionEvent", {
        p_age: age,
        p_language: language,
        p_threadId: threadId,
        p_status: "failure",
        p_errcode: 'MissingParams'
      },req.telemetryContext);

      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const assistantClient = getAssistantClient();
    const assistant = getAssistant(); // <-- Get the assistant object
    const contextString = message.map(m => m.content).join('\n\n');


    // 3. Create a run to generate quiz questions in the same thread
    const run = await assistantClient.beta.threads.runs.create(threadId, {
       assistant_id: assistant.id,
        model: assistant.model,
        temperature: 0.1,
        instructions: ` **User Requirements**
        - Age group: ${age} years old
        - Language: ${language}
        - Context: ${contextString}
        
        **Response Rules**
        1. Create between 3 and 5 multiple-choice questions that directly relate to and are EXCLUSIVELY ABOUT ALL OF: "${contextString}". 
          The questions **cannot** be subjective; for example, do not ask any questions like, "What's your favorite color?". 
          Ensure that the questions generated are not the same as the ones that are asked by the chatbot in ${contextString}. **
        2. Use ${language} suitable for age ${age}.
        3. Questions should be strictly age appropriate only relevant to ${age}.
        4. Include fun facts or interesting information related to the questions.
        5. Format response as: 
           [{
             question: "...", 
             options: ["...", "...", "...", "..."], 
             correctAnswer: 0-3, 
             explanation: "..."
           }]
        6. NO MARKDOWN FORMATTING - return only pure JSON
    `,
    tools: [{
        type: "code_interpreter" // Required for JSON parsing
    }],
    metadata: {
        age_optimization: age.toString(),
        language_constraints: `${language}-only`,
        strict_context: "enabled"
        
    }
    });

    // 4. Poll for run completion
    let runStatus;
    do {
      await new Promise(r => setTimeout(r, 1500));
      runStatus = await assistantClient.beta.threads.runs.retrieve(threadId, run.id);
    } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

    if (runStatus.status === 'failed') {
      emitEvent("QuestionEvent",
        {
          p_age: age,
          p_language: language,
          p_threadId: threadId,
          p_status: "failure",
          p_errcode: 'QuizGenFailed'
        }, req.telemetryContext
      )
      return res.status(500).json({ error: 'Quiz generation failed.' });
    }

    // 5. Retrieve the assistant's response message
    const runMessages = await assistantClient.beta.threads.messages.list(threadId);
    const lastMessage = runMessages.data
      .filter(m => m.run_id === run.id && m.role === 'assistant')
      .pop();

    let quizQuestions = [];
    // Backend: /generateQuestions endpoint
    if (lastMessage) {
      try {
        // Correct content extraction:
        const content = lastMessage.content.find(c => c.type === 'text')?.text?.value || '';
        quizQuestions = JSON.parse(content);
      } catch (err) {
        console.error('JSON parse error:', err, 'Content:', content);
        emitEvent(
          "QuestionEvent",
          {
            p_age: age,
            p_language: language,
            p_threadId: threadId,
            p_status: "failure",
            p_errcode: 'JSONParseError'
          }, req.telemetryContext
        )
        return res.status(500).json({ error: 'Failed to parse quiz JSON.' });
      }
    }
    emitEvent(
      "QuestionEvent",
      {
        p_age: age,
        p_language: language,
        p_threadId: threadId,
        p_status: "success"
      }, req.telemetryContext
    )
    return res.json({ result: quizQuestions });
  } catch (error) {
    console.error('Error in /generateQuestions:', error);
    emitEvent(
      "QuestionEvent",
      {
        p_age: age,
        p_language: language,
        p_threadId: threadId,
        p_status: "failure",
        p_errcode: "InternalServerError"
      }, req.telemetryContext
    )
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;