"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Check, ChevronDown, Clock, Download, HelpCircle, LineChart, ListFilter, RefreshCw, Search, Settings, Share2, Table } from 'lucide-react';

// Mock data for experiments
const experimentsMockData = [
  {
    id: "exp-001",
    name: "Churn Model - XGBoost Hyperparameter Tuning",
    model: "Customer Churn Predictor",
    modelId: "mod-001",
    createdBy: "alex@example.com",
    startedAt: "2023-11-15T08:30:00Z",
    status: "Completed",
    duration: "1h 45m",
    bestAccuracy: 0.92,
    runs: [
      {
        id: "run-001",
        name: "Run 1 - Base Parameters",
        status: "Completed",
        startedAt: "2023-11-15T08:30:00Z",
        finishedAt: "2023-11-15T09:15:00Z",
        metrics: {
          accuracy: 0.89,
          precision: 0.86,
          recall: 0.91,
          f1Score: 0.88,
          auc: 0.925
        },
        parameters: {
          estimators: 100,
          maxDepth: 5,
          learningRate: 0.1,
          minChildWeight: 1,
          subsample: 0.8,
          colsampleByTree: 0.8
        }
      },
      {
        id: "run-002",
        name: "Run 2 - Increased Estimators",
        status: "Completed",
        startedAt: "2023-11-15T09:20:00Z",
        finishedAt: "2023-11-15T10:05:00Z",
        metrics: {
          accuracy: 0.91,
          precision: 0.88,
          recall: 0.92,
          f1Score: 0.90,
          auc: 0.935
        },
        parameters: {
          estimators: 200,
          maxDepth: 5,
          learningRate: 0.1,
          minChildWeight: 1,
          subsample: 0.8,
          colsampleByTree: 0.8
        }
      },
      {
        id: "run-003",
        name: "Run 3 - Optimized Depth",
        status: "Completed",
        startedAt: "2023-11-15T10:10:00Z",
        finishedAt: "2023-11-15T10:55:00Z",
        metrics: {
          accuracy: 0.92,
          precision: 0.89,
          recall: 0.94,
          f1Score: 0.91,
          auc: 0.945
        },
        parameters: {
          estimators: 200,
          maxDepth: 6,
          learningRate: 0.1,
          minChildWeight: 1,
          subsample: 0.8,
          colsampleByTree: 0.8
        }
      }
    ]
  },
  {
    id: "exp-002",
    name: "Recommendation Model - Neural Network vs. Matrix Factorization",
    model: "Product Recommendation Engine",
    modelId: "mod-002",
    createdBy: "sarah@example.com",
    startedAt: "2023-11-12T14:15:00Z",
    status: "Completed",
    duration: "5h 20m",
    bestAccuracy: 0.85,
    runs: [
      {
        id: "run-101",
        name: "Matrix Factorization Baseline",
        status: "Completed",
        startedAt: "2023-11-12T14:15:00Z",
        finishedAt: "2023-11-12T15:30:00Z",
        metrics: {
          accuracy: 0.78,
          precision: 0.75,
          recall: 0.79,
          f1Score: 0.77,
          meanAveragePrecision: 0.72
        },
        parameters: {
          factors: 100,
          regularization: 0.01,
          iterations: 50,
          algorithm: "ALS"
        }
      },
      {
        id: "run-102",
        name: "Neural Network - 1 Hidden Layer",
        status: "Completed",
        startedAt: "2023-11-12T15:45:00Z",
        finishedAt: "2023-11-12T17:30:00Z",
        metrics: {
          accuracy: 0.82,
          precision: 0.80,
          recall: 0.83,
          f1Score: 0.81,
          meanAveragePrecision: 0.79
        },
        parameters: {
          hiddenLayers: 1,
          neuronsPerLayer: 128,
          dropoutRate: 0.2,
          learningRate: 0.001,
          batchSize: 64
        }
      },
      {
        id: "run-103",
        name: "Neural Network - 2 Hidden Layers",
        status: "Completed",
        startedAt: "2023-11-12T17:45:00Z",
        finishedAt: "2023-11-12T19:35:00Z",
        metrics: {
          accuracy: 0.85,
          precision: 0.83,
          recall: 0.86,
          f1Score: 0.84,
          meanAveragePrecision: 0.81
        },
        parameters: {
          hiddenLayers: 2,
          neuronsPerLayer: 128,
          dropoutRate: 0.3,
          learningRate: 0.001,
          batchSize: 64
        }
      }
    ]
  },
  {
    id: "exp-003",
    name: "BERT Fine-tuning for Sentiment Analysis",
    model: "Sentiment Analysis Model",
    modelId: "mod-003",
    createdBy: "michael@example.com",
    startedAt: "2023-11-10T09:30:00Z",
    status: "Running",
    duration: "3h 15m (so far)",
    bestAccuracy: 0.88,
    runs: [
      {
        id: "run-201",
        name: "Base BERT",
        status: "Completed",
        startedAt: "2023-11-10T09:30:00Z",
        finishedAt: "2023-11-10T11:15:00Z",
        metrics: {
          accuracy: 0.85,
          precision: 0.84,
          recall: 0.85,
          f1Score: 0.84,
          rocAuc: 0.91
        },
        parameters: {
          baseModel: "bert-base-uncased",
          epochs: 3,
          batchSize: 16,
          learningRate: 2e-5,
          maxLength: 128
        }
      },
      {
        id: "run-202",
        name: "DistilBERT",
        status: "Completed",
        startedAt: "2023-11-10T11:30:00Z",
        finishedAt: "2023-11-10T12:40:00Z",
        metrics: {
          accuracy: 0.83,
          precision: 0.82,
          recall: 0.83,
          f1Score: 0.82,
          rocAuc: 0.89
        },
        parameters: {
          baseModel: "distilbert-base-uncased",
          epochs: 4,
          batchSize: 32,
          learningRate: 3e-5,
          maxLength: 128
        }
      },
      {
        id: "run-203",
        name: "RoBERTa",
        status: "Running",
        startedAt: "2023-11-10T13:00:00Z",
        finishedAt: null,
        metrics: {
          accuracy: 0.88,
          precision: 0.87,
          recall: 0.89,
          f1Score: 0.88,
          rocAuc: 0.93
        },
        parameters: {
          baseModel: "roberta-base",
          epochs: 4,
          batchSize: 16,
          learningRate: 2e-5,
          maxLength: 128
        }
      }
    ]
  }
];

