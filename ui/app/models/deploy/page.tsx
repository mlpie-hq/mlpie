"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Layers, Server, Workflow, Cpu } from 'lucide-react';
import Link from 'next/link';
import MultiMethodInterface, { UIFormField, CodeExample, FormData } from '@/components/MultiMethodInterface';

// Mock data for available models
const availableModels = [
  { id: "mod-001", name: "Customer Churn Predictor", version: "2.3.0", type: "Classification", framework: "XGBoost" },
  { id: "mod-002", name: "Product Recommendation Engine", version: "1.5.2", type: "Recommendation", framework: "TensorFlow" },
  { id: "mod-003", name: "Sentiment Analysis Model", version: "3.1.0", type: "NLP", framework: "PyTorch" },
  { id: "mod-004", name: "Image Classification Model", version: "2.0.1", type: "Computer Vision", framework: "Keras" },
  { id: "mod-005", name: "Price Prediction Model", version: "1.2.3", type: "Regression", framework: "Scikit-learn" }
];

// Available environments
const environments = [
  { id: "env-dev", name: "Development", cluster: "dev-cluster", namespace: "mlpie-dev" },
  { id: "env-staging", name: "Staging", cluster: "staging-cluster", namespace: "mlpie-staging" },
  { id: "env-prod", name: "Production", cluster: "prod-cluster", namespace: "mlpie-prod" },
  { id: "env-edge", name: "Edge", cluster: "edge-cluster", namespace: "mlpie-edge" }
];

