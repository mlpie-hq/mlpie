"use client";

import { useProject } from "@/contexts/ProjectContext";
import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Custom hook to access and manage project/environment state across the application
 * Provides convenience methods for navigation and state management
 */
export function useProjectHeader() {
  const {
    selectedProject,
    selectedEnvironment,
    projects,
    setSelectedProject,
    setSelectedEnvironment,
  } = useProject();

  const router = useRouter();
  const pathname = usePathname();

  /**
   * Navigate to a project's detail page
   */
  const navigateToProject = useCallback(
    (projectId: number) => {
      router.push(`/projects/${projectId}`);
    },
    [router]
  );

  /**
   * Navigate to a specific environment within a project
   */
  const navigateToEnvironment = useCallback(
    (projectId: number, environmentId: string) => {
      router.push(`/projects/${projectId}/environments/${environmentId}`);
    },
    [router]
  );

  /**
   * Get the current route context (project/environment IDs from the URL)
   */
  const getRouteContext = useCallback(() => {
    const projectMatch = pathname.match(/\/projects\/(\d+)/);
    const environmentMatch = pathname.match(/\/environments\/([^/]+)/);

    return {
      projectId: projectMatch ? parseInt(projectMatch[1], 10) : null,
      environmentId: environmentMatch ? environmentMatch[1] : null,
    };
  }, [pathname]);

  /**
   * Check if context selectors should be shown for the current route
   */
  const shouldShowSelector = useCallback(() => {
    const settingsRoutes = ["/settings", "/admin"];
    return !settingsRoutes.some((route) => pathname.startsWith(route));
  }, [pathname]);

  /**
   * Format a string with current project/environment context
   * Useful for creating dynamic titles, API paths, etc.
   */
  const formatWithContext = useCallback(
    (template: string): string => {
      let result = template;

      if (selectedProject) {
        result = result.replace(/{projectId}/g, selectedProject.id.toString());
        result = result.replace(/{projectName}/g, selectedProject.name);
      }

      if (selectedEnvironment) {
        result = result.replace(/{environmentId}/g, selectedEnvironment.id);
        result = result.replace(/{environmentName}/g, selectedEnvironment.name);
      }

      return result;
    },
    [selectedProject, selectedEnvironment]
  );

  return {
    selectedProject,
    selectedEnvironment,
    projects,
    setSelectedProject,
    setSelectedEnvironment,
    navigateToProject,
    navigateToEnvironment,
    getRouteContext,
    shouldShowSelector,
    formatWithContext,
  };
}
