"use client"; // Add "use client" directive for useState

import { useState } from "react"; // Import useState
import Link from 'next/link'; // Import Link
import MultiMethodInterface from "../components/MultiMethodInterface"; // Import our new component
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

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Initialize projects state with initial data
  const [projects, setProjects] = useState(initialProjects);
  
  // Form state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  // State variables to track project name and description for real-time updates
  const [projectName, setProjectName] = useState('My Project');
  const [projectDescription, setProjectDescription] = useState('Project description');

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
    setProjectName('My Project');
    setProjectDescription('Project description');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // Function to add the new project
  const handleCreateProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Extract form data
    const name = formData.get('projectName') as string;
    const description = formData.get('projectDescription') as string;
    
    // Basic validation
    if (!name) {
      alert("Project name is required.");
      return;
    }

    // Create new project with simplified fields
    const newProject = {
      id: Date.now(),
      name,
      description: description || "",
      lastUpdated: "Just now",
      status: "Inactive",
      progress: 0,
      models: 0,
      datasets: 0,
      tags: [...tags],
      createdAt: new Date().toISOString(),
    };

    // Add to projects state
    setProjects([newProject, ...projects]);
    handleCloseModal();
  };

  // Helper function to generate example code snippets based on project name and description
  const getExampleCode = () => {
    // Use the current state variables for project name and description
    const name = projectName || 'My Project';
    const description = projectDescription || 'Project description';

    // Format the project name for use in identifiers (kebab-case)
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');

    // Format the tags as a comma-separated string for CLI
    const tagsString = tags.length > 0 ? tags.join(',') : 'ml,example';
    
    // Format tags as an array for YAML and SDK
    const tagsYaml = tags.length > 0 
      ? tags.map(tag => `    - "${tag}"`).join('\n')
      : '    - "ml"\n    - "example"';
    
    const tagsSDK = tags.length > 0 
      ? `[${tags.map(tag => `"${tag}"`).join(', ')}]`
      : '["ml", "example"]';

    // YAML example
    const yamlExample = `apiVersion: mlpie.ai/v1
kind: Project
metadata:
  name: ${formattedName}
spec:
  displayName: ${name}
  description: ${description}
  tags:
${tagsYaml}`;

    // CLI example
    const cliExample = `mlpie projects create --name "${name}" --description "${description}" --tags "${tagsString}"`;

    // SDK (Python) example
    const sdkExample = `from mlpie import MLPieClient

# Initialize client
client = MLPieClient()

# Create project
project = client.projects.create(
    name="${name}",
    description="${description}",
    tags=${tagsSDK}
)

print(f"Created project with ID: {project.id}")`;

    return { yamlExample, cliExample, sdkExample };
  };

  // Define form fields for the MultiMethodInterface component
  const formFields = [
    {
      id: 'projectName',
      name: 'projectName',
      label: 'Project Name',
      type: 'text' as const,
      placeholder: 'e.g., Customer Churn Predictor',
      required: true,
      value: projectName,
      onChange: setProjectName
    },
    {
      id: 'projectDescription',
      name: 'projectDescription',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'A brief description of the project\'s goal',
      required: false,
      value: projectDescription,
      onChange: setProjectDescription
    }
  ];

  // Tag handling for the MultiMethodInterface component
  const tagHandling = {
    tags,
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown
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

      {/* Create Project Modal using MultiMethodInterface component */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="m-4 my-8 relative w-1/2">
            {/* Close button outside of component for better control of modal */}
            <div className="absolute right-3 top-3 z-10">
              <button 
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-gray-600" 
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <MultiMethodInterface
              title="Create New Project"
              fields={formFields}
              getExampleCode={getExampleCode}
              onSubmit={handleCreateProject}
              tags={tagHandling}
              submitButtonText="Create Project"
              yamlInstructions="You can create a project by defining it in YAML and applying it with"
              cliInstructions="You can create a project using the MLPie command-line interface:"
              sdkInstructions="You can create a project programmatically using the MLPie Python SDK:"
            />
          </div>
        </div>
      )}
    </div>
  );
}
