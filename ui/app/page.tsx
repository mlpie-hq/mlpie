"use client"; // Add "use client" directive for useState

import { useState } from "react"; // Import useState
import Link from 'next/link'; // Import Link
// import Image from "next/image"; // Removed unused import

// Initial project data (will be used as default state)
const initialProjects = [
  {
    id: 1,
    name: "Customer Churn Prediction",
    description: "Machine learning model to predict customer churn based on behavioral data and service usage patterns.",
    lastUpdated: "2 hours ago",
    status: "Active",
    progress: 85,
    models: 3,
    datasets: 2,
  },
  {
    id: 2,
    name: "GenAI Content Summarizer",
    description: "Summarizing long articles using a fine-tuned large language model with configurable summary length.",
    lastUpdated: "1 day ago",
    status: "Active",
    progress: 62,
    models: 2,
    datasets: 4,
  },
  {
    id: 3,
    name: "Image Classification Pipeline",
    description: "End-to-end pipeline for training and deploying an image classifier with data augmentation and validation.",
    lastUpdated: "3 days ago",
    status: "Inactive",
    progress: 32,
    models: 1,
    datasets: 3,
  },
  {
    id: 4,
    name: "Sentiment Analysis API",
    description: "API endpoint for real-time sentiment analysis of customer feedback and social media mentions.",
    lastUpdated: "1 week ago",
    status: "Active",
    progress: 90,
    models: 1,
    datasets: 2,
  },
];

// Stats cards data
const stats = [
  { label: "Total Projects", value: "12" },
  { label: "Active Models", value: "24" },
  { label: "Training Jobs", value: "3", status: "running" },
  { label: "Total Datasets", value: "37" },
];

// Define project types for the dropdown
const projectTypes = [
  { id: 'classification', name: 'Classification' },
  { id: 'regression', name: 'Regression' },
  { id: 'nlp', name: 'Natural Language Processing' },
  { id: 'computer_vision', name: 'Computer Vision' },
  { id: 'time_series', name: 'Time Series' },
  { id: 'generative_ai', name: 'Generative AI' },
  { id: 'other', name: 'Other' },
];

// Define deployment environments
const deploymentEnvironments = [
  { id: 'development', name: 'Development' },
  { id: 'staging', name: 'Staging' },
  { id: 'production', name: 'Production' },
  { id: 'none', name: 'None (Training Only)' },
];

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Initialize projects state with initial data
  const [projects, setProjects] = useState(initialProjects);
  
  // Form state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Function to add a tag from input
  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Function to remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Function to handle pressing Enter in the tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleAddTag();
    }
  };

  const handleOpenModal = () => {
    // Reset form state when opening modal
    setTags([]);
    setTagInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // Updated function to add the new project with enhanced fields
  const handleCreateProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Extract form data
    const name = formData.get('projectName') as string;
    const description = formData.get('projectDescription') as string;
    const projectType = formData.get('projectType') as string;
    const status = formData.get('status') as string;
    const deploymentTarget = formData.get('deploymentTarget') as string;
    const expectedDuration = formData.get('expectedDuration') as string;
    
    // Basic validation
    if (!name) {
      alert("Project name is required.");
      return;
    }

    // Create new project with enhanced fields
    const newProject = {
      id: Date.now(),
      name,
      description,
      lastUpdated: "Just now",
      status: status || "Inactive",
      progress: 0,
      models: 0,
      datasets: 0,
      // New fields
      projectType: projectType || "other",
      deploymentTarget: deploymentTarget || "none",
      expectedDuration: expectedDuration || "Not specified",
      tags: [...tags],
      createdAt: new Date().toISOString(),
    };

    // Add to projects state
    setProjects([newProject, ...projects]);
    handleCloseModal();
  };

  return (
    <div className="space-y-6 relative"> {/* Added relative positioning for modal */}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-foreground mb-1">Projects</h1>
          <p className="text-sm text-muted">Manage your ML projects and track their progress</p>
        </div>
        {/* Updated button to open modal */}
        <button 
          onClick={handleOpenModal} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4 shadow-card">
            <p className="text-sm text-muted mb-1">{stat.label}</p>
            <div className="flex items-center">
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              {stat.status === "running" && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                  Running
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Projects</h2>
          <div className="text-sm text-muted hover:text-foreground cursor-pointer">View all</div>
        </div>
        
        {/* Project Cards Grid - Now maps over the 'projects' state */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block hover:no-underline">
              <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden h-full flex flex-col hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">{project.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${ 
                        project.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-4 line-clamp-2 flex-grow">{project.description}</p>
                  
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0 mt-auto">
                  <div className="flex text-xs text-muted pt-4 border-t border-border">
                    <div className="flex items-center mr-4">
                      {/* Model Icon SVG */}
                      <svg className="w-4 h-4 mr-1 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <span>{project.models} Models</span>
                    </div>
                    <div className="flex items-center">
                      {/* Dataset Icon SVG */}
                      <svg className="w-4 h-4 mr-1 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{project.datasets} Datasets</span>
                    </div>
                    <div className="ml-auto text-muted">
                      Updated {project.lastUpdated}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="text-gray-500 col-span-full text-center">No projects found.</p>
          )}
        </div>
      </div>

      {/* Enhanced Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Create New Project</h2>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-gray-600" 
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Enhanced Form */}
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info - Left Column */}
                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                    <input 
                      type="text" 
                      id="projectName" 
                      name="projectName" 
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Customer Churn Predictor"
                    />
                  </div>
                  
                  {/* Project Type Dropdown */}
                  <div>
                    <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select 
                      id="projectType" 
                      name="projectType" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {projectTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Initial Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
                    <select 
                      id="status" 
                      name="status" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Inactive">Inactive</option>
                      <option value="Active">Active</option>
                      <option value="Planning">Planning</option>
                    </select>
                  </div>
                  
                  {/* Expected Duration */}
                  <div>
                    <label htmlFor="expectedDuration" className="block text-sm font-medium text-gray-700 mb-1">Expected Duration</label>
                    <select 
                      id="expectedDuration" 
                      name="expectedDuration" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Less than 1 month">Less than 1 month</option>
                      <option value="1-3 months">1-3 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6+ months">6+ months</option>
                    </select>
                  </div>
                </div>
                
                {/* Additional Info - Right Column */}
                <div className="space-y-4">
                  {/* Description */}
                  <div>
                    <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      id="projectDescription" 
                      name="projectDescription"
                      rows={3} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="A brief description of the project's goal"
                    ></textarea>
                  </div>
                  
                  {/* Target Deployment Environment */}
                  <div>
                    <label htmlFor="deploymentTarget" className="block text-sm font-medium text-gray-700 mb-1">Target Deployment Environment</label>
                    <select 
                      id="deploymentTarget" 
                      name="deploymentTarget" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {deploymentEnvironments.map(env => (
                        <option key={env.id} value={env.id}>{env.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        id="tagInput" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Add a tag"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddTag}
                        className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                      >
                        Add
                      </button>
                    </div>
                    {/* Display added tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                          {tag}
                          <button 
                            type="button"
                            onClick={() => handleRemoveTag(tag)} 
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
