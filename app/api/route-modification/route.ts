import { NextRequest, NextResponse } from "next/server"
import { parseRouteRequest, type RouteModificationRequest } from "@/lib/services/llmService"

export async function POST(request: NextRequest) {
  try {
    const body: RouteModificationRequest = await request.json()

    // Validate request
    if (!body.userRequest || !body.currentRoute) {
      return NextResponse.json(
        { error: "Missing required fields: userRequest and currentRoute" },
        { status: 400 }
      )
    }

    if (!body.currentRoute.origin || !body.currentRoute.destination) {
      return NextResponse.json(
        { error: "Missing origin or destination in currentRoute" },
        { status: 400 }
      )
    }

    // Parse route modification request
    const result = await parseRouteRequest(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing route modification:", error)
    return NextResponse.json(
      { error: "Failed to process route modification request" },
      { status: 500 }
    )
  }
}

