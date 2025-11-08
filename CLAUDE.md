# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Journey Assist is an LLM-powered conversational navigation app built for car dashboards. It enables natural language route modifications through MapBox integration, optimized for in-vehicle use with dark mode and large touch targets.

**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, MapBox GL JS, Tailwind CSS 4, shadcn/ui components

## Development Commands

### Running the Application

```bash
# Development server (default port 3000)
npm run dev
# or
pnpm dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Environment Setup

Create `.env.local` with required API keys:

```env
# Required for MapBox features
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Optional - for LLM route modifications (fallback to rule-based if not provided)
OPENAI_API_KEY=your_key_here
# OR
ANTHROPIC_API_KEY=your_key_here
```

## Architecture Overview

### State Management Pattern

The app uses a centralized state management approach in `app/page.tsx` with multiple navigation states:

- **idle**: Initial state, showing destination search
- **searching**: Route calculation in progress
- **navigating**: Active navigation with route display
- **comparing-routes**: Showing alternative route options

State flows unidirectionally from the main page component down to child components via props.

### Core Data Flow

1. **Destination Selection**: User searches → MapBox Geocoding API → Place suggestions
2. **Route Calculation**: Origin + Destination → MapBox Directions API → Route with geometry + steps
3. **Route Modification**: Natural language input → LLM Service (OpenAI/Anthropic/rules) → Modified parameters → MapBox Directions API → Alternative routes
4. **Route Comparison**: Multiple routes displayed → User selects → Active route updated

### Service Layer Architecture

Three main services in `lib/services/`:

- **mapboxService.ts**: Singleton service handling MapBox API calls (geocoding, directions, alternatives)
- **llmService.ts**: Natural language parsing with fallback chain (OpenAI → Anthropic → rule-based)
- **geolocationService.ts**: Browser geolocation wrapper

All services use error handling with fallbacks to ensure app remains functional.

### Component Structure

**Layout Components**:
- `app/page.tsx`: Main orchestrator managing navigation state and data flow
- `app/layout.tsx`: Root layout with font loading and MapBox CSS imports

**Feature Components** (in `components/`):
- `map-view.tsx`: MapBox GL JS integration with route rendering and marker management
- `destination-search.tsx`: Debounced search with MapBox geocoding autocomplete
- `navigation-info.tsx`: Turn-by-turn directions display with route stats
- `conversational-input.tsx`: Chat-style interface for natural language route modifications
- `route-comparison.tsx`: Side-by-side route comparison with color-coded visualization

**UI Components** (in `components/ui/`):
- shadcn/ui components configured with Tailwind CSS 4
- Uses "new-york" style variant with CSS variables for theming

### Key Technical Patterns

**Coordinate Format**: MapBox uses `[longitude, latitude]` format consistently. Always use `[lng, lat]` order when working with coordinates.

**Geolocation Hook**: `useGeolocation` hook with `watch` parameter - set to `true` during navigation to track position continuously, `false` otherwise to save battery.

**Route Rendering**: Routes stored with GeoJSON geometry. When rendering multiple routes (comparison mode), use color array from `ROUTE_COLORS` constant for visual differentiation.

**LLM Integration**: Backend API route at `/api/route-modification` processes requests server-side to keep API keys secure. Frontend sends user request + current route context, receives modified MapBox parameters.

## Path Aliases

```typescript
@/*        // Root directory
@/components
@/lib
@/hooks
@/app
```

## Important Implementation Notes

### MapBox API Integration

- Always check `mapboxService.isConfigured()` before MapBox operations
- Route calculation requires `geometries=geojson&steps=true&overview=full` parameters for proper turn-by-turn display
- Use `alternatives=true` when requesting multiple route options
- Exclude parameters: `exclude=highways,tolls,ferries` (comma-separated)

### LLM Service Behavior

The LLM service (`lib/services/llmService.ts`) implements a graceful degradation pattern:
1. Attempts OpenAI if `OPENAI_API_KEY` is set
2. Falls back to Anthropic if `ANTHROPIC_API_KEY` is set
3. Falls back to rule-based parsing if neither key is available

This ensures the app works without LLM APIs, making it suitable for development without API costs.

### State Updates

When modifying route-related state:
- Always reset `isCalculatingRoute` in finally blocks
- Set appropriate `navigationState` before async operations
- Include current route as first option when showing alternatives for comparison context

### Error Handling Philosophy

- Never crash on API failures - show user-friendly alerts and return to previous state
- Always provide fallback values (e.g., San Francisco coordinates if geolocation unavailable)
- Log errors to console but display simplified messages to users

## Testing and Debugging

### Common Development Issues

**MapBox not loading**: Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set and exposed (must have `NEXT_PUBLIC_` prefix for client-side access)

**Geolocation errors**: Browser geolocation requires HTTPS in production. Use `http://localhost` for development.

**Route not displaying**: Verify coordinates are in `[lng, lat]` order, not `[lat, lng]`

**LLM parsing failures**: Check API key format and billing status. The app will fall back to rule-based parsing automatically.

## Design System

### Dark Mode Optimization
The entire UI is optimized for car dashboard use with dark backgrounds:
- Primary background: `hsl(222.2 84% 4.9%)`
- Cards/surfaces use elevated backgrounds with subtle borders
- High contrast text for readability in various lighting conditions

### Touch Target Sizing
All interactive elements follow 44px minimum touch target requirement per the PRD.

### Color Coding
Routes use specific colors for comparison:
1. Primary route: Blue (`hsl(217, 91%, 60%)`)
2. Alternative 1: Orange (`hsl(40, 84%, 53%)`)
3. Alternative 2: Green (`hsl(142, 76%, 36%)`)

## File Organization Conventions

- Feature components go in `components/` root
- Reusable UI primitives go in `components/ui/`
- Business logic/API wrappers go in `lib/services/`
- React hooks go in `hooks/`
- API routes go in `app/api/*/route.ts`

## Dependencies of Note

- **mapbox-gl**: Core mapping library (requires CSS import in layout)
- **react-map-gl**: React wrapper (if used for future refactoring)
- **zustand**: Available but not currently used (state is in page component)
- **zod**: Available for schema validation in API routes
- **react-hook-form**: Available for form state management
- **sonner**: Toast notifications (imported via `components/ui/sonner.tsx`)

## Performance Considerations

- MapBox map initialization is expensive - only create one map instance (handled via useRef)
- Debounce search input (300ms) to avoid excessive geocoding API calls
- Only enable geolocation watching when actively navigating
- Lazy load route alternatives only when "Modify Route" is triggered
