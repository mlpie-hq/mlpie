"use client";

import { useParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Server, Package, BarChart2, FlaskConical, Settings, PlusCircle, Trash2, Edit, GitBranch, RefreshCw, X, MoreVertical, KeyRound, Eye, EyeOff, Plus } from 'lucide-react';
import MultiMethodInterface, { UIFormField, CodeExample, FormData } from '@/components/MultiMethodInterface';
import { useProject } from '@/contexts/ProjectContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define GitRepository Type with name
type GitRepository = {
  id: string;
  name: string;
  url: string;
  branch: string;
  lastSync: string;
  status: string; // e.g., 'Synced', 'Pending', 'Error'
};

// Define Environment Type clearly at the top level
type Environment = {
  id: string;
  name: string;
  status: string;
  deployedVersion: string;
  cluster: string;
  lastDeployed: string;
};

type ProjectDataset = {
  id: string;
  name: string;
  recordCount: number;
  type: string;
  lastUpdated: string;
};

// Define Secret Type
type SecretKeyValue = {
  key: string;
  value: string;
};

type Secret = {
  id: string;
  name: string;
  values: SecretKeyValue[];
  createdAt: string;
};

type Project = {
  id: number;
  name: string;
  description: string;
  lastUpdated: string;
  status: string;
  progress: number;
  models: number;
  datasets: ProjectDataset[];
  environments: Environment[];
  gitRepos: GitRepository[]; // Add Git Repos array
  secrets: Secret[]; // Add Secrets array
};

// Temporary: Import or copy the initialProjects data structure for lookup
// In a real app, you'd fetch this data based on the ID
const initialProjects: Project[] = [
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
    ],
    gitRepos: [
      { id: 'repo-1', name: 'Main Churn Logic', url: 'https://github.com/mlpie-oss/churn-prediction', branch: 'main', lastSync: '5 mins ago', status: 'Synced' },
      { id: 'repo-2', name: 'Data Pipelines', url: 'https://dev.azure.com/org/project/_git/customer-data-pipelines', branch: 'develop', lastSync: '2 hours ago', status: 'Pending' },
    ],
    secrets: [
      { 
        id: 'secret-1', 
        name: 'AWS Credentials', 
        values: [
          { key: 'AWS_ACCESS_KEY_ID', value: 'AKIAIOSFODNN7EXAMPLE' },
          { key: 'AWS_SECRET_ACCESS_KEY', value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' }
        ],
        createdAt: '3 days ago'
      },
      {
        id: 'secret-2',
        name: 'Database Credentials',
        values: [
          { key: 'DB_HOST', value: 'postgres.example.com' },
          { key: 'DB_USER', value: 'admin' },
          { key: 'DB_PASSWORD', value: 'securepassword123' },
          { key: 'DB_NAME', value: 'churn_prediction' }
        ],
        createdAt: '1 week ago'
      }
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
    ],
    gitRepos: [],
    secrets: []
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
    environments: [],
    gitRepos: [
       { id: 'repo-3', name: 'Classifier Model', url: 'https://gitlab.com/my-research-group/image-classifier', branch: 'feature/new-augmentation', lastSync: '1 day ago', status: 'Error' },
    ],
    secrets: []
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
    ],
    gitRepos: [],
    secrets: []
  },
];

// Helper to get status styles
const getStatusClasses = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'synced':
    case 'running':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'inactive':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'error':
    case 'failed':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

