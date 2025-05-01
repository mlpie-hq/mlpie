"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, Beaker, Layers } from 'lucide-react';
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

export default function CreateExperimentPage() {
  const router = useRouter();
  const [experimentCreated, setExperimentCreated] = useState(false);
  
  // Form state
  const [experimentName, setExperimentName] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('classification');
  const [algorithm, setAlgorithm] = useState('');
  const [dataset, setDataset] = useState('');
  
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
  
  // Handle form submission
  const handleSubmitExperiment = (formData: FormData) => {
    console.log("Creating experiment with config:", formData);
    // In a real app, this would make an API call to create the experiment
    
    // Show success and redirect to the experiments page
    setExperimentCreated(true);
    setTimeout(() => {
      router.push('/models/experiments');
    }, 2000);
  };
  
  // Generate example code based on form data
  const getExperimentExampleCode = (formData: FormData): CodeExample => {
    // Extract values from form data
    const experimentName = formData.experimentName || '<experiment-name>';
    const description = formData.description || '<description>';
    const taskType = formData.taskType || 'classification';
    const algorithm = formData.algorithm || '<algorithm>';
    const dataset = formData.dataset || '<dataset-id>';
    const tagsList = tags.length ? tags : ['<tag1>', '<tag2>'];
    
    // YAML example
    const yaml = `apiVersion: your-platform.com/v1alpha1
kind: Experiment
metadata:
  name: ${String(experimentName).toLowerCase().replace(/\s+/g, '-')}
  labels:
    task-type: ${taskType}
    algorithm: ${algorithm}
    ${tagsList.map(tag => `tag-${tag.toLowerCase().replace(/\s+/g, '-')}: "true"`).join('\n    ')}
spec:
  displayName: "${experimentName}"
  description: "${description}"
  algorithm: ${algorithm}
  taskType: ${taskType}
  ${dataset ? `datasetId: "${dataset}"` : '# No dataset selected'}
  tags:
    ${tagsList.map(tag => `- "${tag}"`).join('\n    ')}`;

    // CLI example
    const cli = `your-cli experiment create \\
  --name "${experimentName}" \\
  --description "${description}" \\
  --task-type ${taskType} \\
  --algorithm ${algorithm} \\
  ${dataset ? `--dataset ${dataset} \\` : ''}
  ${tagsList.map(tag => `--tag "${tag}"`).join(' \\\n  ')}`;

    // SDK example
    const sdk = `from your_sdk import Client

client = Client()

# Create a new experiment
experiment = client.experiments.create(
    name="${experimentName}",
    description="${description}",
    task_type="${taskType}",
    algorithm="${algorithm}",
    ${dataset ? `dataset_id="${dataset}",` : ''}
    tags=[${tagsList.map(tag => `"${tag}"`).join(', ')}]
)

print(f"Experiment created: {experiment.id}")

# To add a run to this experiment:
# run = experiment.add_run(
#     name="First run",
#     hyperparameters={
#         "learning_rate": 0.01,
#         "max_depth": 6
#     }
# )
`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };
  
  // Define form fields
  const formFields: UIFormField[] = [
    // Basic Information Section
    {
      id: 'experiment-name',
      name: 'experimentName',
      label: 'Experiment Name',
      type: 'text' as const,
      placeholder: 'Enter a name for the experiment',
      required: true,
      value: experimentName,
      onChange: (value: string | number) => setExperimentName(String(value))
    },
    {
      id: 'experiment-description',
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Briefly describe what this experiment is for',
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
    
    // Optional Dataset Selection
    {
      id: 'dataset',
      name: 'dataset',
      label: 'Dataset (Optional)',
      type: 'select' as const,
      required: false,
      value: dataset,
      onChange: (value: string | number) => setDataset(String(value)),
      options: [
        { value: '', label: '-- Select a dataset (optional) --' },
        ...availableDatasets.map(ds => ({ 
          value: ds.id, 
          label: `${ds.name} (${ds.records.toLocaleString()} records, ${ds.size})` 
        }))
      ]
    }
  ];
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/models/experiments" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Experiment</h1>
        </div>
      </div>
      
      {experimentCreated ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="animate-pulse mb-4">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-green-800 mb-2">Experiment Created!</h2>
          <p className="text-green-700">
            Your experiment has been created successfully. You will be redirected to the experiments page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Experiment Process</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Beaker className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">1. Create Experiment</h4>
                    <p className="text-xs text-gray-500 mt-1">Define experiment metadata</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">2. Add Training Runs</h4>
                    <p className="text-xs text-gray-500 mt-1">Run multiple training jobs with different hyperparameters</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">3. Compare Results</h4>
                    <p className="text-xs text-gray-500 mt-1">Evaluate performance metrics</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">What is an Experiment?</h4>
              <p className="text-xs text-blue-700">
                An experiment is a logical grouping of model training runs with different hyperparameters, aimed at finding the optimal configuration for a specific task. Experiments help you organize, track, and compare multiple training runs.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <MultiMethodInterface
              title="Configure Experiment"
              fields={formFields}
              getExampleCode={getExperimentExampleCode}
              onSubmit={handleSubmitExperiment}
              tags={tags}
              tagInput={tagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onTagInputChange={setTagInput}
              onTagInputKeyDown={handleTagInputKeyDown}
              submitButtonText="Create Experiment"
              yamlInstructions="Define an experiment resource in YAML format"
              cliInstructions="Use the command-line interface to create an experiment"
              sdkInstructions="Use the Python SDK to programmatically create an experiment"
            />
          </div>
        </div>
      )}
    </div>
  );
} 