"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Beaker } from 'lucide-react';
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

// Helper function to format numbers
function formatNumber(value: number) {
  return value.toFixed(3);
}

export default function PromoteRunPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const experimentId = params.id;
  const experiment = getMockExperiment(experimentId);
  
  const [promotionComplete, setPromotionComplete] = useState(false);
  
  // Form state
  const [modelName, setModelName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRunId, setSelectedRunId] = useState(experiment.runs[0].id);
  const [version, setVersion] = useState('1.0.0');
  
  // Tag management
  const [tags, setTags] = useState<string[]>([...experiment.tags]);
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
  
  // Get the selected run
  const selectedRun = experiment.runs.find(run => run.id === selectedRunId) || experiment.runs[0];
  
  // Auto-generate model name based on experiment and selected run
  React.useEffect(() => {
    if (!modelName && selectedRun) {
      setModelName(`${experiment.name.replace(/\s+/g, '-').toLowerCase()}-model-v${version}`);
    }
  }, [selectedRunId, version, experiment.name, modelName, selectedRun]);
  
  // Handle form submission
  const handlePromoteRun = (formData: FormData) => {
    console.log("Promoting run to model:", formData);
    // In a real app, this would make an API call to promote the run to a model
    
    // Show success and redirect to the model detail page
    setPromotionComplete(true);
    
    // In a real app, we would redirect to the new model's detail page
    setTimeout(() => {
      router.push('/models');
    }, 2000);
  };
  
  // Generate example code based on form data
  const getPromoteExampleCode = (formData: FormData): CodeExample => {
    // Extract values from form data
    const modelName = formData.modelName || '<model-name>';
    const description = formData.description || '<description>';
    const runId = formData.selectedRunId || '<run-id>';
    const version = formData.version || '1.0.0';
    const tagsList = tags.length ? tags : ['<tag1>', '<tag2>'];
    
    // YAML example
    const yaml = `apiVersion: your-platform.com/v1alpha1
kind: Model
metadata:
  name: ${String(modelName).toLowerCase().replace(/\s+/g, '-')}
  labels:
    task-type: ${experiment.taskType}
    algorithm: ${experiment.algorithm}
    ${tagsList.map(tag => `tag-${tag.toLowerCase().replace(/\s+/g, '-')}: "true"`).join('\n    ')}
spec:
  displayName: "${modelName}"
  description: "${description}"
  version: "${version}"
  type: "${experiment.taskType}"
  framework: "${experiment.algorithm}"
  origin:
    type: "experiment-run"
    experimentId: "${experimentId}"
    runId: "${runId}"
  metrics:
    accuracy: ${selectedRun.metrics.accuracy}
    precision: ${selectedRun.metrics.precision}
    recall: ${selectedRun.metrics.recall}
    f1Score: ${selectedRun.metrics.f1Score}
  tags:
    ${tagsList.map(tag => `- "${tag}"`).join('\n    ')}`;

    // CLI example
    const cli = `your-cli model create \\
  --from-experiment-run ${runId} \\
  --name "${modelName}" \\
  --description "${description}" \\
  --version "${version}" \\
  ${tagsList.map(tag => `--tag "${tag}"`).join(' \\\n  ')}`;

    // SDK example
    const sdk = `from your_sdk import Client

client = Client()

# Get the experiment and run
experiment = client.experiments.get("${experimentId}")
run = experiment.get_run("${runId}")

# Promote run to model
model = run.promote_to_model(
    name="${modelName}",
    description="${description}",
    version="${version}",
    tags=[${tagsList.map(tag => `"${tag}"`).join(', ')}]
)

print(f"Model created: {model.id}")
print(f"Model version: {model.version}")
print(f"Model metrics: accuracy={model.metrics.get('accuracy')}")

# To register the model:
# registry = client.registries.get_default()
# registry.register(model)
`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };
  
  // Define form fields
  const formFields: UIFormField[] = [
    // Run Selection
    {
      id: 'selected-run',
      name: 'selectedRunId',
      label: 'Run to Promote',
      type: 'select' as const,
      required: true,
      value: selectedRunId,
      onChange: (value: string | number) => setSelectedRunId(String(value)),
      options: experiment.runs.map(run => ({
        value: run.id,
        label: `${run.name} (Accuracy: ${formatNumber(run.metrics.accuracy)})`
      }))
    },
    
    // Model Information
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
      placeholder: 'Describe what this model does and how it was trained',
      required: false,
      value: description,
      onChange: (value: string | number) => setDescription(String(value))
    },
    {
      id: 'version',
      name: 'version',
      label: 'Version',
      type: 'text' as const,
      placeholder: 'e.g., 1.0.0',
      required: true,
      value: version,
      onChange: (value: string | number) => setVersion(String(value))
    }
  ];
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/models/experiments/${experimentId}`} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Promote Run to Model</h1>
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
      
      {promotionComplete ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="animate-pulse mb-4">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-green-800 mb-2">Run Promoted to Model!</h2>
          <p className="text-green-700">
            Your run has been successfully promoted to a model. You will be redirected to the models page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Run Details</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Performance Metrics</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-900">Accuracy</dt>
                      <dd className="text-sm font-medium text-blue-600">{formatNumber(selectedRun.metrics.accuracy)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-900">Precision</dt>
                      <dd className="text-sm text-gray-700">{formatNumber(selectedRun.metrics.precision)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-900">Recall</dt>
                      <dd className="text-sm text-gray-700">{formatNumber(selectedRun.metrics.recall)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-900">F1 Score</dt>
                      <dd className="text-sm text-gray-700">{formatNumber(selectedRun.metrics.f1Score)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-900">AUC</dt>
                      <dd className="text-sm text-gray-700">{formatNumber(selectedRun.metrics.auc)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Hyperparameters</h4>
                  <dl className="space-y-1">
                    {Object.entries(selectedRun.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="text-sm text-gray-900">{key}</dt>
                        <dd className="text-sm text-gray-700">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="text-sm font-medium text-indigo-800 mb-2">What is Model Promotion?</h4>
              <p className="text-xs text-indigo-700">
                Promoting a run creates a registered model from your experiment's best-performing training run. This model becomes versioned, trackable, and deployable in production.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <MultiMethodInterface
              title="Configure Model Registration"
              fields={formFields}
              getExampleCode={getPromoteExampleCode}
              onSubmit={handlePromoteRun}
              tags={tags}
              tagInput={tagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onTagInputChange={setTagInput}
              onTagInputKeyDown={handleTagInputKeyDown}
              submitButtonText="Promote to Model"
              yamlInstructions="Define a model registration in YAML format"
              cliInstructions="Use the command-line interface to promote a run to a model"
              sdkInstructions="Use the Python SDK to programmatically promote a run to a model"
            />
          </div>
        </div>
      )}
    </div>
  );
} 