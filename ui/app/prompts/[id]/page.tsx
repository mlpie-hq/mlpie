"use client";

import { useState } from "react";
import { 
  Clock, 
  Settings, 
  FileText, 
  Play, 
  Copy, 
  SlidersHorizontal, 
  History // For history tab
} from "lucide-react";

// Mock data for a specific prompt
const promptData = {
  id: "prompt-001",
  name: "Product Description Generator",
  description: "Generates engaging product descriptions based on keywords and features. Uses a persona for tone.",
  creator: "Marketing Team",
  createdAt: "2023-11-01T10:00:00Z",
  lastModified: "2023-11-20T15:30:00Z",
  type: "Generation",
  modelUsed: "GPT-4",
  status: "Active",
  version: "1.2.0",
  tags: ["Marketing", "E-commerce", "Content", "GPT-4"],
  
  // Additional details for prompt detail page
  promptText: `You are an expert e-commerce copywriter. Your goal is to write a compelling product description for the following product based on the provided keywords and features. Adopt a {tone} tone.

Product Name: {product_name}
Keywords: {keywords}
Features:\n{features}

Constraint: The description should be between 50 and 100 words.

Output format: Plain text product description.`,
  
  parameters: {
    temperature: 0.7,
    max_tokens: 150,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    stop_sequences: [],
  },
  
  variables: [
    { name: "tone", type: "string", description: "Desired tone (e.g., 'playful', 'professional', 'urgent')", defaultValue: "persuasive" },
    { name: "product_name", type: "string", description: "The name of the product.", defaultValue: "" },
    { name: "keywords", type: "string", description: "Comma-separated keywords relevant to the product.", defaultValue: "" },
    { name: "features", type: "string", description: "Bulleted or numbered list of product features.", defaultValue: "" },
  ],

  usageExamples: [
    {
      input: {
        tone: "playful",
        product_name: "Quantum Sneakers",
        keywords: "running shoes, comfortable, lightweight, futuristic",
        features: "- Anti-gravity soles\n- Self-tying laces\n- Color-changing fabric"
      },
      output: "Bounce into the future with Quantum Sneakers! These aren't your average running shoes. Featuring revolutionary anti-gravity soles and slick self-tying laces, they're the lightest, comfiest ride this side of the Milky Way. Plus, the color-changing fabric means your style is always on point. Get ready to run like never before!"
    }
  ],
  
  versionHistory: [
    { version: "1.2.0", date: "2023-11-20T15:30:00Z", user: "Alice B.", changes: "Added {tone} variable and updated constraint.", status: "Active" },
    { version: "1.1.0", date: "2023-11-15T09:00:00Z", user: "Alice B.", changes: "Refined prompt structure for better feature handling.", status: "Archived" },
    { version: "1.0.0", date: "2023-11-01T10:00:00Z", user: "Marketing Team", changes: "Initial prompt creation.", status: "Archived" },
  ]
};

