"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BarChart3, 
  Check, 
  ChevronDown, 
  Download, 
  LineChart, 
  Share2, 
  Table, 
  Plus,
  ArrowUpRight
} from 'lucide-react';

// Similar mock data for experiments as in the experiments page
const getMockExperiment = (id: string) => {
  return {
    id,
    name: "Customer Churn Prediction",
    description: "Experiment to predict customer churn using different ML algorithms",
    taskType: "classification",
    algorithm: "xgboost",
    dataset: "ds-001",
    datasetName: "Customer Data 2023 Q1-Q3",
    createdAt: "2023-11-15T08:30:00Z",
    createdBy: "alex@example.com",
    status: "Running",
    duration: "2h 15m (so far)",
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
          learningRate: 0.1,
          maxDepth: 5,
          minChildWeight: 1,
          subsample: 0.8,
          colsampleByTree: 0.8,
          nEstimators: 100
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
          learningRate: 0.1,
          maxDepth: 5,
          minChildWeight: 1,
          subsample: 0.8,
          colsampleByTree: 0.8,
          nEstimators: 200
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
          learningRate: 0.1,
          maxDepth: 6,
          minChildWeight: 1,
          subsample: 0.8,
          colsampleByTree: 0.8,
          nEstimators: 200
        }
      }
    ]
  };
};

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

// Helper function to get best run
function getBestRun(experiment: ReturnType<typeof getMockExperiment>) {
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
  parameters: Record<string, number | string>;
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
                    ? (typeof run.parameters[key] === 'number' && (run.parameters[key] as number) < 0.01 
                        ? (run.parameters[key] as number).toExponential(2) 
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

export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  const experimentId = params.id;
  const experiment = getMockExperiment(experimentId);
  const [showChart, setShowChart] = useState(true);
  const [expandedRuns, setExpandedRuns] = useState<string[]>([]);
  
  const bestRun = getBestRun(experiment);
  
  const toggleRunExpand = (runId: string) => {
    setExpandedRuns(prev => 
      prev.includes(runId) 
        ? prev.filter(id => id !== runId) 
        : [...prev, runId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/models/experiments" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Experiment Details</h1>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{experiment.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Created by {experiment.createdBy} • Started: {formatDate(experiment.createdAt)}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {experiment.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {experiment.taskType}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {experiment.algorithm}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {experiment.datasetName}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(experiment.status)}`}>
                  {experiment.status}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link 
                href={`/models/experiments/${experimentId}/run`}
                className="inline-flex items-center p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Run
              </Link>
              <Link 
                href={`/models/experiments/${experimentId}/promote`}
                className="inline-flex items-center p-2 rounded-md border border-green-600 text-green-700 bg-white hover:bg-green-50 text-sm"
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
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
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500">Runs</p>
              <p className="text-lg font-semibold text-gray-900">{experiment.runs.length}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500">Best Accuracy</p>
              <p className="text-lg font-semibold text-gray-900">{experiment.bestAccuracy.toFixed(3)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{experiment.duration}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500">Best Run</p>
              <p className="text-lg font-semibold text-gray-900">{bestRun.name.split(' - ')[0]}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-900">Performance Comparison</h3>
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
              {experiment.runs.slice(0, 2).map(run => (
                <MetricChart 
                  key={run.id}
                  title={run.name}
                  data={run.metrics}
                />
              ))}
            </div>
          ) : (
            <ParameterComparisonTable runs={experiment.runs} />
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex justify-between items-center">
            <span>Run History</span>
            <Link 
              href={`/models/experiments/${experimentId}/run`}
              className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Run
            </Link>
          </h3>
          <div className="space-y-4">
            {experiment.runs.map((run, index) => (
              <div key={run.id} className="border border-gray-100 rounded-lg">
                <div 
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleRunExpand(run.id)}
                >
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
                          href={`/models/experiments/${experimentId}/promote?run=${run.id}`}
                          className="ml-3 p-1 px-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded"
                          title="Promote this run to a model"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Promote
                        </Link>
                      )}
                      <button 
                        className="ml-3 p-1 text-gray-400 hover:text-gray-600" 
                        title="View run details"
                      >
                        <ChevronDown 
                          className={`h-4 w-4 transform transition-transform ${expandedRuns.includes(run.id) ? 'rotate-180' : ''}`} 
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedRuns.includes(run.id) && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Performance Metrics</h5>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(run.metrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <dt className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                              <dd className="text-xs font-medium text-gray-900">{value.toFixed(3)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Hyperparameters</h5>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(run.parameters).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <dt className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                              <dd className="text-xs font-medium text-gray-900">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                      <Link
                        href={`/models/experiments/${experimentId}/promote?run=${run.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-green-600 text-green-700 bg-white hover:bg-green-50"
                      >
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Promote to Model
                      </Link>
                      <button
                        className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Artifacts
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 