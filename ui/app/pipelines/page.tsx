"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, Clock, MoreVertical } from "lucide-react";

// Mock data for pipelines
const pipelinesMockData = [
  {
    id: "pip-001",
    name: "Text Classification Pipeline",
    description: "BERT-based text classification for sentiment analysis",
    creator: "Sarah Chen",
    createdAt: "2023-10-15T14:30:00Z",
    lastModified: "2023-11-10T09:45:00Z",
    status: "Active",
    progress: 100,
    runtime: "4h 15m",
    tags: ["NLP", "Classification", "Production"],
  },
  {
    id: "pip-002",
    name: "Image Segmentation Workflow",
    description: "U-Net architecture for medical image segmentation",
    creator: "James Wilson",
    createdAt: "2023-09-28T11:20:00Z",
    lastModified: "2023-11-08T16:30:00Z",
    status: "Running",
    progress: 73,
    runtime: "12h 30m",
    tags: ["Computer Vision", "Healthcare", "Development"],
  },
  {
    id: "pip-003",
    name: "Time Series Forecasting",
    description: "LSTM model for stock market prediction",
    creator: "Alex Johnson",
    createdAt: "2023-10-05T09:15:00Z",
    lastModified: "2023-11-05T14:20:00Z",
    status: "Failed",
    progress: 68,
    runtime: "2h 45m",
    tags: ["Time Series", "Finance", "Experimental"],
  },
  {
    id: "pip-004",
    name: "Recommendation Engine",
    description: "Collaborative filtering for product recommendations",
    creator: "Lisa Wong",
    createdAt: "2023-10-20T13:40:00Z",
    lastModified: "2023-11-11T10:15:00Z",
    status: "Paused",
    progress: 45,
    runtime: "3h 20m",
    tags: ["Recommender", "E-commerce", "Production"],
  },
  {
    id: "pip-005",
    name: "Data ETL Pipeline",
    description: "Extract, transform, load pipeline for customer data",
    creator: "Mark Davis",
    createdAt: "2023-11-01T10:00:00Z",
    lastModified: "2023-11-12T11:30:00Z",
    status: "Active",
    progress: 100,
    runtime: "1h 10m",
    tags: ["ETL", "Data Engineering", "Production"],
  },
  {
    id: "pip-006",
    name: "Audio Classification",
    description: "Audio feature extraction and classification for voice commands",
    creator: "Priya Patel",
    createdAt: "2023-10-10T15:45:00Z",
    lastModified: "2023-11-09T13:25:00Z",
    status: "Running",
    progress: 89,
    runtime: "5h 40m",
    tags: ["Audio", "Classification", "Development"],
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
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function PipelinesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastModified");
  
  const filteredPipelines = pipelinesMockData
    .filter(pipeline => 
      pipeline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pipeline.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pipeline.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "lastModified") {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  
  return (
    <div>
      {/* Search and filters */}
      <div className="mb-6 flex justify-between">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search pipelines by name, description, or tags"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-gray-500">Sort by:</span>
          <div className="relative">
            <select
              aria-label="Sort pipelines by"
              className="appearance-none bg-white border border-gray-300 px-4 py-2 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="lastModified">Last Modified</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Pipelines List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pipeline
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPipelines.map((pipeline) => (
              <tr key={pipeline.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <Link 
                        href={`/pipelines/${pipeline.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {pipeline.name}
                      </Link>
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {pipeline.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pipeline.status)}`}>
                      {pipeline.status}
                    </span>
                    {pipeline.status === "Running" && (
                      <div className="ml-2 flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {pipeline.runtime}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pipeline.creator}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(pipeline.lastModified)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {pipeline.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    aria-label={`More options for ${pipeline.name}`}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 