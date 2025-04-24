export default function Pipelines() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-foreground mb-1">Pipelines</h1>
          <p className="text-sm text-muted">Create and manage your ML training and deployment pipelines</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Pipeline
        </button>
      </div>

      {/* Content Placeholder */}
      <div className="bg-card rounded-lg border border-border p-8 shadow-card text-center">
        <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12" />
            <path d="M6 8h12" />
            <path d="M6 13h12" />
            <path d="M6 18h12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">No Pipelines Yet</h2>
        <p className="text-muted max-w-md mx-auto mb-6">
          Create your first pipeline to automate model training, data preprocessing, and deployment workflows.
        </p>
        <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium">
          View Pipeline Templates
        </button>
      </div>
    </div>
  );
} 