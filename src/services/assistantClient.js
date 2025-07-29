import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const azureOpenAIKey = process.env.AZURE_OPENAI_KEY;
const azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureOpenAIVersion = "2024-05-01-preview";

if (!azureOpenAIKey || !azureOpenAIEndpoint) {
    throw new Error("Please set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT in your environment variables.");
}

const getClient = () => {
    const assistantClient = new AzureOpenAI({
        endpoint: azureOpenAIEndpoint,
        apiVersion: azureOpenAIVersion,
        apiKey: azureOpenAIKey,
    });
    return assistantClient;
};

let assistantClient = null;

   export const initializeAssistantClient = () => {
     if (!assistantClient) {
        assistantClient = getClient();

     }
     return assistantClient;
   }

   export const getAssistantClient = () => {
     if (!assistantClient) {
       console.log("Assistant client not initialized yet, initializing...");
       assistantClient = getClient();
     }
     return assistantClient;
   }

  
