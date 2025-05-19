import { apiClient } from "../lib/apiClient";

// UI type for Environment (as used in ProjectDetailPage)
export type Environment = {
  id: string;
  name: string;
  status: string;
  deployedVersion: string;
  lastDeployed: string;
  cluster?: string; // For modal compatibility, though not displayed in list
};

// Type matching the backend Pydantic schema EnvironmentResponse
export interface EnvironmentResponse {
  id: string;
  name: string;
  project_name: string;
  status: string;
  version?: string | null;
  updated_at: string;
  created_at: string;
  description?: string | null;
}

export const environmentService = {
  getProjectEnvironments: async (
    projectName: string
  ): Promise<Environment[]> => {
    const environmentsFromAPI = await apiClient<EnvironmentResponse[]>(
      `/api/v1/projects/${projectName}/environments`
    );
    return environmentsFromAPI.map((envRes) => ({
      id: envRes.id,
      name: envRes.name,
      status: envRes.status,
      deployedVersion: envRes.version || "N/A",
      lastDeployed: new Date(envRes.updated_at).toLocaleString(),
      // cluster is not directly mapped here as it's not in EnvironmentResponse
      // The component `page.tsx` will add a dummy `cluster` if needed for its local state
    }));
  },
};
