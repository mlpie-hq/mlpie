"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Beaker, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import MultiMethodInterface, { UIFormField, CodeExample, FormData } from '@/components/MultiMethodInterface';

// Mock data for the experiment - this would come from an API in a real app
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
    tags: ["churn", "customer", "prediction"],
    runCount: 3
  };
};

// Hyperparameter options based on algorithm
const getHyperparameterFields = (algorithm: string) => {
  // Default XGBoost hyperparameters
  const xgboostParams = [
    {
      id: 'learning-rate',
      name: 'learningRate',
      label: 'Learning Rate',
      type: 'select' as const,
      required: true,
      value: '0.1',
      options: [
        { value: '0.001', label: '0.001' },
        { value: '0.01', label: '0.01' },
        { value: '0.05', label: '0.05' },
        { value: '0.1', label: '0.1' },
        { value: '0.2', label: '0.2' }
      ]
    },
    {
      id: 'max-depth',
      name: 'maxDepth',
      label: 'Max Depth',
      type: 'select' as const,
      required: true,
      value: '6',
      options: [
        { value: '3', label: '3' },
        { value: '4', label: '4' },
        { value: '5', label: '5' },
        { value: '6', label: '6' },
        { value: '8', label: '8' },
        { value: '10', label: '10' }
      ]
    },
    {
      id: 'min-child-weight',
      name: 'minChildWeight',
      label: 'Min Child Weight',
      type: 'select' as const,
      required: true,
      value: '1',
      options: [
        { value: '1', label: '1' },
        { value: '3', label: '3' },
        { value: '5', label: '5' },
        { value: '7', label: '7' }
      ]
    },
    {
      id: 'subsample',
      name: 'subsample',
      label: 'Subsample',
      type: 'select' as const,
      required: true,
      value: '0.8',
      options: [
        { value: '0.6', label: '0.6' },
        { value: '0.7', label: '0.7' },
        { value: '0.8', label: '0.8' },
        { value: '0.9', label: '0.9' },
        { value: '1.0', label: '1.0' }
      ]
    },
    {
      id: 'colsample-bytree',
      name: 'colsampleByTree',
      label: 'Column Sample By Tree',
      type: 'select' as const,
      required: true,
      value: '0.8',
      options: [
        { value: '0.6', label: '0.6' },
        { value: '0.7', label: '0.7' },
        { value: '0.8', label: '0.8' },
        { value: '0.9', label: '0.9' },
        { value: '1.0', label: '1.0' }
      ]
    },
    {
      id: 'n-estimators',
      name: 'nEstimators',
      label: 'Number of Estimators',
      type: 'select' as const,
      required: true,
      value: '100',
      options: [
        { value: '50', label: '50' },
        { value: '100', label: '100' },
        { value: '200', label: '200' },
        { value: '500', label: '500' },
        { value: '1000', label: '1000' }
      ]
    }
  ];

  // Select hyperparameters based on the algorithm
  switch (algorithm.toLowerCase()) {
    case 'xgboost':
      return xgboostParams;
    case 'random_forest':
      // Similar to XGBoost but with different defaults - would be customized in a real app
      return xgboostParams;
    case 'neural_network':
      // Neural network specific hyperparameters would go here
      return xgboostParams;
    default:
      return xgboostParams;
  }
};

