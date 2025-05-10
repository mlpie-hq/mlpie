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
  // Any other fields that might come from the backend but are not used in the UI directly
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    // Placeholder for the actual API endpoint
    const projectsFromAPI = await apiClient<ProjectFromAPI[]>(
      "/api/v1/projects"
    );

    // Map API response to the Project interface, adding dummy data
    return projectsFromAPI.map((project) => ({
      ...project,
      models: Math.floor(Math.random() * 5) + 1, // Random number of models (1-5)
      datasets: Math.floor(Math.random() * 5) + 1, // Random number of datasets (1-5)
      updated: `Updated ${Math.floor(Math.random() * 24) + 1} hours ago`, // Random update time
    }));
  },
};
