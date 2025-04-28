"use client";

import { useState } from 'react';
import Link from 'next/link';

// Re-add sourceTypeColors as it's used in the list rendering
const sourceTypeColors = {
  "PostgreSQL": { bg: "bg-blue-100", text: "text-blue-800" },
  "S3 Bucket": { bg: "bg-orange-100", text: "text-orange-800" },
  "API Import": { bg: "bg-purple-100", text: "text-purple-800" },
  "File Upload": { bg: "bg-gray-100", text: "text-gray-800" },
  "MongoDB": { bg: "bg-green-100", text: "text-green-800" },
  "BigQuery": { bg: "bg-yellow-100", text: "text-yellow-800" },
  "Transformation": { bg: "bg-gray-100", text: "text-gray-800" },
} as const;

// Helper function for Dataset Type styling (Copied from detail page)
const getDatasetTypeClasses = (type: string) => {
  if (type === "Source") {
    return "bg-green-100 text-green-800 border border-green-200";
  } else if (type === "Derived") {
    return "bg-purple-100 text-purple-800 border border-purple-200";
  }
  return "bg-gray-100 text-gray-800 border border-gray-200"; // Fallback
};

// Dataset data - Updated with Source/Derived types
const datasets = [
  {
    id: 1,
    name: "Customer Demographics",
    description: "Cleaned customer demographic data with 25+ attributes for personalization and segmentation analysis.",
    lastUpdated: "1 hour ago",
    status: "Ready",
    type: "Source" as const, // Updated type
    rows: 125000,
    size: "48 MB",
    tags: ["customers", "demographics", "production"],
    version: "2.1.0",
    source: {
      type: "PostgreSQL",
      location: "analytics-db.mlpie.ai",
      lastSync: "30 minutes ago",
      metadata: {
        database: "customer_analytics",
        table: "user_demographics",
        schema: "public"
      },
      canSync: true
    }
  },
  {
    id: 2,
    name: "Product Images",
    description: "High-resolution product images dataset with multiple angles and lighting conditions for training visual models.",
    lastUpdated: "2 days ago",
    status: "Processing",
    type: "Derived" as const, // Updated type
    sourceDatasetIds: ["1"], // Added link to source
    rows: 15700,
    size: "5.2 GB",
    tags: ["images", "products", "retail"],
    version: "1.3.2",
    source: {
      type: "S3 Bucket",
      location: "s3://mlpie-datasets/retail/images",
      lastSync: "2 days ago",
      metadata: {
        region: "us-west-2",
        prefix: "/retail/images",
        fileTypes: "jpg, png"
      },
      canSync: true
    }
  },
  {
    id: 3,
    name: "Support Tickets",
    description: "Annotated dataset of customer support tickets with sentiment and issue classification for training NLP models.",
    lastUpdated: "1 week ago",
    status: "Ready",
    type: "Source" as const, // Updated type
    rows: 87420,
    size: "156 MB",
    tags: ["nlp", "support", "text"],
    version: "3.0.0-beta",
    source: {
      type: "API Import",
      location: "Zendesk API",
      lastSync: "7 days ago",
      metadata: {
        endpoint: "https://api.zendesk.com/v2/tickets",
        filters: "date > 2023-01-01",
        auth: "OAuth2"
      },
      canSync: true
    }
  },
  {
    id: 4,
    name: "Sensor Readings",
    description: "Time-series data collected from IoT sensors with temperature, humidity, and pressure readings at 5-minute intervals.",
    lastUpdated: "3 days ago",
    status: "Ready",
    type: "Source" as const, // Updated type
    rows: 250000,
    size: "87 MB",
    tags: ["iot", "time-series", "sensors"],
    version: "1.0.4",
    source: {
      type: "File Upload",
      location: "Local Storage",
      lastSync: "3 days ago",
      metadata: {
        format: "CSV",
        uploaded: "2023-07-15",
        encoding: "UTF-8"
      },
      canSync: false
    }
  },
  // Add a 5th dataset for demonstration
  {
    id: 5,
    name: "Processed Sensor Data",
    description: "Sensor readings aggregated and cleaned for anomaly detection modeling.",
    lastUpdated: "1 day ago",
    status: "Ready",
    type: "Derived" as const, // Updated type
    sourceDatasetIds: ["4"], // Added link to source
    rows: 248500, // Slightly less after cleaning
    size: "80 MB",
    tags: ["iot", "time-series", "processed", "anomaly-detection"],
    version: "1.0.0",
    source: { // Example: indicating derived nature, maybe no direct source connection
      type: "Transformation", // Or similar indicative type
      location: "Processing Pipeline P-003",
      lastSync: "1 day ago",
      metadata: {
          pipelineId: "p-003",
          sourceDataset: "Sensor Readings (v1.0.4)"
      },
      canSync: false
     }
  }
];

