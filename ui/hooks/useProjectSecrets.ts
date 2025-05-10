import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  secretsService,
  SecretKeyValue,
  SecretDefinition,
  SecretCreatePayload,
  SecretValuesUpdatePayload,
  SecretOperationResponse,
} from "@/services/secretsService";

export interface UseProjectSecretsOptions {
  onSuccessCreate?: (data: SecretDefinition) => void;
  onSuccessUpdate?: (data: SecretOperationResponse) => void;
  onSuccessDelete?: (data: SecretOperationResponse) => void;
}

/**
 * Hook for managing project secrets
 * Note: Unlike most project resources which follow GitOps principles,
 * secrets are directly manageable through the UI since they are not stored in Git.
 */
export function useProjectSecrets(
  projectId: string,
  options: UseProjectSecretsOptions = {}
) {
  const queryClient = useQueryClient();
  const secretsQueryKey = ["projects", projectId, "secrets"];

  // Fetch all secret definitions for a project
  const secretsQuery: UseQueryResult<SecretDefinition[], Error> = useQuery({
    queryKey: secretsQueryKey,
    queryFn: () => secretsService.listProjectSecretDefinitions(projectId),
    refetchOnWindowFocus: false,
  });

  // Create a new secret
  const createSecretMutation: UseMutationResult<
    SecretDefinition,
    Error,
    SecretCreatePayload
  > = useMutation({
    mutationFn: (payload) =>
      secretsService.createProjectSecret(projectId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: secretsQueryKey });
      toast.success(`Secret "${data.name}" created successfully`);
      if (options.onSuccessCreate) {
        options.onSuccessCreate(data);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create secret: ${error.message}`);
    },
  });

  // Update an existing secret's values
  const updateSecretValuesMutation: UseMutationResult<
    SecretOperationResponse,
    Error,
    { secretName: string; values: SecretKeyValue[] }
  > = useMutation({
    mutationFn: ({ secretName, values }) =>
      secretsService.updateProjectSecretValues(projectId, secretName, {
        values,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: secretsQueryKey });
      toast.success(
        `Secret "${variables.secretName}" values updated successfully`
      );
      if (options.onSuccessUpdate) {
        options.onSuccessUpdate(data);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update secret values: ${error.message}`);
    },
  });

  // Delete a secret
  const deleteSecretMutation: UseMutationResult<
    SecretOperationResponse,
    Error,
    string
  > = useMutation({
    mutationFn: (secretName) =>
      secretsService.deleteProjectSecret(projectId, secretName),
    onSuccess: (data, secretName) => {
      queryClient.invalidateQueries({ queryKey: secretsQueryKey });
      toast.success(
        data.message || `Secret "${secretName}" deleted successfully`
      );
      if (options.onSuccessDelete) {
        options.onSuccessDelete(data);
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete secret: ${error.message}`);
    },
  });

  return {
    secretsQuery,
    secretDefinitions: secretsQuery.data || [],
    isLoading: secretsQuery.isLoading,
    isError: secretsQuery.isError,
    error: secretsQuery.error,

    createSecret: createSecretMutation.mutate,
    isCreating: createSecretMutation.isPending,

    updateSecretValues: updateSecretValuesMutation.mutate,
    isUpdating: updateSecretValuesMutation.isPending,

    deleteSecret: deleteSecretMutation.mutate,
    isDeleting: deleteSecretMutation.isPending,
  };
}
