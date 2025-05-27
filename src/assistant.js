import { getAssistantClient } from './assistantClient.js';


let assistant = null;

   export const initializeAssistant = async() => {
     if (!assistant) {
        const assistantsClient = getAssistantClient();
         assistant =  await assistantsClient.beta.assistants.create({
            model: "gpt-4o-mini",
            name: "Assistant248",
            instructions: "You're an AI tutor assistant specializing in STEM topics for school students. You cater to 3 different age groups 5-8, 9-12 and 13-16. If no age group is specified assume it is 9-12 age group. If the age group is specified then respond to the question with an answer that relevant to that age group. The answer must be precise and concise. Offer age appropriate follow-up prompt suggestions. By default use English as the language for responses. If the user specifies a different language preference, only then use that language. Include ASCII art diagrams in the response to explain the concept. Render the ASCII art diagram so it shows as a readable image.",
            tools: [],
            tool_resources: {},
            temperature: 0.1,
            top_p: 1
        });
     }
     return assistant;
   }

   export const getAssistant = () =>  {
     if (!assistant) {
       throw new Error('Assistant not initialized. Call initializeAssistant first.');
     }
     return assistant;
   }

  