// Helper function to format dates
function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

// Helper function for status styling
function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'running':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'stopped':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}

// Helper function to get best runs
function getBestRun(experiment: typeof experimentsMockData[0]) {
  // Find the run with the highest accuracy
  return experiment.runs.reduce((best, current) => {
    return (current.metrics.accuracy > best.metrics.accuracy) ? current : best;
  }, experiment.runs[0]);
}

// Simple component for metric charts (placeholder)
function MetricChart({ title, data }: { title: string, data: Record<string, number> }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="h-40 bg-gray-50 flex items-center justify-center rounded">
        <LineChart className="h-8 w-8 text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chart visualization would appear here</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span className="text-xs font-medium">{typeof value === 'number' ? value.toFixed(3) : value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Parameter comparison table
function ParameterComparisonTable({ runs }: { runs: Array<{
  id: string;
  name: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  metrics: Record<string, number>;
  parameters: Record<string, any>;
}> }) {
  // Get unique parameter keys from all runs
  const paramKeys = Array.from(new Set(
    runs.flatMap(run => Object.keys(run.parameters))
  ));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run Name</th>
            {paramKeys.map(key => (
              <th key={key} className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
            <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {runs.map((run) => (
            <tr key={run.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 text-sm font-medium text-gray-900">{run.name}</td>
              {paramKeys.map(key => (
                <td key={key} className="py-2 px-4 text-sm text-gray-500">
                  {run.parameters[key] !== undefined 
                    ? (typeof run.parameters[key] === 'number' && run.parameters[key] < 0.01 
                        ? run.parameters[key].toExponential(2) 
                        : run.parameters[key])
                    : '-'}
                </td>
              ))}
              <td className="py-2 px-4 text-sm font-medium text-gray-900">
                {run.metrics.accuracy.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExperimentsPage() {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChart, setShowChart] = useState(true);
  
  // Filter experiments based on search query
  const filteredExperiments = experimentsMockData.filter(exp => 
    exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.model.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get the selected experiment
  const selectedExperiment = activeExperiment 
    ? experimentsMockData.find(exp => exp.id === activeExperiment) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Experiment Tracking</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center text-sm"
            title="Refresh experiments list"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          <button 
            className="p-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center text-sm"
            title="Filter experiments"
          >
            <ListFilter className="h-4 w-4 mr-1" />
            Filter
          </button>
          <Link href="/models/experiments/create" className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center text-sm">
            <span className="mr-1">+</span>
            New Experiment
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experiments List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="p-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {filteredExperiments.length > 0 ? (
              filteredExperiments.map((experiment) => {
                const bestRun = getBestRun(experiment);
                const isActive = experiment.id === activeExperiment;
                
                return (
                  <div 
                    key={experiment.id}
                    className={`p-4 rounded-lg border ${isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'} hover:border-indigo-500 cursor-pointer`}
                    onClick={() => setActiveExperiment(experiment.id)}
                  >
                    <div className="flex justify-between mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusClass(experiment.status)}`}>
                        {experiment.status}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {experiment.duration}
                      </span>
                    </div>
                    <h3 className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-gray-900'} line-clamp-2`}>
                      {experiment.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Model: {experiment.model}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <span>Runs: {experiment.runs.length}</span>
                      <span>Best Accuracy: {bestRun.metrics.accuracy.toFixed(3)}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Started: {formatDate(experiment.startedAt)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <div className="flex justify-center mb-3">
                  <LineChart className="h-12 w-12 text-gray-300" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No experiments found</h3>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Experiment Details */}
        <div className="lg:col-span-2">
          {selectedExperiment ? (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{selectedExperiment.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedExperiment.model} • Created by {selectedExperiment.createdBy}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/models/experiments/${selectedExperiment.id}/run`}
                      className="inline-flex items-center p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                    >
                      <span className="mr-1">+</span>
                      Add Run
                    </Link>
                    <Link 
                      href={`/models/experiments/${selectedExperiment.id}/promote`}
                      className="inline-flex items-center p-2 rounded-md border border-green-600 text-green-700 bg-white hover:bg-green-50 text-sm"
                    >
                      <span className="mr-1">↗</span>
                      Promote to Model
                    </Link>
                    <button 
                      className="p-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      title="Share experiment"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      title="Download experiment data"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Runs</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedExperiment.runs.length}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Best Accuracy</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedExperiment.bestAccuracy.toFixed(3)}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="inline-flex items-center justify-center mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusClass(selectedExperiment.status)}`}>
                        {selectedExperiment.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Model Performance</h3>
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                    <button 
                      className={`p-1 rounded-md text-xs ${showChart ? 'bg-white shadow' : 'text-gray-500'}`}
                      onClick={() => setShowChart(true)}
                      title="Show as charts"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button 
                      className={`p-1 rounded-md text-xs ${!showChart ? 'bg-white shadow' : 'text-gray-500'}`}
                      onClick={() => setShowChart(false)}
                      title="Show as table"
                    >
                      <Table className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {showChart ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedExperiment.runs.slice(0, 2).map(run => (
                      <MetricChart 
                        key={run.id}
                        title={run.name}
                        data={run.metrics}
                      />
                    ))}
                  </div>
                ) : (
                  <ParameterComparisonTable runs={selectedExperiment.runs} />
                )}
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex justify-between items-center">
                  <span>Run History</span>
                  <Link 
                    href={`/models/experiments/${selectedExperiment.id}/run`}
                    className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  >
                    <span className="mr-1">+</span>
                    Add Run
                  </Link>
                </h3>
                <div className="space-y-4">
                  {selectedExperiment.runs.map((run, index) => (
                    <div key={run.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium mr-2">
                              {index + 1}
                            </span>
                            <h4 className="text-sm font-medium text-gray-900">{run.name}</h4>
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusClass(run.status)}`}>
                              {run.status}
                            </span>
                          </div>
                          <div className="ml-8 mt-1 text-xs text-gray-500">
                            Started: {formatDate(run.startedAt)}
                            {run.finishedAt && ` • Finished: ${formatDate(run.finishedAt)}`}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center text-xs font-medium">
                            <div className="flex items-center text-indigo-600">
                              <Check className="h-4 w-4 mr-1" />
                              Accuracy: {run.metrics.accuracy.toFixed(3)}
                            </div>
                          </div>
                          {run.status === "Completed" && (
                            <Link
                              href={`/models/experiments/${selectedExperiment.id}/promote?run=${run.id}`}
                              className="ml-3 p-1 px-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded"
                              title="Promote this run to a model"
                            >
                              Promote
                            </Link>
                          )}
                          <button className="ml-3 p-1 text-gray-400 hover:text-gray-600" title="View run details">
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* We could add a collapsible section here to show more details */}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 bg-white rounded-lg border border-gray-200">
              <div className="bg-indigo-100 rounded-full p-3 mb-4">
                <HelpCircle className="h-10 w-10 text-indigo-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Select an experiment</h3>
              <p className="text-sm text-gray-500 text-center max-w-md mt-1">
                Choose an experiment from the list to view its details, including runs, parameters, and metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 