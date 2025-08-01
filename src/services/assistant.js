import { getAssistantClient } from './assistantClient.js';

let assistant = null;

   export const initializeAssistant = async() => {
     if (!assistant) {
        const assistantsClient = getAssistantClient();
         assistant =  await assistantsClient.beta.assistants.create({
            model: "gpt-4o-mini",
            name: "Assistant248",
            instructions: "",
            tools: [],
            tool_resources: {},
            temperature: 0.1,
            top_p: 1
        });
     }
     return assistant;
   }

   export const getAssistant = async ()  =>  {
     if (!assistant) {
       console.log("Lazy initializing assistant...");
       assistant = await initializeAssistant();
     }
     return assistant;
   }

  


