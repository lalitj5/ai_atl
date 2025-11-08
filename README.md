# Journey Assist MVP

A conversational navigation interface that allows natural language route modifications through an LLM-powered assistant, integrated with MapBox for visualization and routing.

## Features

- **Real-time Map Display**: MapBox GL JS integration with dark mode optimized for car dashboards
- **Destination Search**: Real-time autocomplete powered by MapBox Geocoding API
- **Route Calculation**: Automatic route calculation with turn-by-turn directions
- **Conversational Route Modification**: LLM-powered natural language interface for route adjustments
- **Route Comparison**: Visual comparison of multiple route alternatives
- **Real-time Navigation**: Continuous GPS tracking with turn-by-turn guidance

## Prerequisites

- Node.js 18+ and npm/pnpm
- MapBox account and API token ([Get one here](https://account.mapbox.com/access-tokens/))
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

# LLM API Configuration (Optional - for conversational route modification)
# Choose one:
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Note**: If no LLM API key is provided, the app will use a simple rule-based fallback for route modifications.

4. **Run the development server**

```bash
npm run dev
# or
pnpm dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Search for a destination**: Type in the search bar to find your destination
2. **Start navigation**: Click "Start Navigation" to calculate and display the route
3. **Modify route**: Click "Modify Route" or use the conversational input to request changes:
   - "Make it more scenic"
   - "Avoid highways"
   - "Find the fastest route"
   - "Go through downtown"
4. **Compare routes**: Review alternative routes and select your preferred option
5. **Navigate**: Follow turn-by-turn directions with real-time GPS tracking

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
│       └── llmService.ts          # LLM integration
└── hooks/
    └── useGeolocation.ts          # Geolocation React hook
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

## Technologies

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **MapBox GL JS**: Interactive maps and routing
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives

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

- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires browser geolocation API support

## License

MIT

