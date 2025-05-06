'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type Environment = {
  id: string;
  name: string;
};

export type Project = {
  id: number;
  name: string;
  environments: Environment[];
};

type ProjectContextType = {
  selectedProject: Project | null;
  selectedEnvironment: Environment | null;
  showSelector: boolean;
  projects: Project[];
  setSelectedProject: (project: Project | null) => void;
  setSelectedEnvironment: (env: Environment | null) => void;
  setShowSelector: (show: boolean) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Mock projects data - would be fetched from API in real app
const mockProjects: Project[] = [
  {
    id: 1,
    name: "Customer Churn Prediction",
    environments: [
      { id: 'dev', name: 'Development' },
      { id: 'staging', name: 'Staging' },
      { id: 'prod', name: 'Production' },
    ],
  },
  {
    id: 2,
    name: "GenAI Content Summarizer",
    environments: [
      { id: 'dev', name: 'Development' },
      { id: 'prod', name: 'Production' },
    ],
  },
  {
    id: 3,
    name: "Image Classification Pipeline",
    environments: [
      { id: 'dev', name: 'Development' },
    ],
  },
  {
    id: 4,
    name: "Sentiment Analysis API",
    environments: [
      { id: 'prod', name: 'Production' },
    ],
  }
];

// Routes where selector should be hidden
const hideSelectorRoutes = [
  '/settings',
  '/admin',
];

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [projects] = useState<Project[]>(mockProjects);
  const [showSelector, setShowSelector] = useState(true);
  
  const pathname = usePathname();
  
  // Effect to set selected project based on URL
  useEffect(() => {
    // Extract project ID from URL if it's a project detail page
    const projectIdMatch = pathname.match(/\/projects\/(\d+)/);
    if (projectIdMatch) {
      const projectId = parseInt(projectIdMatch[1], 10);
      const project = projects.find(p => p.id === projectId) || null;
      setSelectedProject(project);
      
      // Set environment to the first one if available
      if (project && project.environments.length > 0 && !selectedEnvironment) {
        setSelectedEnvironment(project.environments[0]);
      }
    }
    
    // Check if selector should be hidden for this route
    const shouldHideSelector = hideSelectorRoutes.some(route => pathname.startsWith(route));
    setShowSelector(!shouldHideSelector);
  }, [pathname, projects]);

  return (
    <ProjectContext.Provider value={{
      selectedProject,
      selectedEnvironment,
      showSelector,
      projects,
      setSelectedProject,
      setSelectedEnvironment,
      setShowSelector,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
} 