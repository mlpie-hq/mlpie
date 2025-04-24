"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MoreVertical, Zap, Layers, Download, Grid, List, Clock, Activity } from "lucide-react";

// Mock data for models
const modelsMockData = [
  {
    id: "mod-001",
    name: "Customer Churn Predictor",
    description: "XGBoost model for predicting customer churn probability",
    creator: "Alex Johnson",
    createdAt: "2023-10-10T11:20:00Z",
    lastModified: "2023-11-15T14:30:00Z",
    type: "Classification",
    framework: "XGBoost",
    status: "Deployed",
    accuracy: 0.92,
    runtime: "25ms",
    tags: ["Churn", "Customer", "Production"],
  },
  {
    id: "mod-002",
    name: "Product Recommendation Engine",
    description: "Collaborative filtering model for personalized product recommendations",
    creator: "Sarah Chen",
    createdAt: "2023-09-05T13:45:00Z",
    lastModified: "2023-11-12T10:30:00Z",
    type: "Recommendation",
    framework: "TensorFlow",
    status: "Training",
    accuracy: 0.85,
    runtime: "150ms",
    tags: ["Recommendation", "E-commerce", "Development"],
  },
  {
    id: "mod-003",
    name: "Sentiment Analysis Model",
    description: "BERT-based model for analyzing sentiment in customer reviews",
    creator: "Michael Wong",
    createdAt: "2023-10-22T09:10:00Z",
    lastModified: "2023-11-10T15:45:00Z",
    type: "NLP",
    framework: "PyTorch",
    status: "Deployed",
    accuracy: 0.88,
    runtime: "85ms",
    tags: ["NLP", "Sentiment", "Production"],
  },
  {
    id: "mod-004",
    name: "Image Classification Model",
    description: "ResNet50 model for product image classification",
    creator: "Emma Davis",
    createdAt: "2023-08-15T10:00:00Z",
    lastModified: "2023-11-05T11:20:00Z",
    type: "Computer Vision",
    framework: "Keras",
    status: "Deployed",
    accuracy: 0.94,
    runtime: "110ms",
    tags: ["Computer Vision", "Classification", "Production"],
  },
  {
    id: "mod-005",
    name: "Price Prediction Model",
    description: "Regression model for predicting product prices based on features",
    creator: "David Kim",
    createdAt: "2023-10-30T16:20:00Z",
    lastModified: "2023-11-08T13:15:00Z",
    type: "Regression",
    framework: "Scikit-learn",
    status: "Testing",
    accuracy: 0.79,
    runtime: "18ms",
    tags: ["Regression", "Pricing", "Development"],
  },
  {
    id: "mod-006",
    name: "Fraud Detection System",
    description: "Ensemble model for detecting fraudulent transactions",
    creator: "Lisa Wong",
    createdAt: "2023-09-18T14:30:00Z",
    lastModified: "2023-11-14T16:40:00Z",
    type: "Classification",
    framework: "LightGBM",
    status: "Deployed",
    accuracy: 0.96,
    runtime: "35ms",
    tags: ["Fraud", "Finance", "Production"],
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'deployed':
      return 'bg-green-100 text-green-800';
    case 'training':
      return 'bg-blue-100 text-blue-800';
    case 'testing':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'classification':
      return <Layers className="h-4 w-4 text-purple-500" />;
    case 'regression':
      return <Zap className="h-4 w-4 text-blue-500" />;
    case 'nlp':
      return <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M8 9h8m-8 4h8m-8 4h5"/></svg>;
    case 'recommendation':
      return <svg className="h-4 w-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    case 'computer vision':
      return <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 19c-2.3 0-4.3-1.9-4.3-4.3 0-.6.4-1 1-1s1 .4 1 1c0 1.3 1 2.3 2.3 2.3s2.3-1 2.3-2.3c0-.6.4-1 1-1s1 .4 1 1c0 2.4-2 4.3-4.3 4.3z"/></svg>;
    default:
      return <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
  }
}

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastModified");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  // Get unique model types and statuses for filters
  const modelTypes = Array.from(new Set(modelsMockData.map(model => model.type)));
  const modelStatuses = Array.from(new Set(modelsMockData.map(model => model.status)));
  
  const filteredModels = modelsMockData
    .filter(model => 
      (searchQuery === "" || 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) &&
      (typeFilter === null || model.type === typeFilter) &&
      (statusFilter === null || model.status === statusFilter)
    )
    .sort((a, b) => {
      if (sortBy === "lastModified") {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "accuracy") {
        return b.accuracy - a.accuracy;
      }
      return 0;
    });
  
  return (
    <div className="space-y-6">
      {/* Combined Header and Controls Section - Refined */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">All Models</h1> 
        </div>
        
        {/* Controls Group (Search, Filters, View Toggle) */} 
        <div className="flex flex-col sm:flex-row sm:items-center gap-2"> 
          {/* Search Input - Adjusted width */}
          <div className="relative w-full sm:w-64 md:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              // Using slightly different padding/classes to match reference visual style
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Type Filter Dropdown - Adjusted style */}
          <select
            aria-label="Filter models by type"
            // Added pr-8 for dropdown arrow space, adjusted padding
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={typeFilter || ""}
            onChange={(e) => setTypeFilter(e.target.value || null)}
          >
            <option value="">All Types</option>
            {modelTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {/* Status Filter Dropdown - Adjusted style */}
          <select
            aria-label="Filter models by status"
            // Added pr-8 for dropdown arrow space, adjusted padding
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            {modelStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          {/* Sort By Dropdown - Adjusted style */}
          <select
            aria-label="Sort models by"
            // Added pr-8 for dropdown arrow space, adjusted padding
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="lastModified">Last Modified</option>
            <option value="name">Name</option>
            <option value="accuracy">Accuracy</option>
          </select>
          
          {/* View Toggle - Adjusted style */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white shrink-0">
            <button
              // Adjusted padding and active state style
              className={`p-2 ${viewMode === 'card' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('card')}
              aria-label="Card view"
              title="Card view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              // Adjusted padding and active state style
              className={`p-2 ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              title="Table view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div key={model.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      {getTypeIcon(model.type)}
                      <span className="text-sm text-gray-600 ml-2">{model.type}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(model.status)}`}>
                        {model.status}
                      </span>
                    </div>
                    
                    <Link href={`/models/${model.id}`}>
                      <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600">{model.name}</h3>
                    </Link>
                    
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{model.description}</p>
                    
                    <div className="mt-3">
                      <div className="flex items-center text-sm">
                        <Activity className="h-4 w-4 text-gray-400 mr-1.5" />
                        <span className="text-gray-600 mr-1">Accuracy:</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-1.5">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${model.accuracy * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-900">{(model.accuracy * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="flex items-center text-sm mt-1">
                        <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                        <span className="text-gray-600 mr-1">Last modified:</span>
                        <span className="text-gray-900">{formatDate(model.lastModified)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {model.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-t border-gray-200">
                <span className="text-sm text-gray-500">Framework: {model.framework}</span>
                
                <div className="flex space-x-2">
                  <button
                    aria-label={`Deploy ${model.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                  >
                    <Zap className="h-5 w-5" />
                  </button>
                  <button
                    aria-label={`Download ${model.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    aria-label={`More options for ${model.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Framework
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <Link 
                            href={`/models/${model.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {model.name}
                          </Link>
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {model.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {getTypeIcon(model.type)}
                        </div>
                        <span className="text-sm text-gray-900">{model.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(model.status)}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${model.accuracy * 100}%` }}
                          ></div>
                        </div>
                        <span>{(model.accuracy * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {model.framework}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(model.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          aria-label={`Deploy ${model.name}`}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Zap className="h-5 w-5" />
                        </button>
                        <button 
                          aria-label={`Download ${model.name}`}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button 
                          aria-label={`More options for ${model.name}`}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {filteredModels.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No models found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
} 