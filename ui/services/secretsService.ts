import { apiClient } from "../lib/apiClient";

// Type definitions
export interface SecretKeyValue {
  key: string;
  value: string;
}

// Represents the metadata of a secret bundle
export interface SecretDefinition {
  id: string; // UUID
  project_name: string;
  name: string; // User-defined secret name (used as secretId/secretBundleName in paths)
  description?: string;
  created_at: string; // datetime
  updated_at: string; // datetime
  // Note: 'values' are not part of the definition model from the backend
}

// Payload for creating a new secret (definition + initial values)
export interface SecretCreatePayload {
  secret_name: string;
  values: SecretKeyValue[];
  description?: string;
}

// Payload for updating the values of an existing secret
export interface SecretValuesUpdatePayload {
  values: SecretKeyValue[];
}

// Represents the actual key-value pairs of a secret
export interface SecretValues extends SecretValuesUpdatePayload {
  project_name: string;
  secret_name: string;
}

// Generic response for operations like update/delete
export interface SecretOperationResponse {
  success: boolean;
  message: string;
}

// Secrets service with functions for working with project secrets
export const secretsService = {
  // List all secret definitions for a project
  listProjectSecretDefinitions: async (
    projectId: string
  ): Promise<SecretDefinition[]> => {
    return apiClient<SecretDefinition[]>(
      `/api/v1/secrets/project/${projectId}`
    );
  },

  // Get a single secret definition by its name
  getProjectSecretDefinition: async (
    projectId: string,
    secretName: string // Changed from secretId to secretName for clarity
  ): Promise<SecretDefinition> => {
    return apiClient<SecretDefinition>(
      `/api/v1/secrets/project/${projectId}/bundle/${secretName}`
    );
  },

  // Get the values for a specific secret bundle
  getProjectSecretValues: async (
    projectId: string,
    secretName: string
  ): Promise<SecretValues> => {
    return apiClient<SecretValues>(
      `/api/v1/secrets/project/${projectId}/bundle/${secretName}/values`
    );
  },

  // Create a new secret (definition and initial values) for a project
  createProjectSecret: async (
    projectId: string,
    payload: SecretCreatePayload
  ): Promise<SecretDefinition> => {
    // Returns the created SecretDefinition
    return apiClient<SecretDefinition>(`/api/v1/secrets/project/${projectId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Update the values of an existing secret
  updateProjectSecretValues: async (
    projectId: string,
    secretName: string,
    payload: SecretValuesUpdatePayload
  ): Promise<SecretOperationResponse> => {
    return apiClient<SecretOperationResponse>(
      `/api/v1/secrets/project/${projectId}/bundle/${secretName}/values`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  },

  // Delete a secret bundle (definition and its values)
  deleteProjectSecret: async (
    projectId: string,
    secretName: string
  ): Promise<SecretOperationResponse> => {
    return apiClient<SecretOperationResponse>(
      `/api/v1/secrets/project/${projectId}/bundle/${secretName}`,
      {
        method: "DELETE",
      }
    );
  },
};
