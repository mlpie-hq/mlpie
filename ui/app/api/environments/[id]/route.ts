import { NextResponse } from "next/server";

// Mock environments data for demonstration
interface EnvironmentConfig {
  id: string;
  name: string;
  description: string;
  cluster: string;
  status: string;
  version: string;
  lastDeployed: string;
  deployedVersion: string;
  created_at: string;
  updated_at: string;
  spec: {
    profilers: {
      default: string;
      configurations: Array<{
        name: string;
        type: string;
        enabled: boolean;
        config: Record<string, unknown>;
      }>;
    };
  };
}

interface MockEnvironments {
  [key: string]: EnvironmentConfig;
}

const mockEnvironments: MockEnvironments = {
  "env-1": {
    id: "env-1",
    name: "Development",
    description: "Development environment for testing",
    cluster: "dev-cluster.mlpie.ai",
    status: "Active",
    version: "1.0.0",
    lastDeployed: "2023-09-15T00:00:00Z",
    deployedVersion: "v1.2.3",
    created_at: "2023-09-01T00:00:00Z",
    updated_at: "2023-09-15T00:00:00Z",
    spec: {
      profilers: {
        default: "pandas_profiler",
        configurations: [
          {
            name: "pandas_profiler",
            type: "pandas",
            enabled: true,
            config: {
              correlation_threshold: 0.7,
              include_percentiles: true,
              numerical_distribution_analysis: true,
              text_length_analysis: true,
              max_memory_usage: "4G",
            },
          },
          {
            name: "minimal_profiler",
            type: "pandas",
            enabled: true,
            config: {
              correlation_threshold: 0.5,
              include_percentiles: false,
              sample_size: 10000,
              numerical_distribution_analysis: false,
              text_length_analysis: false,
            },
          },
        ],
      },
    },
  },
  "env-2": {
    id: "env-2",
    name: "Production",
    description: "Production environment",
    cluster: "prod-cluster.mlpie.ai",
    status: "Active",
    version: "1.0.0",
    lastDeployed: "2023-09-20T00:00:00Z",
    deployedVersion: "v1.2.3",
    created_at: "2023-09-01T00:00:00Z",
    updated_at: "2023-09-20T00:00:00Z",
    spec: {
      profilers: {
        default: "minimal_profiler",
        configurations: [
          {
            name: "minimal_profiler",
            type: "pandas",
            enabled: true,
            config: {
              correlation_threshold: 0.5,
              include_percentiles: false,
              sample_size: 10000,
              numerical_distribution_analysis: false,
              text_length_analysis: false,
            },
          },
        ],
      },
    },
  },
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // For demonstration, use mock data
    if (!mockEnvironments[id]) {
      return NextResponse.json(
        { message: `Environment with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ environment: mockEnvironments[id] });
  } catch (error) {
    console.error(`Error fetching environment ${id}:`, error);
    return NextResponse.json(
      {
        message: "Failed to fetch environment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
