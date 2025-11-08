# Product Requirements Document: Journey Assist MVP

## Product Overview

**Product Name:** Journey Assist  
**Version:** MVP 1.0  
**Target Platform:** Car dashboard interface (web-based, optimized for in-car displays)  
**Primary User:** Drivers and passengers seeking fluid, voice-friendly route modifications during travel

## Problem Statement

Current navigation solutions (Google Maps, Waze, etc.) require manual interface manipulation to adjust routes, which is:
- Distracting and unsafe while driving
- Cumbersome for making subjective adjustments ("more scenic," "avoid highways")
- Prone to user error (missing exits during manual rerouting)

## Solution

A conversational navigation interface that allows natural language route modifications through an LLM-powered assistant, integrated with MapBox for visualization and routing.

---

## Core Features (MVP Scope)

### 1. Navigation Display
**Description:** Real-time map view with active route guidance

**Requirements:**
- MapBox GL JS integration for map rendering
- Current location indicator with real-time GPS tracking
- Active route displayed as a highlighted line on the map
- Turn-by-turn directions displayed prominently
- ETA and distance remaining
- Next maneuver preview (e.g., "In 0.5 miles, turn right onto Main St")
- Auto-zoom that adjusts to upcoming turns

**UI Specifications:**
- Full-screen map as primary view
- Persistent info card showing: current step, next turn, ETA, total distance
- Dark mode optimized for nighttime driving
- Large, readable fonts (minimum 18pt for body text, 24pt+ for critical info)
- High-contrast color scheme for dashboard visibility

### 2. Route Input & Initialization
**Description:** Set destination and start navigation

**Requirements:**
- Destination search input field
- Autocomplete suggestions powered by MapBox Geocoding API
- "Start Navigation" button to initiate route
- Default route calculation using MapBox Directions API
- Starting location auto-detected via browser geolocation

**UI Specifications:**
- Clean, minimal search interface
- Search bar centered with large touch targets (minimum 44px height)
- Suggestion dropdown with clear, readable entries
- Confirmation screen showing route overview before starting

### 3. Conversational Route Modification
**Description:** LLM-powered natural language interface for route adjustments

**Requirements:**
- Text input field for conversational commands (voice input out of MVP scope, but UI should accommodate future integration)
- LLM processes natural language requests such as:
  - "Make this more scenic"
  - "Avoid highways"
  - "Find a route through downtown"
  - "Add a stop at [location]"
  - "Show me an alternative"
- Backend sends modified parameters to MapBox Directions API
- New route options displayed for user confirmation
- Ability to compare current route vs. proposed route (side-by-side stats)

**UI Specifications:**
- Floating input bar at bottom of screen (collapsible)
- Chat-style interface showing user requests and system responses
- "Apply Route" and "Keep Current" buttons for proposed changes
- Loading indicator while LLM processes request
- Error handling with clear, conversational feedback

### 4. Route Comparison View
**Description:** Visual comparison when alternative routes are generated

**Requirements:**
- Display multiple route options on map simultaneously
- Differentiate routes with distinct colors
- Show comparison metrics for each route:
  - Total distance
  - Estimated time
  - Route characteristics (e.g., "Scenic," "Fastest," "Avoids highways")
- Tap/click route to select
- Smooth transition when new route is applied

**UI Specifications:**
- Side panel or bottom sheet with route cards
- Color-coded route lines matching card colors
- Quick-select buttons for each alternative
- Clear visual indication of currently selected route

---

## Technical Architecture (High-Level)

### Frontend Stack
- **Framework:** React (or Next.js for enhanced routing)
- **Mapping:** MapBox GL JS
- **Styling:** Tailwind CSS (for rapid, responsive UI)
- **State Management:** React Context or Zustand (lightweight)

### Backend Requirements
- **LLM Integration:** API endpoint that processes natural language → structured route parameters
  - Input: User's conversational request + current route context
  - Output: Modified route parameters (waypoints, preferences, constraints)
- **Route Generation:** MapBox Directions API
- **Geolocation:** Browser Geolocation API

### Data Flow
1. User inputs destination → MapBox Geocoding → Route calculation
2. User sends conversational modification → LLM backend → Parse intent → Generate route parameters
3. Modified parameters → MapBox Directions API → New route(s)
4. Display alternatives → User selects → Update active navigation

---

## User Flows

### Primary Flow: Starting Navigation
1. User opens Journey Assist interface
2. User types/selects destination
3. System calculates default route
4. Route overview displayed with "Start" button
5. User confirms, navigation begins

### Secondary Flow: Modifying Route Mid-Journey
1. User clicks conversational input bar
2. User types request (e.g., "make this more scenic")
3. System shows loading indicator
4. LLM processes request and generates new route parameters
5. System displays alternative route(s) with comparison
6. User reviews and selects preferred route
7. Navigation updates with new route

### Edge Cases to Handle
- No GPS signal: Display clear error, suggest troubleshooting
- Invalid destination: Show "No results found" with suggestion to rephrase
- LLM unable to parse request: Respond conversationally, ask for clarification
- No alternative routes available: Explain why (e.g., "Already on most scenic route")

---

## Non-Functional Requirements

### Performance
- Map render time: <2 seconds on initial load
- Route calculation: <3 seconds for standard routes
- LLM response time: <5 seconds (set user expectation with loading states)

### Accessibility
- Large touch targets (44px minimum)
- High contrast ratios (WCAG AA compliant)
- Screen reader support for critical navigation info
- Operable without precise fine motor control