export default function DeployModelPage() {
  const router = useRouter();
  const [deploymentStarted, setDeploymentStarted] = useState(false);
  
  // Form state
  const [selectedModel, setSelectedModel] = useState('');
  const [deploymentName, setDeploymentName] = useState('');
  const [environment, setEnvironment] = useState('env-dev');
  const [protocol, setProtocol] = useState('rest');
  const [replicas, setReplicas] = useState('2');
  const [cpuLimit, setCpuLimit] = useState('1');
  const [memoryLimit, setMemoryLimit] = useState('2');
  const [autoscaling, setAutoscaling] = useState('true');
  const [minReplicas, setMinReplicas] = useState('1');
  const [maxReplicas, setMaxReplicas] = useState('5');
  const [targetCPU, setTargetCPU] = useState('80');
  
  // Deployment strategy state
  const [strategy, setStrategy] = useState('rolling');
  const [canaryPercentage, setCanaryPercentage] = useState('20');
  
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
  
  // Show/hide autoscaling options
  const showAutoscalingOptions = autoscaling === 'true';
  
  // Show/hide canary percentage
  const showCanaryPercentage = strategy === 'canary';
  
  // Auto-generate deployment name based on selected model
  React.useEffect(() => {
    if (selectedModel && !deploymentName) {
      const model = availableModels.find(m => m.id === selectedModel);
      if (model) {
        const sanitizedName = model.name.toLowerCase().replace(/\s+/g, '-');
        setDeploymentName(`${sanitizedName}-deployment`);
      }
    }
  }, [selectedModel, deploymentName]);
  
  // Handle form submission
  const handleSubmitDeployment = (formData: FormData) => {
    console.log("Deploying model with config:", formData);
    // In a real app, this would make an API call to start deployment
    
    // Show success and redirect to a "deployments" page
    setDeploymentStarted(true);
    setTimeout(() => {
      router.push('/models');
    }, 2000);
  };
  
  // Generate example code based on form data
  const getDeploymentExampleCode = (formData: FormData): CodeExample => {
    // Extract values
    const modelId = formData.modelId as string || '<model-id>';
    const deploymentName = formData.deploymentName as string || '<deployment-name>';
    const environment = formData.environment as string || 'env-dev';
    const protocol = formData.protocol as string || 'rest';
    const replicas = formData.replicas as string || '2';
    const cpuLimit = formData.cpuLimit as string || '1';
    const memoryLimit = formData.memoryLimit as string || '2';
    const autoscaling = formData.autoscaling as string || 'true';
    const minReplicas = autoscaling === 'true' ? (formData.minReplicas as string || '1') : replicas;
    const maxReplicas = autoscaling === 'true' ? (formData.maxReplicas as string || '5') : replicas;
    const targetCPU = formData.targetCPU as string || '80';
    const strategy = formData.strategy as string || 'rolling';
    const canaryPercentage = formData.canaryPercentage as string || '20';
    
    const selectedEnv = environments.find(env => env.id === environment) || environments[0];
    const tagsList = tags.length ? tags : ['<tag1>', '<tag2>'];
    
    // Get model details
    const model = availableModels.find(m => m.id === modelId) || {
      id: modelId,
      name: '<model-name>',
      version: '<version>',
      type: '<type>',
      framework: '<framework>'
    };
    
    // YAML example
    const yaml = `apiVersion: your-platform.com/v1alpha1
kind: ModelDeployment
metadata:
  name: ${deploymentName}
  namespace: ${selectedEnv.namespace}
  labels:
    environment: ${selectedEnv.name.toLowerCase()}
    protocol: ${protocol}
    model-id: ${model.id}
    ${tagsList.map(tag => `tag-${tag.toLowerCase().replace(/\s+/g, '-')}: "true"`).join('\n    ')}
spec:
  modelRef:
    name: ${model.name}
    version: ${model.version}
    id: ${model.id}
  serving:
    protocol: ${protocol}
    replicas: ${replicas}
    resources:
      limits:
        cpu: "${cpuLimit}"
        memory: "${memoryLimit}Gi"
      requests:
        cpu: "0.5"
        memory: "1Gi"
    ${autoscaling === 'true' ? `autoscaling:
      enabled: true
      minReplicas: ${minReplicas}
      maxReplicas: ${maxReplicas}
      targetCPUUtilizationPercentage: ${targetCPU}` 
      : '# Autoscaling disabled'}
  deploymentStrategy:
    type: ${strategy}
    ${strategy === 'canary' ? `canaryPercentage: ${canaryPercentage}` : '# Using rolling update strategy'}
  tags:
    ${tagsList.map(tag => `- "${tag}"`).join('\n    ')}`;

    // CLI example
    const cli = `your-cli model deploy \\
  --model-id ${model.id} \\
  --name "${deploymentName}" \\
  --environment ${selectedEnv.id} \\
  --protocol ${protocol} \\
  --replicas ${replicas} \\
  --cpu ${cpuLimit} \\
  --memory ${memoryLimit} \\
  --strategy ${strategy} \\
  ${strategy === 'canary' ? `--canary-percentage ${canaryPercentage} \\` : ''}
  ${autoscaling === 'true' 
    ? `--autoscaling enabled \\
  --min-replicas ${minReplicas} \\
  --max-replicas ${maxReplicas} \\
  --target-cpu ${targetCPU} \\` 
    : '--autoscaling disabled \\'}
  ${tagsList.map(tag => `--tag "${tag}"`).join(' \\\n  ')}`;

    // SDK example
    const sdk = `from your_sdk import Client

client = Client()

# Get model and environment
model = client.models.get("${model.id}")
environment = client.environments.get("${selectedEnv.id}")

# Define deployment configuration
deployment = client.deployments.create(
    name="${deploymentName}",
    model=model,
    environment=environment,
    protocol="${protocol}",
    replicas=${replicas},
    resources={
        "cpu": ${cpuLimit},
        "memory": ${memoryLimit}
    },
    ${autoscaling === 'true' 
      ? `autoscaling={
        "enabled": True,
        "min_replicas": ${minReplicas},
        "max_replicas": ${maxReplicas},
        "target_cpu": ${targetCPU}
    },` 
      : '"autoscaling": { "enabled": False },'}
    deployment_strategy={
        "type": "${strategy}"${strategy === 'canary' ? `,
        "canary_percentage": ${canaryPercentage}` : ''}
    },
    tags=[${tagsList.map(tag => `"${tag}"`).join(', ')}]
)

# Start the deployment
result = deployment.start()
print(f"Deployment started: {result.endpoint_url}")
`;

    return { yamlExample: yaml, cliExample: cli, sdkExample: sdk };
  };
  
  // Define form fields
  const formFields: UIFormField[] = [
    // Model Selection Section
    {
      id: 'model-id',
      name: 'modelId',
      label: 'Model',
      type: 'select' as const,
      required: true,
      value: selectedModel,
      onChange: (value: string | number) => setSelectedModel(String(value)),
      options: availableModels.map(model => ({ 
        value: model.id, 
        label: `${model.name} (v${model.version}, ${model.framework})` 
      }))
    },
    {
      id: 'deployment-name',
      name: 'deploymentName',
      label: 'Deployment Name',
      type: 'text' as const,
      placeholder: 'Enter a name for this deployment',
      required: true,
      value: deploymentName,
      onChange: (value: string | number) => setDeploymentName(String(value))
    },
    
    // Target Environment Section
    {
      id: 'environment',
      name: 'environment',
      label: 'Environment',
      type: 'select' as const,
      required: true,
      value: environment,
      onChange: (value: string | number) => setEnvironment(String(value)),
      options: environments.map(env => ({ 
        value: env.id, 
        label: `${env.name} (${env.cluster})` 
      }))
    },
    {
      id: 'protocol',
      name: 'protocol',
      label: 'Serving Protocol',
      type: 'select' as const,
      required: true,
      value: protocol,
      onChange: (value: string | number) => setProtocol(String(value)),
      options: [
        { value: 'rest', label: 'REST API' },
        { value: 'grpc', label: 'gRPC' },
        { value: 'mqtt', label: 'MQTT (for Edge deployment)' }
      ]
    },
    
    // Resource Allocation Section
    {
      id: 'replicas',
      name: 'replicas',
      label: 'Replicas',
      type: 'select' as const,
      required: true,
      value: replicas,
      onChange: (value: string | number) => setReplicas(String(value)),
      options: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '5', label: '5' },
        { value: '10', label: '10' }
      ]
    },
    {
      id: 'cpu-limit',
      name: 'cpuLimit',
      label: 'CPU Limit (cores)',
      type: 'select' as const,
      required: true,
      value: cpuLimit,
      onChange: (value: string | number) => setCpuLimit(String(value)),
      options: [
        { value: '0.5', label: '0.5 cores' },
        { value: '1', label: '1 core' },
        { value: '2', label: '2 cores' },
        { value: '4', label: '4 cores' }
      ]
    },
    {
      id: 'memory-limit',
      name: 'memoryLimit',
      label: 'Memory Limit (GB)',
      type: 'select' as const,
      required: true,
      value: memoryLimit,
      onChange: (value: string | number) => setMemoryLimit(String(value)),
      options: [
        { value: '1', label: '1 GB' },
        { value: '2', label: '2 GB' },
        { value: '4', label: '4 GB' },
        { value: '8', label: '8 GB' }
      ]
    },
    
    // Autoscaling Section
    {
      id: 'autoscaling',
      name: 'autoscaling',
      label: 'Enable Autoscaling',
      type: 'select' as const,
      required: true,
      value: autoscaling,
      onChange: (value: string | number) => setAutoscaling(String(value)),
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    },
    ...(showAutoscalingOptions ? [
      {
        id: 'min-replicas',
        name: 'minReplicas',
        label: 'Min Replicas',
        type: 'select' as const,
        required: autoscaling === 'true',
        value: minReplicas,
        onChange: (value: string | number) => setMinReplicas(String(value)),
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' }
        ]
      },
      {
        id: 'max-replicas',
        name: 'maxReplicas',
        label: 'Max Replicas',
        type: 'select' as const,
        required: autoscaling === 'true',
        value: maxReplicas,
        onChange: (value: string | number) => setMaxReplicas(String(value)),
        options: [
          { value: '3', label: '3' },
          { value: '5', label: '5' },
          { value: '10', label: '10' },
          { value: '20', label: '20' }
        ]
      },
      {
        id: 'target-cpu',
        name: 'targetCPU',
        label: 'Target CPU Utilization (%)',
        type: 'select' as const,
        required: autoscaling === 'true',
        value: targetCPU,
        onChange: (value: string | number) => setTargetCPU(String(value)),
        options: [
          { value: '50', label: '50%' },
          { value: '70', label: '70%' },
          { value: '80', label: '80%' },
          { value: '90', label: '90%' }
        ]
      }
    ] : []),
    
    // Deployment Strategy
    {
      id: 'strategy',
      name: 'strategy',
      label: 'Deployment Strategy',
      type: 'select' as const,
      required: true,
      value: strategy,
      onChange: (value: string | number) => setStrategy(String(value)),
      options: [
        { value: 'rolling', label: 'Rolling Update' },
        { value: 'canary', label: 'Canary Deployment' },
        { value: 'blue-green', label: 'Blue/Green Deployment' }
      ]
    },
    ...(showCanaryPercentage ? [
      {
        id: 'canary-percentage',
        name: 'canaryPercentage',
        label: 'Canary Percentage (%)',
        type: 'select' as const,
        required: strategy === 'canary',
        value: canaryPercentage,
        onChange: (value: string | number) => setCanaryPercentage(String(value)),
        options: [
          { value: '10', label: '10%' },
          { value: '20', label: '20%' },
          { value: '30', label: '30%' },
          { value: '50', label: '50%' }
        ]
      }
    ] : [])
  ];
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/models" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Deploy Model</h1>
        </div>
      </div>
      
      {deploymentStarted ? (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="animate-pulse mb-4">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-medium text-green-800 mb-2">Deployment Started!</h2>
          <p className="text-green-700">
            Your model deployment has been submitted successfully. You will be redirected to the models page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deployment Process</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">1. Select Model</h4>
                    <p className="text-xs text-gray-500 mt-1">Choose a trained model to deploy</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Server className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">2. Choose Environment</h4>
                    <p className="text-xs text-gray-500 mt-1">Select deployment target</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">3. Configure Protocol</h4>
                    <p className="text-xs text-gray-500 mt-1">Set up API access</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">4. Set Deployment Strategy</h4>
                    <p className="text-xs text-gray-500 mt-1">How the model will be updated</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mt-1 shrink-0 bg-blue-100 p-1.5 rounded-full text-blue-600">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">5. Allocate Resources</h4>
                    <p className="text-xs text-gray-500 mt-1">Configure compute resources</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Environment Info</h4>
              <p className="text-xs text-blue-700">
                <span className="font-medium">Development:</span> For testing and development<br />
                <span className="font-medium">Staging:</span> Pre-production validation<br />
                <span className="font-medium">Production:</span> Live, customer-facing deployment<br />
                <span className="font-medium">Edge:</span> For IoT and on-device deployment
              </p>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <MultiMethodInterface
              title="Configure Model Deployment"
              fields={formFields}
              getExampleCode={getDeploymentExampleCode}
              onSubmit={handleSubmitDeployment}
              tags={tags}
              tagInput={tagInput}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onTagInputChange={setTagInput}
              onTagInputKeyDown={handleTagInputKeyDown}
              submitButtonText="Deploy Model"
              yamlInstructions="Define a model deployment resource in YAML format"
              cliInstructions="Use the command-line interface to deploy a model"
              sdkInstructions="Use the Python SDK to programmatically deploy a model"
            />
          </div>
        </div>
      )}
    </div>
  );
} 