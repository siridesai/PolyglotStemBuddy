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
    const assistant = await getAssistant(); // <-- Get the assistant object
    const contextString = message
                          .filter(m => m.type === 'assistant')
                          .map(m => m.content)
                          .join('\n\n');
  

    // 3. Create a run to generate quiz questions in the same thread
    const run = await assistantClient.beta.threads.runs.create(threadId, {
       assistant_id: assistant.id,
        model: assistant.model,
        temperature: 0.1,
        instructions: `User Requirements

                      Age group: ${age} years old

                      Language: ${language}

                      Context: ${contextString}

                      Response Rules

                      Create exactly 5 multiple-choice questions that directly relate to and are EXCLUSIVELY ABOUT ALL OF: "${contextString}".

                      Questions cannot be subjective (e.g., no questions like "What's your favorite color?").

                      Ensure questions are NOT duplicates of chatbot questions present in ${contextString}.

                      Use ${language} suitable for age ${age}.

                      Questions must be strictly age-appropriate and relevant to ${age} and must be directly related to ${contextString}.

                      Include fun facts or interesting information related to the questions.

                      For ages 13 through 16, always present any mathematical or chemical equations in LaTeX format.

                      Important LaTeX Math Formatting and Escaping Instructions:

                      Use standard Markdown LaTeX delimiters:

                      Inline math must be wrapped with single dollar signs: $ ... $.

                      Block math may be wrapped with double dollar signs: $$ ... $$.

                      Every single backslash (\) in LaTeX commands must be escaped as double backslashes (\\) in the raw JSON output string.

                      For example, to represent the fraction \frac{3}{4}, output it as "$\\\\frac{3}{4}$" in the JSON.

                      This escaping ensures that after JSON parsing, the frontend receives the correct single backslash for valid LaTeX rendering.

                      Do not use parentheses or other delimiters around LaTeX formulas, such as (\frac{3}{4}), \$$\\frac{3}{4}\$$, or unescaped $\frac{3}{4}$. These will NOT render correctly in Markdown.

                      Mixed fractions must be formatted as a single math expression without spaces, symbols, or parentheses between the whole number and the fraction.

                      Correct: $2\\\\frac{3}{4}$

                      Incorrect: $2 \\\\frac{3}{4}$, $(2\\\\frac{3}{4})$, or $2 \\\\frac{3}{4}$ with spaces or words like “and” or plus signs.

                      Use LaTeX commands consistently (e.g., \\frac, \\times) and escape all backslashes accordingly in all quiz fields: questions, options, and explanations.

                      Return only a pure JSON array of question objects without any markdown formatting, fences, or extra text.

                      Example Pure JSON (for reference):
                      [
                        {
                          "question": "Which is equal to $2\\\\frac{1}{2}$ as an improper fraction?",
                          "options": [
                            "$\\\\frac{3}{2}$",
                            "$\\\\frac{5}{2}$",
                            "$\\\\frac{8}{2}$",
                            "$\\\\frac{2}{5}$"
                          ],
                          "correctAnswer": 1,
                          "explanation": "$2\\\\frac{1}{2} = \\\\frac{5}{2}$ because $2\\\\times2+1=5$."
                        }
                      ]
                      Notes:

                      All LaTeX backslashes must be escaped twice (\\) in JSON strings so that, after parsing, they become a single backslash (\) recognized by the renderer.

                      This applies equally to questions, options, and explanations.

                      Always enclose inline math inside single dollar signs ($...$), block math inside double dollar signs ($$...$$).

                      Do not use LaTeX in parentheses like (\frac{2}{3}) since these won't render properly in Markdown.

                      These LaTeX formatting rules apply in all languages you generate (e.g., Kannada, Marathi, Hindi, Spanish, etc.). Math expressions must always conform to these dollar sign delimiter and escaping rules regardless of language.

                      Format the final assistant output as only the pure JSON array shown above — no markdown fences or other decorations.

                      Use the native ${language} script exclusively in the output.

                      All string values in the JSON must be enclosed in double quotes ("), including explanations.

                      Do NOT output raw text without quotes; all answers, explanations, questions, and options must be valid JSON strings.

                      The final output must be a valid JSON array parsable without error.`,
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
    let content = '';
    if (lastMessage) {
      try {
        // Correct content extraction:
        content = lastMessage.content.find(c => c.type === 'text')?.text?.value || '';
        // Attempt to extract JSON array if extra text or markdown fences are present
        const jsonMatch = content.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("No valid JSON array found in assistant response.");
        quizQuestions = JSON.parse(jsonMatch[0]);
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
