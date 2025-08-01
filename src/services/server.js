import express from 'express';
import path from 'path';
import runAssistantRouter from './routes/runAssistant.js'
import generateQuestionsRouter from './routes/generateQuestions.js';
import generateSummaryRouter from './routes/generateSummary.js';
import cancelAssistantRunRouter from './routes/cancelAssistantRun.js';
import getSpeechTokenRouter from './routes/getSpeechToken.js';
import deleteThreadRouter from './routes/deleteThread.js';
import threadIDRouter from './routes/threadID.js';
import generateRandomTopicQuestionsRouter from './routes/generateRandomTopicQuestions.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { getOrCreateThread } from '../services/threadManager.js';
import { getAssistantClient, initializeAssistantClient } from '../services/assistantClient.js';
import { getAssistant, initializeAssistant } from '../services/assistant.js';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { initializeAppInsights } from './appInsights.js'
import { telemetryContextMiddleware } from './appInsights.js';
import cookieParser from 'cookie-parser';


dotenv.config();
const app = express();

app.set('trust proxy', 2);
app.use((req, res, next) => {
  // Example: Add X-Forwarded-For if missing
  if (!req.headers['x-forwarded-for']) {
    req.headers['x-forwarded-for'] = req.ip || req.socket.remoteAddress;
  }
  next();
});

const port = process.env.PORT || 3000;  // Use environment variable for port

const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING; 
initializeAppInsights(appInsightsConnectionString);


function keyGenerator(req) {
  let ip;
  
  // 1. Check X-Forwarded-For (supports arrays and strings)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    if (Array.isArray(forwardedFor)) {
      ip = forwardedFor[0];
    } else {
      ip = forwardedFor.split(',')[0].trim();
    }
  }
  
  // 2. Fallback to X-Real-IP if available
  if (!ip) {
    ip = req.headers['x-real-ip'];
  }
  
  // 3. Use Express's req.ip (respects trust proxy)
  if (!ip) {
    ip = req.ip;
  }
  
  // 4. Final fallbacks
  ip = ip || req.socket?.remoteAddress || 'unknown';
  
  // Clean IP (remove port/IPv6 brackets)
  return ip.replace(/(:\d+)?$/, '').replace(/^\[|\]$/g, '');
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());

app.use(cors());
app.use(express.json());

// Session tracking
const sessionRunMap = new Map();

const limiter = rateLimit({
  windowMs: process.env.TIME_WINDOW_MS, // 15 minutes
  max: process.env.MAX_REQ, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Adds RateLimit-* headers
  legacyHeaders: false,  // Disables X-RateLimit-* headers
  keyGenerator,
});

// Apply to all requests
app.use(limiter);
app.use(telemetryContextMiddleware);

app.get('/test-ip', (req, res) => {
  res.json({
    ip: req.ip,
    xForwardedFor: req.headers['x-forwarded-for'],
    processedIP: keyGenerator(req),
  });
});

// API Routes (MUST COME BEFORE STATIC FILES)

// Mount all routers under /api
app.use('/api', runAssistantRouter);
app.use('/api', generateQuestionsRouter);
app.use('/api', deleteThreadRouter);
app.use('/api', threadIDRouter);
app.use('/api', getSpeechTokenRouter);
app.use('/api', generateSummaryRouter);
app.use('/api', cancelAssistantRunRouter);
app.use('/api', generateRandomTopicQuestionsRouter);

// Static files (MUST COME AFTER API ROUTES)
app.use(express.static(path.join(__dirname, '../../dist')));
app.use('/assets', express.static(path.join(__dirname, '../../dist/assets')));

// SPA catch-all (MUST BE LAST)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
});

// Initialize assistants
(async () => {
  try {
    // Await initialization of assistant client and assistant before listening
    await initializeAssistantClient();
    await initializeAssistant();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize assistant client or assistant:', error);
    process.exit(1);
  }
})();
