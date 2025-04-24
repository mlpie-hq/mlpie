"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MoreVertical, Grid, List, Clock, Activity, FileText, Settings, Tag } from "lucide-react"; // Added FileText, Settings, Tag

// Mock data for prompts
const promptsMockData = [
  {
    id: "prompt-001",
    name: "Product Description Generator",
    description: "Generates engaging product descriptions based on keywords and features.",
    creator: "Marketing Team",
    createdAt: "2023-11-01T10:00:00Z",
    lastModified: "2023-11-20T15:30:00Z",
    type: "Generation",
    modelUsed: "GPT-4",
    status: "Active",
    version: "1.2.0",
    tags: ["Marketing", "E-commerce", "Content"],
  },
  {
    id: "prompt-002",
    name: "Customer Support Responder",
    description: "Drafts empathetic and helpful replies to common customer support queries.",
    creator: "Support Team",
    createdAt: "2023-10-15T09:15:00Z",
    lastModified: "2023-11-18T11:00:00Z",
    type: "Generation",
    modelUsed: "Claude 3 Sonnet",
    status: "Active",
    version: "2.0.1",
    tags: ["Support", "Customer Service", "Drafting"],
  },
  {
    id: "prompt-003",
    name: "Sentiment Analysis Classifier",
    description: "Classifies text input into Positive, Negative, or Neutral sentiment.",
    creator: "Data Science",
    createdAt: "2023-09-25T14:00:00Z",
    lastModified: "2023-11-10T09:45:00Z",
    type: "Classification",
    modelUsed: "BERT", // Can also be specific LLM tuned for classification
    status: "Archived",
    version: "1.0.0",
    tags: ["NLP", "Sentiment", "Analysis"],
  },
  {
    id: "prompt-004",
    name: "Code Explanation Generator",
    description: "Explains complex code snippets in plain English.",
    creator: "Engineering Team",
    createdAt: "2023-11-05T16:30:00Z",
    lastModified: "2023-11-19T10:10:00Z",
    type: "Explanation",
    modelUsed: "GPT-4",
    status: "Active",
    version: "1.1.0",
    tags: ["Code", "Development", "Documentation"],
  },
   {
    id: "prompt-005",
    name: "Meeting Summarizer",
    description: "Summarizes long meeting transcripts into key points and action items.",
    creator: "Product Team",
    createdAt: "2023-10-28T11:00:00Z",
    lastModified: "2023-11-21T14:55:00Z",
    type: "Summarization",
    modelUsed: "Claude 3 Haiku",
    status: "Draft",
    version: "0.9.0",
    tags: ["Summarization", "Meetings", "Productivity"],
  },
];

// Helper functions (similar to models page)
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
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Icon based on prompt type (example)
function getPromptTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'generation':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'classification':
      return <Tag className="h-4 w-4 text-purple-500" />;
    case 'explanation':
       return <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20V16"/></svg>; // Example: Bar chart icon
    case 'summarization':
       return <svg className="h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>; // Example: Align left
    default:
      return <Settings className="h-4 w-4 text-gray-500" />;
  }
}


export default function PromptsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastModified");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Get unique prompt types and statuses for filters
  const promptTypes = Array.from(new Set(promptsMockData.map(prompt => prompt.type)));
  const promptStatuses = Array.from(new Set(promptsMockData.map(prompt => prompt.status)));

  const filteredPrompts = promptsMockData
    .filter(prompt =>
      (searchQuery === "" ||
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) &&
      (typeFilter === null || prompt.type === typeFilter) &&
      (statusFilter === null || prompt.status === statusFilter)
    )
    .sort((a, b) => {
      if (sortBy === "lastModified") {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "createdAt") {
         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Combined Header and Controls Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">All Prompts</h1>
        </div>

        {/* Controls Group (Search, Filters, View Toggle) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-64 md:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter Dropdown */}
          <select
            aria-label="Filter prompts by type"
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={typeFilter || ""}
            onChange={(e) => setTypeFilter(e.target.value || null)}
          >
            <option value="">All Types</option>
            {promptTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status Filter Dropdown */}
          <select
            aria-label="Filter prompts by status"
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            {promptStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            aria-label="Sort prompts by"
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="lastModified">Last Modified</option>
            <option value="name">Name</option>
             <option value="createdAt">Created At</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white shrink-0">
            <button
              className={`p-2 ${viewMode === 'card' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setViewMode('card')}
              aria-label="Card view"
              title="Card view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
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
          {filteredPrompts.map((prompt) => (
            <div key={prompt.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
              <div className="p-5 flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    {getPromptTypeIcon(prompt.type)}
                    <span className="ml-2">{prompt.type}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(prompt.status)}`}>
                    {prompt.status}
                  </span>
                </div>
                
                <Link href={`/prompts/${prompt.id}`}>
                  <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 line-clamp-1">{prompt.name}</h3>
                </Link>
                <span className="text-xs text-gray-500 block mb-2">v{prompt.version}</span>
                
                <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-grow">{prompt.description}</p>
                
                <div className="mt-3">
                  <div className="flex items-center text-sm text-gray-500">
                     <svg className="h-4 w-4 mr-1.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
                     {prompt.creator}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                    Modified: {formatDate(prompt.lastModified)}
                  </div>
                   <div className="flex items-center text-sm text-gray-500 mt-1">
                     <Settings className="h-4 w-4 mr-1.5 text-gray-400" />
                     Model: {prompt.modelUsed}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-1">
                  {prompt.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Actions Footer - Simplified for Prompts */}
              <div className="bg-gray-50 px-5 py-3 flex justify-end items-center border-t border-gray-200">
                 <div className="flex space-x-2">
                   <button
                    aria-label={`Edit ${prompt.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                   >
                     <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                   </button>
                   <button
                    aria-label={`More options for ${prompt.name}`}
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
                    Prompt Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrompts.map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <Link 
                            href={`/prompts/${prompt.id}`} 
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {prompt.name}
                          </Link>
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {prompt.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {getPromptTypeIcon(prompt.type)}
                        </div>
                        <span className="text-sm text-gray-900">{prompt.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(prompt.status)}`}>
                        {prompt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prompt.modelUsed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(prompt.lastModified)}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{prompt.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          aria-label={`Edit ${prompt.name}`}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button 
                          aria-label={`More options for ${prompt.name}`}
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
      {filteredPrompts.length === 0 && (
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
              // Using a document or text icon for prompts empty state
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No prompts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
} 