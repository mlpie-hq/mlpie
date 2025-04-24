"use client";

import { useState } from "react";
import { 
  Activity, 
  Clock, 
  Download, 
  Layers, 
  Play, 
  BarChart3, 
  Zap
} from "lucide-react";

// Mock data for a specific model
const modelData = {
  id: "mod-001",
  name: "Customer Churn Predictor",
  description: "XGBoost model for predicting customer churn probability based on customer behavior and transaction history",
  creator: "Alex Johnson",
  createdAt: "2023-10-10T11:20:00Z",
  lastModified: "2023-11-15T14:30:00Z",
  type: "Classification",
  framework: "XGBoost",
  status: "Deployed",
  accuracy: 0.92,
  precision: 0.89,
  recall: 0.94,
  f1Score: 0.91,
  runtime: "25ms",
  version: "2.3.0",
  tags: ["Churn", "Customer", "Production"],
  
  // Additional details for model detail page
  config: {
    estimators: 250,
    maxDepth: 6,
    learningRate: 0.1,
    minChildWeight: 1,
    subsample: 0.8,
    colsampleByTree: 0.8,
    objective: "binary:logistic",
    evalMetric: "auc"
  },
  
  features: [
    { name: "tenure", importance: 0.28, type: "numeric" },
    { name: "monthly_charges", importance: 0.21, type: "numeric" },
    { name: "total_charges", importance: 0.18, type: "numeric" },
    { name: "contract_type", importance: 0.12, type: "categorical" },
    { name: "payment_method", importance: 0.09, type: "categorical" },
    { name: "internet_service", importance: 0.07, type: "categorical" },
    { name: "online_security", importance: 0.05, type: "categorical" }
  ],
  
  trainingDatasets: [
    { id: "ds-001", name: "Customer Data 2023 Q1-Q3", records: 85000, size: "250MB" },
    { id: "ds-002", name: "Customer Behavior Metrics", records: 72000, size: "180MB" }
  ],
  
  deployments: [
    { 
      id: "dep-001", 
      environment: "Production", 
      endpoint: "https://api.mlpie.ai/predict/churn",
      deployedAt: "2023-11-15T10:30:00Z",
      status: "Active",
      avgLatency: "30ms",
      uptime: "99.98%",
      requests: {
        total: 125000,
        lastDay: 4500,
        lastWeek: 32000
      }
    },
    { 
      id: "dep-002", 
      environment: "Staging", 
      endpoint: "https://staging.api.mlpie.ai/predict/churn",
      deployedAt: "2023-11-14T16:45:00Z",
      status: "Active",
      avgLatency: "28ms",
      uptime: "100%",
      requests: {
        total: 5200,
        lastDay: 400,
        lastWeek: 2800
      }
    }
  ],
  
  trainingHistory: [
    { 
      id: "train-001", 
      version: "2.3.0",
      startedAt: "2023-11-14T08:30:00Z",
      finishedAt: "2023-11-14T10:15:00Z",
      status: "Completed",
      accuracy: 0.92,
      loss: 0.28,
      epochs: 100,
      runtime: "1h 45m",
      metrics: {
        accuracy: [0.78, 0.82, 0.85, 0.88, 0.9, 0.91, 0.92],
        loss: [0.68, 0.56, 0.45, 0.38, 0.33, 0.3, 0.28]
      }
    },
    { 
      id: "train-002", 
      version: "2.2.0",
      startedAt: "2023-10-20T09:45:00Z",
      finishedAt: "2023-10-20T11:20:00Z",
      status: "Completed",
      accuracy: 0.89,
      loss: 0.32,
      epochs: 100,
      runtime: "1h 35m",
      metrics: {
        accuracy: [0.75, 0.79, 0.83, 0.85, 0.87, 0.88, 0.89],
        loss: [0.72, 0.61, 0.52, 0.43, 0.38, 0.35, 0.32]
      }
    }
  ],
  
  confusionMatrix: {
    truePositive: 412,
    falsePositive: 52,
    trueNegative: 1580,
    falseNegative: 28
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
    case 'deployed':
    case 'active':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'training':
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'testing':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function ModelDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'config' | 'deployments' | 'training'>('overview');
  
  // In a real app, we would fetch the model data based on the ID
  // For demo purposes, we're using the mock data
  const model = modelData;
  
  // Using the params.id for demonstration - in a real app this would fetch model data
  console.log(`Model ID from params: ${params.id}`);
  
  return (
    <div>
      {/* Model header with action buttons */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">{model.name}</h1>
              <div className="ml-3 flex items-center">
                <span className="text-sm text-gray-500 mr-2">v{model.version}</span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(model.status)}`}>
                  {model.status}
                </span>
              </div>
            </div>
            <p className="text-gray-500 mt-1">{model.description}</p>
            
            <div className="flex items-center mt-3 space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <Layers className="h-4 w-4 mr-1.5 text-gray-400" />
                {model.type}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Activity className="h-4 w-4 mr-1.5 text-gray-400" />
                Accuracy: {model.accuracy.toFixed(2)}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                Last modified: {formatDate(model.lastModified)}
              </div>
            </div>
            
            <div className="flex mt-2 flex-wrap gap-1">
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
          
          <div className="flex space-x-2">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Play className="h-4 w-4 mr-2" />
              Deploy
            </button>
            
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            
            <button 
              aria-label="Re-train model" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Zap className="h-4 w-4 mr-2" />
              Re-train
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview' as const, label: 'Overview' },
            { key: 'performance' as const, label: 'Performance' },
            { key: 'config' as const, label: 'Configuration' },
            { key: 'deployments' as const, label: 'Deployments' },
            { key: 'training' as const, label: 'Training History' }
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
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Key Metrics</h3>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Accuracy</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-900">{(model.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Precision</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-900">{(model.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Recall</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-900">{(model.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">F1 Score</span>
                  <span className="mt-1 text-3xl font-semibold text-gray-900">{(model.f1Score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            {/* Feature importance */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Feature Importance</h3>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-4">
                  {model.features
                    .sort((a, b) => b.importance - a.importance)
                    .map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <div className="w-32 flex-shrink-0">
                          <span className="text-sm font-medium text-gray-900">{feature.name}</span>
                          <div className="text-xs text-gray-500">{feature.type}</div>
                        </div>
                        <div className="flex-grow">
                          <div className="relative pt-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="overflow-hidden h-2 flex rounded bg-gray-200">
                                  <div
                                    style={{ width: `${feature.importance * 100}%` }}
                                    className="bg-indigo-600"
                                  ></div>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 ml-4">
                                {(feature.importance * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Training datasets */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Training Datasets</h3>
              </div>
              <div className="px-6 py-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {model.trainingDatasets.map((dataset) => (
                        <tr key={dataset.id}>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-indigo-600">{dataset.name}</div>
                                <div className="text-sm text-gray-500">ID: {dataset.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dataset.records.toLocaleString()}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dataset.size}
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
        
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Confusion Matrix</h4>
                      <div className="mt-2 grid grid-cols-2 gap-px bg-gray-200 rounded overflow-hidden">
                        <div className="bg-green-100 p-4 flex flex-col items-center justify-center">
                          <span className="text-lg font-semibold text-green-800">{model.confusionMatrix.truePositive}</span>
                          <span className="text-xs text-gray-700">True Positive</span>
                        </div>
                        <div className="bg-red-100 p-4 flex flex-col items-center justify-center">
                          <span className="text-lg font-semibold text-red-800">{model.confusionMatrix.falsePositive}</span>
                          <span className="text-xs text-gray-700">False Positive</span>
                        </div>
                        <div className="bg-red-100 p-4 flex flex-col items-center justify-center">
                          <span className="text-lg font-semibold text-red-800">{model.confusionMatrix.falseNegative}</span>
                          <span className="text-xs text-gray-700">False Negative</span>
                        </div>
                        <div className="bg-green-100 p-4 flex flex-col items-center justify-center">
                          <span className="text-lg font-semibold text-green-800">{model.confusionMatrix.trueNegative}</span>
                          <span className="text-xs text-gray-700">True Negative</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Accuracy</span>
                        <span className="mt-1 text-xl font-semibold text-gray-900">{(model.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Precision</span>
                        <span className="mt-1 text-xl font-semibold text-gray-900">{(model.precision * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Recall</span>
                        <span className="mt-1 text-xl font-semibold text-gray-900">{(model.recall * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">F1 Score</span>
                        <span className="mt-1 text-xl font-semibold text-gray-900">{(model.f1Score * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Metrics Visualization</h4>
                  <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Interactive metrics chart would be rendered here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Latest evaluation results */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Latest Evaluation Results</h3>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Runtime Performance</h4>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-500">Average Inference Time</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">{model.runtime}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-500">Memory Usage</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">128MB</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-500">Throughput</div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">40 req/s</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Edge Cases & Outliers</h4>
                    <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        The model shows reduced accuracy (~78%) for customers with less than 3 months of tenure.
                        Consider gathering more data for new customers or creating a separate model for this segment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Model Configuration */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Model Configuration</h3>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">General Settings</h4>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Framework</dt>
                        <dd className="text-sm text-gray-900">{model.framework}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Type</dt>
                        <dd className="text-sm text-gray-900">{model.type}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Objective</dt>
                        <dd className="text-sm text-gray-900">{model.config.objective}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Evaluation Metric</dt>
                        <dd className="text-sm text-gray-900">{model.config.evalMetric}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Hyperparameters</h4>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Number of Estimators</dt>
                        <dd className="text-sm text-gray-900">{model.config.estimators}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Max Depth</dt>
                        <dd className="text-sm text-gray-900">{model.config.maxDepth}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Learning Rate</dt>
                        <dd className="text-sm text-gray-900">{model.config.learningRate}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Min Child Weight</dt>
                        <dd className="text-sm text-gray-900">{model.config.minChildWeight}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Subsample</dt>
                        <dd className="text-sm text-gray-900">{model.config.subsample}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-700">Column Sample By Tree</dt>
                        <dd className="text-sm text-gray-900">{model.config.colsampleByTree}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Inference Configuration */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Inference Configuration</h3>
              </div>
              <div className="px-6 py-5">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Input Schema</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "tenure": {"type": "number", "required": true},
  "monthly_charges": {"type": "number", "required": true},
  "total_charges": {"type": "number", "required": true},
  "contract_type": {"type": "string", "enum": ["Month-to-month", "One year", "Two year"], "required": true},
  "payment_method": {"type": "string", "required": true},
  "internet_service": {"type": "string", "enum": ["DSL", "Fiber optic", "No"], "required": true},
  "online_security": {"type": "string", "enum": ["Yes", "No", "No internet service"], "required": true}
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Output Schema</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "churn_probability": {"type": "number", "description": "Probability of customer churn (0-1)"},
  "churn_prediction": {"type": "boolean", "description": "True if customer is predicted to churn"},
  "confidence": {"type": "number", "description": "Confidence score of the prediction (0-1)"}
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'deployments' && (
          <div className="space-y-6">
            {/* Active deployments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Deployments</h3>
              </div>
              <div className="px-6 py-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed At</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {model.deployments.map((deployment) => (
                        <tr key={deployment.id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-2.5 w-2.5 rounded-full mr-2 ${deployment.environment.toLowerCase() === 'production' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                              <span className="text-sm font-medium text-gray-900">{deployment.environment}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(deployment.status)}`}>
                              {deployment.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">{deployment.endpoint}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">{formatDate(deployment.deployedAt)}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Uptime: {deployment.uptime}</div>
                            <div className="text-sm text-gray-500">Latency: {deployment.avgLatency}</div>
                            <div className="text-sm text-gray-500">Requests: {deployment.requests.total.toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              View
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Stop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Deployment metrics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Deployment Metrics</h3>
                <div className="flex space-x-2">
                  <select 
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    defaultValue="dep-001"
                    aria-label="Select deployment environment"
                  >
                    {model.deployments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.environment}
                      </option>
                    ))}
                  </select>
                  <select 
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    defaultValue="day"
                    aria-label="Select time period"
                  >
                    <option value="day">Last 24 hours</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requests Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Requests</h4>
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Request volume chart would be rendered here
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500">Total</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">125,000</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500">Last Day</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">4,500</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500">Last Week</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">32,000</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Latency Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Latency (ms)</h4>
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Latency trend chart would be rendered here
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500">Avg</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">30ms</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500">p95</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">52ms</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-500">p99</div>
                        <div className="mt-1 text-lg font-semibold text-gray-900">87ms</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'training' && (
          <div className="space-y-6">
            {/* Training history table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Training History</h3>
              </div>
              <div className="px-6 py-5">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {model.trainingHistory.map((training) => (
                        <tr key={training.id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">v{training.version}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">{formatDate(training.startedAt)}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500">{training.runtime}</span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(training.status)}`}>
                              {training.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Accuracy: {training.accuracy.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">Loss: {training.loss.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">Epochs: {training.epochs}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              View Logs
                            </button>
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Compare
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Training metrics visualization */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Training Metrics</h3>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  style={{ maxWidth: '200px' }}
                  defaultValue="train-001"
                  aria-label="Select training version"
                >
                  {model.trainingHistory.map((training) => (
                    <option key={training.id} value={training.id}>
                      v{training.version} - {formatDate(training.startedAt)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Accuracy Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Accuracy vs Epochs</h4>
                    <div className="h-64 bg-gray-100 rounded p-4">
                      {/* This would be a real chart in a production application */}
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">1.0</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.8</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                          <div className="w-48 h-1 bg-indigo-500 rounded"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.6</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.4</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.2</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.0</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <div className="text-xs text-gray-500">0</div>
                          <div className="text-xs text-gray-500">20</div>
                          <div className="text-xs text-gray-500">40</div>
                          <div className="text-xs text-gray-500">60</div>
                          <div className="text-xs text-gray-500">80</div>
                          <div className="text-xs text-gray-500">100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Loss Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Loss vs Epochs</h4>
                    <div className="h-64 bg-gray-100 rounded p-4">
                      {/* This would be a real chart in a production application */}
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">1.0</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.8</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.6</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.4</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                          <div className="w-40 h-1 bg-red-500 rounded"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.2</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">0.0</div>
                          <div className="flex-1 mx-2 border-b border-gray-300"></div>
                        </div>
                        <div className="flex justify-between pt-2">
                          <div className="text-xs text-gray-500">0</div>
                          <div className="text-xs text-gray-500">20</div>
                          <div className="text-xs text-gray-500">40</div>
                          <div className="text-xs text-gray-500">60</div>
                          <div className="text-xs text-gray-500">80</div>
                          <div className="text-xs text-gray-500">100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Compute Resources */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Compute Resources</h3>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">CPU Usage</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">4 vCPUs</div>
                    <div className="text-sm text-gray-500">85% utilization</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">Memory Usage</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">16 GB</div>
                    <div className="text-sm text-gray-500">73% utilization</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500">GPU Usage</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">1x Tesla T4</div>
                    <div className="text-sm text-gray-500">92% utilization</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 