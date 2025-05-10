import { apiClient } from "../lib/apiClient";

export interface SecretProviderConfigPayload {
  provider: string;
  file_path?: string;
  encryption_password?: string;
  env_prefix?: string;
}

export interface CurrentSecretConfigResponse {
  provider: string;
  config: Record<string, string | undefined>;
  available_providers: string[];
}

export interface ConfigResponse {
  success: boolean;
  message: string;
}

// Define the structure based on the actual API response
export interface RootGitRepositorySettingsResponse {
  REPO_URL: string;
  REPO_USERNAME: string;
  REPO_EMAIL: string;
  AUTH_TYPE: string;
}

export interface DatabaseSettingsResponse {
  DATABASE_ECHO: boolean;
}

export interface APISettingsResponse {
  HOST: string;
  PORT: number;
  DEBUG: boolean;
  RELOAD: boolean;
  CORS_ALLOWED_ORIGINS: string;
}

export interface RootSettingsResponse {
  git: RootGitRepositorySettingsResponse;
  database: DatabaseSettingsResponse;
  api: APISettingsResponse;
  APP_NAME: string;
  APP_VERSION: string;
  ENV: string;
}

export const configService = {
  getCurrentSecretsConfig: async (): Promise<CurrentSecretConfigResponse> => {
    // Note: The API client prepends the base URL
    return apiClient<CurrentSecretConfigResponse>("/config/secrets");
  },

  getRootConfig: async (): Promise<RootSettingsResponse> => {
    console.log("Fetching /config/root");
    return apiClient<RootSettingsResponse>("/config/root");
  },

  updateSecretsConfig: async (
    payload: SecretProviderConfigPayload
  ): Promise<ConfigResponse> => {
    return apiClient<ConfigResponse>("/config/secrets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
