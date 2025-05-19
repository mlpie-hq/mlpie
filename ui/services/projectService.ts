import { apiClient } from "../lib/apiClient";

export interface Project {
  name: string;
  description: string;
  status: string; // Assuming status is a string, e.g., "Active", "Inactive"
  models: number; // Dummy data
  datasets: number; // Dummy data
  updated: string; // Dummy data, e.g., "Updated 2 hours ago"
}

// This interface represents the expected structure from the backend
interface ProjectFromAPI {
  name: string;
  description: string;
  status: string;
  repository_url: string; // Added to match backend ProjectResponse
  branch: string; // Added to match backend ProjectResponse
  updated_at: string; // Added to match backend ProjectResponse
  // Any other fields that might come from the backend but are not used in the UI directly
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const projectsFromAPI = await apiClient<ProjectFromAPI[]>(
      "/api/v1/projects"
    );

    return projectsFromAPI.map((project) => ({
      name: project.name,
      description: project.description,
      status: project.status,
      models: Math.floor(Math.random() * 5) + 1,
      datasets: Math.floor(Math.random() * 5) + 1,
      updated: new Date(project.updated_at).toLocaleDateString(), // Use updated_at from API
    }));
  },
};
