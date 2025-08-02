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
                      Question Generation

                      Create exactly 5 multiple-choice questions strictly about all content in ${contextString} and only about that.

                      Questions must be objective and fact-based—no subjective questions.

                      Avoid any duplication of chatbot questions present in ${contextString}.

                      Use ${language} suitable for the ${age}-year-old audience.

                      Questions should be strictly age-appropriate and directly relevant to ${contextString}.

                      Include fun facts or interesting related information in the explanations.

                      Mathematical and LaTeX Formatting Rules (especially for ages 13-16)

                      Use standard Markdown LaTeX delimiters:

                      Inline math wrapped with single dollar signs: $...$

                      Block math wrapped with double dollar signs: $$...$$

                      Crucial LaTeX Backslash Escaping:

                      Every single backslash \ in all LaTeX commands and symbols (e.g., \frac, \sqrt, \sum, and Greek letters like \mu, \nu, \pi) must be replaced with two backslashes \\ in the raw JSON output string.

                      This includes backslashes anywhere in the LaTeX expression — inside subscripts, superscripts, concatenated strings, or dynamic variables.

                      For example:

                      \frac{3}{4} → $\\frac{3}{4}$

                      \mu → \\mu

                      $T_{\mu\nu}$ → $T_{\\mu\\nu}$

                      The full expression G_{\mu\nu} = \frac{8\pi G}{c^4} T_{\mu\nu} must be escaped as: $G_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$  

                      "G_{\\mu\\nu}"  ← correct  
                      "G_{\mu\nu}"    ← incorrect (will cause errors or incorrect rendering)


                      Important: Perform the double backslash replacement on the entire LaTeX string before converting or embedding it into JSON.

                      This is the key step: apply your backslash escaping uniformly to all parts of the LaTeX code, including dynamically generated content, before any JSON serialization or output formatting.

                      Do NOT:

                      Use any extra delimiters or parentheses around LaTeX formulas (no (\frac{3}{4}), no \$$\\frac{3}{4}\$$) — only $...$ or $$...$$.

                      Use triple backslashes \\\ or quadruple \\\\ or inconsistent escaping forms like \\\\div.

                      Insert spaces, words, or extra symbols inside mixed fractions.

                      Mix escaped and non-escaped backslashes—escape all or none, consistently.

                      Apply all escaping rules consistently across questions, options, and explanations.

                      JSON Output Format

                      Return exactly 5 question objects in a pure JSON array.

                      Do NOT output markdown fences, code blocks, explanations, or any extra text.
                      
                      DO NOT use any other markdown such as \`\`\`json.

                      Each question object must have the following fields:

                      "question": string

                      "options": array of strings (typically 4 options)

                      "correctAnswer": integer (0-based index for the correct option)

                      "explanation": string (concise, with fun facts/clarifications)

                      All strings must use double quotes " including text inside LaTeX formulas.

                      Example of fully correct escaping in JSON:
                      {
                        "question": "What does the symbol $G_{\\mu\\nu}$ represent in Einstein's field equation?",
                        "options": [
                          "The speed of light",
                          "The gravitational constant",
                          "The curvature of spacetime",
                          "The stress-energy tensor"
                        ],
                        "correctAnswer": 2,
                        "explanation": "$G_{\\mu\\nu}$ represents the curvature of spacetime, which is influenced by matter and energy."
                      }

                      Use the native ${language} script exclusively in all output fields.

                      The final output must be valid JSON parsable without any errors.

                      Please follow these instructions meticulously to generate well-formed, escape-safe, age-appropriate, language-specific multiple-choice questions in JSON format.`,
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
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No valid JSON array found in assistant response.");
        quizQuestions = JSON.parse(jsonMatch[0].replace(/^```(?:json)?\s*/i, ''));
      } catch (err) {
       console.error('JSON parse error:', err, 'Content:', content);

        try {
              let preCleaned = content;
 
              const latexPlaceholder = '__LATEX_BS_PLACEHOLDER__';
              preCleaned = preCleaned.replace(/(\${1,2})([\s\S]+?)\1/g, (match, delim, inner) => {
                let temp = inner.replace(/\\\\/g, latexPlaceholder);
                temp = temp.replace(/\\/g, '\\\\');
                temp = temp.replace(new RegExp(latexPlaceholder, 'g'), '\\\\');
                return delim + temp + delim;
              });

              const globalPlaceholder = '__GLOBAL_BS_PLACEHOLDER__';
              preCleaned = preCleaned.replace(/\\\\/g, globalPlaceholder);
              preCleaned = preCleaned.replace(/\\/g, '\\\\');
              preCleaned = preCleaned.replace(new RegExp(globalPlaceholder, 'g'), '\\\\');

              quizQuestions = JSON.parse(preCleaned);
            } catch (finalErr) {
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
