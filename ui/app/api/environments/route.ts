import { NextResponse } from "next/server";

// Mock data for demonstration
const mockData = {
  environments: [
    {
      id: "env-1",
      name: "Development",
      description: "Development environment for testing",
      spec: {
        profilers: {
          default: "pandas_profiler",
          configurations: [
            {
              name: "pandas_profiler",
              type: "pandas",
              enabled: true,
            },
            {
              name: "minimal_profiler",
              type: "pandas",
              enabled: true,
            },
          ],
        },
      },
    },
    {
      id: "env-2",
      name: "Production",
      description: "Production environment",
      spec: {
        profilers: {
          default: "minimal_profiler",
          configurations: [
            {
              name: "minimal_profiler",
              type: "pandas",
              enabled: true,
            },
          ],
        },
      },
    },
  ],
};

export async function GET() {
  try {
    // In a real app, we would fetch from the backend API
    // But for this example, we'll return mock data
    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Error fetching environments:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch environments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// For demonstration, this would be the expected response format
// {
//   "environments": [
//     {
//       "id": "env-1",
//       "name": "Development",
//       "description": "Development environment for testing",
//       "spec": {
//         "profilers": {
//           "default": "pandas_profiler",
//           "configurations": [
//             {
//               "name": "pandas_profiler",
//               "type": "pandas",
//               "enabled": true
//             },
//             {
//               "name": "minimal_profiler",
//               "type": "pandas",
//               "enabled": true
//             }
//           ]
//         }
//       }
//     },
//     {
//       "id": "env-2",
//       "name": "Production",
//       "description": "Production environment",
//       "spec": {
//         "profilers": {
//           "default": "minimal_profiler",
//           "configurations": [
//             {
//               "name": "minimal_profiler",
//               "type": "pandas",
//               "enabled": true
//             }
//           ]
//         }
//       }
//     }
//   ]
// }
