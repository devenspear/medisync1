# StillCaster

**AI-Powered Meditation Platform**

StillCaster is a sophisticated meditation application that generates personalized meditation sessions using AI-generated scripts, natural voice synthesis, and ambient music. The platform adapts to individual preferences and provides a complete mindfulness experience with Apple-inspired UI design.

## 🌟 Features

### Core Functionality
- **AI-Generated Meditation Scripts**: Personalized meditation content using OpenAI GPT models
- **Natural Voice Synthesis**: High-quality text-to-speech using ElevenLabs Voice API
- **Ambient Music Generation**: AI-generated background music via ElevenLabs Music API with Web Audio API fallback
- **Intelligent Assessment Flow**: 12-step guided setup to understand user preferences
- **Real-time Session Control**: Dynamic timer management with voice-music synchronization
- **Apple-Inspired UI**: Modern iOS-style interface with glass morphism effects

### Technical Features
- **Responsive Design**: Optimized for iPhone and mobile devices
- **Progressive Enhancement**: Works offline with fallback systems
- **Session Persistence**: Save and replay favorite meditation sessions
- **Debug Console**: Comprehensive testing tools for audio systems
- **Demo Mode**: Full functionality preview without API requirements

## 🛠 Technology Stack

- **Frontend**: Next.js 15.5.3, React 19, TypeScript
- **Styling**: Tailwind CSS with custom Apple-style components
- **Audio**: Web Audio API, ElevenLabs Voice & Music APIs
- **State Management**: Zustand with localStorage persistence
- **Authentication**: JWT-based auth system
- **Deployment**: Vercel with automatic deployments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Optional: ElevenLabs API key for enhanced features

### Installation

```bash
# Clone the repository
git clone https://github.com/devenspear/medisync1.git
cd stillcaster

# Install dependencies
npm install

# Set up environment variables (optional)
cp .env.local.example .env.local
# Add your API keys to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables (Optional)

```bash
# OpenAI API (for script generation)
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs APIs (for voice and music)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

**Note**: StillCaster works in demo mode without API keys, using sample data and Web Audio API for music generation.

## 📱 User Journey

1. **Assessment Flow**: 12-step personalized setup
   - Meditation goals and experience level
   - Voice and music preferences
   - Environmental and focus preferences
   - Duration and timing preferences

2. **AI Script Generation**: Real-time progress indicators
   - Personalized meditation scripts based on assessment
   - SSML formatting for natural speech patterns
   - Themed content matching user preferences

3. **Session Experience**: Immersive meditation sessions
   - Voice-guided meditation with ambient music
   - Dynamic timer with 5-second music fade-out
   - Session controls and volume mixing

4. **Session Management**: Save and replay favorites
   - Personal meditation library
   - Progress tracking and statistics

## 🎨 Design System

### Apple-Inspired Components
- **AppleCard**: Interactive selection cards with gradients
- **AppleToggle**: iOS-style toggle switches
- **AppleProgress**: Engaging progress indicators
- **AppleSlider**: Volume and duration controls

### Color Palette
- Primary gradients: Blue to purple spectrum
- Glass morphism with backdrop blur effects
- Dark theme with gray-900 to black gradients
- Accent colors: Orange for demo, green for success

## 🔧 API Integrations

### ElevenLabs Voice API
- Text-to-speech with natural intonation
- SSML support for pauses and emphasis
- Fallback to browser speech synthesis

### ElevenLabs Music API
- AI-generated ambient soundscapes
- 30-second looping compositions
- Fallback to Web Audio API ambient tone generation

### OpenAI API
- GPT-powered meditation script generation
- Context-aware content based on user assessment
- Fallback to curated demo content

## 🧪 Testing & Debugging

### Debug Console
Access comprehensive testing tools at `/debug-music`:
- Music generation testing with detailed logs
- Audio playback verification
- API integration status monitoring
- Fallback system validation

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Run production server
```

## 📦 Project Structure

```
stillcaster/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── debug-music/       # Debug console
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AppleUI.tsx       # Apple-style UI components
│   ├── AssessmentFlow.tsx # 12-step user setup
│   └── SessionPlayer.tsx  # Meditation session interface
├── lib/                   # Core business logic
│   ├── musicSynthesis.ts  # Music generation system
│   ├── voiceSynthesis.ts  # Voice generation system
│   ├── audioEngineV2.ts   # Audio playback engine
│   └── musicConstants.ts  # Music generation data
└── public/               # Static assets
```

## 🚢 Deployment

### Vercel Deployment
StillCaster is deployed on Vercel with automatic deployments from the main branch.

**Production URL**: https://medisync-hqgbez940-deven-projects.vercel.app

### Manual Deployment
```bash
# Deploy to Vercel
npx vercel --prod

# Or build for other platforms
npm run build
```

## 🔒 Security & Privacy

- No personal data collection in demo mode
- JWT-based authentication for premium features
- Client-side audio processing for privacy
- Secure API key management

## 🎯 Roadmap

See [PRD.md](./PRD.md) for detailed product roadmap and feature specifications.

### Near-term Goals
- Enhanced music personalization
- Social sharing features
- Advanced progress analytics
- Offline session downloads

### Long-term Vision
- AI-powered meditation coaching
- Community features and challenges
- Integration with health platforms
- Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- Audio processing powered by [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- Voice synthesis by [ElevenLabs](https://elevenlabs.io/)
- AI content generation by [OpenAI](https://openai.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**Created with ❤️ by the StillCaster team**