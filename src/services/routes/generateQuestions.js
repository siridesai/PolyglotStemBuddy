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
    const contextString = message
                          .filter(m => m.type === 'assistant')
                          .map(m => m.content)
                          .join('\n\n');
  

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
        1. Create 5 multiple-choice questions that directly relate to and are EXCLUSIVELY ABOUT ALL OF: "${contextString}". 
          The questions **cannot** be subjective; for example, do not ask any questions like, "What's your favorite color?". 
          Ensure that the questions generated are not the same as the ones that are asked by the chatbot in ${contextString}. **
        2. Use ${language} suitable for age ${age}.
        3. Questions should be strictly age appropriate only relevant to ${age}.
        4. Include fun facts or interesting information related to the questions.
        5. For ages 13 through 16, always use mathematical or chemical equations in LaTeX.
          When generating answers with math, always use Markdown with standard LaTeX math delimiters: $ ... $ for inline math, and $$ ... $$ for block math.
          Never use parentheses (e.g., (\frac{2}{3})); only use dollar sign delimiters.
          For all mathematical or chemical expressions, use Markdown with standard LaTeX math delimiters.

          IMPORTANT—LaTeX Escaping:

          When outputting any LaTeX formula, every backslash (\) must be escaped as two backslashes (\\) in the pure JSON output, so that upon decoding, the frontend receives a single correct backslash for LaTeX commands.

          For example, output "$\\frac{1}{3}$" in JSON, not "$\frac{1}{3}$".

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

          In quiz options, questions, and explanations, always use this format for mixed fractions.

          Example Pure JSON (for reference):
          json
          [
            {
              "question": "Which is equal to $2\\frac{1}{2}$ as an improper fraction?",
              "options": ["$\\frac{3}{2}$", "$\\frac{5}{2}$", "$\\frac{8}{2}$", "$\\frac{2}{5}$"],
              "correctAnswer": 1,
              "explanation": "$2\\frac{1}{2} = \\frac{5}{2}$ because $2\\times2+1=5$"
            }
          ]
           All LaTeX backslashes must be escaped twice in JSON strings as \\ so that when parsed they become a single backslash \ recognized by the renderer.
            For example, the fraction should be represented as $\\frac{2}{3}$ in JSON, so it renders as $ \frac{2}{3} $.

            Always enclose inline math inside single dollar signs ($...$), and block math inside double dollar signs ($$...$$).

            Do not use LaTeX in parentheses like (\frac{2}{3}), which won't be rendered as math in Markdown. 
            These LaTeX formatting rules apply in all languages you generate, including Kannada, Marathi, Hindi, Spanish, etc.  
            Math expressions must always follow the dollar sign delimiter and escaping rules regardless of language.
            
        6. Format response as: 
           [{
             question: "...", 
             options: ["...", "...", "...", "..."], 
             correctAnswer: 0-3, 
             explanation: "..."
           }]
        7. NO MARKDOWN FORMATTING - return only pure JSON
           All response content should be a valid JSON array of question objects.

            Each string field (question, options, explanation) is a JSON string and must correctly escape any LaTeX backslashes (\\).

            The JSON string may contain LaTeX delimiters $...$ or $$...$$ as text, never omit or alter these during serialization.

            **Example of required JSON output format:**

             [
              {
                "question": "What is $\\frac{1}{2}$ plus $\\frac{1}{4}$?",
                "options": ["$\\frac{2}{3}$", "$\\frac{3}{4}$", "$\\frac{1}{2}$", "$\\frac{5}{6}$"],
                "correctAnswer": 1,
                "explanation": "Adding $\\frac{1}{2}$ and $\\frac{1}{4}$ yields $\\frac{3}{4}$."
              }
            ]

            **Important Notes:**
          
            - Return ONLY this pure JSON array, nothing else.
            - Escape LaTeX backslashes as shown.
            - Do not include markdown fences or any other text.
            - You must respond ONLY in ${language}, using the native ${language} script entirely.
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
