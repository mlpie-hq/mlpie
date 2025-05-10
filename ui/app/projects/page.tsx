"use client"; // Add "use client" directive for useState

import { useState, useEffect, KeyboardEvent } from "react"; // Added KeyboardEvent
import Link from 'next/link'; // Import Link
import MultiMethodInterface, { UIFormField, FormData as MultiFormData, CodeExample } from "@/components/MultiMethodInterface"; // Import types
import { projectService, Project } from "@/services/projectService"; // Import service and interface

// import Image from "next/image"; // Removed unused import

// Stats cards data
const stats = [
  { label: "Total Projects", value: "12" },
  { label: "Active Models", value: "24" },
  { label: "Training Jobs", value: "3", status: "running" },
  { label: "Total Datasets", value: "37" },
];

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]); // Use Project interface
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [projectName, setProjectName] = useState('My Project');
  const [projectDescription, setProjectDescription] = useState('Project description');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const fetchedProjects = await projectService.getProjects();
        setProjects(fetchedProjects);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        // It's good practice to provide a user-friendly error message
        if (err instanceof Error) {
            setError(`Failed to load projects: ${err.message}. Please try again later.`);
        } else {
            setError("Failed to load projects due to an unknown error. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Function to add a tag from input
  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  // Function to remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Function to handle pressing Enter in the tag input
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
  const handleCreateProject = (formData: MultiFormData) => {
    const name = formData.projectName as string;
    const description = formData.projectDescription as string;
    
    // Basic validation
    if (!name) {
      alert("Project name is required.");
      return;
    }

    // Create a new project object. Note: This new project is created on the client-side.
    // It won't have real 'models', 'datasets', or 'updated' info from a backend perspective
    // until it's persisted and re-fetched, or if the create API returns the full object.
    // The projectService.getProjects() provides dummy data for these.
    // For consistency, newly created projects here will have some default/dummy values too.
    const newProject: Project = {
      // id: Date.now(), // The Project interface from service doesn't have id. Assuming name is key for now or backend assigns id.
      name,
      description: description || "",
      updated: "Just now", // Dummy value
      status: "Inactive", // Default status
      models: 0, // Dummy value
      datasets: 0, // Dummy value
      // tags: [...tags], // The Project interface doesn't have tags. This might need adjustment.
      // createdAt: new Date().toISOString(), // The Project interface doesn't have createdAt
    };

    // Add to projects state
    setProjects([newProject, ...projects]); // Add to the beginning of the list
    handleCloseModal();
  };

  // Helper function to generate example code snippets based on project name and description
  const getExampleCode = (formData: MultiFormData): CodeExample => {
    const name = (formData.projectName as string) || 'My Project';
    const description = (formData.projectDescription as string) || 'Project description';
    // Use the 'tags' state directly as MultiMethodInterface handles form data separately for its core fields
    const currentTags = tags;

    // Format the project name for use in identifiers (kebab-case)
    const formattedName = name.toLowerCase().replace(/\s+/g, '-');

    // Format the tags as a comma-separated string for CLI
    const tagsString = currentTags.length > 0 ? currentTags.join(',') : 'ml,example';
    
    // Format tags as an array for YAML and SDK
    const tagsYaml = currentTags.length > 0 
      ? currentTags.map(tag => `    - "${tag}"`).join('\n')
      : '    - "ml"\n    - "example"';
    
    const tagsSDK = currentTags.length > 0 
      ? `[${currentTags.map(tag => `"${tag}"`).join(', ')}]`
      : '["ml", "example"]';

    // YAML example
    const yamlExample = `apiVersion: mlpie.ai/v1
kind: Project
metadata:
  name: ${formattedName}
spec:
  displayName: ${name}
  description: ${description}
  tags:\n${tagsYaml}`;

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
  const formFields: UIFormField[] = [
    {
      id: 'projectName',
      name: 'projectName',
      label: 'Project Name',
      type: 'text' as const,
      placeholder: 'e.g., Customer Churn Predictor',
      required: true,
      value: projectName,
      onChange: (value) => setProjectName(value as string)
    },
    {
      id: 'projectDescription',
      name: 'projectDescription',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'A brief description of the project\'s goal',
      required: false,
      value: projectDescription,
      onChange: (value) => setProjectDescription(value as string)
    }
  ];

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
        
        {isLoading && <p className="text-center text-muted">Loading projects...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!isLoading && !error && (
          <>
            {projects.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center">No projects found. Start by creating one!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => ( // Use index for key if project doesn't have a unique ID from service
                  <Link key={project.name + index} href={`/projects/${project.name.toLowerCase().replace(/\\s+/g, '-')}`} className="block hover:no-underline"> {/* Assuming name can be used for a slug-like URL for now */}
                    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden h-full flex flex-col hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                      <div className="p-5 flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-foreground line-clamp-1">{project.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${ 
                              project.status.toLowerCase() === 'active' // Normalize status check
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted mb-4 line-clamp-2 flex-grow">{project.description}</p>
                        
                        {/* Progress bar removed as requested */}
                      </div>
                      <div className="p-5 pt-0 mt-auto"> {/* Ensure this div is correctly placed for layout */}
                        <div className="flex text-xs text-muted pt-4 border-t border-border">
                          <div className="flex items-center mr-4">
                            <svg className="w-4 h-4 mr-1 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                            <span>{project.models} Models</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>{project.datasets} Datasets</span>
                          </div>
                          <div className="ml-auto text-muted">
                            {project.updated} {/* Using 'updated' from service */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
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
              tags={tags}
              tagInput={tagInput}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onTagInputChange={handleTagInputChange}
              onTagInputKeyDown={handleTagKeyDown}
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
