export default function Models() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-foreground mb-1">Models</h1>
          <p className="text-sm text-muted">Browse, train and deploy machine learning models</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors">
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Model
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-card">
          <p className="text-sm text-muted mb-1">Models in Registry</p>
          <h3 className="text-2xl font-bold text-foreground">18</h3>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-card">
          <p className="text-sm text-muted mb-1">Models Deployed</p>
          <h3 className="text-2xl font-bold text-foreground">7</h3>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-card">
          <p className="text-sm text-muted mb-1">Training Jobs</p>
          <div className="flex items-center">
            <h3 className="text-2xl font-bold text-foreground">2</h3>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
              Running
            </span>
          </div>
        </div>
      </div>

      {/* Model Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7"></polyline>
                  <line x1="9" y1="20" x2="15" y2="20"></line>
                  <line x1="12" y1="4" x2="12" y2="20"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Classification</h3>
            </div>
            <p className="text-sm text-muted mb-4">Models that categorize data into predefined classes or labels.</p>
            <div className="text-xs text-muted">
              <span className="font-medium">6 models</span> • <span>2 deployed</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6" y2="6"></line>
                  <line x1="6" y1="18" x2="6" y2="18"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Large Language Models</h3>
            </div>
            <p className="text-sm text-muted mb-4">Transformer-based models for text processing and generation.</p>
            <div className="text-xs text-muted">
              <span className="font-medium">4 models</span> • <span>3 deployed</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M16 13.37a4 4 0 1 1-4 0V4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Computer Vision</h3>
            </div>
            <p className="text-sm text-muted mb-4">Models for image classification, object detection, and segmentation.</p>
            <div className="text-xs text-muted">
              <span className="font-medium">5 models</span> • <span>1 deployed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 