// Helper function for Dataset Type badge styles
const getDatasetTypeClasses = (type: string) => {
  switch (type.toLowerCase()) {
    case 'source':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'derived':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string, 10) : null;
  
  const { setSelectedProject, setSelectedEnvironment } = useProject();
  const [activeTab, setActiveTab] = useState('overview');
  const initialProjectData = initialProjects.find(p => p.id === projectId);
  
  // --- State for Environments --- 
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment | null>(null);
  const [envId, setEnvId] = useState(''); 
  const [envName, setEnvName] = useState('');
  const [envCluster, setEnvCluster] = useState('');

  // --- State for Git Repos --- 
  const [gitRepos, setGitRepos] = useState<GitRepository[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // State for the Link Repo MMI Modal
  const [isLinkRepoModalOpen, setIsLinkRepoModalOpen] = useState(false);
  const [repoNameMMI, setRepoNameMMI] = useState('');
  const [repoUrlMMI, setRepoUrlMMI] = useState('');

  // --- State for Secrets ---
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [currentSecret, setCurrentSecret] = useState<Secret | null>(null);
  const [secretName, setSecretName] = useState('');
  const [secretValues, setSecretValues] = useState<SecretKeyValue[]>([{ key: '', value: '' }]);
  const [showSecretValues, setShowSecretValues] = useState<Record<string, boolean>>({});

  // Effect to initialize states
  useEffect(() => {
    if (initialProjectData) {
      setEnvironments(initialProjectData.environments);
      setGitRepos(initialProjectData.gitRepos);
      setSecrets(initialProjectData.secrets || []);
      
      // Update the global context with this project
      setSelectedProject(initialProjectData);
      
      // If there are environments, select the first one by default
      if (initialProjectData.environments.length > 0) {
        setSelectedEnvironment(initialProjectData.environments[0]);
      } else {
        setSelectedEnvironment(null);
      }
    }
  }, [initialProjectData, setSelectedProject, setSelectedEnvironment]);

  // Effect for closing context menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // --- Handlers for Environment CRUD --- 
  const handleOpenEnvModal = (env: Environment | null = null) => {
    setCurrentEnvironment(env);
    if (env) {
      setEnvId(env.id);
      setEnvName(env.name);
      setEnvCluster(env.cluster);
    } else {
      setEnvId('');
      setEnvName('');
      setEnvCluster('');
    }
    setIsEnvModalOpen(true);
  };

  const handleCloseEnvModal = () => {
    setIsEnvModalOpen(false);
    setCurrentEnvironment(null);
    setEnvId(''); 
    setEnvName('');
    setEnvCluster('');
  };

  const handleSaveEnvironment = (formData: FormData) => {
    const name = formData.name as string;
    const cluster = formData.cluster as string;
    
    if (!name || !cluster) {
        alert("Environment Name and Cluster are required.");
        return; 
    }

    const newEnvData: Omit<Environment, 'status' | 'deployedVersion' | 'lastDeployed'> = {
        id: currentEnvironment ? envId : `env-${Date.now()}`, 
        name: name,
        cluster: cluster,
    };

    if (currentEnvironment) {
        console.log("Updating environment:", newEnvData.id, newEnvData);
        setEnvironments(prev => prev.map(env => 
            env.id === currentEnvironment.id ? { ...env, ...newEnvData } : env
        ));
    } else {
        console.log("Adding environment:", newEnvData);
        const fullNewEnv: Environment = {
            ...newEnvData,
            status: 'Pending', 
            deployedVersion: 'N/A', 
            lastDeployed: 'Never'
        }
        setEnvironments(prev => [...prev, fullNewEnv]);
    }
    handleCloseEnvModal();
  };

  const handleDeleteEnvironment = (idToDelete: string) => {
    const envToDelete = environments.find(e => e.id === idToDelete);
    if (window.confirm(`Are you sure you want to delete environment "${envToDelete?.name ?? idToDelete}"?`)) {
        console.log("Deleting environment:", idToDelete);
        setEnvironments(prev => prev.filter(env => env.id !== idToDelete));
    }
  };
  // --- End Environment Handlers ---

  // --- Handlers for Git Repo Link MMI --- 
  const handleOpenLinkRepoModal = () => {
    setRepoNameMMI(''); // Reset form state for MMI
    setRepoUrlMMI('');
    setIsLinkRepoModalOpen(true);
  };

  const handleCloseLinkRepoModal = () => {
    setIsLinkRepoModalOpen(false);
    // Optionally reset MMI form state here too if needed
  };

  const handleLinkRepositorySubmit = (formData: FormData) => {
    const name = formData.name as string; // Assuming field names in MMI are 'name' and 'url'
    const url = formData.url as string;
    
    if (!name || !url) {
      alert("Please fill in all repository details (Name, URL).");
      return;
    }

    // Add Logic - Create new repo link
    const newRepo: GitRepository = {
      id: `repo-${Date.now()}`,
      name: name,
      url: url,
      branch: 'main', // Defaulting branch as it's not in the UI form anymore
      status: 'Pending',
      lastSync: 'Never',
    };
    console.log("Linking repository via MMI:", newRepo);
    setGitRepos(prev => [...prev, newRepo]);
    handleCloseLinkRepoModal();
  };

  const handleDeleteRepo = (idToDelete: string) => {
    const repoToDelete = gitRepos.find(r => r.id === idToDelete);
    if (window.confirm(`Are you sure you want to unlink repository "${repoToDelete?.name ?? idToDelete}"?`)) {
        console.log("Deleting repository link:", idToDelete);
        setGitRepos(prev => prev.filter(repo => repo.id !== idToDelete));
    }
  };
  // --- End Git Repo Handlers ---

  // --- Handlers for Secret CRUD ---
  const handleOpenSecretModal = (secret: Secret | null = null) => {
    setCurrentSecret(secret);
    if (secret) {
      setSecretName(secret.name);
      setSecretValues([...secret.values]);
    } else {
      setSecretName('');
      setSecretValues([{ key: '', value: '' }]);
    }
    setIsSecretModalOpen(true);
  };

  const handleCloseSecretModal = () => {
    setIsSecretModalOpen(false);
    setCurrentSecret(null);
    setSecretName('');
    setSecretValues([{ key: '', value: '' }]);
  };

  const handleAddSecretKeyValue = () => {
    setSecretValues([...secretValues, { key: '', value: '' }]);
  };

  const handleRemoveSecretKeyValue = (index: number) => {
    const newValues = [...secretValues];
    newValues.splice(index, 1);
    setSecretValues(newValues);
  };

  const handleUpdateSecretKeyValue = (index: number, field: 'key' | 'value', newValue: string) => {
    const newValues = [...secretValues];
    newValues[index][field] = newValue;
    setSecretValues(newValues);
  };

  const handleSaveSecret = () => {
    if (!secretName) {
      alert("Secret name is required.");
      return;
    }

    // Validate that all keys and values are filled
    const hasEmptyFields = secretValues.some(kv => !kv.key || !kv.value);
    if (hasEmptyFields) {
      alert("All key-value pairs must have both key and value filled.");
      return;
    }

    // Check for duplicate keys
    const keys = secretValues.map(kv => kv.key);
    if (new Set(keys).size !== keys.length) {
      alert("Secret keys must be unique.");
      return;
    }

    const newSecretData: Secret = {
      id: currentSecret ? currentSecret.id : `secret-${Date.now()}`,
      name: secretName,
      values: secretValues,
      createdAt: currentSecret ? currentSecret.createdAt : new Date().toLocaleDateString()
    };

    if (currentSecret) {
      setSecrets(prev => prev.map(s => s.id === currentSecret.id ? newSecretData : s));
    } else {
      setSecrets(prev => [...prev, newSecretData]);
    }

    handleCloseSecretModal();
  };

  const handleDeleteSecret = (idToDelete: string) => {
    if (confirm("Are you sure you want to delete this secret? This action cannot be undone.")) {
      setSecrets(prev => prev.filter(s => s.id !== idToDelete));
    }
  };

  const toggleSecretValueVisibility = (secretId: string) => {
    setShowSecretValues(prev => ({
      ...prev,
      [secretId]: !prev[secretId]
    }));
  };

  const project = initialProjectData;

  if (!project) {
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'models', label: 'Models', icon: Package },
    { id: 'datasets', label: 'Datasets', icon: FlaskConical },
    { id: 'environments', label: 'Environments', icon: Server },
    { id: 'git', label: 'Git Repos', icon: GitBranch },
    { id: 'secrets', label: 'Secrets', icon: KeyRound },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card p-4 rounded-lg border border-border">
                 <p className="text-xs text-muted-foreground mb-1">Models</p>
                 <h3 className="text-xl font-bold">{project.models}</h3>
               </div>
               <div className="bg-card p-4 rounded-lg border border-border">
                 <p className="text-xs text-muted-foreground mb-1">Datasets</p>
                 <h3 className="text-xl font-bold">{project.datasets.length}</h3> 
               </div>
               <div className="bg-card p-4 rounded-lg border border-border">
                 <p className="text-xs text-muted-foreground mb-1">Progress</p>
                 <h3 className="text-xl font-bold">{project.progress}%</h3>
              </div>
            </div>
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
            <div className="bg-card p-4 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">Recent Activity</h4>
              <p className="text-xs text-muted-foreground">No recent activity recorded.</p>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div>
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

            {project.models > 0 ? (
              <div className="space-y-4">
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-foreground">Deployment Environments</h2>
              <button 
                onClick={() => handleOpenEnvModal()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Environment
              </button>
            </div>
            
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-left">Name</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-left">Cluster</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-left">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-left">Deployed Version</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-left">Last Deployed</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {environments.length > 0 ? (
                    environments.map((env: Environment, index: number) => (
                      <tr key={env.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                        <td className="px-4 py-3 font-medium text-foreground">
                          <Link href={`/projects/${params.id}/environments/${env.id}`} className="hover:text-primary hover:underline">
                            {env.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{env.cluster}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(env.status)}`}>
                            {env.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{env.deployedVersion}</td>
                        <td className="px-4 py-3 text-muted-foreground">{env.lastDeployed}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleOpenEnvModal(env)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                              title="Edit Environment"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEnvironment(env.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                              title="Delete Environment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground italic">
                        No environments configured for this project yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'git':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-medium text-foreground">Linked Git Repositories</h2>
               <button 
                 onClick={handleOpenLinkRepoModal}
                 className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 flex items-center"
               >
                 <PlusCircle className="w-4 h-4 mr-2" />
                 Link Repository
               </button>
             </div>

             {gitRepos.length > 0 ? (
              <div className="bg-card border border-border rounded-lg"> 
                 <table className="w-full text-sm"> 
                   <thead className="bg-secondary/50">
                     <tr>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">Name</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">URL</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">Status</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">Last Sync</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {gitRepos.map((repo: GitRepository, index: number) => (
                       <tr key={repo.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                         <td className="px-4 py-3 align-top font-medium text-foreground truncate">{repo.name}</td> 
                         <td className="px-4 py-3 align-top text-xs text-muted-foreground truncate" title={repo.url}>{repo.url}</td> 
                         <td className="px-4 py-3 align-top"> 
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(repo.status)}`}>
                              {repo.status}
                            </span>
                         </td>
                         <td className="px-4 py-3 text-muted-foreground text-xs align-top truncate">{repo.lastSync}</td> 
                         
                         <td className="px-4 py-3 text-right align-top whitespace-nowrap"> 
                           <div className="relative inline-block text-left"> 
                             <button 
                               onClick={() => setOpenMenuId(openMenuId === repo.id ? null : repo.id)}
                               className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                               title="Actions"
                             >
                               <MoreVertical className="w-4 h-4" />
                             </button>
 
                             {openMenuId === repo.id && (
                               <div 
                                 ref={menuRef}
                                 className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10 py-1"
                               >
                                 <button 
                                   onClick={() => { alert('Sync action TBD'); setOpenMenuId(null); }}
                                   className="flex items-center w-full px-3 py-1.5 text-sm text-foreground hover:bg-secondary text-left"
                                 >
                                   <RefreshCw className="w-4 h-4 mr-2" />
                                   Sync Now
                                 </button>
                                 <button 
                                   onClick={() => { alert('Editing via this menu is not available. Use delete and re-link.'); setOpenMenuId(null); }} 
                                   className="flex items-center w-full px-3 py-1.5 text-sm text-foreground hover:bg-secondary text-left disabled:opacity-50" 
                                 >
                                   <Edit className="w-4 h-4 mr-2" />
                                   Edit Link...
                                 </button>
                                 <div className="my-1 h-px bg-border"></div>
                                 <button 
                                   onClick={() => { handleDeleteRepo(repo.id); setOpenMenuId(null); }}
                                   className="flex items-center w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 text-left"
                                 >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Unlink Repository
                                 </button>
                               </div>
                             )}
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="bg-card p-6 rounded-lg border border-border text-center">
                   <GitBranch className="mx-auto h-12 w-12 text-muted-foreground"/>
                   <h3 className="mt-2 text-sm font-semibold text-foreground">No Git Repositories Linked</h3>
                   <p className="mt-1 text-sm text-muted-foreground">Link a Git repository to sync code and configurations.</p>
                   <div className="mt-6">
                     <button 
                       onClick={handleOpenLinkRepoModal}
                       type="button" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                       <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                       Link Repository
                     </button>
                   </div>
               </div>
             )}
          </div>
        );
      case 'secrets':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-medium text-foreground">Project Secrets</h2>
               <button 
                 onClick={() => handleOpenSecretModal()} 
                 className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 flex items-center"
               >
                 <PlusCircle className="w-4 h-4 mr-2" />
                 Add Secret
               </button>
             </div>

             {secrets.length > 0 ? (
              <div className="bg-card border border-border rounded-lg"> 
                 <table className="w-full text-sm"> 
                   <thead className="bg-secondary/50">
                     <tr>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">Name</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">Key-Value Pairs</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-left">Created At</th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {secrets.map((secret: Secret, index: number) => (
                       <tr key={secret.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                         <td className="px-4 py-3 align-top font-medium text-foreground">{secret.name}</td> 
                         <td className="px-4 py-3 align-top">
                           <div className="flex items-center mb-1">
                             <span className="text-xs text-muted-foreground mr-2">{secret.values.length} key-value pairs</span>
                             <button 
                               onClick={() => toggleSecretValueVisibility(secret.id)}
                               className="p-1 text-xs text-muted-foreground hover:text-primary rounded"
                             >
                               {showSecretValues[secret.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                             </button>
                           </div>
                           <div className="space-y-1 max-w-xs">
                             {secret.values.map((kv, kvIndex) => (
                               <div key={kvIndex} className="flex items-center">
                                 <span className="text-xs font-medium text-foreground mr-1">{kv.key}:</span>
                                 <span className="text-xs text-muted-foreground font-mono">
                                   {showSecretValues[secret.id] ? kv.value : '••••••••'}
                                 </span>
                               </div>
                             ))}
                           </div>
                         </td>
                         <td className="px-4 py-3 text-muted-foreground text-xs align-top">{secret.createdAt}</td> 
                         
                         <td className="px-4 py-3 text-right align-top whitespace-nowrap"> 
                           <div className="flex space-x-1 justify-end">
                             <button 
                               onClick={() => handleOpenSecretModal(secret)}
                               className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                               title="Edit Secret"
                             >
                               <Edit className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDeleteSecret(secret.id)}
                               className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                               title="Delete Secret"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <div className="bg-card p-6 rounded-lg border border-border text-center">
                   <KeyRound className="mx-auto h-12 w-12 text-muted-foreground"/>
                   <h3 className="mt-2 text-sm font-semibold text-foreground">No secrets configured for this project yet.</h3>
                   <div className="mt-6">
                     <button 
                       onClick={() => handleOpenSecretModal()}
                       type="button" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                       <PlusCircle className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                       Add Secret
                     </button>
                   </div>
               </div>
             )}
          </div>
        );
      case 'settings':
        return <div>Project Settings Placeholder</div>;
      default:
        return <div>Select a tab</div>;
    }
  };

  const envFormFields: UIFormField[] = [
    {
      id: 'env-name',
      name: 'name',
      label: 'Environment Name',
      type: 'text',
      placeholder: 'e.g., Production, Staging, Development',
      required: true,
      value: envName,
      onChange: (value) => setEnvName(String(value)),
    },
    {
      id: 'env-cluster',
      name: 'cluster',
      label: 'Target Cluster URL/Name',
      type: 'text',
      placeholder: 'e.g., gke_my-project_us-central1-a_prod-cluster',
      required: true,
      value: envCluster,
      onChange: (value) => setEnvCluster(String(value)),
    },
  ];

  const getEnvExampleCode = (): CodeExample => {
    const envIdentifier = (currentEnvironment?.id || envName.toLowerCase().replace(/\s+/g, '-') || 'new-environment');
    const name = envName || (currentEnvironment ? currentEnvironment.name : '<environment-name>');
    const cluster = envCluster || (currentEnvironment ? currentEnvironment.cluster : '<cluster-url-or-name>');
    const action = currentEnvironment ? 'update' : 'add';
    const commandAction = currentEnvironment ? 'update' : 'add'; // CLI/SDK might use update/add

    // YAML Example
    const yaml = `apiVersion: your-platform.com/v1alpha1
kind: ProjectEnvironment
metadata:
  name: ${envIdentifier}
  namespace: project-${projectId} # Assuming namespace convention
spec:
  displayName: "${name}"
  cluster: ${cluster}
  # Additional config like resource limits, node selectors can go here`;

    // CLI Example
    const cli = `your-cli project env ${commandAction} --project ${projectId} \
    ${currentEnvironment ? `--env-id ${envIdentifier}` : ''} \
    --name "${name}" \
    --cluster "${cluster}" \
    # Add other flags as needed: --resource-quota=...`;

    // SDK Example
    const sdk = `from your_sdk import Client

client = Client()
project = client.get_project(${projectId})

environment = project.environments.${action}(
    ${currentEnvironment ? `id='${envIdentifier}',` : ''}
    name="${name}",
    cluster="${cluster}"
    # Add other parameters: resource_quota=...
)

print(f"${currentEnvironment ? 'Updated' : 'Added'} environment: {environment.name} ({environment.id})")`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };

  // --- Git Repo Link MMI Definitions ---
  const repoFormFields: UIFormField[] = [
    {
      id: 'repo-link-name',
      name: 'name', // Corresponds to key in FormData
      label: 'Repository Link Name',
      type: 'text',
      placeholder: 'e.g., Main Code, Data Processing Scripts',
      required: true,
      value: repoNameMMI,
      onChange: (value) => setRepoNameMMI(String(value)),
    },
    {
      id: 'repo-link-url',
      name: 'url', // Corresponds to key in FormData
      label: 'Repository URL',
      type: 'text', // Changed from 'url' to allow non-standard Git URLs if needed
      placeholder: 'https://github.com/your-org/your-repo.git',
      required: true,
      value: repoUrlMMI,
      onChange: (value) => setRepoUrlMMI(String(value)),
    },
    // Branch field removed from UI
  ];

  const getRepoExampleCode = (name: string, url: string): CodeExample => {
    const repoIdentifier = name.toLowerCase().replace(/\s+/g, '-') || 'new-repo-link';
    const safeUrl = url || '<repository-url>';
    
    // YAML Example - Branch removed
    const yaml = `apiVersion: your-platform.com/v1alpha1 # Using generic API group
kind: ProjectRepository
metadata:
  name: ${repoIdentifier}
  namespace: project-${projectId}
spec:
  displayName: "${name || 'My Repository Link'}"
  url: ${safeUrl}
  # secretRef: optional-secret-name`;

    // CLI Example - Branch removed
    const cli = `your-cli project repo link --project ${projectId} \ 
    --name "${name || 'my-repo-link'}" \ 
    --url "${safeUrl}"`;

    // SDK Example - Branch removed
    const sdk = `from your_sdk import Client # Using generic SDK name

client = Client()

project = client.get_project(${projectId})

repo = project.link_repository(
    name="${name || 'my-repo-link'}",
    url="${safeUrl}"
)

print(f"Linked repository: {repo.name} ({repo.id})")`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };
  // --- End Git Repo Link MMI Definitions ---

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(project.status)}`}>
                {project.status}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Last updated: {project.lastUpdated}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-border w-full justify-start">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="px-3 pb-3">
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="py-4">
            {tab.id === activeTab && renderTabContent()}
          </TabsContent>
        ))}
      </Tabs>

      {isEnvModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
               <h3 className="text-lg font-semibold text-foreground">
                 {currentEnvironment ? 'Edit Environment' : 'Add New Environment'}
               </h3>
               <button 
                 className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                 onClick={handleCloseEnvModal}
                 title="Close"
                 aria-label="Close dialog"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
              <div className="p-4 overflow-y-auto flex-1">
                 <MultiMethodInterface
                    title={currentEnvironment ? 'Edit Environment' : 'Add New Environment'}
                    fields={envFormFields} 
                    getExampleCode={getEnvExampleCode}
                    onSubmit={handleSaveEnvironment}
                    submitButtonText={currentEnvironment ? 'Save Changes' : 'Add Environment'}
                    yamlInstructions="Define the environment configuration as a ProjectEnvironment resource."
                    cliInstructions={`Use 'your-cli project env ${currentEnvironment ? 'update' : 'add'} ...' to manage environments.`}
                    sdkInstructions={`Use 'client.projects.environments.${currentEnvironment ? 'update' : 'add'}(...)' in the SDK.`}
                  />
              </div>
          </div>
        </div>
      )}

      {isLinkRepoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
               <h3 className="text-lg font-semibold text-foreground">
                 Link New Git Repository 
               </h3>
               <button 
                 className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground" 
                 onClick={handleCloseLinkRepoModal}
                 title="Close"
                 aria-label="Close dialog"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
              <div className="p-4 overflow-y-auto flex-1">
                 <MultiMethodInterface
                    fields={repoFormFields}
                    getExampleCode={() => getRepoExampleCode(repoNameMMI, repoUrlMMI)} 
                    onSubmit={handleLinkRepositorySubmit}
                    submitButtonText={'Link Repository'}
                    yamlInstructions="Define a ProjectRepository resource in YAML format."
                    cliInstructions="Use the command-line tool to link a repository."
                    sdkInstructions="Use the Python SDK to programmatically link a repository."
                  />
              </div>
          </div>
        </div>
      )}

      {isSecretModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
             <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
               <h3 className="text-lg font-semibold text-foreground">
                 {currentSecret ? 'Edit Secret' : 'Add New Secret'}
               </h3>
               <button 
                 className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                 onClick={handleCloseSecretModal}
                 title="Close"
                 aria-label="Close dialog"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1">
               <form onSubmit={(e) => { e.preventDefault(); handleSaveSecret(); }}>
                 <div className="space-y-5">
                   <div>
                     <label htmlFor="secret-name" className="block text-sm font-medium text-foreground mb-1">
                       Secret Name
                     </label>
                     <input
                       type="text"
                       id="secret-name"
                       value={secretName}
                       onChange={(e) => setSecretName(e.target.value)}
                       className="w-full px-3 py-2 border border-border rounded-md shadow-sm text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                       placeholder="e.g., AWS Credentials, Database Connection"
                       required
                     />
                   </div>
                   
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-medium text-foreground">
                         Secret Values
                       </label>
                       <button
                         type="button"
                         onClick={handleAddSecretKeyValue}
                         className="inline-flex items-center text-xs text-primary hover:text-primary/80"
                       >
                         <Plus className="w-3 h-3 mr-1" />
                         Add Key-Value Pair
                       </button>
                     </div>
                     
                     <div className="space-y-3">
                       {secretValues.map((kv, index) => (
                         <div key={index} className="flex items-start gap-2">
                           <div className="flex-1">
                             <input
                               type="text"
                               value={kv.key}
                               onChange={(e) => handleUpdateSecretKeyValue(index, 'key', e.target.value)}
                               className="w-full px-3 py-2 border border-border rounded-md shadow-sm text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                               placeholder="Key"
                               required
                             />
                           </div>
                           <div className="flex-1">
                             <input
                               type="password"
                               value={kv.value}
                               onChange={(e) => handleUpdateSecretKeyValue(index, 'value', e.target.value)}
                               className="w-full px-3 py-2 border border-border rounded-md shadow-sm text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                               placeholder="Value"
                               required
                             />
                           </div>
                           {secretValues.length > 1 && (
                             <button
                               type="button"
                               onClick={() => handleRemoveSecretKeyValue(index)}
                               className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                               title="Remove key-value pair"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
                 
                 <div className="mt-6 flex justify-end space-x-3">
                   <button
                     type="button"
                     onClick={handleCloseSecretModal}
                     className="px-4 py-2 border border-border text-muted-foreground rounded-md text-sm hover:bg-secondary"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                   >
                     {currentSecret ? 'Update Secret' : 'Create Secret'}
                   </button>
                 </div>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
} 