# Journey Assist MVP

A conversational navigation interface that allows natural language route modifications through an LLM-powered assistant, integrated with MapBox for visualization and routing.

## Features

- **Real-time Map Display**: MapBox GL JS integration with dark mode optimized for car dashboards
- **Destination Search**: Real-time autocomplete powered by MapBox Geocoding API
- **Route Calculation**: Automatic route calculation with turn-by-turn directions
- **Voice Input**: Natural language voice commands with wake word detection ("Hey Journey") and Azure Whisper transcription
- **Conversational Route Modification**: LLM-powered natural language interface for route adjustments
- **Route Comparison**: Visual comparison of multiple route alternatives
- **Real-time Navigation**: Continuous GPS tracking with turn-by-turn guidance

## Prerequisites

- Node.js 18+ and npm/pnpm
- MapBox account and API token ([Get one here](https://account.mapbox.com/access-tokens/))
- Azure OpenAI account with Whisper deployment (for voice input)
- LLM API key (optional for LLM features):
  - OpenAI API key, or
  - Anthropic API key

## Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd code
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# MapBox API Configuration (Required)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# Azure OpenAI Configuration (Required for voice input)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint_here
AZURE_OPENAI_DEPLOYMENT=whisper  # Optional, defaults to "whisper"

# LLM API Configuration (Optional - for conversational route modification)
# Choose one:
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Note**: If no LLM API key is provided, the app will use a simple rule-based fallback for route modifications.

4. **Run the backend server** (for voice transcription)

In one terminal, start the Express backend server:

```bash
node server.js
```

The backend server will run on [http://localhost:3001](http://localhost:3001)

5. **Run the development server**

In another terminal, start the Next.js development server:

```bash
npm run dev
# or
pnpm dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Search for a destination**: Type in the search bar to find your destination
2. **Start navigation**: Click "Start Navigation" to calculate and display the route
3. **Use voice input**: Click the microphone button (top-right corner) to enable voice commands
   - Say "Hey Journey" to activate recording
   - Speak your command naturally
   - Recording stops automatically after 3.5 seconds of silence
4. **Modify route**: Click "Modify Route" or use voice/text input to request changes:
   - "Make it more scenic"
   - "Avoid highways"
   - "Find the fastest route"
   - "Go through downtown"
5. **Compare routes**: Review alternative routes and select your preferred option
6. **Navigate**: Follow turn-by-turn directions with real-time GPS tracking

## Project Structure

```
journey-assist/
├── app/
│   ├── api/
│   │   └── route-modification/    # LLM API endpoint
│   ├── page.tsx                   # Main page component
│   └── layout.tsx                 # Root layout
├── components/
│   ├── map-view.tsx               # MapBox map component
│   ├── destination-search.tsx     # Destination search with autocomplete
│   ├── navigation-info.tsx        # Turn-by-turn navigation display
│   ├── conversational-input.tsx    # LLM-powered route modification
│   └── route-comparison.tsx       # Route alternatives comparison
├── lib/
│   └── services/
│       ├── mapboxService.ts       # MapBox API integration
│       ├── geolocationService.ts  # Browser geolocation
│       ├── llmService.ts          # LLM integration
│       └── microphoneService.ts   # Voice input & wake word detection
├── hooks/
│   ├── useGeolocation.ts          # Geolocation React hook
│   └── useMicrophone.ts           # Voice input React hook
└── server.js                       # Express backend for Azure Whisper transcription
```

## API Keys Setup

### MapBox

1. Sign up at [mapbox.com](https://www.mapbox.com/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Create a new token or use the default public token
4. Add it to `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

### OpenAI (Optional)

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new API key
4. Add it to `.env.local` as `OPENAI_API_KEY`

### Anthropic (Optional)

1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Go to API Keys section
3. Create a new API key
4. Add it to `.env.local` as `ANTHROPIC_API_KEY`

### Azure OpenAI (Required for Voice Input)

1. Create an Azure account at [portal.azure.com](https://portal.azure.com/)
2. Create an Azure OpenAI resource
3. Deploy a Whisper model (e.g., `whisper`)
4. Get your API key and endpoint from the Azure portal
5. Add them to `.env.local`:
   - `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
   - `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
   - `AZURE_OPENAI_DEPLOYMENT`: Your Whisper deployment name (defaults to "whisper")

## Technologies

- **Next.js 16**: React framework with App Router
- **React 19**: Latest React features
- **TypeScript**: Type-safe development
- **MapBox GL JS**: Interactive maps and routing
- **Tailwind CSS 4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Express**: Backend server for voice transcription
- **Azure OpenAI Whisper**: Speech-to-text transcription
- **Web Speech API**: Browser-based wake word detection

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Browser Support

- **Chrome/Edge (required for voice input)**: Full support including Web Speech API for wake word detection
- Firefox: Map and navigation features only (no voice input)
- Safari: Map and navigation features only (no voice input)
- Requires browser geolocation API support

**Note**: Voice input with wake word detection ("Hey Journey") requires Chrome or Edge browser due to Web Speech API compatibility.

## License

MIT

