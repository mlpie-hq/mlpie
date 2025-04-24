"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MoreVertical, Grid, List, Clock, Settings, Tag, Power, HelpCircle, Puzzle, Activity } from "lucide-react"; // Added Puzzle for plugins

// Mock data for plugins
const pluginsMockData = [
  {
    id: "plugin-001",
    name: "Slack Notifier",
    description: "Sends notifications to Slack channels based on pipeline events.",
    developer: "MLPie Core",
    createdAt: "2023-09-10T10:00:00Z",
    lastModified: "2023-11-22T11:00:00Z",
    category: "Notification",
    status: "Enabled",
    version: "1.3.0",
    tags: ["Slack", "Notifications", "Communication"],
  },
  {
    id: "plugin-002",
    name: "Data Quality Checker",
    description: "Validates incoming data against predefined rules and schemas.",
    developer: "Community Contributor",
    createdAt: "2023-10-05T14:20:00Z",
    lastModified: "2023-11-15T09:30:00Z",
    category: "Data Validation",
    status: "Enabled",
    version: "2.1.1",
    tags: ["Data Quality", "Validation", "Preprocessing"],
  },
  {
    id: "plugin-003",
    name: "Model Monitoring Dashboard",
    description: "Integrates with monitoring tools to display model performance metrics.",
    developer: "MLPie Core",
    createdAt: "2023-08-20T16:00:00Z",
    lastModified: "2023-11-20T16:45:00Z",
    category: "Monitoring",
    status: "Disabled",
    version: "1.0.5",
    tags: ["Monitoring", "Dashboard", "Performance"],
  },
  {
    id: "plugin-004",
    name: "GitHub Integration",
    description: "Connects pipelines to GitHub repositories for code versioning.",
    developer: "MLPie Core",
    createdAt: "2023-11-01T12:00:00Z",
    lastModified: "2023-11-19T17:00:00Z",
    category: "Integration",
    status: "Enabled",
    version: "1.1.0",
    tags: ["GitHub", "Versioning", "CI/CD"],
  },
  {
    id: "plugin-005",
    name: "Custom Alerting",
    description: "Allows configuration of custom alert rules for various system events.",
    developer: "Community Contributor",
    createdAt: "2023-10-18T09:00:00Z",
    lastModified: "2023-11-10T10:15:00Z",
    category: "Alerting",
    status: "Disabled",
    version: "1.0.0",
    tags: ["Alerts", "Customization"],
  },
];

// Helper functions
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
    case 'enabled':
      return 'bg-green-100 text-green-800';
    case 'disabled':
      return 'bg-gray-100 text-gray-800';
    // Add other statuses if needed (e.g., error, pending)
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Icon based on plugin category (example)
function getPluginCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'notification':
      return <svg className="h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; // Bell icon
    case 'data validation':
      return <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; // Check circle
    case 'monitoring':
       return <Activity className="h-4 w-4 text-orange-500" />;
    case 'integration':
      return <Puzzle className="h-4 w-4 text-purple-500" />;
    case 'alerting':
      return <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; // Alert triangle
    default:
      return <Puzzle className="h-4 w-4 text-gray-500" />;
  }
}