### Safety
- Minimize driver distraction: conversational input reduces need to look at screen
- Clear, unambiguous turn instructions
- Audible alerts for upcoming maneuvers (future enhancement, but design UI with this in mind)

---

## Out of Scope (Post-MVP)

- Voice input/output
- Real-time traffic integration
- Multi-stop route optimization
- Saved favorite locations
- Route history
- User accounts and preferences
- Offline mode
- Mobile app (native iOS/Android)
- Integration with car's native systems (CarPlay, Android Auto)

---

## Success Metrics (MVP)

- User successfully completes end-to-end navigation flow
- Natural language route modification works ≥80% of time
- Route alternatives generated within 5 seconds
- Zero critical bugs in core navigation functionality

---

## Design Principles

1. **Safety First:** Every UI decision prioritizes driver safety and minimal distraction
2. **Conversational:** Interface feels like talking to a co-pilot, not operating software
3. **Clarity:** Information hierarchy is obvious; critical info is unmissable
4. **Responsiveness:** System feels fast and acknowledges user input immediately
5. **Forgiving:** Errors are handled gracefully with helpful guidance

---

## UI Component Breakdown (for Implementation)

### Components Needed:

#### 1. MapView Component
- MapBox GL container
- Route overlay
- Location marker
- Auto-zoom/pan logic

#### 2. NavigationInfo Component
- Current step display
- Next turn preview
- ETA/distance card

#### 3. SearchBar Component
- Input field
- Autocomplete dropdown
- Clear button

#### 4. ConversationalInput Component
- Collapsible chat interface
- Message history
- Input field
- Send button

#### 5. RouteComparison Component
- Route cards with metrics
- Selection buttons
- Visual differentiation

#### 6. LoadingState Component
- Spinner/skeleton for async operations
- Contextual loading messages

---

## Visual Reference Guidelines

### Color Palette
- **Primary:** Blue (#2563EB) - active route, primary actions
- **Secondary:** Green (#10B981) - confirmation, success
- **Accent:** Orange (#F59E0B) - alerts, alternative routes
- **Background:** Dark Gray (#1F2937) - main background
- **Surface:** Lighter Gray (#374151) - cards, panels
- **Text:** White (#FFFFFF) - primary text
- **Text Secondary:** Light Gray (#D1D5DB) - supporting text

### Typography
- **Primary Font:** Inter or System UI
- **Heading sizes:** 24-32px
- **Body text:** 18-20px
- **Small text:** 14-16px (minimum)

### Layout
- Full-screen map as canvas
- Floating UI elements with subtle shadows
- Rounded corners (8-12px) for modern feel
- Generous padding (16-24px) for touch-friendliness

---

## Implementation Notes

### MapBox Setup
1. Sign up for MapBox account and obtain API key
2. Install MapBox GL JS: `npm install mapbox-gl`
3. Initialize map with dark style for dashboard: `mapbox://styles/mapbox/dark-v11`
4. Enable geolocation controls

### API Integrations
- **MapBox Geocoding API:** For destination search and autocomplete
- **MapBox Directions API:** For route calculation
- **Custom LLM Backend:** Endpoint to process natural language and return structured route modifications

### State Management Structure
```javascript
{
  navigation: {
    currentLocation: { lat, lng },
    destination: { lat, lng, name },
    activeRoute: { geometry, distance, duration, steps },
    isNavigating: boolean
  },
  routeModification: {
    pendingRequest: string,
    alternativeRoutes: [],
    isLoading: boolean
  }
}
```

### Sample LLM Integration
The LLM backend should accept:
```json
{
  "userRequest": "make this more scenic",
  "currentRoute": {
    "origin": [lat, lng],
    "destination": [lat, lng],
    "currentParams": {}
  }
}
```

And return:
```json
{
  "modifiedParams": {
    "avoid": ["highways"],
    "waypoints": [[lat, lng]],
    "profile": "mapbox/driving"
  },
  "explanation": "I'll route you through scenic backroads, avoiding highways."
}
```

---

## File Structure Suggestion

```
journey-assist/
├── src/
│   ├── components/
│   │   ├── MapView.jsx
│   │   ├── NavigationInfo.jsx
│   │   ├── SearchBar.jsx
│   │   ├── ConversationalInput.jsx
│   │   ├── RouteComparison.jsx
│   │   └── LoadingState.jsx
│   ├── hooks/
│   │   ├── useMapbox.js
│   │   ├── useGeolocation.js
│   │   └── useRouteModification.js
│   ├── services/
│   │   ├── mapboxService.js
│   │   └── llmService.js
│   ├── utils/
│   │   ├── routeHelpers.js
│   │   └── formatters.js
│   ├── App.jsx
│   └── index.js
├── public/
├── package.json
└── README.md
```

---

## Getting Started Checklist

- [ ] Set up React project with Vite or Next.js
- [ ] Install dependencies (MapBox GL, Tailwind CSS)
- [ ] Obtain MapBox API key and configure
- [ ] Implement basic map rendering
- [ ] Add geolocation functionality
- [ ] Build search and routing with MapBox APIs
- [ ] Create conversational input component
- [ ] Integrate LLM backend endpoint
- [ ] Implement route comparison view
- [ ] Add navigation state management
- [ ] Style for dark mode and large touch targets
- [ ] Test end-to-end user flows

---

This PRD provides the foundation for building Journey Assist MVP. Focus on core navigation and conversational modification first, then iterate based on user testing and feedback.
