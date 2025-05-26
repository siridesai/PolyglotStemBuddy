import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const azureOpenAIKey = process.env.VITE_AZURE_OPENAI_KEY;
const azureOpenAIEndpoint = process.env.VITE_AZURE_OPENAI_ENDPOINT;
const azureOpenAIVersion = "2024-05-01-preview";

if (!azureOpenAIKey || !azureOpenAIEndpoint) {
    throw new Error("Please set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT in your environment variables.");
}


const getClient = () => {
    const assistantsClient = new AzureOpenAI({
        endpoint: azureOpenAIEndpoint,
        apiVersion: azureOpenAIVersion,
        apiKey: azureOpenAIKey,
    });
    return assistantsClient;
};

export const runAssistantBackend = async (message, age, language = 'en') => {
    try {
        const assistantsClient = getClient();
        
        // Create a thread
        const thread = await assistantsClient.beta.threads.create({});

        // Add the user's message to the thread
        await assistantsClient.beta.threads.messages.create(thread.id, {
            role: "user",
            content: message,
        });

        // Create the assistant
        const assistant = await assistantsClient.beta.assistants.create({
            model: "gpt-4o-mini",
            name: "Assistant248",
            instructions: "You're an AI tutor assistant specializing in STEM topics for school students. You cater to 3 different age groups 5-8, 9-12 and 13-16. If no age group is specified assume it is 9-12 age group. If the age group is specified then respond to the question with an answer that relevant to that age group. The answer must be precise and concise. Offer age appropriate follow-up prompt suggestions. By default use English as the language for responses. If the user specifies a different language preference, only then use that language. Include ASCII art diagrams in the response to explain the concept. Render the ASCII art diagram so it shows as a readable image.",
            tools: [],
            tool_resources: {},
            temperature: 0.1,
            top_p: 1
        });

        // Run the thread
        const run = await assistantsClient.beta.threads.runs.create(thread.id, {
            assistant_id: assistant.id,
        });

        // Poll for completion
        let runStatus = run.status;
        while (runStatus === 'queued' || runStatus === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const runStatusResponse = await assistantsClient.beta.threads.runs.retrieve(
                thread.id,
                run.id
            );
            runStatus = runStatusResponse.status;
        }

        // Get the messages once complete
        if (runStatus === 'completed') {
            const messages = await assistantsClient.beta.threads.messages.list(thread.id);
            return messages.data[0].content[0].text.value;
        } else {
            throw new Error(`Run failed with status: ${runStatus}`);
        }
    } catch (error) {
        console.error(`Error running assistant: ${error.message}`);
        throw error;
    }
};