const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const azureOpenAIKey = process.env.VITE_AZURE_OPENAI_KEY;
const azureOpenAIEndpoint = process.env.VITE_AZURE_OPENAI_ENDPOINT;
const azureOpenAIVersion = "2024-05-01-preview";

if (!azureOpenAIKey || !azureOpenAIEndpoint) {
    throw new Error("Please set AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT in your environment variables.");
}

const getClient = () => {
    return new OpenAI({
        apiKey: azureOpenAIKey,
        baseURL: `${azureOpenAIEndpoint}/openai/deployments/gpt-4`,
        defaultQuery: { 'api-version': azureOpenAIVersion },
        defaultHeaders: { 'api-key': azureOpenAIKey }
    });
};

app.post('/runAssistant', async (req, res) => {
    try {
        const { message, age, language = 'en' } = req.body;
        const client = getClient();

        const completion = await client.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You're an AI tutor assistant specializing in STEM topics for school students. You cater to 3 different age groups 5-8, 9-12 and 13-16. If no age group is specified assume it is 9-12 age group. If the age group is specified then respond to the question with an answer that relevant to that age group. The answer must be precise and concise. Offer age appropriate follow-up prompt suggestions. By default use English as the language for responses. If the user specifies a different language preference (${language}), only then use that language.`
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        res.json({ result: completion.choices[0].message.content });
    } catch (error) {
        console.error("Backend API error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});