"use client";

import { useState } from "react";
import { Play, Pause, RefreshCw, Clock, Download, ArrowUpRight, AlertCircle } from "lucide-react";

// Mock data for a specific pipeline
const pipelineData = {
  id: "pip-001",
  name: "Text Classification Pipeline",
  description: "BERT-based text classification for sentiment analysis with fine-tuning on custom dataset",
  creator: "Sarah Chen",
  createdAt: "2023-10-15T14:30:00Z",
  lastModified: "2023-11-10T09:45:00Z",
  status: "Active",
  progress: 100,
  runtime: "4h 15m",
  tags: ["NLP", "Classification", "Production"],
  
  // Additional details for pipeline page
  configuration: {
    model: "bert-base-uncased",
    framework: "PyTorch",
    batchSize: 32,
    learningRate: 2e-5,
    epochs: 5,
    optimizer: "AdamW",
    earlyStopping: true,
    patienceEpochs: 2
  },
  
  inputs: [
    { name: "customer_reviews.csv", type: "CSV", size: "125MB", records: 50000 },
    { name: "product_descriptions.json", type: "JSON", size: "30MB", records: 5000 }
  ],
  
  outputs: [
    { name: "sentiment_model.pt", type: "Model", size: "550MB" },
    { name: "evaluation_results.json", type: "JSON", size: "2MB" }
  ],
  
  runHistory: [
    { 
      id: "run-001", 
      startTime: "2023-11-10T08:30:00Z", 
      endTime: "2023-11-10T09:45:00Z",
      status: "Completed",
      metrics: {
        accuracy: 0.92,
        f1Score: 0.91,
        precision: 0.89,
        recall: 0.93
      }
    },
    { 
      id: "run-002", 
      startTime: "2023-11-05T14:20:00Z", 
      endTime: "2023-11-05T15:35:00Z",
      status: "Completed",
      metrics: {
        accuracy: 0.90,
        f1Score: 0.89,
        precision: 0.87,
        recall: 0.91
      }
    },
    { 
      id: "run-003", 
      startTime: "2023-11-01T10:15:00Z", 
      endTime: "2023-11-01T11:30:00Z",
      status: "Failed",
      error: "Out of memory error during training batch"
    }
  ],
  
  // Simple graph representation (would be visualized with a proper graph library)
  graph: {
    nodes: [
      { id: "n1", type: "data_source", label: "Data Source" },
      { id: "n2", type: "preprocessing", label: "Text Preprocessing" },
      { id: "n3", type: "training", label: "Model Training" },
      { id: "n4", type: "evaluation", label: "Evaluation" },
      { id: "n5", type: "deployment", label: "Deployment" }
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" }
    ]
  }
};

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
    case 'completed':
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

export default function PipelineDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'configuration' | 'visuals'>('overview');
  
  // In a real app, we would fetch the pipeline data based on the ID
  // For demo purposes, we're using the mock data
  const pipeline = pipelineData;
  
  // Using the params.id for demonstration - in a real app this would fetch data
  console.log(`Pipeline ID from params: ${params.id}`);
  
  return (
    <div>
      {/* Pipeline header with action buttons */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{pipeline.name}</h1>
            <p className="text-gray-500 mt-1">{pipeline.description}</p>
            
            <div className="flex items-center mt-3 space-x-4">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(pipeline.status)}`}>
                {pipeline.status}
              </span>
              
              <span className="text-sm text-gray-500">
                Created by {pipeline.creator}
              </span>
              
              <span className="text-sm text-gray-500">
                Last modified: {formatDate(pipeline.lastModified)}
              </span>
            </div>
            
            <div className="flex mt-2 flex-wrap gap-1">
              {pipeline.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Play className="h-4 w-4 mr-2" />
              Run Pipeline
            </button>
            
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </button>
            
            <button 
              aria-label="Refresh pipeline" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview' as const, label: 'Overview' },
            { key: 'runs' as const, label: 'Run History' },
            { key: 'configuration' as const, label: 'Configuration' },
            { key: 'visuals' as const, label: 'Pipeline Graph' }
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
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Last Run</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {formatDate(pipeline.runHistory[0].startTime).split(',')[0]}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Runtime</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" />
                  {pipeline.runtime}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Latest Accuracy</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {pipeline.runHistory[0].metrics?.accuracy.toFixed(2) || 'N/A'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Total Runs</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {pipeline.runHistory.length}
                </div>
              </div>
            </div>
            
            {/* Inputs and Outputs */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Inputs</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {pipeline.inputs.map((input, idx) => (
                      <li key={idx} className="px-4 py-3">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{input.name}</div>
                            <div className="text-sm text-gray-500">{input.type} • {input.size} • {input.records.toLocaleString()} records</div>
                          </div>
                          <button aria-label={`Download ${input.name}`} className="text-indigo-600 hover:text-indigo-800">
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Outputs</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {pipeline.outputs.map((output, idx) => (
                      <li key={idx} className="px-4 py-3">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{output.name}</div>
                            <div className="text-sm text-gray-500">{output.type} • {output.size}</div>
                          </div>
                          <button aria-label={`Download ${output.name}`} className="text-indigo-600 hover:text-indigo-800">
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'runs' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Run History</h3>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Run ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Start Time</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Duration</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Metrics</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {pipeline.runHistory.map((run) => {
                    const startDate = new Date(run.startTime);
                    const endDate = run.endTime ? new Date(run.endTime) : null;
                    const duration = endDate 
                      ? `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} min` 
                      : 'In progress';
                    
                    return (
                      <tr key={run.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600">{run.id}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(run.status)}`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(run.startTime)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{duration}</td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {run.metrics ? (
                            <div className="flex space-x-2">
                              <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-md">
                                Acc: {run.metrics.accuracy.toFixed(2)}
                              </span>
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                                F1: {run.metrics.f1Score.toFixed(2)}
                              </span>
                            </div>
                          ) : run.error ? (
                            <div className="flex items-center text-red-600">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">{run.error}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <button type="button" className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full">
                            View Details
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'configuration' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Configuration</h3>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                {Object.entries(pipeline.configuration).map(([key, value]) => (
                  <div key={key} className="col-span-1">
                    <dt className="text-sm font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{value.toString()}</dd>
                  </div>
                ))}
              </dl>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Edit Configuration
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'visuals' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Graph</h3>
            
            {/* This would be replaced with a proper graph visualization library */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 h-96 flex justify-center items-center">
              <div className="text-center text-gray-500">
                <div className="mb-4">Pipeline Graph Visualization</div>
                <div className="grid grid-cols-5 gap-4">
                  {pipeline.graph.nodes.map((node, index) => (
                    <div 
                      key={node.id} 
                      className="border border-gray-300 rounded-lg p-3 text-center bg-white relative"
                    >
                      <div className="text-sm font-medium">{node.label}</div>
                      {index < pipeline.graph.nodes.length - 1 && (
                        <div className="absolute top-1/2 right-0 transform translate-x-4 -translate-y-1/2">
                          <svg width="40" height="20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="0" y1="10" x2="40" y2="10" stroke="#718096" strokeWidth="2" />
                            <polygon points="40,10 32,6 32,14" fill="#718096" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  Using a production implementation, this would be an interactive graph visualization
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 