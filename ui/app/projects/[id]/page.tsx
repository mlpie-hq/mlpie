"use client";

import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import Link from 'next/link';
import { Server, Package, BarChart2, FlaskConical, Settings, PlusCircle, Play, Pencil } from 'lucide-react';

// Temporary: Import or copy the initialProjects data structure for lookup
// In a real app, you'd fetch this data based on the ID
const initialProjects = [
  {
    id: 1,
    name: "Customer Churn Prediction",
    description: "Machine learning model to predict customer churn based on behavioral data and service usage patterns.",
    lastUpdated: "2 hours ago",
    status: "Active",
    progress: 85,
    models: 3,
    datasets: [
      { id: 'ds-001', name: 'Customer Transactions (Raw)', recordCount: 1250000, type: 'Source', lastUpdated: '5 days ago' },
      { id: 'ds-002', name: 'Churn Features (Processed)', recordCount: 1100000, type: 'Derived', lastUpdated: '2 days ago' }
    ],
    environments: [
      { id: 'dev', name: 'Development', status: 'Synced', deployedVersion: 'v1.2.1-beta', cluster: 'dev-cluster', lastDeployed: '15 mins ago' },
      { id: 'staging', name: 'Staging', status: 'Synced', deployedVersion: 'v1.2.0', cluster: 'staging-cluster', lastDeployed: '2 hours ago' },
      { id: 'prod', name: 'Production', status: 'Error', deployedVersion: 'v1.1.5', cluster: 'prod-cluster-1', lastDeployed: '1 day ago' },
    ]
  },
  {
    id: 2,
    name: "GenAI Content Summarizer",
    description: "Summarizing long articles using a fine-tuned large language model with configurable summary length.",
    lastUpdated: "1 day ago",
    status: "Active",
    progress: 62,
    models: 2,
    datasets: [
       { id: 'ds-101', name: 'Web Articles Corpus', recordCount: 50000, type: 'Source', lastUpdated: '1 week ago' },
       { id: 'ds-102', name: 'Training Summaries', recordCount: 45000, type: 'Derived', lastUpdated: '4 days ago' },
       { id: 'ds-103', name: 'Validation Set', recordCount: 5000, type: 'Derived', lastUpdated: '4 days ago' },
       { id: 'ds-104', name: 'Fine-tuning Data', recordCount: 10000, type: 'Derived', lastUpdated: '3 days ago' },
    ],
    environments: [
      { id: 'dev', name: 'Development', status: 'Synced', deployedVersion: 'v0.8.0', cluster: 'dev-cluster', lastDeployed: '30 mins ago' },
      { id: 'prod', name: 'Production', status: 'Synced', deployedVersion: 'v0.7.5', cluster: 'prod-genai', lastDeployed: '3 days ago' },
    ]
  },
  {
    id: 3,
    name: "Image Classification Pipeline",
    description: "End-to-end pipeline for training and deploying an image classifier with data augmentation and validation.",
    lastUpdated: "3 days ago",
    status: "Inactive",
    progress: 32,
    models: 1,
    datasets: [
      { id: 'ds-201', name: 'ImageNet Samples', recordCount: 100000, type: 'Source', lastUpdated: '1 month ago' },
      { id: 'ds-202', name: 'Augmented Training Images', recordCount: 500000, type: 'Derived', lastUpdated: '1 week ago' },
      { id: 'ds-203', name: 'Validation Images', recordCount: 10000, type: 'Derived', lastUpdated: '1 week ago' },
    ],
    environments: [] // No environments configured yet
  },
   {
    id: 4,
    name: "Sentiment Analysis API",
    description: "API endpoint for real-time sentiment analysis of customer feedback and social media mentions.",
    lastUpdated: "1 week ago",
    status: "Active",
    progress: 90,
    models: 1,
    datasets: [
       { id: 'ds-301', name: 'Customer Feedback DB', recordCount: 80000, type: 'Source', lastUpdated: '2 days ago' },
       { id: 'ds-302', name: 'Cleaned Sentiment Data', recordCount: 75000, type: 'Derived', lastUpdated: '1 day ago' },
    ],
    environments: [
       { id: 'prod', name: 'Production', status: 'Synced', deployedVersion: 'v2.0.0', cluster: 'prod-cluster-2', lastDeployed: '1 week ago' },
    ]
  },
];

