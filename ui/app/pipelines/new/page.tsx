"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MultiMethodInterface, { CodeExample, UIFormField } from '../../../components/MultiMethodInterface';

// --- Mock Data --- (Replace with actual data fetching)
const mockProjects = [
  { id: 'proj_1', name: 'Customer Churn Prediction' },
  { id: 'proj_2', name: 'Image Recognition Service' },
  { id: 'proj_3', name: 'Fraud Detection System' },
];

const mockRepositories: Record<string, { id: string; url: string; name: string }[]> = {
  'proj_1': [
    { id: 'repo_1a', name: 'churn-model-training', url: 'git@github.com:org/churn-model-training.git' },
    { id: 'repo_1b', name: 'feature-pipelines', url: 'git@github.com:org/feature-pipelines.git' },
  ],
  'proj_2': [
    { id: 'repo_2a', name: 'image-processing-api', url: 'git@github.com:org/image-processing-api.git' },
  ],
  'proj_3': [
    { id: 'repo_3a', name: 'fraud-detection-pipeline', url: 'git@github.com:org/fraud-detection-pipeline.git' },
  ], 
};
// --- End Mock Data ---

export default function CreatePipelinePage() {
  const router = useRouter();

  // State for Add Pipeline form
  const [projectId, setProjectId] = useState<string>('');
  const [pipelineName, setPipelineName] = useState('');
  const [pipelineDescription, setPipelineDescription] = useState('');
  const [repositoryId, setRepositoryId] = useState<string>('');
  const [revisionType, setRevisionType] = useState<string>('branch');
  const [version, setVersion] = useState<string>('main');
  const [filePath, setFilePath] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Memoize repository options based on selected project
  const availableRepositories = useMemo(() => {
    return projectId ? (mockRepositories[projectId] || []) : [];
  }, [projectId]);

  // Tag handlers (identical to dataset creation)
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
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

  // Form reset handler
  const resetForm = () => {
    setProjectId('');
    setPipelineName('');
    setPipelineDescription('');
    setRepositoryId('');
    setRevisionType('branch');
    setVersion('main');
    setFilePath('');
    setTags([]);
    setTagInput('');
  };

  // Navigate back function
  const handleCancel = () => {
    resetForm(); 
    router.push('/pipelines');
  };

  // Handle pipeline creation submission
  const handleCreatePipeline = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedRepo = availableRepositories.find(repo => repo.id === repositoryId);
    
    console.log('Creating pipeline:', {
      projectId,
      name: pipelineName,
      description: pipelineDescription,
      source: {
          repositoryId: repositoryId,
          repositoryUrl: selectedRepo?.url,
          revisionType: revisionType,
          ref: version,
          filePath: filePath,
      },
      tags
    });
    
    // --- TODO: Replace console.log with actual API call ---
    router.push('/pipelines?created=true'); 
  };

  // Generate example code snippets for pipelines
  const getExampleCode = (): CodeExample => {
    const normalizedName = pipelineName.trim() ? pipelineName : 'my-pipeline';
    const normalizedDesc = pipelineDescription.trim() ? pipelineDescription : 'Pipeline description';
    const selectedRepo = availableRepositories.find(repo => repo.id === repositoryId);
    const normalizedRepoName = selectedRepo ? selectedRepo.name : 'your-repo-name';
    const normalizedVersion = version.trim() ? version : (revisionType === 'branch' ? 'main' : (revisionType === 'tag' ? 'v1.0.0' : 'HEAD'));
    const normalizedPath = filePath.trim() ? filePath : 'pipelines/pipeline.py';
    const normalizedTags = tags.length > 0 ? tags : ['example', 'pipeline'];
    const normalizedProjectId = projectId || 'your-project-id';
    
    const yamlExample = `apiVersion: mlpie.ai/v1alpha1
kind: Pipeline
metadata:
  name: ${normalizedName.toLowerCase().replace(/\s+/g, '-')}
  project: ${normalizedProjectId}
spec:
  description: "${normalizedDesc}"
  source:
    repository: ${normalizedRepoName}
    revisionType: ${revisionType}
    ref: ${normalizedVersion}
    filePath: ${normalizedPath}
  tags:
${normalizedTags.map(tag => `  - ${tag}`).join('\n')}`;

    const cliExample = `mlpie pipeline create \\
  --project ${normalizedProjectId} \\
  --name "${normalizedName}" \\
  --description "${normalizedDesc}" \\
  --repository "${normalizedRepoName}" \\
  --revision-type ${revisionType} \\
  --ref ${normalizedVersion} \\
  --file-path "${normalizedPath}" \\
  --tags ${normalizedTags.join(',')}`;

    const sdkExample = `from mlpie import MLPieClient

client = MLPieClient()

# Create a new pipeline definition
pipeline = client.pipelines.create(
    project_id="${normalizedProjectId}",
    name="${normalizedName}",
    description="${normalizedDesc}",
    source={
        "repository": "${normalizedRepoName}",
        "revision_type": "${revisionType}",
        "ref": "${normalizedVersion}",
        "filePath": "${normalizedPath}"
    },
    tags=${JSON.stringify(normalizedTags)}
)

print(f"Created pipeline: {pipeline.name}, ID: {pipeline.id}")`;

    return { yamlExample, cliExample, sdkExample };
  };

  // Define form fields for the UI tab
  const formFields: UIFormField[] = [
    {
      id: 'project-id',
      name: 'project',
      label: 'Project',
      type: 'select',
      placeholder: 'Select a project',
      required: true,
      value: projectId,
      onChange: (value) => {
        setProjectId(value);
        setRepositoryId('');
        setRevisionType('branch');
        setVersion('main');
      },
      options: [
        { value: '', label: 'Select a project...' },
        ...mockProjects.map(p => ({ value: p.id, label: p.name }))
      ]
    },
    {
      id: 'pipeline-name',
      name: 'name',
      label: 'Pipeline Name',
      type: 'text',
      placeholder: 'e.g., customer-churn-training-pipeline',
      required: true,
      value: pipelineName,
      onChange: setPipelineName,
    },
    {
      id: 'pipeline-description',
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe the purpose of this pipeline',
      required: false,
      value: pipelineDescription,
      onChange: setPipelineDescription,
    },
    {
      id: 'repository-id',
      name: 'repository',
      label: 'Repository',
      type: 'select',
      placeholder: 'Select repository...', 
      required: true,
      value: repositoryId,
      onChange: (value) => {
          setRepositoryId(value);
          setRevisionType('branch');
          setVersion('main');
      },
      options: [
        { value: '', label: projectId ? 'Select repository...' : 'Select a project first' }, 
        ...availableRepositories.map(repo => ({ value: repo.id, label: repo.name }))
      ],
    },
    {
        id: 'revision-type',
        name: 'revisionType',
        label: 'Revision Type',
        type: 'select',
        placeholder: '',
        required: true,
        value: revisionType,
        onChange: (value) => {
            setRevisionType(value);
            if (value === 'branch') setVersion('main');
            else if (value === 'tag') setVersion('v1.0.0');
            else if (value === 'commit') setVersion('');
            else setVersion('');
        },
        options: [
            { value: 'branch', label: 'Branch' },
            { value: 'tag', label: 'Tag' },
            { value: 'commit', label: 'Commit Hash' },
        ]
    },
    {
        id: 'version',
        name: 'version',
        label: revisionType === 'commit' ? 'Commit Hash' : (revisionType === 'tag' ? 'Tag Name' : 'Branch Name'),
        type: 'text',
        placeholder: revisionType === 'commit' ? 'Enter full commit SHA' : (revisionType === 'tag' ? 'Enter tag name (e.g., v1.2.0)' : 'Enter branch name (e.g., main)'),
        required: true,
        value: version,
        onChange: setVersion,
    },
    {
      id: 'file-path',
      name: 'filePath',
      label: 'Pipeline File Path (within repo)',
      type: 'text',
      placeholder: 'e.g., src/pipelines/training.py or pipeline.yaml',
      required: true,
      value: filePath,
      onChange: setFilePath,
    }
  ];
  
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */} 
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Pipeline</h1>
          <p className="text-sm text-muted">Define a new pipeline from a source repository.</p>
        </div>
      </div>

      {/* Main form area using MultiMethodInterface */}
      <MultiMethodInterface
        fields={formFields}
        getExampleCode={getExampleCode}
        onSubmit={handleCreatePipeline}
        tags={{
          tags,
          tagInput,
          setTagInput,
          handleAddTag,
          handleRemoveTag,
          handleTagKeyDown
        }}
        yamlInstructions="Define your pipeline using a YAML manifest:"
        cliInstructions="Create your pipeline using the CLI:"
        sdkInstructions="Create your pipeline using the Python SDK:"
      />
      
      {/* Page Level Action Buttons */} 
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
            form="multi-method-interface-form"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
            disabled={!projectId || !repositoryId || !pipelineName || !revisionType || !version || !filePath}
          >
            Create Pipeline
          </button>
      </div>
    </div>
  );
} 