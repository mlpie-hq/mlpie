import { NextResponse } from "next/server";

// Define the base URL for the backend API
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check required fields
    if (!body.dataset_id) {
      return new NextResponse(
        JSON.stringify({ detail: "dataset_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/jobs/profile-dataset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dataset_id: body.dataset_id,
        profiler_name: body.profiler_name,
        environment_id: body.environment_id,
        config: body.config,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new NextResponse(
        JSON.stringify({
          detail: errorData.detail || "Failed to create profile job",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating profile job:", error);
    return new NextResponse(
      JSON.stringify({ detail: "Failed to create profile job" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
