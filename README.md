<p align="center">
  <img src="https://i.ibb.co/Y7vbr0v7/Polyglot-STEMBuddy-picture.jpg">
</p>

## Polyglot STEM Buddy
AI-powered chatbot for teaching STEM concepts to kids—across ages and languages!
Let kids select their age and language, chat with the bot, and generate flashcards, quizzes, or a PDF summary.
Try it live: [www.polyglotstem.ai](url)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

### 🚀 Features

- Age-Adaptive: Content for ages 5–15
- Multilingual: English, Español, हिंदी, ಕನ್ನಡ, मराठी
- Study Tools: Flashcards, quizzes, downloadable PDF summaries
- Voice Support: Speak and listen with Azure Speech
- Visuals: Mermaid.js diagrams for clear explanations
- Feedback: Microsoft Forms survey on lesson exit

---

### 🛠️ Tech Stack

- Frontend: React.js
- Backend: Node.js/Express
- AI: Azure OpenAI API, Azure Speech SDK
- PDF: jsPDF, html2canvas
- Monitoring: Azure Application Insights (optional)

---

### ⚙️ Quick Start

- git clone https://github.com/yourusername/polyglot-stem-buddy.git
- cd polyglot-stem-buddy
- npm install
- cp .env.example .env
# Edit .env with your Azure/OpenAI/Speech keys and settings

Example .env keys:
- OPENAI_API_KEY=your_azure_openai_key
- AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
- SPEECH_KEY=your_azure_speech_key
- SPEECH_REGION=your_azure_region
- APPLICATIONINSIGHTS_CONNECTION_STRING=your_connection_string
- TIME_WINDOW_MS=900000
- MAX_REQ=100

---

### ▶️ Usage

- Start locally:
  npm run local-server
- Build for production:
  npm run build
- Visit:
  http://localhost:3000 (or [www.polyglotstem.ai](url))

---

### 📝 How It Works

1. Select age & language
2. Chat about STEM topics
3. Generate study aids:
   - Flashcards
   - Quiz
   - PDF summary
4. Exit lesson:
   - Feedback form appears (customize your own Microsoft Form in ExitLessonModal)

---

### 🔧 Configuration

Variable                               | Purpose
--------------------------------------- | ----------------------------------------
OPENAI_API_KEY                         | Azure OpenAI API key
AZURE_OPENAI_ENDPOINT                  | Azure OpenAI endpoint
SPEECH_KEY                             | Azure Speech Service key
SPEECH_REGION                          | Azure region (e.g., eastus)
APPLICATIONINSIGHTS_CONNECTION_STRING  | Azure Application Insights (optional)
TIME_WINDOW_MS                         | Rate limiter window (ms)
MAX_REQ                                | Max requests per window

---

### 🤝 Contributing

1. Fork the repo
2. Create a branch (git checkout -b feature/your-feature)
3. Commit your changes
4. Push and open a pull request
5. Add a fun comment if you like—robots love encouragement!

---

### 📄 License

MIT License. See LICENSE.

---

### 🙏 Acknowledgments

- Azure Cognitive Services (Speech, OpenAI)
- Mermaid.js
- jsPDF & html2canvas
- Microsoft Forms

---

_Sparking curiosity, one conversation at a time! ✨_
