import { NextResponse } from "next/server";

// Define the base URL for the backend API
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/logs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch job logs" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching job logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
