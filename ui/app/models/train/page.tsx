"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, Cog, Server, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import MultiMethodInterface, { UIFormField, CodeExample, FormData } from '@/components/MultiMethodInterface';

// Mock data for datasets that could be used for training
const availableDatasets = [
  { id: "ds-001", name: "Customer Data 2023 Q1-Q3", records: 85000, size: "250MB", type: "Structured" },
  { id: "ds-002", name: "Customer Behavior Metrics", records: 72000, size: "180MB", type: "Structured" },
  { id: "ds-003", name: "Product Reviews", records: 150000, size: "420MB", type: "Text" },
  { id: "ds-004", name: "Product Images", records: 45000, size: "2.3GB", type: "Image" },
  { id: "ds-005", name: "Transaction History", records: 500000, size: "1.2GB", type: "Structured" }
];

// Algorithm options based on task type
const algorithmOptions = {
  classification: [
    { value: "xgboost", label: "XGBoost" },
    { value: "random_forest", label: "Random Forest" },
    { value: "logistic_regression", label: "Logistic Regression" },
    { value: "neural_network", label: "Neural Network" }
  ],
  regression: [
    { value: "linear_regression", label: "Linear Regression" },
    { value: "random_forest", label: "Random Forest" },
    { value: "xgboost", label: "XGBoost" },
    { value: "neural_network", label: "Neural Network" }
  ],
  nlp: [
    { value: "bert", label: "BERT" },
    { value: "distilbert", label: "DistilBERT" },
    { value: "roberta", label: "RoBERTa" }
  ],
  computer_vision: [
    { value: "resnet", label: "ResNet" },
    { value: "efficient_net", label: "EfficientNet" },
    { value: "vision_transformer", label: "Vision Transformer" }
  ]
};