// Helper to get status styles
const getStatusClasses = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'synced':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

// Helper function for Dataset Type badge styles
const getDatasetTypeClasses = (type: string) => {
  switch (type.toLowerCase()) {
    case 'source':
      return 'border-blue-400 text-blue-700 bg-blue-50';
    case 'derived':
      return 'border-purple-400 text-purple-700 bg-purple-50';
    default:
      return 'border-gray-400 text-gray-700 bg-gray-50';
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string, 10) : null;
  
  // State for active tab - updated tab options to match the pattern in other pages
  const [activeTab, setActiveTab] = useState('overview');

  // Find the project data - Replace with actual data fetching later
  const project = initialProjects.find(p => p.id === projectId);

  if (!project) {
    // Handle case where project is not found
    return (
        <div className="p-6 text-center">
            <h1 className="text-xl text-red-600">Project Not Found</h1>
            <p className="text-gray-500">Could not find project with ID: {projectId}</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                Return to Projects
            </Link>
        </div>
    );
  }

  // Tab definitions including Environments
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'models', label: 'Models', icon: Package },
    { id: 'datasets', label: 'Datasets', icon: FlaskConical },
    { id: 'environments', label: 'Environments', icon: Server },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Content for each tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div>
            {/* Project Overview Stats - Use updated project data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card p-4 rounded-lg border border-border">
                 <p className="text-xs text-muted-foreground mb-1">Models</p>
                 <h3 className="text-xl font-bold">{project.models}</h3>
               </div>
               <div className="bg-card p-4 rounded-lg border border-border">
                 <p className="text-xs text-muted-foreground mb-1">Datasets</p>
                 {/* Display count from updated dataset array */}
                 <h3 className="text-xl font-bold">{project.datasets.length}</h3> 
               </div>
               <div className="bg-card p-4 rounded-lg border border-border">
                 <p className="text-xs text-muted-foreground mb-1">Progress</p>
                 <h3 className="text-xl font-bold">{project.progress}%</h3>
              </div>
            </div>
             {/* Progress Bar */}
             <div className="bg-card p-4 rounded-lg border border-border mb-6">
               <p className="text-sm font-medium text-foreground mb-2">Project Progress</p>
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-muted-foreground">Progress</span>
                 <span className="font-medium text-foreground">{project.progress}%</span>
               </div>
               <div className="w-full bg-secondary rounded-full h-2">
                 <div 
                   className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                   style={{ width: `${project.progress}%` }}
                 ></div>
               </div>
             </div>
            {/* Recent Activity Placeholder */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">Recent Activity</h4>
              <p className="text-xs text-muted-foreground">No recent activity recorded.</p>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div>
            {/* Key Metrics Section */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Key Metrics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                <div>
                  <p className="text-gray-500 text-sm">Accuracy</p>
                  <p className="font-bold text-3xl text-gray-800">92.0%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Precision</p>
                  <p className="font-bold text-3xl text-gray-800">89.0%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Recall</p>
                  <p className="font-bold text-3xl text-gray-800">94.0%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">F1 Score</p>
                  <p className="font-bold text-3xl text-gray-800">91.0%</p>
                </div>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Feature Importance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">tenure</p>
                    <p className="text-xs text-gray-500">numeric</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-48 h-4 bg-gray-200 rounded-full mr-3">
                      <div className="h-4 bg-blue-600 rounded-full" style={{ width: '28%' }}></div>
                    </div>
                    <span className="text-sm font-medium">28.0%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">monthly_charges</p>
                    <p className="text-xs text-gray-500">numeric</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-48 h-4 bg-gray-200 rounded-full mr-3">
                      <div className="h-4 bg-blue-600 rounded-full" style={{ width: '21%' }}></div>
                    </div>
                    <span className="text-sm font-medium">21.0%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">total_charges</p>
                    <p className="text-xs text-gray-500">numeric</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-48 h-4 bg-gray-200 rounded-full mr-3">
                      <div className="h-4 bg-blue-600 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                    <span className="text-sm font-medium">18.0%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">contract_type</p>
                    <p className="text-xs text-gray-500">categorical</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-48 h-4 bg-gray-200 rounded-full mr-3">
                      <div className="h-4 bg-blue-600 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    <span className="text-sm font-medium">12.0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'configuration':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Model Configuration</h2>
                <p className="text-sm text-gray-500 mt-1">Parameters and settings for training</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                Edit Configuration
              </button>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Training Parameters</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                  <div>
                    <p className="text-sm text-gray-500">Model Type</p>
                    <p className="font-medium">XGBoost Classifier</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Learning Rate</p>
                    <p className="font-medium">0.01</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Depth</p>
                    <p className="font-medium">6</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Number of Estimators</p>
                    <p className="font-medium">100</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Random State</p>
                    <p className="font-medium">42</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subsample</p>
                    <p className="font-medium">0.8</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Feature Engineering</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Feature Selection</p>
                      <p className="font-medium">SHAP-based ranking</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Scaling Method</p>
                      <p className="font-medium">StandardScaler</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Missing Value Strategy</p>
                      <p className="font-medium">Mean imputation</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Categorical Encoding</p>
                      <p className="font-medium">One-hot encoding</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'deployments':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Deployments</h2>
                <p className="text-sm text-gray-500 mt-1">Production instances of your models</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Deploy Model
              </button>
            </div>
            
            {project.models > 0 ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">Production Endpoint</h3>
                      <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Healthy
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        Logs
                      </button>
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        Settings
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Deployed Model</p>
                        <p className="font-medium">ChurnPredictor-v2</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Endpoint URL</p>
                        <p className="font-medium text-blue-600">/api/v1/predict/churn</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Deployed On</p>
                        <p className="font-medium">5 days ago</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Traffic</h4>
                      <div className="flex space-x-4 text-sm">
                        <div>
                          <span className="font-medium">2,345</span>
                          <span className="text-gray-500 ml-1">requests today</span>
                        </div>
                        <div>
                          <span className="font-medium">45ms</span>
                          <span className="text-gray-500 ml-1">avg. latency</span>
                        </div>
                        <div>
                          <span className="font-medium">99.9%</span>
                          <span className="text-gray-500 ml-1">uptime</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No deployments yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-4">Deploy your models to production to make them accessible via API endpoints.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  Deploy a Model
                </button>
              </div>
            )}
          </div>
        );
      case 'training_history':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Training History</h2>
                <p className="text-sm text-gray-500 mt-1">Record of model training runs</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Training Runs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started At</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">run_123456</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ChurnPredictor-v3</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Yesterday at 3:45 PM</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45m 12s</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">91.2%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900">View Details</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">run_123455</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ChurnPredictor-v2</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 days ago</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">38m 05s</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">87.5%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900">View Details</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">run_123454</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ChurnPredictor-v1</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 week ago</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">42m 30s</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">85.2%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900">View Details</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'models':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Models</h2>
                <p className="text-sm text-gray-500 mt-1">Trained models for this project</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Train New Model
              </button>
            </div>

            {/* Models List */}
            {project.models > 0 ? (
              <div className="space-y-4">
                {/* Model Item - Production */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">ChurnPredictor-v2</h3>
                      <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Production
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        View Details
                      </button>
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        ⋮
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">XGBoost</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Accuracy</p>
                        <p className="font-medium">87.5%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Trained</p>
                        <p className="font-medium">5 days ago</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Inference Time</p>
                        <p className="font-medium">45ms</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Item - Development */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">ChurnPredictor-v3</h3>
                      <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Development
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        View Details
                      </button>
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        ⋮
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">Neural Network</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Accuracy</p>
                        <p className="font-medium">91.2%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Trained</p>
                        <p className="font-medium">Yesterday</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Inference Time</p>
                        <p className="font-medium">120ms</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No models yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-4">Train your first model to start making predictions based on your data.</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  Train Your First Model
                </button>
              </div>
            )}
          </div>
        );
      case 'datasets':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-medium text-foreground">Datasets ({project.datasets.length})</h3>
               <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md flex items-center text-sm font-medium transition-colors">
                 <PlusCircle className="w-4 h-4 mr-1.5" />
                 Add Dataset
               </button>
             </div>

             {project.datasets.length > 0 ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                 <table className="min-w-full divide-y divide-border">
                   <thead className="bg-secondary/50">
                     <tr>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Records</th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</th>
                       <th scope="col" className="relative px-6 py-3">
                         <span className="sr-only">Actions</span>
                       </th>
                     </tr>
                   </thead>
                   <tbody className="bg-card divide-y divide-border">
                     {project.datasets.map((dataset) => (
                       <tr key={dataset.id}>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{dataset.name}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDatasetTypeClasses(dataset.type)}`}>
                              {dataset.type}
                            </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{dataset.recordCount.toLocaleString()}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{dataset.lastUpdated}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           {/* Link to future dataset detail page */}
                           <Link href={`/datasets/${dataset.id}`} className="text-primary hover:text-primary/80">
                             View
                           </Link>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
              <div className="text-center py-10 bg-card rounded-lg border border-border">
                 <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground"/>
                 <h3 className="mt-2 text-sm font-semibold text-foreground">No datasets found</h3>
                 <p className="mt-1 text-sm text-muted-foreground">Add datasets to start training models.</p>
                 <div className="mt-6">
                   <button type="button" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                     <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                     Add Dataset
                   </button>
                 </div>
               </div>
             )}
          </div>
        );
      case 'environments':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-foreground">Project Environments</h3>
              {/* Button to add/configure might also go here if environments exist */}
              {project.environments.length > 0 && (
                 <button type="button" className="inline-flex items-center rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80">
                   <Settings className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                   Configure Environments
                 </button>
              )}
            </div>
            {project.environments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.environments.map(env => (
                  <div key={env.id} className="bg-card p-4 rounded-lg border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-semibold text-foreground">{env.name}</h4>
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(env.status)}`}>
                         {env.status}
                       </span>
                    </div>
                     <p className="text-xs text-muted-foreground mb-1">Cluster: <span className="font-medium text-foreground">{env.cluster}</span></p>
                     <p className="text-xs text-muted-foreground mb-1">Deployed Version: <span className="font-medium text-foreground">{env.deployedVersion}</span></p>
                     <p className="text-xs text-muted-foreground">Last Deployed: <span className="font-medium text-foreground">{env.lastDeployed}</span></p>
                     {/* Add actions like View Details, Deploy, etc. later */}
                     <div className="mt-3 pt-3 border-t border-border flex justify-end">
                        <button className="text-xs text-primary hover:underline">View Details</button>
                     </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-card rounded-lg border border-border">
                 <Server className="mx-auto h-12 w-12 text-muted-foreground"/>
                 <h3 className="mt-2 text-sm font-semibold text-foreground">No environments configured</h3>
                 <p className="mt-1 text-sm text-muted-foreground">Get started by adding a deployment environment for this project.</p>
                 <div className="mt-6">
                   <button type="button" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                     <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                     Add Environment
                   </button>
                 </div>
               </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-medium text-foreground mb-4">Project Settings</h3>
            <p className="text-sm text-muted-foreground">Settings placeholder...</p>
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Project Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 p-6 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center">
            {project.name}
            <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(project.status)}`}>
              {project.status}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
          <p className="text-xs text-muted-foreground">Last updated: {project.lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md flex items-center text-xs font-medium transition-colors">
            <Pencil className="w-3 h-3 mr-1.5" />
            Edit Project
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md flex items-center text-xs font-medium transition-colors">
            <Play className="w-3 h-3 mr-1.5" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex -mb-px space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Area */}
      <div className="py-4">
         {renderTabContent()} 
      </div>
    </div>
  );
} 