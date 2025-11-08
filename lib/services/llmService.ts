/**
 * LLM Service
 * Handles natural language processing for route modification requests
 */

export interface RouteModificationParams {
  avoid?: string[] // e.g., ["motorway", "toll", "ferry"] - Mapbox API values
  waypoints?: [number, number][] // [lng, lat] format
  profile?: "driving" | "walking" | "cycling" | "driving-traffic"
}

export interface RouteModificationRequest {
  userRequest: string
  currentRoute: {
    origin: [number, number]
    destination: [number, number]
    currentParams?: RouteModificationParams
  }
}

export interface RouteModificationResponse {
  modifiedParams: RouteModificationParams
  explanation: string
}

/**
 * Parse natural language route modification request using LLM
 * @param request User's natural language request and current route context
 * @returns Modified route parameters and explanation
 */
export async function parseRouteRequest(
  request: RouteModificationRequest
): Promise<RouteModificationResponse> {
  const openaiApiKey = process.env.OPENAI_API_KEY
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  // Use OpenAI if available, otherwise Anthropic, otherwise fallback to simple parsing
  if (openaiApiKey) {
    return parseWithOpenAI(request, openaiApiKey)
  } else if (anthropicApiKey) {
    return parseWithAnthropic(request, anthropicApiKey)
  } else {
    // Fallback to simple rule-based parsing for MVP
    return parseWithRules(request)
  }
}

/**
 * Parse route request using OpenAI
 */
async function parseWithOpenAI(
  request: RouteModificationRequest,
  apiKey: string
): Promise<RouteModificationResponse> {
  const systemPrompt = `You are a navigation assistant. Parse user requests for route modifications and return structured parameters.

User's current route: from [${request.currentRoute.origin[0]}, ${request.currentRoute.origin[1]}] to [${request.currentRoute.destination[0]}, ${request.currentRoute.destination[1]}]

Return JSON with:
- avoid: array of road types to avoid - MUST use Mapbox API values: "motorway" (highways), "toll" (toll roads), "ferry" (ferries)
- waypoints: array of [lng, lat] coordinates for intermediate stops (optional)
- profile: "driving", "walking", "cycling", or "driving-traffic"
- explanation: human-readable explanation of the route change

Examples:
- "make it more scenic" -> avoid: ["motorway"], explanation: "I'll route you through scenic backroads, avoiding highways."
- "avoid highways" -> avoid: ["motorway"], explanation: "I'll find a route that avoids highways."
- "avoid tolls" -> avoid: ["toll"], explanation: "I'll find a route that avoids toll roads."
- "go through downtown" -> waypoints: [downtown_coords], explanation: "I'll route you through downtown."
- "find the fastest route" -> profile: "driving-traffic", explanation: "I'll find the fastest route considering traffic."`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use cheaper model for MVP
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.userRequest },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)

    return {
      modifiedParams: {
        avoid: content.avoid || [],
        waypoints: content.waypoints || [],
        profile: content.profile || "driving",
      },
      explanation: content.explanation || "Route modified as requested.",
    }
  } catch (error) {
    console.error("Error calling OpenAI:", error)
    // Fallback to rule-based parsing
    return parseWithRules(request)
  }
}

/**
 * Parse route request using Anthropic Claude
 */
async function parseWithAnthropic(
  request: RouteModificationRequest,
  apiKey: string
): Promise<RouteModificationResponse> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022", // Use cheaper model for MVP
        max_tokens: 1024,
        system: `You are a navigation assistant. Parse user requests for route modifications and return structured JSON.

Return JSON with:
- avoid: array of road types to avoid - MUST use Mapbox values: "motorway", "toll", "ferry"
- waypoints: array of [lng, lat] coordinates (optional)
- profile: "driving", "walking", "cycling", or "driving-traffic"
- explanation: human-readable explanation

Examples: "avoid highways" -> {"avoid": ["motorway"]}, "avoid tolls" -> {"avoid": ["toll"]}`,
        messages: [
          {
            role: "user",
            content: `Current route: from [${request.currentRoute.origin[0]}, ${request.currentRoute.origin[1]}] to [${request.currentRoute.destination[0]}, ${request.currentRoute.destination[1]}]. User request: ${request.userRequest}. Return JSON only.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = JSON.parse(data.content[0].text)

    return {
      modifiedParams: {
        avoid: content.avoid || [],
        waypoints: content.waypoints || [],
        profile: content.profile || "driving",
      },
      explanation: content.explanation || "Route modified as requested.",
    }
  } catch (error) {
    console.error("Error calling Anthropic:", error)
    // Fallback to rule-based parsing
    return parseWithRules(request)
  }
}

/**
 * Simple rule-based parsing as fallback
 */
function parseWithRules(
  request: RouteModificationRequest
): RouteModificationResponse {
  const userRequest = request.userRequest.toLowerCase()

  const modifiedParams: RouteModificationParams = {
    profile: "driving",
  }

  let explanation = "I'll modify your route as requested."

  // Detect avoid keywords
  if (userRequest.includes("scenic") || userRequest.includes("scenery")) {
    modifiedParams.avoid = ["motorway"]
    explanation = "I'll route you through scenic backroads, avoiding highways."
  } else if (userRequest.includes("avoid highway") || userRequest.includes("no highway")) {
    modifiedParams.avoid = ["motorway"]
    explanation = "I'll find a route that avoids highways."
  } else if (userRequest.includes("avoid toll")) {
    modifiedParams.avoid = ["toll"]
    explanation = "I'll find a route that avoids toll roads."
  } else if (userRequest.includes("fastest") || userRequest.includes("quickest")) {
    modifiedParams.profile = "driving-traffic"
    explanation = "I'll find the fastest route considering traffic."
  } else if (userRequest.includes("shortest")) {
    modifiedParams.profile = "driving"
    explanation = "I'll find the shortest route."
  } else if (userRequest.includes("alternative") || userRequest.includes("different")) {
    explanation = "I'll find an alternative route for you."
  } else {
    explanation = "I'll modify your route based on your request."
  }

  return {
    modifiedParams,
    explanation,
  }
}