export default function TrainModelPage() {
  const router = useRouter();
  const [trainingStarted, setTrainingStarted] = useState(false);
  
  // Form state
  const [modelName, setModelName] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('classification');
  const [algorithm, setAlgorithm] = useState('');
  const [trainingDataset, setTrainingDataset] = useState('');
  const [validationDataset, setValidationDataset] = useState('');
  const [validationSplit, setValidationSplit] = useState('20');
  const [epochs, setEpochs] = useState('100');
  const [batchSize, setBatchSize] = useState('32');
  const [learningRate, setLearningRate] = useState('0.001');
  
  // Resource allocation
  const [cpuCount, setCpuCount] = useState('4');
  const [memoryGB, setMemoryGB] = useState('16');
  const [gpuCount, setGpuCount] = useState('1');
  
  // Tag management
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      addTag(tagInput);
    }
  };
  
  // Logic to show/hide validation dataset based on validation type
  const [validationType, setValidationType] = useState('split');
  const showValidationDataset = validationType === 'separate';
  
  // Handle form submission
  const handleSubmitTraining = (formData: FormData) => {
    console.log("Training model with config:", formData);
    // In a real app, this would make an API call to start training
    
    // Show success and redirect to a "training job" page
    setTrainingStarted(true);
    setTimeout(() => {
      router.push('/models');
    }, 2000);
  };
  
  // Generate example code based on form data
  const getTrainingExampleCode = (formData: FormData): CodeExample => {
    // Extract values from form data
    const modelName = formData.modelName || '<model-name>';
    const description = formData.description || '<description>';
    const taskType = formData.taskType || 'classification';
    const algorithm = formData.algorithm || '<algorithm>';
    const trainingDataset = formData.trainingDataset || '<dataset-id>';
    const validationDataset = formData.validationDataset || '<validation-dataset-id>';
    const validationType = formData.validationType || 'split';
    const validationSplit = formData.validationSplit || '20';
    const epochs = formData.epochs || '100';
    const batchSize = formData.batchSize || '32';
    const learningRate = formData.learningRate || '0.001';
    const cpuCount = formData.cpuCount || '4';
    const memoryGB = formData.memoryGB || '16';
    const gpuCount = formData.gpuCount || '1';
    const tagsList = tags.length ? tags : ['<tag1>', '<tag2>'];
    
    // YAML example
    const yaml = `apiVersion: your-platform.com/v1alpha1
kind: ModelTrainingJob
metadata:
  name: ${String(modelName).toLowerCase().replace(/\s+/g, '-')}
  labels:
    task-type: ${taskType}
    algorithm: ${algorithm}
    ${tagsList.map(tag => `tag-${tag.toLowerCase().replace(/\s+/g, '-')}: "true"`).join('\n    ')}
spec:
  displayName: "${modelName}"
  description: "${description}"
  algorithm: ${algorithm}
  taskType: ${taskType}
  training:
    datasetId: "${trainingDataset}"
    ${validationType === 'split' 
      ? `validationSplit: ${validationSplit}`
      : `validationDatasetId: "${validationDataset}"`}
  hyperparameters:
    epochs: ${epochs}
    batchSize: ${batchSize}
    learningRate: ${learningRate}
  resources:
    cpu: ${cpuCount}
    memoryGB: ${memoryGB}
    gpu: ${gpuCount}
  tags:
    ${tagsList.map(tag => `- "${tag}"`).join('\n    ')}`;

    // CLI example
    const cli = `your-cli model train \\
  --name "${modelName}" \\
  --description "${description}" \\
  --task-type ${taskType} \\
  --algorithm ${algorithm} \\
  --training-dataset ${trainingDataset} \\
  ${validationType === 'split'
    ? `--validation-split ${validationSplit} \\`
    : `--validation-dataset ${validationDataset} \\`}
  --epochs ${epochs} \\
  --batch-size ${batchSize} \\
  --learning-rate ${learningRate} \\
  --cpu ${cpuCount} \\
  --memory ${memoryGB} \\
  --gpu ${gpuCount} \\
  ${tagsList.map(tag => `--tag "${tag}"`).join(' \\\n  ')}`;

    // SDK example
    const sdk = `from your_sdk import Client

client = Client()

# Define training configuration
training_job = client.models.create_training_job(
    name="${modelName}",
    description="${description}",
    task_type="${taskType}",
    algorithm="${algorithm}",
    training_dataset="${trainingDataset}",
    ${validationType === 'split'
      ? `validation_split=${validationSplit},`
      : `validation_dataset="${validationDataset}",`}
    hyperparameters={
        "epochs": ${epochs},
        "batch_size": ${batchSize},
        "learning_rate": ${learningRate}
    },
    resources={
        "cpu": ${cpuCount},
        "memory_gb": ${memoryGB},
        "gpu": ${gpuCount}
    },
    tags=[${tagsList.map(tag => `"${tag}"`).join(', ')}]
)

# Start the training job
job = training_job.start()
print(f"Training job started: {job.id}")

# Optionally, wait for completion
# job.wait_for_completion()
# print(f"Job completed with status: {job.status}")`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };
  
  // Define form fields with correct type literals
  const formFields: UIFormField[] = [
    // Basic Information Section
    {
      id: 'model-name',
      name: 'modelName',
      label: 'Model Name',
      type: 'text' as const,
      placeholder: 'Enter a name for the model',
      required: true,
      value: modelName,
      onChange: (value: string | number) => setModelName(String(value))
    },
    {
      id: 'model-description',
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Briefly describe what this model does',
      required: false,
      value: description,
      onChange: (value: string | number) => setDescription(String(value))
    },
    {
      id: 'task-type',
      name: 'taskType',
      label: 'Task Type',
      type: 'select' as const,
      required: true,
      value: taskType,
      onChange: (value: string | number) => {
        setTaskType(String(value));
        setAlgorithm(''); // Reset algorithm when task type changes
      },
      options: [
        { value: 'classification', label: 'Classification' },
        { value: 'regression', label: 'Regression' },
        { value: 'nlp', label: 'Natural Language Processing' },
        { value: 'computer_vision', label: 'Computer Vision' }
      ]
    },
    {
      id: 'algorithm',
      name: 'algorithm',
      label: 'Algorithm',
      type: 'select' as const,
      required: true,
      value: algorithm,
      onChange: (value: string | number) => setAlgorithm(String(value)),
      options: algorithmOptions[taskType as keyof typeof algorithmOptions] || []
    },
    
    // Dataset Selection Section
    {
      id: 'training-dataset',
      name: 'trainingDataset',
      label: 'Training Dataset',
      type: 'select' as const,
      required: true,
      value: trainingDataset,
      onChange: (value: string | number) => setTrainingDataset(String(value)),
      options: availableDatasets.map(ds => ({ 
        value: ds.id, 
        label: `${ds.name} (${ds.records.toLocaleString()} records, ${ds.size})` 
      }))
    },
    {
      id: 'validation-type',
      name: 'validationType',
      label: 'Validation Approach',
      type: 'select' as const,
      required: true,
      value: validationType,
      onChange: (value: string | number) => setValidationType(String(value)),
      options: [
        { value: 'split', label: 'Split Training Data' },
        { value: 'separate', label: 'Use Separate Dataset' }
      ]
    },
    ...(showValidationDataset ? [{
      id: 'validation-dataset',
      name: 'validationDataset',
      label: 'Validation Dataset',
      type: 'select' as const,
      required: validationType === 'separate',
      value: validationDataset,
      onChange: (value: string | number) => setValidationDataset(String(value)),
      options: availableDatasets.map(ds => ({ 
        value: ds.id, 
        label: `${ds.name} (${ds.records.toLocaleString()} records, ${ds.size})` 
      }))
    }] : [{
      id: 'validation-split',
      name: 'validationSplit',
      label: 'Validation Split (%)',
      type: 'select' as const,
      required: validationType === 'split',
      value: validationSplit,
      onChange: (value: string | number) => setValidationSplit(String(value)),
      options: [
        { value: '10', label: '10%' },
        { value: '15', label: '15%' },
        { value: '20', label: '20%' },
        { value: '25', label: '25%' },
        { value: '30', label: '30%' }
      ]
    }]),
    
    // Training Parameters Section
    {
      id: 'epochs',
      name: 'epochs',
      label: 'Epochs',
      type: 'select' as const,
      required: true,
      value: epochs,
      onChange: (value: string | number) => setEpochs(String(value)),
      options: [
        { value: '50', label: '50' },
        { value: '100', label: '100' },
        { value: '200', label: '200' },
        { value: '500', label: '500' },
        { value: '1000', label: '1000' }
      ]
    },
    {
      id: 'batch-size',
      name: 'batchSize',
      label: 'Batch Size',
      type: 'select' as const,
      required: true,
      value: batchSize,
      onChange: (value: string | number) => setBatchSize(String(value)),
      options: [
        { value: '16', label: '16' },
        { value: '32', label: '32' },
        { value: '64', label: '64' },
        { value: '128', label: '128' },
        { value: '256', label: '256' }
      ]
    },
    {
      id: 'learning-rate',
      name: 'learningRate',
      label: 'Learning Rate',
      type: 'select' as const,
      required: true,
      value: learningRate,
      onChange: (value: string | number) => setLearningRate(String(value)),
      options: [
        { value: '0.0001', label: '0.0001' },
        { value: '0.001', label: '0.001' },
        { value: '0.01', label: '0.01' },
        { value: '0.05', label: '0.05' },
        { value: '0.1', label: '0.1' }
      ]
    },
    
    // Resource Allocation Section
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
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/models" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Train New Model</h1>
        </div>
      </div>
      
      {trainingStarted ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="animate-pulse mb-4">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-green-800 mb-2">Training Job Started!</h2>
          <p className="text-green-700">
            Your model training job has been submitted successfully. You will be redirected to the models page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Training Process</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">1. Select Data</h4>
                    <p className="text-xs text-gray-500 mt-1">Choose training and validation datasets</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">2. Configure Model</h4>
                    <p className="text-xs text-gray-500 mt-1">Select algorithm and parameters</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Cog className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">3. Set Hyperparameters</h4>
                    <p className="text-xs text-gray-500 mt-1">Tune learning settings</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Server className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">4. Allocate Resources</h4>
                    <p className="text-xs text-gray-500 mt-1">Specify CPU, memory and GPU</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Need Help?</h4>
              <p className="text-xs text-yellow-700">
                Unsure about parameters? Check our <a href="#" className="text-yellow-800 underline">model training guide</a> or use the auto-tuning option to optimize automatically.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <MultiMethodInterface
              title="Configure Training Job"
              fields={formFields}
              getExampleCode={getTrainingExampleCode}
              onSubmit={handleSubmitTraining}
              tags={tags}
              tagInput={tagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onTagInputChange={setTagInput}
              onTagInputKeyDown={handleTagInputKeyDown}
              submitButtonText="Start Training"
              yamlInstructions="Define a training job resource in YAML format"
              cliInstructions="Use the command-line interface to start training"
              sdkInstructions="Use the Python SDK to programmatically train a model"
            />
          </div>
        </div>
      )}
    </div>
  );
} 