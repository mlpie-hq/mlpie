// import Image from "next/image"; // Removed unused import

// Project data
const projects = [
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
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-foreground mb-1">Projects</h1>
          <p className="text-sm text-muted">Manage your ML projects and track their progress</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
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

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-card rounded-lg border border-border shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-5">
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
                <p className="text-sm text-muted mb-4 line-clamp-2">{project.description}</p>
                
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
                
                {/* Stats */}
                <div className="flex text-xs text-muted mt-4 pt-4 border-t border-border">
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
                    Updated {project.lastUpdated}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