export default function CreateRunPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const experimentId = params.id;
  const experiment = getMockExperiment(experimentId);
  
  const [runStarted, setRunStarted] = useState(false);
  
  // Form state
  const [runName, setRunName] = useState(`Run ${experiment.runCount + 1}`);
  const [description, setDescription] = useState('');
  
  // Resource allocation
  const [cpuCount, setCpuCount] = useState('4');
  const [memoryGB, setMemoryGB] = useState('16');
  const [gpuCount, setGpuCount] = useState('1');
  
  // Hyperparameter state
  const [hyperparameterStates, setHyperparameterStates] = useState<Record<string, string>>({
    learningRate: '0.1',
    maxDepth: '6',
    minChildWeight: '1',
    subsample: '0.8',
    colsampleByTree: '0.8',
    nEstimators: '100'
  });
  
  // Function to update a hyperparameter value
  const updateHyperparameterValue = (name: string, value: string | number) => {
    setHyperparameterStates(prev => ({
      ...prev,
      [name]: String(value)
    }));
  };
  
  // Handle form submission
  const handleSubmitRun = (formData: FormData) => {
    console.log("Starting run with config:", formData);
    // In a real app, this would make an API call to start a training run
    
    // Show success and redirect to the experiment detail page
    setRunStarted(true);
    setTimeout(() => {
      router.push(`/models/experiments/${experimentId}`);
    }, 2000);
  };
  
  // Generate example code based on form data
  const getRunExampleCode = (formData: FormData): CodeExample => {
    // Extract values from form data
    const runName = formData.runName || `<run-name>`;
    const description = formData.description || '<description>';
    
    // Extract hyperparameter values
    const hyperparams: Record<string, string> = {};
    Object.keys(hyperparameterStates).forEach(key => {
      const formKey = key as keyof typeof formData;
      hyperparams[key] = String(formData[formKey] || hyperparameterStates[key]);
    });
    
    const cpuCount = formData.cpuCount || '4';
    const memoryGB = formData.memoryGB || '16';
    const gpuCount = formData.gpuCount || '1';
    
    // YAML example
    const yaml = `apiVersion: your-platform.com/v1alpha1
kind: ExperimentRun
metadata:
  name: ${String(runName).toLowerCase().replace(/\s+/g, '-')}
  labels:
    experiment-id: ${experimentId}
    algorithm: ${experiment.algorithm}
    task-type: ${experiment.taskType}
spec:
  displayName: "${runName}"
  description: "${description}"
  experimentId: "${experimentId}"
  hyperparameters:
    learningRate: ${hyperparams.learningRate}
    maxDepth: ${hyperparams.maxDepth}
    minChildWeight: ${hyperparams.minChildWeight}
    subsample: ${hyperparams.subsample}
    colsampleByTree: ${hyperparams.colsampleByTree}
    nEstimators: ${hyperparams.nEstimators}
  resources:
    cpu: ${cpuCount}
    memoryGB: ${memoryGB}
    gpu: ${gpuCount}`;

    // CLI example
    const cli = `your-cli experiment run \\
  --experiment-id ${experimentId} \\
  --name "${runName}" \\
  --description "${description}" \\
  --learning-rate ${hyperparams.learningRate} \\
  --max-depth ${hyperparams.maxDepth} \\
  --min-child-weight ${hyperparams.minChildWeight} \\
  --subsample ${hyperparams.subsample} \\
  --colsample-bytree ${hyperparams.colsampleByTree} \\
  --n-estimators ${hyperparams.nEstimators} \\
  --cpu ${cpuCount} \\
  --memory ${memoryGB} \\
  --gpu ${gpuCount}`;

    // SDK example
    const sdk = `from your_sdk import Client

client = Client()

# Get the experiment
experiment = client.experiments.get("${experimentId}")

# Add a new run to the experiment
run = experiment.add_run(
    name="${runName}",
    description="${description}",
    hyperparameters={
        "learning_rate": ${hyperparams.learningRate},
        "max_depth": ${hyperparams.maxDepth},
        "min_child_weight": ${hyperparams.minChildWeight},
        "subsample": ${hyperparams.subsample},
        "colsample_bytree": ${hyperparams.colsampleByTree},
        "n_estimators": ${hyperparams.nEstimators}
    },
    resources={
        "cpu": ${cpuCount},
        "memory_gb": ${memoryGB},
        "gpu": ${gpuCount}
    }
)

# Start the run
run.start()
print(f"Training run started: {run.id}")

# To monitor the status
# run.wait_for_completion()
# print(f"Run completed with status: {run.status}")
# print(f"Accuracy: {run.metrics.get('accuracy')}")
`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };
  
  // Generate run-specific form fields
  const runFields: UIFormField[] = [
    // Basic Information Section
    {
      id: 'run-name',
      name: 'runName',
      label: 'Run Name',
      type: 'text' as const,
      placeholder: 'Enter a name for this run',
      required: true,
      value: runName,
      onChange: (value: string | number) => setRunName(String(value))
    },
    {
      id: 'run-description',
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Briefly describe the hyperparameter settings for this run',
      required: false,
      value: description,
      onChange: (value: string | number) => setDescription(String(value))
    }
  ];
  
  // Generate hyperparameter fields for the selected algorithm
  const hyperparameterFields = getHyperparameterFields(experiment.algorithm).map(field => ({
    ...field,
    value: hyperparameterStates[field.name as keyof typeof hyperparameterStates] || field.value,
    onChange: (value: string | number) => updateHyperparameterValue(field.name, value)
  }));
  
  // Resource allocation fields
  const resourceFields: UIFormField[] = [
    {
      id: 'cpu-count',
      name: 'cpuCount',
      label: 'CPU Cores',
      type: 'select' as const,
      required: true,
      value: cpuCount,
      onChange: (value: string | number) => setCpuCount(String(value)),
      options: [
        { value: '2', label: '2 Cores' },
        { value: '4', label: '4 Cores' },
        { value: '8', label: '8 Cores' },
        { value: '16', label: '16 Cores' }
      ]
    },
    {
      id: 'memory-gb',
      name: 'memoryGB',
      label: 'Memory (GB)',
      type: 'select' as const,
      required: true,
      value: memoryGB,
      onChange: (value: string | number) => setMemoryGB(String(value)),
      options: [
        { value: '8', label: '8 GB' },
        { value: '16', label: '16 GB' },
        { value: '32', label: '32 GB' },
        { value: '64', label: '64 GB' }
      ]
    },
    {
      id: 'gpu-count',
      name: 'gpuCount',
      label: 'GPU Count',
      type: 'select' as const,
      required: true,
      value: gpuCount,
      onChange: (value: string | number) => setGpuCount(String(value)),
      options: [
        { value: '0', label: 'No GPU' },
        { value: '1', label: '1 GPU' },
        { value: '2', label: '2 GPUs' },
        { value: '4', label: '4 GPUs' }
      ]
    }
  ];
  
  // Combine all fields
  const formFields: UIFormField[] = [
    ...runFields,
    ...hyperparameterFields,
    ...resourceFields
  ];
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/models/experiments/${experimentId}`} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Add Run to Experiment</h1>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <Beaker className="h-6 w-6 text-indigo-600 mt-1" />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">{experiment.name}</h3>
            <p className="text-sm text-gray-500">{experiment.description}</p>
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
            </div>
          </div>
        </div>
      </div>
      
      {runStarted ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="animate-pulse mb-4">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-green-800 mb-2">Training Run Started!</h2>
          <p className="text-green-700">
            Your training run has been submitted successfully. You will be redirected to the experiment page where you can monitor progress.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hyperparameter Tuning</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Adjust Parameters</h4>
                    <p className="text-xs text-gray-500 mt-1">Modify hyperparameters to improve model performance</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Compare Results</h4>
                    <p className="text-xs text-gray-500 mt-1">Evaluate metrics across different runs</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Experiment Tips</h4>
              <p className="text-xs text-yellow-700">
                <span className="block font-medium">XGBoost Tips:</span>
                <span className="block">• Start with a lower learning rate (0.01-0.1)</span>
                <span className="block">• Try different max_depth values (3-10)</span>
                <span className="block">• Adjust min_child_weight to prevent overfitting</span>
              </p>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <MultiMethodInterface
              title="Configure Training Run"
              fields={formFields}
              getExampleCode={getRunExampleCode}
              onSubmit={handleSubmitRun}
              submitButtonText="Start Training Run"
              yamlInstructions="Define a training run in YAML format"
              cliInstructions="Use the command-line interface to start a training run"
              sdkInstructions="Use the Python SDK to programmatically start a training run"
            />
          </div>
        </div>
      )}
    </div>
  );
} 