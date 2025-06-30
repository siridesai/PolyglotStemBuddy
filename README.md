# Polyglot STEM Buddy 🌱🔬

An AI-powered educational chatbot that teaches STEM concepts to kids in multiple languages. Users select their age and language, then interact with the chatbot to learn science topics. After learning, they can generate study materials like flashcards, quizzes, and downloadable PDF summaries.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Key Features
- **Age-Adaptive Learning**: Content tailored for ages 5-15
- **Multilingual Support**: English, Español, हिंदी, ಕನ್ನಡ, मराठी
- **Interactive Tools**:
  - AI Chatbot with voice input/output
  - Flashcard generator
  - Quiz creator
  - PDF summary exporter
- **Accessibility Focus**: Voice interaction and visual diagrams

## Technologies Used
- **Frontend**: React.js + Vite
- **Backend**: Node.js/Express
- **AI Services**:
  - Azure OpenAI API (ChatGPT)
  - Azure Speech SDK (Text-to-Speech/STT)
- **Diagramming**: Mermaid.js
- **PDF Generation**: jsPDF + html2canvas

## Installation
*Clone repository*
git clone https://github.com/yourusername/polyglot-stem-buddy.git

*Install dependencies*
cd polyglot-stem-buddy
npm install

*Set environment variables*
cp .env.example .env
    
*Add your Azure credentials to `.env`:*
VITE_OPENAI_API_KEY=your_azure_openai_key
VITE_SPEECH_KEY=your_azure_speech_key
VITE_SPEECH_REGION=your_azure_region

## Usage
*Start development server*
npm run dev

*Build for production*
npm run build

Visit `http://localhost:3000` and:
1. Select age group and language
2. Ask STEM questions in the chat
3. After learning, choose to:
   - Generate flashcards
   - Create a quiz
   - Download PDF summary
   - Exit lesson

## Configuration
| Environment Variable | Purpose |
|----------------------|---------|
| `VITE_OPENAI_API_KEY` | Azure OpenAI API key |
| `VITE_SPEECH_KEY` | Azure Speech Service key |
| `VITE_SPEECH_REGION` | Azure region (e.g., `eastus`) |

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add some feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a pull request

## License
This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

## Acknowledgments
- Azure Cognitive Services for speech/ML capabilities
- OpenAI for foundational models
- Mermaid.js for accessible diagrams


