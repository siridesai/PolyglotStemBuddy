<p align="center">
  <img src="https://github.com/siridesai/PolyglotStemBuddy/blob/main/public/images/banner.jpg">
</p>

## Polyglot STEM Buddy
AI-powered chat-based application for teaching STEM concepts to kids—across ages and languages!
Let kids select their age and language, chat with the bot, and generate flashcards, quizzes, or a PDF summary.
Great tool for students, parents, and educators!
Try it live: [https://www.polyglotstembuddy.org](https://www.polyglotstembuddy.org).

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

- Frontend: React.js, TypeScript
- UX Design: Bolt.new
- Backend: Node.js/Express
- Hosted On: Azure App Service
- AI: Azure OpenAI (GPT-4o-mini LLM)
- Speech and Transcription: Azure Cognitive Services (Speech SDK)
- PDF: jsPDF, html2canvas
- Monitoring: Azure Application Insights

---

### ⚙️ Quick Start

- git clone https://github.com/yourusername/polyglot-stem-buddy.git
- cd polyglot-stem-buddy
- npm install
- cp .env.example .env
  
### Edit .env for your configuration

Example `.env` keys:
- OPENAI_API_KEY=your_azure_openai_key
- AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
- SPEECH_KEY=your_azure_speech_key
- SPEECH_REGION=your_azure_region
- TIME_WINDOW_MS=900000
- MAX_REQ=100
- ENABLE_APPINSIGHTS=true
- APPLICATIONINSIGHTS_CONNECTION_STRING=your_connection_string
- VITE_FEEDBACK_FORM_BASE_URL=your_feedback_form_link
- VITE_FEEDBACK_FORM_FIELD_LANGUAGE=form_field_GUID_for_language
- VITE_FEEDBACK_FORM_FIELD_AGE_GROUP=form_field_GUID_for_age_group

---

### ▶️ Usage

- **Build for production:**  
  `npm run build`
- **To test locally:**  
  `npm run local-server`
- **Visit:**  
  `http://localhost:3000`
- For reference, see [https://www.polyglotstembuddy.org](https://www.polyglotstembuddy.org).
- If you plan to deploy this as an Azure App Service, refer to the [GitHub action workflow](https://github.com/siridesai/PolyglotStemBuddy/blob/main/.github/workflows/main_polyglot-stem-buddy.yml).

---

### 📝 How It Works

1. Select age & language
2. Chat about STEM topics
3. Generate study aids:
   - Flashcards
   - Quiz
   - PDF summary
4. Exit lesson & provide feedback

---

### 🔧 Configuration

| Variable                               | Purpose                                               |
|-----------------------------------------|-------------------------------------------------------|
| `OPENAI_API_KEY`                        | Azure OpenAI API key                                  |
| `AZURE_OPENAI_ENDPOINT`                 | Azure OpenAI endpoint                                 |
| `SPEECH_KEY`                            | Azure Speech Service key                              |
| `SPEECH_REGION`                         | Azure region (e.g., `eastus`)                         |
| `TIME_WINDOW_MS`                        | Rate limiter window (milliseconds)                    |
| `MAX_REQ`                               | Max requests per window                               |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Azure Application Insights connection string (optional)|
| `ENABLE_APPINSIGHTS`                    | Enable Application Insights (optional)                |
| `VITE_ENABLE_APPINSIGHTS`               | Enable App Insights in Vite frontend (optional)       |
| `VITE_APPINSIGHTS_CONNECTION_STRING`    | Vite Application Insights connection string (optional) |
| `VITE_FEEDBACK_FORM_FIELD_LANGUAGE`     | Feedback form field: language                         |
| `VITE_FEEDBACK_FORM_FIELD_AGE_GROUP`    | Feedback form field: age group                        |

**Notes:**
- Variables starting with `VITE_` are for the frontend (Vite).
- Optional variables can be omitted if not needed.
  
---

### 🤝 Contributing

1. Fork the repo
2. Create a branch (git checkout -b feature/your-feature)
3. Commit your changes
4. Push and open a pull request

---

### 📄 License

MIT License. See LICENSE.

---

### 💬 Feedback

We value your input! Your feedback helps us improve Polyglot STEM Buddy and make it more effective for learners of all ages and backgrounds. If you have comments, ideas, or feature requests, please feel free to open an issue on our [GitHub Issues](https://github.com/siridesai/PolyglotStemBuddy/issues) page.

_STEM learning made simple✨_
