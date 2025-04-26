"use client";

import { useState } from "react";
import MultiMethodInterface from "../../components/MultiMethodInterface";

export default function MultiMethodDemoPage() {
  // State for form fields
  const [datasetName, setDatasetName] = useState('My Dataset');
  const [datasetDescription, setDatasetDescription] = useState('Dataset description');
  const [datasetSource, setDatasetSource] = useState('s3://example-bucket/data.csv');
  
  // State for tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Tag handling functions
  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Submit handler
  const handleCreateDataset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Dataset created: ${datasetName}\nSource: ${datasetSource}\nTags: ${tags.join(', ')}`);
    // In a real app, you would call an API here
  };

  // Generate code examples for dataset creation
  const getDatasetExampleCode = () => {
    // Format the dataset name for use in identifiers (kebab-case)
    const formattedName = datasetName.toLowerCase().replace(/\s+/g, '-');
    
    // Format tags
    const tagsString = tags.length > 0 ? tags.join(',') : 'tabular,csv';
    const tagsYaml = tags.length > 0 
      ? tags.map(tag => `    - "${tag}"`).join('\n')
      : '    - "tabular"\n    - "csv"';
    const tagsSDK = tags.length > 0 
      ? `[${tags.map(tag => `"${tag}"`).join(', ')}]`
      : '["tabular", "csv"]';

    // YAML example
    const yamlExample = `apiVersion: mlpie.ai/v1
kind: Dataset
metadata:
  name: ${formattedName}
spec:
  displayName: ${datasetName}
  description: ${datasetDescription}
  source: ${datasetSource}
  tags:
${tagsYaml}`;

    // CLI example
    const cliExample = `mlpie datasets create --name "${datasetName}" --description "${datasetDescription}" --source "${datasetSource}" --tags "${tagsString}"`;

    // SDK example
    const sdkExample = `from mlpie import MLPieClient

# Initialize client
client = MLPieClient()

# Create dataset
dataset = client.datasets.create(
    name="${datasetName}",
    description="${datasetDescription}",
    source="${datasetSource}",
    tags=${tagsSDK}
)

print(f"Created dataset with ID: {dataset.id}")`;

    return { yamlExample, cliExample, sdkExample };
  };

  // Define form fields
  const datasetFormFields = [
    {
      id: 'datasetName',
      name: 'datasetName',
      label: 'Dataset Name',
      type: 'text' as const,
      placeholder: 'e.g., Customer Transactions',
      required: true,
      value: datasetName,
      onChange: setDatasetName
    },
    {
      id: 'datasetDescription',
      name: 'datasetDescription',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'A brief description of the dataset',
      required: false,
      value: datasetDescription,
      onChange: setDatasetDescription
    },
    {
      id: 'datasetSource',
      name: 'datasetSource',
      label: 'Data Source',
      type: 'text' as const,
      placeholder: 'e.g., s3://bucket/path.csv',
      required: true,
      value: datasetSource,
      onChange: setDatasetSource
    }
  ];

  // Tag handling props
  const tagHandling = {
    tags,
    tagInput,
    setTagInput,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">MultiMethodInterface Demo</h1>
      <p className="text-gray-600 mb-8">This page demonstrates using the MultiMethodInterface component for dataset creation.</p>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-medium text-yellow-800 mb-2">Component Reuse</h2>
        <p className="text-yellow-700">
          This demonstrates how the same MultiMethodInterface component can be reused for different resource types.
          The component handles UI/YAML/CLI/SDK display patterns while you just provide the specific data and callback functions.
        </p>
      </div>
      
      <MultiMethodInterface
        title="Create New Dataset"
        fields={datasetFormFields}
        getExampleCode={getDatasetExampleCode}
        onSubmit={handleCreateDataset}
        tags={tagHandling}
        submitButtonText="Create Dataset"
        yamlInstructions="Define your dataset in YAML and apply with"
        cliInstructions="Create a dataset using the command line:"
        sdkInstructions="Create a dataset programmatically:"
      />
    </div>
  );
} 