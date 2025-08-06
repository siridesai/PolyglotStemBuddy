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
    const assistant = await getAssistant();
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
    
    if (err.message.includes("ThreadNotFound")) {
    // If thread not found, create a new one and retry internally
    try {
      await deleteCurrentThread(sessionId);
      const newThreadId = await getOrCreateThread(sessionId);

      const responseContent = await assistantClient.beta.threads.retrieve(threadId);

      return res.status(200).json({
        content: responseContent,
        message: 'Retried with new thread after old thread was not found.',
        threadId: newThreadId
        });
  
        } catch (retryErr) {
        console.error('Failed retry after thread recreation:', retryErr);
        return res.status(500).json({ error: 'Failed to recover from missing thread.' });
        }
      } else {
        // Other errors
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
      }
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
                        **An expression like $T_{\mu\nu}$ must be written as $T_{\\mu\\nu}$ inside JSON.**

                       For block math (e.g.)
                        $$
                        \\frac{2}{3} \\div \\frac{4}{5} = \\frac{2}{3} \\times \\frac{5}{4} = \\frac{5}{6}
                        $$
                        ).
                        All math commands (frac, sqrt, sum, overline, etc) and Greek letters (mu, nu, pi, etc) must follow this escaping rule.
                        Each backslash in these commands or symbols must be double escaped as \\. For example, \mu must be written as \\mu in the JSON string.

                        Specifically, every single backslash \ in LaTeX commands (such as \frac, \sqrt, \sum) and Greek letters (like \mu, \nu, \pi, etc.) must be replaced with a double backslash \\ in the JSON strings.

                        This is required because \ is a special escape character in JSON and needs to be escaped to preserve the literal backslash for LaTeX processing later.

                        For example:

                        The LaTeX command \mu must appear as \\mu in the JSON string.

                        **An expression like $T_{\mu\nu}$ must be written as $T_{\\mu\\nu}$ inside JSON.**

                        When generating or writing JSON manually, confirm all instances of \ within math expressions are doubled.
                      
                        Do not use other delimiters like (\frac{2}{3}), $$ ... $$, or $$ ... $$ for math expressions; these won't be rendered by the Markdown parser.

                        Escape backslashes properly for LaTeX (e.g., \\frac{2}{3} in JSON or string literals, so it is received as \frac{2}{3} when parsed).

                        **IMPORTANT:** 
                        Every single LaTeX backslash (\) must be escaped as double backslash (\\) in JSON or string outputs so that the front end receives a single backslash for correct rendering.
                      - Never put LaTeX formulas inside parentheses or any other delimiters like (\frac{2}{3}); use only $...$ and $$...$$.
                      - For ages 13-16, always present relevant mathematical or chemical equations using these delimiters and escaping rules.
                      - For mixed fractions, write the whole number immediately followed by the fraction inside math delimiters with no space or extra symbols:
                      - Inline: $3\\frac{1}{4}$
                      - The Greek letters such as mu,nu,pi,rho etc must appear as \\mu,\\nu,\\pi,\\rho in the JSON string.
                      - Example: What does the Einstein tensor $G_{\\mu\\nu}$ represent in general relativity?
                      - Block:
                        $$
                        3\\frac{1}{4}
                        $$
                      - All math commands (frac, sqrt, sum, overline, etc) and Greek letters (mu, nu, pi, etc) must follow this escaping rule.
                      - Specifically, every single backslash \ in LaTeX commands (such as \frac, \sqrt, \sum) and Greek letters (like \mu, \nu, \pi, etc.) must be replaced with a double backslash \\ in the JSON strings.

                      - This is required because \ is a special escape character in JSON and needs to be escaped to preserve the literal backslash for LaTeX processing later.

                        The Greek letters such as mu,nu,pi,rho etc must appear as \\mu,\\nu,\\pi,\\rho in the JSON string.

                        Example: What does the Einstein tensor $G_{\\mu\\nu}$ represent in general relativity?

                        When generating or writing JSON manually, confirm all instances of \ within math expressions are doubled.
                        
                      - These rules apply in all languages you output. Math expressions must always follow the dollar sign delimiter and escaping rules regardless of language.


                        For ages 13 through 16, always present mathematical or chemical equations in LaTeX using the above delimiters when relevant.

                        Every single backslash \ in all LaTeX commands and symbols (e.g., \frac, \sqrt, \sum, and Greek letters like \mu, \nu, \pi) must be replaced with two backslashes \\ in the raw JSON output string.

                        This includes backslashes anywhere in the LaTeX expression — inside subscripts, superscripts, concatenated strings, or dynamic variables.
  
                        For example:
  
                        $\frac{3}{4}$ → $\\frac{3}{4}$
  
                        \mu → \\mu
  
                        $T_{\mu\nu}$ → $T_{\\mu\\nu}$
  
                        The full expression G_{\mu\nu} = \frac{8\pi G}{c^4} T_{\mu\nu} must be escaped as: $G_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$  
  
                        "G_{\\mu\\nu}"  ← correct  
                        "G_{\mu\nu}"    ← incorrect (will cause errors or incorrect rendering)


                        Important: Perform the double backslash replacement on the entire LaTeX string before converting or embedding it into JSON.

                        **Ensure all generated content is clear, concise, and formatted for the appropriate ${age} group in ${language} and strictly belongs to ${topic}.**

                        Review rendered output to confirm math displays as intended and revise if it shows raw code instead of rendered math.
                        DO NOT use any other markdown such as \`\`\`json.
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

      textValue = textValue.replace(/```[\s]*$/, '');   
      // Double any backslash not followed by a valid JSON escape character
      textValue = textValue.replace(/\\(?![\\\/bfnrtu"])/g, '\\\\');

      console.log(textValue);
      // Attempt to parse JSON
      topics = JSON.parse(textValue);

      // Handle stringified JSON inside the title property
      while (typeof topics === 'string') {
        topics = JSON.parse(topics);
      }
    } catch (err) {
      console.log("JSON parse failed: ", err);
       let preCleaned = textValue;
 
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

              topics = JSON.parse(preCleaned);
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
