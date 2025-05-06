'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { useProject, Project, Environment } from '@/contexts/ProjectContext';
import Link from 'next/link';

export default function ProjectSelector() {
  const { 
    selectedProject, 
    selectedEnvironment, 
    showSelector,
    projects, 
    setSelectedProject, 
    setSelectedEnvironment 
  } = useProject();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const envDropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (envDropdownRef.current && !envDropdownRef.current.contains(event.target as Node)) {
        setIsEnvDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handler for project selection
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedEnvironment(project.environments[0] || null);
    setIsProjectDropdownOpen(false);
  };

  // Handler for environment selection
  const handleSelectEnvironment = (env: Environment) => {
    setSelectedEnvironment(env);
    setIsEnvDropdownOpen(false);
  };

  if (!showSelector) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Project Selector */}
      <div className="relative" ref={projectDropdownRef}>
        <button
          onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-primary/10 hover:bg-primary/15 text-primary rounded-md transition-colors"
        >
          <Layers size={16} />
          <span className="max-w-[150px] truncate">
            {selectedProject ? selectedProject.name : 'Select Project'}
          </span>
          <ChevronDown size={14} />
        </button>

        {isProjectDropdownOpen && (
          <div className="absolute left-0 mt-1 w-64 bg-card border border-border rounded-md shadow-lg z-50">
            <div className="max-h-[300px] overflow-y-auto py-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-primary/10 ${
                    selectedProject?.id === project.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                  }`}
                >
                  <span className="truncate">{project.name}</span>
                  {selectedProject?.id === project.id && <Check size={16} />}
                </button>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Link 
                href="/projects"
                className="flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-sm transition-colors"
              >
                View All Projects
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Environment Selector - only visible if a project is selected */}
      {selectedProject && (
        <div className="relative" ref={envDropdownRef}>
          <button
            onClick={() => setIsEnvDropdownOpen(!isEnvDropdownOpen)}
            disabled={!selectedProject || selectedProject.environments.length === 0}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              selectedEnvironment 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <span>
              {selectedEnvironment ? selectedEnvironment.name : 'No Environments'}
            </span>
            {selectedProject.environments.length > 0 && <ChevronDown size={12} />}
          </button>

          {isEnvDropdownOpen && selectedProject.environments.length > 0 && (
            <div className="absolute left-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50">
              <div className="py-1">
                {selectedProject.environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => handleSelectEnvironment(env)}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-primary/10 ${
                      selectedEnvironment?.id === env.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span>{env.name}</span>
                    {selectedEnvironment?.id === env.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 