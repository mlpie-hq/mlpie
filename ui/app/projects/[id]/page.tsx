"use client";

import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import Link from 'next/link';

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
    datasets: 2,
  },
  {
    id: 2,
    name: "GenAI Content Summarizer",
    description: "Summarizing long articles using a fine-tuned large language model with configurable summary length.",
    lastUpdated: "1 day ago",
    status: "Active",
    progress: 62,
    models: 2,
    datasets: 4,
  },
  {
    id: 3,
    name: "Image Classification Pipeline",
    description: "End-to-end pipeline for training and deploying an image classifier with data augmentation and validation.",
    lastUpdated: "3 days ago",
    status: "Inactive",
    progress: 32,
    models: 1,
    datasets: 3,
  },
  {
    id: 4,
    name: "Sentiment Analysis API",
    description: "API endpoint for real-time sentiment analysis of customer feedback and social media mentions.",
    lastUpdated: "1 week ago",
    status: "Active",
    progress: 90,
    models: 1,
    datasets: 2,
  },
];

// Helper to get status styles
const getStatusClasses = (status: string) => {
  return status === 'Active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';
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

  // Content for each tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div>
            {/* Project Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Progress</p>
                <p className="font-medium text-lg text-gray-800 mb-1">{project.progress}%</p>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Models</p>
                <div className="flex items-center">
                  <p className="font-medium text-lg text-gray-800">{project.models}</p>
                  <span className="ml-2 text-xs text-blue-600">
                    {project.models > 0 ? '+1 this week' : 'None yet'}
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm">Datasets</p>
                <p className="font-medium text-lg text-gray-800">{project.datasets}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                {project.models > 0 ? (
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500 mr-3"></div>
                      <div>
                        <p className="text-sm text-gray-800">Model training completed successfully</p>
                        <p className="text-xs text-gray-500">Yesterday at 3:45 PM</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
                      <div>
                        <p className="text-sm text-gray-800">Dataset updated with new records</p>
                        <p className="text-xs text-gray-500">2 days ago at 10:30 AM</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500 mr-3"></div>
                      <div>
                        <p className="text-sm text-gray-800">Project created</p>
                        <p className="text-xs text-gray-500">1 week ago</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No activity yet</p>
                    <p className="text-sm mt-1">Start by adding datasets or training models</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Description */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">About This Project</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">{project.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">2 weeks ago</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Team</p>
                    <p className="font-medium">Data Science</p>
                  </div>
                </div>
              </div>
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
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Datasets</h2>
                <p className="text-sm text-gray-500 mt-1">Data sources for this project</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Dataset
              </button>
            </div>

            {/* Simple dataset list placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Available Datasets</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {project.datasets > 0 ? (
                  Array(project.datasets).fill(0).map((_, i) => (
                    <div key={i} className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {i === 0 ? "Customer Transactions" : "Customer Demographics"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {i === 0 ? "1.2M records" : "450K records"} • Updated {i === 0 ? "5 days ago" : "2 weeks ago"}
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500">No datasets available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'experiments':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-medium text-gray-900">Experiments</h2>
                <p className="text-sm text-gray-500 mt-1">Track and compare model training runs</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                New Experiment
              </button>
            </div>

            {/* Placeholder for experiments */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No experiments yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-4">Run experiments to track model performance and compare different approaches.</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                Create First Experiment
              </button>
            </div>
          </div>
        );
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Project Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mb-2">{project.description}</p>
            <div className="text-sm text-gray-500">Last Updated: {project.lastUpdated}</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(project.status)}`}>
            {project.status}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2 mt-4">
          <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            Edit Project
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'overview' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('performance')} 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'performance' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Performance
          </button>
          <button 
            onClick={() => setActiveTab('configuration')} 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'configuration' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Configuration
          </button>
          <button 
            onClick={() => setActiveTab('deployments')} 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'deployments' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Deployments
          </button>
          <button 
            onClick={() => setActiveTab('training_history')} 
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'training_history' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Training History
          </button>
        </div>
      </div>
      
      {/* Tab Content - no additional wrapper/card */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
} 