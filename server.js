import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runAssistantBackend } from './src/api/backend.js';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/runAssistant', async (req, res) => {
    try {
        const { message, age, language } = req.body;
        const result = await runAssistantBackend(message, age, language);
        res.json({ result });
    } catch (error) {
        console.error("Backend API error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});