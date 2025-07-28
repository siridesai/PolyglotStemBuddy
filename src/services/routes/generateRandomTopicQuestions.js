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
  const instructions = `Generate three unique, age-appropriate, single-line STEM questions strictly related to ${topic} for a student in age group ${age} plus 3 years. 
                        Example: if ${age} is 5, then the age group is 5 to 8. 
                        Ensure the questions are engaging, educational, and suitable for the specified age range and in ${language} only.
                        Use native script JSON format for the response.
                        Each time you receive this prompt, generate a new set of questions, varying the subtopics and wording, even if the input is the same.
                        Do not repeat questions from previous sessions, and rotate through different STEM subtopics suitable for the age group.
                        Respond only in this JSON format using respective native script of ${language}.
                        Respond ONLY in ${language} and in the native script of ${language}. Do NOT use English or any other language under any circumstances.
                        For ages 13 through 16, always use mathematical or chemical equations in LaTeX.
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

                        For ages 13 through 16, always present mathematical or chemical equations in LaTeX using the above delimiters when relevant.

                        **Ensure all generated content is clear, concise, and formatted for the appropriate ${age} group in ${language} and strictly belongs to ${topic}.**

                        Review rendered output to confirm math displays as intended and revise if it shows raw code instead of rendered math.
                        Example: For 'kn' language, response should be in the following format - 
                        {"topicQuestions":["ವಿದ್ಯುತ್ ಸರಣಿಯಲ್ಲಿ ಪ್ರತಿರೋಧಕದ ಪಾತ್ರವೇನು?", "ಯಂತ್ರವಿಜ್ಞಾನದಲ್ಲಿ ಸರಳ ಯಂತ್ರಗಳ ಉದಾಹರಣೆಗಳನ್ನು ಹೇಳಿ.", "ಭೌತಶಾಸ್ತ್ರದಲ್ಲಿ ಗುರ್ತಿಸುವ ನಿಯಮ ಯಾವುದು?"]}`;

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

    return res.status(200).json(topics);
  });
  export default router;