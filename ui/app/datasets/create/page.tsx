"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import MultiMethodInterface, { CodeExample, UIFormField } from '../../../components/MultiMethodInterface'; // Adjust import path

// Define source types with their associated colors (can be moved to a shared location later)
const sourceTypeColors = {
  "PostgreSQL": { bg: "bg-blue-100", text: "text-blue-800" },
  "S3 Bucket": { bg: "bg-orange-100", text: "text-orange-800" },
  "API Import": { bg: "bg-purple-100", text: "text-purple-800" },
  "File Upload": { bg: "bg-gray-100", text: "text-gray-800" },
  "MongoDB": { bg: "bg-green-100", text: "text-green-800" },
  "BigQuery": { bg: "bg-yellow-100", text: "text-yellow-800" },
} as const;


export default function CreateDatasetPage() {
  const router = useRouter(); // Initialize router

  // State for Add Dataset form (moved from datasets/page.tsx)
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [sourceType, setSourceType] = useState('PostgreSQL');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Re-add state for connection details
  const [connectionFields, setConnectionFields] = useState<Record<string, string>>({});
  const [connectionTestResult, setConnectionTestResult] = useState<null | 'success' | 'error'>(null);

  // Handler for adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handler for removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handler for tag key press (for Enter key)
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Re-add connection field update handler
  const updateConnectionField = (field: string, value: string) => {
    setConnectionFields(prev => ({
      ...prev,
      [field]: value
    }));
    setConnectionTestResult(null); // Reset test result on field change
  };
  
  // Re-add connection test handler
  const testConnection = () => {
    setConnectionTestResult(null); // Reset previous result
    console.log('Testing connection for:', {
      sourceType,
      location,
      ...connectionFields
    });
    // Simulate API call
    setTimeout(() => {
      const result = Math.random() > 0.4 ? 'success' : 'error'; // Simulate success/failure
      setConnectionTestResult(result);
    }, 1000);
  };

  // Navigate back function (used for onCancel prop)
  const handleCancel = () => {
    resetForm(); // Call resetForm before navigating
    router.push('/datasets');
  };

  // Add resetForm function to clear all fields
  const resetForm = () => {
      setDatasetName('');
      setDatasetDescription('');
      setSourceType('PostgreSQL');
      setLocation('');
      setTags([]);
      setTagInput('');
      setConnectionFields({});
      setConnectionTestResult(null);
  };

  // Update the handleCreateDataset function (used for onSubmit prop)
  const handleCreateDataset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('Creating dataset:', {
      name: datasetName,
      description: datasetDescription,
      type: 'Source', // Hardcoded to Source
      sourceType,
      location,
      connectionDetails: connectionFields, // Add connection details
      tags
    });
    
    // --- TODO: Replace console.log with actual API call ---
    
    // After successful creation, navigate back to the datasets list
    router.push('/datasets?created=true'); // Add query param for feedback if needed
  };

  // Update getExampleCode function for Source datasets only
  const getExampleCode = (): CodeExample => {
    const normalizedName = datasetName.trim() ? datasetName : 'my-dataset';
    const normalizedDesc = datasetDescription.trim() ? datasetDescription : 'Dataset description';
    const normalizedTags = tags.length > 0 ? tags : ['example', 'dataset'];
    const locationValue = location || getDefaultLocation(sourceType);
    const connectionYaml = getConnectionYaml();
    const connectionCli = getConnectionCli();
    const connectionSdk = getConnectionSdk();
    
    // YAML example
    const yamlExample = `apiVersion: mlpie.ai/v1alpha1
kind: Dataset
metadata:
  name: ${normalizedName.toLowerCase().replace(/\s+/g, '-')}
spec:
  description: "${normalizedDesc}"
  type: "Source"
  source:
    type: ${sourceType}
    location: "${locationValue}"
${connectionYaml}
  tags:
${normalizedTags.map(tag => `    - ${tag}`).join('\n')}`;

    // CLI example
    const cliExample = `mlpie dataset create \\
  --name "${normalizedName}" \\
  --description "${normalizedDesc}" \\
  --type "Source" \\
  --source-type ${sourceType} \\
  --location "${locationValue}" \\
${connectionCli}
  --tags ${normalizedTags.join(',')}`;

    // SDK example
    const sdkExample = `from mlpie import MLPieClient

client = MLPieClient()

# Create a new source dataset
dataset = client.datasets.create(
    name="${normalizedName}",
    description="${normalizedDesc}",
    type="Source",
    source={
        "type": "${sourceType}",
        "location": "${locationValue}",
        "connection": ${connectionSdk}
    },
    tags=${JSON.stringify(normalizedTags)}
)

print(f"Created dataset: {dataset.name}, ID: {dataset.id}")`;

    return { yamlExample, cliExample, sdkExample };
  };

  // Add helper functions for connection details formatting - Only getDefaultLocation needed for now
  const getDefaultLocation = (type: string): string => {
    switch (type) {
      case 'PostgreSQL':
        return 'postgres://hostname:5432/database';
      case 'MySQL':
        return 'mysql://hostname:3306/database';
      case 'S3 Bucket':
        return 's3://bucket-name/prefix';
      case 'API Import':
        return 'https://api.example.com/data';
      case 'MongoDB':
        return 'mongodb://hostname:27017/database';
      case 'BigQuery':
        return 'project.dataset.table';
      case 'File Upload':
        return 'local://upload';
      default:
        return 'example-location';
    }
  };

  // --- Re-add Connection Details Helper Functions ---
  const getRelevantConnectionFields = (type: string): string[] => {
    switch (type) {
      case 'PostgreSQL':
      case 'MySQL':
        return ['host', 'port', 'database', 'username', 'password', 'schema', 'table'];
      case 'S3 Bucket':
        return ['region', 'bucket', 'access_key_id', 'secret_access_key'];
      case 'API Import':
        return ['api_key', 'auth_method']; // Simplified example
      case 'MongoDB':
        return ['connection_string', 'database', 'collection'];
      case 'BigQuery':
        return ['project_id', 'dataset_id', 'table_id', 'credentials_json'];
      // File Upload might not need connection details here
      case 'File Upload': return [];
      default:
        return [];
    }
  };

  const getConnectionYaml = (): string => {
    const relevantFields = getRelevantConnectionFields(sourceType);
    if (relevantFields.length === 0) return '';
    
    const lines = relevantFields
      .filter(field => connectionFields[field])
      .map(field => `      ${field}: "${connectionFields[field]}"`);
    
    return lines.length > 0 ? `    connection:\n${lines.join('\n')}` : '';
  };

  const getConnectionCli = (): string => {
    const relevantFields = getRelevantConnectionFields(sourceType);
    if (relevantFields.length === 0) return '';
    
    return relevantFields
      .filter(field => connectionFields[field])
      .map(field => `  --connection-${field.replace(/_/g, '-')} "${connectionFields[field]}" \\`)
      .join('\n');
  };

  const getConnectionSdk = (): string => {
    const relevantFields = getRelevantConnectionFields(sourceType);
    if (relevantFields.length === 0) return '{}';
    
    const validFields = relevantFields
      .filter(field => connectionFields[field])
      .reduce((acc, field) => {
        acc[field] = connectionFields[field];
        return acc;
      }, {} as Record<string, string>);
      
    if (Object.keys(validFields).length === 0) return '{}';
    
    // Pretty print JSON for SDK example
    let jsonString = JSON.stringify(validFields, null, 4);
    // Indent subsequent lines
    jsonString = jsonString.replace(/\n/g, '\n            '); 
    return jsonString;
  };
  // --- End Connection Details Helper Functions ---

  // Update the formFields definition
  const formFields: UIFormField[] = [
    {
      id: 'dataset-name',
      name: 'name',
      label: 'Dataset Name',
      type: 'text',
      placeholder: 'Enter dataset name',
      required: true,
      value: datasetName,
      onChange: setDatasetName,
    },
    {
      id: 'dataset-description',
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe the dataset purpose and contents',
      required: false,
      value: datasetDescription,
      onChange: setDatasetDescription,
    },
    {
      id: 'source-type',
      name: 'sourceType',
      label: 'Source Type',
      type: 'select' as const,
      placeholder: '',
      required: true,
      value: sourceType,
      onChange: (value: string) => {
        setSourceType(value);
        setLocation(''); // Reset location placeholder when type changes
        setConnectionFields({}); // Reset connection fields on source type change
        setConnectionTestResult(null);
      },
      options: Object.keys(sourceTypeColors).map(type => ({
        value: type,
        label: type
      }))
    },
    {
      id: 'location',
      name: 'location',
      label: 'Location',
      type: 'text' as const,
      placeholder: getDefaultLocation(sourceType),
      required: true, // Make location required for source datasets
      value: location,
      onChange: setLocation,
    }
  ];
  
  // Function to render connection fields based on source type
  const renderConnectionFields = () => {
    const fields = getRelevantConnectionFields(sourceType);
    // No connection fields? Render main actions directly after MultiMethodInterface
    const showConnectionSection = fields.length > 0;
    
    return (
      // Conditionally render the connection section wrapper
      showConnectionSection ? (
        <div className="space-y-4 border border-border rounded-lg p-4 bg-card shadow-sm mt-6"> {/* Add top margin */} 
          <h3 className="text-lg font-medium text-foreground">Connection Details</h3>
          <p className="text-sm text-muted">Provide the necessary credentials and details to connect to your data source.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
              <div key={field}>
                <label htmlFor={`conn-${field}`} className="block text-sm font-medium text-muted mb-1 capitalize">
                  {field.replace(/_/g, ' ')}
                </label>
                <input
                  type={field.includes('password') || field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                  id={`conn-${field}`}
                  value={connectionFields[field] || ''}
                  onChange={(e) => updateConnectionField(field, e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm text-sm bg-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
          
          {/* Actions within Connection Details Section */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {/* Test Connection Area (Left) */}
            <div className="flex items-center space-x-3">
               <button
                type="button"
                onClick={testConnection}
                className="px-4 py-2 border border-secondary text-secondary-foreground rounded-md hover:bg-secondary hover:text-secondary-foreground text-sm font-medium transition-colors"
              >
                Test Connection
              </button>
              {connectionTestResult && (
                <div className={`flex items-center text-xs px-3 py-1 rounded ${ connectionTestResult === 'success' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                  {connectionTestResult === 'success' ? (
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  )}
                  {connectionTestResult === 'success' ? 'Connection Successful' : 'Connection Failed'}
                </div>
              )}
            </div>
            
            {/* Main Actions Area (Right) */}
            <div className="flex space-x-3">
               <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="multi-method-interface-form" // Link button to the form inside MultiMethodInterface
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
              >
                Create Dataset
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Render only main actions if no connection fields
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border">
           <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
           <button
              type="submit"
              form="multi-method-interface-form" // Link button to the form inside MultiMethodInterface
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
            >
              Create Dataset
            </button>
        </div>
      )
    );
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Dataset</h1>
          <p className="text-sm text-muted">Define a new data source for your ML projects.</p>
        </div>
      </div>

      <MultiMethodInterface
        fields={formFields}
        getExampleCode={getExampleCode}
        onSubmit={handleCreateDataset}
        tags={{
          tags,
          tagInput,
          setTagInput,
          handleAddTag,
          handleRemoveTag,
          handleTagKeyDown
        }}
        yamlInstructions="Define your source dataset using a YAML manifest:"
        cliInstructions="Create your source dataset using the CLI:"
        sdkInstructions="Create your source dataset using the Python SDK:"
      />
      
      {/* Render Connection Fields Section & Actions */}
      {renderConnectionFields()}
    </div>
  );
} 