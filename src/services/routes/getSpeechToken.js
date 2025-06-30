import express from 'express';
import { getAssistantClient, initializeAssistantClient } from '../assistantClient.js';
import { getAssistant, initializeAssistant } from '../assistant.js';
import axios from 'axios'; // Add this at the top
import appInsights from 'applicationinsights';

const router = express.Router();

const speechKey = process.env.SPEECH_KEY;
const speechRegion = process.env.SPEECH_REGION;

router.get('/getSpeechToken', async (req, res, next) => {
    const appInsightsClient = appInsights.defaultClient;
    res.setHeader('Content-Type', 'application/json');

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            appInsightsClient.trackEvent({
                name: "GetSpeechTokenEvent",
                properties: {
                    p_status: "success"
                }
            })
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            appInsightsClient.trackEvent({
                name: "GetSpeechTokenEvent",
                properties: {
                    p_status: "failure"
                }
            })
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});

export default router;