// Helper functions
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
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

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'configuration' | 'playground' | 'history'>('overview');
  
  // In a real app, fetch prompt data based on params.id
  const prompt = promptData;
  
  console.log(`Prompt ID from params: ${params.id}`);

  return (
    <div>
      {/* Prompt Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-indigo-600" /> 
                {prompt.name}
              </h1>
              <div className="ml-3 flex items-center">
                <span className="text-sm text-gray-500 mr-2">v{prompt.version}</span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(prompt.status)}`}>
                  {prompt.status}
                </span>
              </div>
            </div>
            <p className="text-gray-500 mt-1 max-w-2xl">{prompt.description}</p>
            
            <div className="flex items-center mt-3 space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                 <svg className="h-4 w-4 mr-1.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
                Created by: {prompt.creator}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Settings className="h-4 w-4 mr-1.5 text-gray-400" />
                Model: {prompt.modelUsed}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                Last modified: {formatDate(prompt.lastModified)}
              </div>
            </div>
            
            <div className="flex mt-2 flex-wrap gap-1">
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
          
          {/* Action Buttons */} 
          <div className="flex space-x-2 shrink-0">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Play className="h-4 w-4 mr-2" />
              Playground
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview' as const, label: 'Overview' },
            { key: 'configuration' as const, label: 'Configuration' },
            { key: 'playground' as const, label: 'Playground' },
            { key: 'history' as const, label: 'History' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.key 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Prompt Text */} 
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Prompt Template</h3>
                <button 
                  className="text-gray-400 hover:text-indigo-600 p-1"
                  onClick={() => navigator.clipboard.writeText(prompt.promptText)}
                  aria-label="Copy prompt text"
                  title="Copy prompt text"
                  >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5">
                 <pre className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-md overflow-x-auto">
                   {prompt.promptText}
                 </pre>
              </div>
            </div>

            {/* Prompt Variables */} 
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Input Variables</h3>
              </div>
              <div className="px-6 py-5">
                 {prompt.variables.length > 0 ? (
                   <ul className="space-y-3">
                     {prompt.variables.map((variable) => (
                       <li key={variable.name} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-center mb-1">
                            <code className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{`{${variable.name}}`}</code>
                            <span className="text-xs text-gray-500">Type: {variable.type}</span>
                          </div>
                          <p className="text-sm text-gray-600">{variable.description}</p>
                          {variable.defaultValue && (
                             <p className="text-xs text-gray-500 mt-1">Default: <code className="bg-gray-100 px-1 rounded">{variable.defaultValue}</code></p>
                          )}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-gray-500">This prompt does not use any input variables.</p>
                 )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="space-y-6">
            {/* Model Parameters */} 
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center">
                <SlidersHorizontal className="h-5 w-5 mr-2 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Model Parameters</h3>
              </div>
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  {Object.entries(prompt.parameters).map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-medium text-gray-500 capitalize">{key.replace('_', ' ')}</dt>
                      <dd className="mt-1 text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            
            {/* Model Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center">
                 <Settings className="h-5 w-5 mr-2 text-gray-400" />
                 <h3 className="text-lg font-medium text-gray-900">Base Model</h3>
              </div>
              <div className="px-6 py-5">
                 <p className="text-sm text-gray-900">{prompt.modelUsed}</p>
                 <p className="text-xs text-gray-500 mt-1">Specific model parameters are configured above.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'playground' && (
          <div className="space-y-6">
            {/* Playground Section */} 
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center">
                <Play className="h-5 w-5 mr-2 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Playground</h3>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Input Area */}
                 <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Input Variables</h4>
                    <div className="space-y-4">
                      {prompt.variables.map((variable) => (
                        <div key={variable.name}>
                           <label htmlFor={variable.name} className="block text-xs font-medium text-gray-500 mb-1">
                             {variable.name} <span className="text-gray-400">({variable.type})</span>
                           </label>
                           {variable.type === 'string' ? (
                              <textarea
                                id={variable.name}
                                rows={variable.name === 'features' ? 3 : 1} // Example: more rows for features
                                className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                defaultValue={prompt.usageExamples[0]?.input[variable.name as keyof typeof prompt.usageExamples[0]['input']] || variable.defaultValue}
                              />
                           ) : ( // Simplified handling for other types 
                              <input
                                type="text" // Or number, etc., based on variable.type
                                id={variable.name}
                                className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                defaultValue={prompt.usageExamples[0]?.input[variable.name as keyof typeof prompt.usageExamples[0]['input']] || variable.defaultValue}
                              />
                           )}
                           <p className="text-xs text-gray-400 mt-1">{variable.description}</p>
                        </div>
                      ))}
                      <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <Play className="h-4 w-4 mr-2" />
                         Run Prompt
                       </button>
                    </div>
                 </div>

                 {/* Output Area */}
                 <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Output</h4>
                    <div className="bg-gray-50 p-4 rounded-md min-h-[200px]">
                       <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                         {prompt.usageExamples[0]?.output || "Click 'Run Prompt' to generate output..."}
                       </pre>
                    </div>
                     <button 
                       className="mt-2 text-gray-400 hover:text-indigo-600 p-1 flex items-center text-xs"
                       onClick={() => navigator.clipboard.writeText(prompt.usageExamples[0]?.output || '')}
                       aria-label="Copy output text"
                       title="Copy output text"
                      >
                       <Copy className="h-4 w-4 mr-1" /> Copy Output
                     </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Version History Section */} 
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center">
                 <History className="h-5 w-5 mr-2 text-gray-400" />
                 <h3 className="text-lg font-medium text-gray-900">Version History</h3>
              </div>
              <div className="px-6 py-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="relative px-4 py-3">
                           <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prompt.versionHistory.map((versionEntry) => (
                        <tr key={versionEntry.version} className={versionEntry.status === 'Active' ? 'bg-green-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-sm ${versionEntry.status === 'Active' ? 'font-semibold text-green-900' : 'font-medium text-gray-900'}`}>v{versionEntry.version}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">{formatDate(versionEntry.date)}</span>
                          </td>
                           <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">{versionEntry.user}</span>
                          </td>
                           <td className="px-4 py-4">
                            <span className="text-sm text-gray-500 line-clamp-2 max-w-md">{versionEntry.changes}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(versionEntry.status)}`}>
                              {versionEntry.status}
                            </span>
                          </td>
                           <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                             {versionEntry.status !== 'Active' && ( 
                               <button 
                                className="text-indigo-600 hover:text-indigo-900"
                                aria-label={`Revert to version ${versionEntry.version}`}
                                title={`Revert to version ${versionEntry.version}`}
                                >
                                 Revert
                               </button>
                              )}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
} 