export default function PluginsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastModified");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Get unique plugin categories and statuses for filters
  const pluginCategories = Array.from(new Set(pluginsMockData.map(plugin => plugin.category)));
  const pluginStatuses = Array.from(new Set(pluginsMockData.map(plugin => plugin.status)));

  const filteredPlugins = pluginsMockData
    .filter(plugin =>
      (searchQuery === "" ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      ) &&
      (categoryFilter === null || plugin.category === categoryFilter) &&
      (statusFilter === null || plugin.status === statusFilter)
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
          <h1 className="text-xl font-semibold text-gray-900">All Plugins</h1>
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
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            aria-label="Filter plugins by category"
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={categoryFilter || ""}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {pluginCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Status Filter Dropdown */}
          <select
            aria-label="Filter plugins by status"
            className="block w-full sm:w-auto pl-3 pr-8 py-2 text-base border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none"
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            {pluginStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            aria-label="Sort plugins by"
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
          {filteredPlugins.map((plugin) => (
            <div key={plugin.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col">
              <div className="p-5 flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                     {getPluginCategoryIcon(plugin.category)}
                     <span className="ml-2 font-medium">{plugin.category}</span>
                  </div>
                   <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(plugin.status)}`}>
                     {plugin.status}
                   </span>
                </div>
                
                {/* Link to detail page if it exists, otherwise just display name */}
                {/* <Link href={`/plugins/${plugin.id}`}> */}
                 <h3 className="text-lg font-medium text-gray-900 /*hover:text-indigo-600*/ line-clamp-1">{plugin.name}</h3>
                {/* </Link> */}
                 <span className="text-xs text-gray-500 block mb-2">v{plugin.version}</span>

                <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-grow">{plugin.description}</p>
                
                <div className="mt-3">
                  <div className="flex items-center text-sm text-gray-500">
                     <svg className="h-4 w-4 mr-1.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
                     Developer: {plugin.developer}
                  </div>
                   <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                    Updated: {formatDate(plugin.lastModified)}
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-1">
                  {plugin.tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Actions Footer */}
              <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-t border-gray-200">
                 <button 
                    className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm ${plugin.status === 'Enabled' ? 'text-red-700 bg-red-100 hover:bg-red-200' : 'text-green-700 bg-green-100 hover:bg-green-200'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    aria-label={plugin.status === 'Enabled' ? `Disable ${plugin.name}` : `Enable ${plugin.name}`}
                    title={plugin.status === 'Enabled' ? `Disable ${plugin.name}` : `Enable ${plugin.name}`}
                 >
                   <Power className="h-4 w-4 mr-1" />
                   {plugin.status === 'Enabled' ? 'Disable' : 'Enable'}
                 </button>
                 <div className="flex space-x-1">
                   <button
                    aria-label={`Settings for ${plugin.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                    title="Settings"
                   >
                     <Settings className="h-5 w-5" />
                   </button>
                    <button
                    aria-label={`Help for ${plugin.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                    title="Help / Documentation"
                   >
                     <HelpCircle className="h-5 w-5" />
                   </button>
                   {/* Optional: Add MoreVertical if needed */}
                   {/* <button
                    aria-label={`More options for ${plugin.name}`}
                    className="text-gray-400 hover:text-indigo-600 p-1"
                   >
                     <MoreVertical className="h-5 w-5" />
                   </button> */}
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
                    Plugin Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Developer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
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
                {filteredPlugins.map((plugin) => (
                  <tr key={plugin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                         {/* Icon could go here */} 
                         {/* <div className="mr-2">{getPluginCategoryIcon(plugin.category)}</div> */} 
                        <div>
                           {/* <Link href={`/plugins/${plugin.id}`}> */}
                            <span className="text-sm font-medium text-gray-900">{plugin.name}</span>
                          {/* </Link> */}
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {plugin.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-2">
                          {getPluginCategoryIcon(plugin.category)}
                        </div>
                        <span className="text-sm text-gray-900">{plugin.category}</span>
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(plugin.status)}`}>
                        {plugin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plugin.developer}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{plugin.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(plugin.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex justify-end items-center space-x-2">
                         <button 
                           className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${plugin.status === 'Enabled' ? 'text-red-700 bg-red-100 hover:bg-red-200' : 'text-green-700 bg-green-100 hover:bg-green-200'}`}
                         >
                           <Power className="h-3 w-3 mr-1" />
                            {plugin.status === 'Enabled' ? 'Disable' : 'Enable'}
                         </button>
                         <button
                          aria-label={`Settings for ${plugin.name}`}
                          className="text-gray-400 hover:text-indigo-600 p-1"
                          title="Settings"
                         >
                           <Settings className="h-5 w-5" />
                         </button>
                         <button
                          aria-label={`Help for ${plugin.name}`}
                          className="text-gray-400 hover:text-indigo-600 p-1"
                          title="Help / Documentation"
                         >
                           <HelpCircle className="h-5 w-5" />
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
      {filteredPlugins.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Puzzle className="mx-auto h-12 w-12 text-gray-400" /> 
          <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria, or install new plugins.
          </p>
        </div>
      )}
    </div>
  );
} 