// Stats cards data
const stats = [
  { label: "Total Datasets", value: "37" },
  { label: "Active in Models", value: "18" },
  { label: "Processing Jobs", value: "2", status: "running" },
  { label: "Total Storage", value: "12.4 GB" },
];

export default function Datasets() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [syncPopup, setSyncPopup] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  
  const toggleMenu = (datasetId: number) => {
    if (activeMenu === datasetId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(datasetId);
    }
  };

  const toggleTooltip = (datasetId: number | null) => {
    setActiveTooltip(datasetId);
  };

  const toggleSyncPopup = (datasetId: number | null, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSyncPopup(datasetId === syncPopup ? null : datasetId);
  };

  // Get unique source types
  const sourceTypes = Array.from(new Set(datasets.map(d => d.source.type)));

  // Filter datasets based on source type
  const filteredDatasets = filterSource 
    ? datasets.filter(d => d.source.type === filterSource)
    : datasets;

  // Get unique dataset types (Source/Derived) for filtering - NEW
  const datasetTypes = Array.from(new Set(datasets.map(d => d.type)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-bold text-foreground mb-1">Datasets</h1>
          <p className="text-sm text-muted">Manage your datasets and use them in model training</p>
        </div>
        <Link 
          href="/datasets/create"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center justify-center text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Dataset
        </Link>
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

      {/* Datasets Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">All Datasets</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search datasets..."
                className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <svg className="w-4 h-4 absolute right-2 top-2 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <select 
              className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filter datasets by type"
            >
              <option value="">All Types</option>
              {datasetTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            {/* Source Filter */}
            <select 
              className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Filter datasets by source"
              value={filterSource || ""}
              onChange={(e) => setFilterSource(e.target.value || null)}
            >
              <option value="">All Sources</option>
              {sourceTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            {/* View Toggle */}
            <div className="flex border border-border rounded-md overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
                aria-label="Grid view"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
                aria-label="Table view"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatasets.map((dataset) => (
              <div key={dataset.id} className="bg-card rounded-lg border border-border shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <Link href={`/datasets/${dataset.id}`} className="block p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2 mb-0.5"> 
                        <h3 className="text-lg font-semibold text-foreground line-clamp-1">{dataset.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getDatasetTypeClasses(dataset.type)}`}
                        >
                          {dataset.type}
                        </span>
                      </div>
                      <div className="text-xs text-muted">v{dataset.version}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        dataset.status === 'Ready' 
                          ? 'bg-green-100 text-green-800' 
                          : dataset.status === 'Processing' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dataset.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-4 line-clamp-2">{dataset.description}</p>
                  
                  {/* Source Info */}
                  <div className="bg-secondary/50 rounded-md p-2 mb-4 flex items-start relative"
                    onMouseEnter={() => toggleTooltip(dataset.id)}
                    onMouseLeave={() => toggleTooltip(null)}
                  >
                    <svg className="w-4 h-4 text-muted mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6" />
                      <path d="M14 3v5h5M9.88 16.12L13 19.24" />
                      <path d="M18.36 11.64a3 3 0 1 1-4.24 4.24" />
                    </svg>
                    <div className="text-xs flex-grow">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceTypeColors[dataset.source.type as keyof typeof sourceTypeColors].bg} ${sourceTypeColors[dataset.source.type as keyof typeof sourceTypeColors].text}`}>
                          {dataset.source.type}
                        </span>
                        {dataset.source.canSync && (
                          <button
                            className="ml-auto p-1 rounded-full hover:bg-secondary text-muted hover:text-foreground relative"
                            aria-label="Sync now"
                            title="Sync now"
                            onClick={(e) => toggleSyncPopup(dataset.id, e)}
                          >
                            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 2v6h-6"></path>
                              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                              <path d="M3 22v-6h6"></path>
                              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                            
                            {/* Sync Popup */}
                            {syncPopup === dataset.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-card rounded-md shadow-dropdown border border-border z-20 text-left py-2">
                                <div className="px-3 pb-2 text-sm font-medium border-b border-border">Sync Options</div>
                                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                                  Sync now
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                                  Schedule sync
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                                  View sync history
                                </button>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-muted truncate max-w-[200px] mt-1">{dataset.source.location}</div>
                      <div className="text-muted mt-0.5">Last synced {dataset.source.lastSync}</div>
                    </div>
                    
                    {/* Source Metadata Tooltip - appears immediately */}
                    {activeTooltip === dataset.id && (
                      <div className="absolute left-0 top-full transform translate-y-2 z-10 w-full bg-card rounded-md shadow-dropdown border border-border p-2 text-xs">
                        <div className="font-medium mb-1">Source Details</div>
                        {Object.entries(dataset.source.metadata).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-3 gap-1 mb-0.5">
                            <span className="text-muted capitalize">{key}:</span>
                            <span className="col-span-2">{value as string}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Dataset Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                      <span className="text-muted">Size:</span>
                      <span className="ml-1 font-medium">{dataset.size}</span>
                    </div>
                    <div>
                      <span className="text-muted">Records:</span>
                      <span className="ml-1 font-medium">{dataset.rows.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted">Updated:</span>
                      <span className="ml-1 font-medium">{dataset.lastUpdated}</span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {dataset.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between mt-4 pt-4 border-t border-border">
                    <button className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </button>
                    <button className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Analyze
                    </button>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-4 py-3 font-medium text-foreground">Name / Version</th>
                  <th className="px-4 py-3 font-medium text-foreground">Type</th>
                  <th className="px-4 py-3 font-medium text-foreground">Source</th>
                  <th className="px-4 py-3 font-medium text-foreground">Size</th>
                  <th className="px-4 py-3 font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-foreground">Last Updated</th>
                  <th className="px-4 py-3 font-medium text-foreground w-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.map((dataset, index) => (
                  <tr key={dataset.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/datasets/${dataset.id}`}>
                        <div>
                          <div className="font-medium text-foreground hover:underline">{dataset.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">v{dataset.version}</span>
                            <div className="text-xs text-muted truncate max-w-[200px]">{dataset.description}</div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getDatasetTypeClasses(dataset.type)}`}
                      >
                        {dataset.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 relative"
                        onMouseEnter={() => toggleTooltip(dataset.id)}
                        onMouseLeave={() => toggleTooltip(null)}
                    >
                      <div className="flex items-center">
                        <span className={`mr-2 px-2 py-0.5 rounded-full text-xs font-medium ${sourceTypeColors[dataset.source.type as keyof typeof sourceTypeColors].bg} ${sourceTypeColors[dataset.source.type as keyof typeof sourceTypeColors].text}`}>
                          {dataset.source.type}
                        </span>
                        {dataset.source.canSync && (
                          <button
                            className="ml-auto p-1 rounded-full hover:bg-secondary text-muted hover:text-foreground relative"
                            aria-label="Sync now"
                            title="Sync now"
                            onClick={(e) => toggleSyncPopup(dataset.id, e)}
                          >
                            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 2v6h-6"></path>
                              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                              <path d="M3 22v-6h6"></path>
                              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                            
                            {/* Sync Popup */}
                            {syncPopup === dataset.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-card rounded-md shadow-dropdown border border-border z-20 text-left py-2">
                                <div className="px-3 pb-2 text-sm font-medium border-b border-border">Sync Options</div>
                                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                                  Sync now
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                                  Schedule sync
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                                  View sync history
                                </button>
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-muted truncate max-w-[150px]">{dataset.source.location}</div>
                      
                      {/* Source Metadata Tooltip */}
                      {activeTooltip === dataset.id && (
                        <div className="absolute left-0 top-full transform translate-y-2 z-10 w-64 bg-card rounded-md shadow-dropdown border border-border p-2 text-xs">
                          <div className="font-medium mb-1">Source Details</div>
                          {Object.entries(dataset.source.metadata).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-1 mb-0.5">
                              <span className="text-muted capitalize">{key}:</span>
                              <span className="col-span-2">{value as string}</span>
                            </div>
                          ))}
                          <div className="mt-1 pt-1 border-t border-border">
                            <span className="text-muted">Last synced:</span> {dataset.source.lastSync}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div>{dataset.size}</div>
                        <div className="text-xs text-muted">{dataset.rows.toLocaleString()} records</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          dataset.status === 'Ready' 
                            ? 'bg-green-100 text-green-800' 
                            : dataset.status === 'Processing' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {dataset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{dataset.lastUpdated}</td>
                    <td className="px-4 py-3 relative">
                      <button 
                        className="p-1 rounded-full hover:bg-secondary flex items-center justify-center"
                        onClick={() => toggleMenu(dataset.id)}
                        aria-label="More actions"
                      >
                        <svg className="w-4 h-4 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      
                      {/* Context Menu */}
                      {activeMenu === dataset.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-card rounded-md shadow-dropdown border border-border z-10">
                          <ul className="py-1 text-sm">
                            <li>
                              <button className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center">
                                <svg className="w-3.5 h-3.5 mr-2 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                              </button>
                            </li>
                            <li>
                              <button className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center">
                                <svg className="w-3.5 h-3.5 mr-2 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                              </button>
                            </li>
                            <li>
                              <button className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center">
                                <svg className="w-3.5 h-3.5 mr-2 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Analyze
                              </button>
                            </li>
                            <li>
                              <button className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center">
                                <svg className="w-3.5 h-3.5 mr-2 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M9 12h6" />
                                  <path d="M12 9v6" />
                                </svg>
                                New Version
                              </button>
                            </li>
                            <li className="border-t border-border">
                              <button className="w-full text-left px-4 py-2 hover:bg-secondary flex items-center text-destructive">
                                <svg className="w-3.5 h-3.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Click outside handler for closing sync popup */}
      {syncPopup !== null && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setSyncPopup(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
} 