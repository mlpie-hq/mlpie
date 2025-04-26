"use client";

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, ExternalLink, GitBranch, Workflow, Database, Info } from "lucide-react";
import ReactFlow, { 
    Controls, 
    Background, 
    MiniMap, 
    useNodesState, 
    useEdgesState, 
    addEdge, 
    Position, 
    MarkerType,
    Node,
    Edge,
    Connection
} from 'reactflow';
import 'reactflow/dist/style.css';

// --- Type Definitions ---
interface Pipeline {
  id: string;
  name: string;
}

interface LineageInput {
  datasetId: string;
  version: string;
}

interface LineageDetails {
  sourceType?: string;
  location?: string;
  table?: string;
  description?: string;
}

interface LineageInfo {
  type: string; // e.g., "Source Origin", "Transformation"
  createdBy: string; // e.g., "Direct Ingestion", "Pipeline"
  pipelineId?: string;
  pipelineRunId?: string;
  jobName?: string;
  inputs?: LineageInput[];
  details?: LineageDetails;
}

// Added specific types for Dataset properties
interface SourceMetadata {
  database?: string;
  table?: string;
  schema?: string;
  region?: string;
  prefix?: string;
  fileTypes?: string;
  endpoint?: string;
  filters?: string;
  auth?: string;
  format?: string;
  uploaded?: string;
  encoding?: string;
  pipelineId?: string;
  sourceDataset?: string;
}

interface SourceInfo {
  type: string; // Consider using a union type if known values
  location: string;
  lastSync: string;
  metadata: SourceMetadata;
  canSync: boolean;
}

interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
}

interface UsageInfo {
  id: string;
  name: string;
  type: string; // e.g., "Classification", "ETL"
  lastRun: string;
}

interface HistoryEntry {
  version: string;
  date: string;
  changes: string;
}

interface StatsDistribution {
  gender?: Record<string, number>;
  ageBrackets?: Record<string, number>;
  resolution?: Record<string, number>;
  fileType?: Record<string, number>;
  usage?: Array<{ month: string; value: number }>;
}

interface StatsInfo {
  quality: number;
  completeness: number;
  uniqueness: number;
  consistency: number;
  distribution: StatsDistribution;
}

interface Dataset {
  id: string;
  name: string;
  description?: string;
  lastUpdated?: string;
  status?: string;
  type: "Source" | "Derived";
  sourceDatasetIds?: string[];
  rows?: number;
  size?: string;
  tags?: string[];
  version: string;
  source?: SourceInfo; // Use specific type
  schema?: SchemaField[]; // Use specific type
  usedIn?: UsageInfo[]; // Use specific type
  history?: HistoryEntry[]; // Use specific type
  stats?: StatsInfo; // Use specific type
  lineage?: LineageInfo;
}

interface DatasetNodeData {
  id: string;
  label: string;
  version: string;
}

interface StepNodeData {
  label: string;
  pipelineId?: string;
  pipelineName?: string;
}
// --- End Type Definitions ---

// Source type colors (reused from datasets page)
const sourceTypeColors = {
  "PostgreSQL": { bg: "bg-blue-100", text: "text-blue-800" },
  "S3 Bucket": { bg: "bg-orange-100", text: "text-orange-800" },
  "API Import": { bg: "bg-purple-100", text: "text-purple-800" },
  "File Upload": { bg: "bg-gray-100", text: "text-gray-800" },
  "MongoDB": { bg: "bg-green-100", text: "text-green-800" },
  "BigQuery": { bg: "bg-yellow-100", text: "text-yellow-800" },
} as const;

// Mock Pipeline Data
const mockPipelines: Pipeline[] = [
  { id: "p1", name: "Customer Enrichment Pipeline" },
  { id: "p2", name: "Image Augmentation Pipeline" },
  { id: "p3", name: "NLP Preprocessing Pipeline" }
];

// Mock dataset for this demo (in a real app, this would come from an API)
const mockDatasets: Dataset[] = [
  {
    id: "1",
    name: "Customer Demographics",
    description: "Cleaned customer demographic data with 25+ attributes for personalization and segmentation analysis.",
    lastUpdated: "1 hour ago",
    status: "Ready",
    type: "Source" as const,
    rows: 125000,
    size: "48 MB",
    tags: ["customers", "demographics", "production"],
    version: "2.1.0",
    source: {
      type: "PostgreSQL" as const,
      location: "analytics-db.mlpie.ai",
      lastSync: "30 minutes ago",
      metadata: {
        database: "customer_analytics",
        table: "user_demographics",
        schema: "public"
      },
      canSync: true
    },
    schema: [
      { name: "user_id", type: "UUID", nullable: false, description: "Unique identifier for each customer" },
      { name: "age", type: "INT", nullable: true, description: "Customer age in years" },
      { name: "gender", type: "VARCHAR(20)", nullable: true, description: "Self-identified gender" },
      { name: "income_bracket", type: "VARCHAR(20)", nullable: true, description: "Income category" },
      { name: "location", type: "VARCHAR(100)", nullable: true, description: "Geographic location" },
      { name: "signup_date", type: "TIMESTAMP", nullable: false, description: "Date customer joined" },
      { name: "last_purchase", type: "TIMESTAMP", nullable: true, description: "Date of most recent purchase" },
    ],
    usedIn: [
      { id: "m1", name: "Customer Churn Predictor", type: "Classification", lastRun: "2 days ago" },
      { id: "m2", name: "Product Recommendation Engine", type: "Recommendation", lastRun: "5 hours ago" },
      { id: "p1", name: "Customer Segmentation Pipeline", type: "ETL", lastRun: "1 day ago" }
    ],
    history: [
      { version: "2.1.0", date: "2023-07-20", changes: "Added income_bracket column and updated 15% of user records" },
      { version: "2.0.0", date: "2023-06-15", changes: "Complete data refresh with improved data quality" },
      { version: "1.5.0", date: "2023-05-10", changes: "Added location data for 90% of users" }
    ],
    stats: {
      quality: 92,
      completeness: 97,
      uniqueness: 88,
      consistency: 94,
      distribution: {
        gender: { 'Male': 48, 'Female': 46, 'Other': 3, 'Prefer not to say': 3 },
        ageBrackets: {
          '18-24': 14,
          '25-34': 28,
          '35-44': 24,
          '45-54': 18,
          '55-64': 10,
          '65+': 6
        },
        usage: [
          { month: 'Jan', value: 32 },
          { month: 'Feb', value: 40 },
          { month: 'Mar', value: 35 },
          { month: 'Apr', value: 50 },
          { month: 'May', value: 58 },
          { month: 'Jun', value: 65 },
          { month: 'Jul', value: 72 },
          { month: 'Aug', value: 80 },
          { month: 'Sep', value: 95 },
          { month: 'Oct', value: 115 },
          { month: 'Nov', value: 125 },
          { month: 'Dec', value: 132 }
        ]
      }
    },
    lineage: {
      type: "Source Origin",
      createdBy: "Direct Ingestion",
      details: {
        sourceType: "PostgreSQL",
        location: "analytics-db.mlpie.ai",
        table: "user_demographics"
      }
    }
  },
  {
    id: "2",
    name: "Product Images",
    description: "High-resolution product images dataset with multiple angles and lighting conditions for training visual models.",
    lastUpdated: "2 days ago",
    status: "Processing",
    type: "Derived" as const,
    sourceDatasetIds: ["1"],
    rows: 15700,
    size: "5.2 GB",
    tags: ["images", "products", "retail"],
    version: "1.3.2",
    source: {
      type: "S3 Bucket" as const,
      location: "s3://mlpie-datasets/retail/images",
      lastSync: "2 days ago",
      metadata: {
        region: "us-west-2",
        prefix: "/retail/images",
        fileTypes: "jpg, png"
      },
      canSync: true
    },
    schema: [
      { name: "image_id", type: "UUID", nullable: false, description: "Unique identifier for each image" },
      { name: "product_id", type: "UUID", nullable: false, description: "Associated product ID" },
      { name: "angle", type: "VARCHAR(20)", nullable: true, description: "Camera angle (front, side, etc.)" },
      { name: "resolution", type: "VARCHAR(20)", nullable: false, description: "Image resolution" },
      { name: "file_path", type: "VARCHAR(255)", nullable: false, description: "Path to image file" },
      { name: "created_date", type: "TIMESTAMP", nullable: false, description: "Date image was created" }
    ],
    usedIn: [
      { id: "m3", name: "Product Image Classifier", type: "Image Classification", lastRun: "3 days ago" },
      { id: "m4", name: "Visual Search Model", type: "Similarity Search", lastRun: "1 week ago" }
    ],
    history: [
      { version: "1.3.2", date: "2023-07-15", changes: "Added 2,000 new product images with consistent lighting" },
      { version: "1.2.0", date: "2023-06-01", changes: "Updated metadata to include better angle descriptions" },
      { version: "1.0.0", date: "2023-05-01", changes: "Initial dataset creation" }
    ],
    stats: {
      quality: 89,
      completeness: 95,
      uniqueness: 98,
      consistency: 91,
      distribution: {
        resolution: { 'HD': 58, '4K': 32, '8K': 10 },
        fileType: { 'JPG': 65, 'PNG': 30, 'TIFF': 5 },
        usage: [
          { month: 'Jan', value: 15 },
          { month: 'Feb', value: 18 },
          { month: 'Mar', value: 22 },
          { month: 'Apr', value: 24 },
          { month: 'May', value: 27 },
          { month: 'Jun', value: 32 },
          { month: 'Jul', value: 38 },
          { month: 'Aug', value: 42 },
          { month: 'Sep', value: 45 },
          { month: 'Oct', value: 48 },
          { month: 'Nov', value: 52 },
          { month: 'Dec', value: 60 }
        ]
      }
    },
    lineage: {
      type: "Transformation",
      createdBy: "Pipeline",
      pipelineId: "p2",
      jobName: "augment-images-v2",
      inputs: [
        { datasetId: "1", version: "2.0.0" }
      ],
      details: {
        description: "Generated augmented images based on customer segments."
      }
    }
  },
  {
    id: "support-tickets-raw",
    name: "Support Tickets",
    type: "Source" as const,
    version: "3.0.0-beta",
    lineage: { type: "Source Origin", createdBy: "Direct Ingestion", details: { sourceType: "API Import", /*...*/ } }
  },
  {
    id: "3",
    name: "Sentiment Scores",
    type: "Derived" as const,
    version: "1.0.0",
    sourceDatasetIds: ["support-tickets-raw"],
    tags: ["nlp", "sentiment", "derived"],
    rows: 87420,
    size: "12 MB",
    status: "Ready",
    lastUpdated: "3 hours ago",
    lineage: {
      type: "Transformation",
      createdBy: "Pipeline",
      pipelineId: "p3",
      jobName: "calculate-sentiment",
      inputs: [{ datasetId: "support-tickets-raw", version: "3.0.0-beta" }],
      details: { description: "Calculated sentiment scores for support tickets." }
    }
  },
  {
    id: "4",
    name: "Enriched Customer Data",
    type: "Derived" as const,
    version: "1.0.0",
    sourceDatasetIds: ["1", "3"],
    tags: ["customers", "enriched", "derived"],
    rows: 125000,
    size: "55 MB",
    status: "Ready",
    lastUpdated: "1 hour ago",
    lineage: {
      type: "Transformation",
      createdBy: "Pipeline",
      pipelineId: "p1",
      jobName: "join-customer-sentiment",
      inputs: [
        { datasetId: "1", version: "2.1.0" },
        { datasetId: "3", version: "1.0.0" }
      ],
      details: { description: "Joined customer demographics with sentiment scores." }
    }
  }
];

// Simple bar chart component
function BarChart({ data, title, className }: { data: Record<string, number>, title?: string, className?: string }) {
  const maxValue = Math.max(...Object.values(data));
  
  return (
    <div className={`${className || ''}`}>
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>{key}</span>
              <span className="text-muted">{value}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${(value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Line chart component for time series data
function LineChart({ data, title, className }: { 
  data: Array<{ month: string, value: number }>, 
  title?: string, 
  className?: string 
}) {
  const maxValue = Math.max(...data.map(item => item.value));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value / maxValue) * 100);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className={`${className || ''}`}>
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <div className="relative h-40 w-full">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line 
              key={y} 
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="#e2e8f0" 
              strokeWidth="0.5" 
            />
          ))}
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2"
            points={points}
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((item.value / maxValue) * 100);
            return (
              <circle 
                key={index} 
                cx={x} 
                cy={y} 
                r="1.5" 
                fill="#4f46e5" 
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-1 text-xs text-muted">
          {data.filter((_, index) => index % 3 === 0 || index === data.length - 1).map((item, index) => (
            <div key={index}>{item.month}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Gauge chart component for data quality metrics
function GaugeChart({ value, title, className }: { value: number, title: string, className?: string }) {
  // Calculate colors based on value
  let color = '#4f46e5'; // primary
  if (value < 70) color = '#ef4444'; // red
  else if (value < 80) color = '#f59e0b'; // amber
  else if (value < 90) color = '#10b981'; // green
  
  // Calculate angle for gauge
  const angle = (value / 100) * 180;
  
  return (
    <div className={`text-center ${className || ''}`}>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <div className="relative w-20 h-10 mx-auto">
        {/* Gauge background */}
        <div className="absolute inset-0 bg-secondary rounded-t-full"></div>
        
        {/* Colored gauge */}
        <div 
          className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-full"
          style={{ 
            height: '100%',
            clipPath: `path('M 0,20 L 20,20 A 10 10 0 ${angle > 90 ? 1 : 0} 1 ${10 + 10 * Math.cos(angle * Math.PI / 180)},${10 - 10 * Math.sin(angle * Math.PI / 180)} L 20,20 L 0,20 Z')` 
          }}
        >
          <div className="absolute inset-0 rounded-t-full" style={{ backgroundColor: color }}></div>
        </div>
        
        {/* Gauge center point */}
        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-foreground rounded-full -translate-x-1/2"></div>
      </div>
      <div className="mt-1 text-2xl font-bold" style={{ color: color }}>{value}%</div>
    </div>
  );
}

// Donut chart component
function DonutChart({ data, title, className }: { 
  data: Record<string, number>, 
  title?: string, 
  className?: string 
}) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  let startAngle = 0;
  
  // Define colors for each segment
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6b21a8', '#1e40af'];
  
  return (
    <div className={`${className || ''}`}>
      {title && <h4 className="text-sm font-medium mb-2">{title}</h4>}
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Donut segments */}
          {Object.entries(data).map(([key, value], index) => {
            const percentage = (value / total) * 100;
            const angle = (percentage / 100) * 360;
            const endAngle = startAngle + angle;
            
            // Calculate SVG arc path
            const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
            const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
            
            // Determine if the arc is more than 180 degrees
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            // Create arc path
            const path = `
              M 50 50
              L ${x1} ${y1}
              A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            // Update the angle for the next segment
            startAngle = endAngle;
            
            return (
              <path 
                key={key} 
                d={path} 
                fill={colors[index % colors.length]} 
              />
            );
          })}
          
          {/* Donut hole */}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        {Object.entries(data).map(([key, value], index) => (
          <div key={key} className="flex items-center">
            <div 
              className="w-3 h-3 mr-1 rounded-sm" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span>{key}</span>
            <span className="ml-auto text-muted">{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'ready':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function for Dataset Type styling
const getDatasetTypeClasses = (type: string) => {
  if (type === "Source") {
    return "bg-green-100 text-green-800 border border-green-300";
  } else if (type === "Derived") {
    return "bg-purple-100 text-purple-800 border border-purple-300";
  }
  return "bg-gray-100 text-gray-800 border border-gray-300"; // Fallback
};

// --- React Flow Graph Component --- 

// Custom Node Types (Use specific data types)
const DatasetNode = ({ data }: { data: DatasetNodeData }) => (
  <div className="p-2 border border-blue-300 rounded bg-blue-50 shadow-sm text-xs"><Link href={`/datasets/${data.id}`} className="font-medium text-blue-700 hover:underline"><Database className="w-3 h-3 inline-block mr-1" /> {data.label}</Link><div className="text-blue-600">(v{data.version})</div></div>
);

const StepNode = ({ data }: { data: StepNodeData }) => (
  <div className="p-2 border border-purple-300 rounded bg-purple-50 shadow-sm text-xs"><Link href={`/pipelines/${data.pipelineId}/steps/${data.label}`} className="font-medium text-purple-700 hover:underline"><Workflow className="w-3 h-3 inline-block mr-1" /> {data.label}</Link><div className="text-purple-600">(Pipeline: {data.pipelineName})</div></div>
);

const nodeTypes = { dataset: DatasetNode, step: StepNode };

function DatasetLineageGraph({ currentDataset, allDatasets, allPipelines }: { 
    currentDataset: Dataset; 
    allDatasets: Dataset[]; 
    allPipelines: Pipeline[]; 
}) {

  const initialNodes = useMemo(() => {
    const nodes: Node<DatasetNodeData | StepNodeData>[] = [];
    const position = { x: 250, y: 150 };
    const parentPosition = { x: 50, y: 50 };
    const inputPosition = { x: 50, y: 250 };
    let inputYOffset = 0;

    // 1. Current Dataset Node
    nodes.push({
      id: currentDataset.id,
      type: 'dataset',
      data: { id: currentDataset.id, label: currentDataset.name, version: currentDataset.version },
      position,
      sourcePosition: Position.Left,
      targetPosition: Position.Right,
      style: { fontWeight: 'bold', border: '2px solid #2563eb' }
    });

    // 2. If Derived, add the generating Step Node and Input Dataset Nodes
    if (currentDataset.type === 'Derived' && currentDataset.lineage?.inputs) {
        const pipeline = allPipelines.find(p => p.id === currentDataset.lineage!.pipelineId);
        const stepId = `${currentDataset.lineage.pipelineId}-${currentDataset.lineage.jobName || 'step'}`;

        // Step Node
        nodes.push({
            id: stepId,
            type: 'step',
            data: { 
                label: currentDataset.lineage.jobName || 'Unknown Step', 
                pipelineId: currentDataset.lineage.pipelineId,
                pipelineName: pipeline?.name || 'Unknown Pipeline'
            },
            position: parentPosition, 
            sourcePosition: Position.Right,
            targetPosition: Position.Left   
        });

        // Input Dataset Nodes (Use LineageInput type here)
        currentDataset.lineage.inputs.forEach((input: LineageInput) => {
            const inputDs = allDatasets.find(d => d.id === input.datasetId);
            nodes.push({
                id: input.datasetId,
                type: 'dataset',
                data: { 
                    id: input.datasetId,
                    label: inputDs?.name || input.datasetId, 
                    version: input.version 
                },
                position: { x: inputPosition.x, y: inputPosition.y + inputYOffset },
                sourcePosition: Position.Right 
            });
            inputYOffset += 100;
        });
    }
    
    return nodes;
  }, [currentDataset, allDatasets, allPipelines]);

  const initialEdges = useMemo(() => {
      const edges: Edge[] = [];
      if (currentDataset.type === 'Derived' && currentDataset.lineage?.inputs) {
        const stepId = `${currentDataset.lineage.pipelineId}-${currentDataset.lineage.jobName || 'step'}`;
        
        edges.push({ 
            id: `e-${stepId}-to-${currentDataset.id}`,
            source: stepId, 
            target: currentDataset.id, 
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true
        });

        // Use LineageInput type here
        currentDataset.lineage.inputs.forEach((input: LineageInput) => {
             edges.push({ 
                id: `e-${input.datasetId}-to-${stepId}`,
                source: input.datasetId, 
                target: stepId, 
                markerEnd: { type: MarkerType.ArrowClosed }
            });
        });
      }
      return edges;
  }, [currentDataset]);

  // Ignore setNodes unused warning, keep setEdges for onConnect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes); 
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  return (
    <div style={{ height: '400px' }} className="border rounded-md overflow-hidden bg-secondary/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

// --- End React Flow Component ---

export default function DatasetDetail() {
  const params = useParams();
  const datasetId = params.id as string;
  
  // Use Dataset type
  const dataset = mockDatasets.find(d => d.id === datasetId);
  
  // Tabs for dataset details
  const [activeTab, setActiveTab] = useState('overview');
  
  // If dataset not found
  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Dataset Not Found</h2>
        <p className="text-muted mb-4">The dataset you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link 
          href="/datasets" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
        >
          Return to Datasets
        </Link>
      </div>
    );
  }

  // Define a default style for source types if undefined
  const defaultSourceStyle = { bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <div className="space-y-6">
      {/* Dataset header */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-1"> {/* Wrap title and type */}
              <h1 className="text-2xl font-semibold">{dataset.name}</h1>
              {dataset.type && ( // Display dataset type badge
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getDatasetTypeClasses(dataset.type)}`}
                >
                  {dataset.type}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-muted mr-2">Version {dataset.version}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(dataset.status ?? '')}`}
              >
                {dataset.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{dataset.description}</p>
          </div>
          
          <div className="flex space-x-2">
            <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md flex items-center text-sm">
              <Download className="w-4 h-4 mr-1.5" />
              Download
            </button>
            <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md flex items-center text-sm">
              <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md flex items-center text-sm">
              <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Analyze
            </button>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(dataset.tags ?? []).map((tag, index) => (
            <span 
              key={index} 
              className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 text-sm font-medium relative ${
              activeTab === 'overview' 
                ? 'text-foreground' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-2 px-1 text-sm font-medium relative ${
              activeTab === 'schema' 
                ? 'text-foreground' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Schema
            {activeTab === 'schema' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-2 px-1 text-sm font-medium relative ${
              activeTab === 'usage' 
                ? 'text-foreground' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Usage & Models
            {activeTab === 'usage' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('lineage')}
            className={`py-2 px-1 text-sm font-medium relative ${
              activeTab === 'lineage' 
                ? 'text-foreground' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Lineage
            {activeTab === 'lineage' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 text-sm font-medium relative ${
              activeTab === 'history' 
                ? 'text-foreground' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Version History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
            )}
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Dataset Details */}
            <div className="col-span-2 space-y-6">
              {/* Key Info Card */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <h3 className="text-lg font-medium mb-4">Dataset Information</h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <div className="text-muted mb-1">Type</div>
                    <div className="font-medium">{dataset.type || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Size</div>
                    <div className="font-medium">{dataset.size}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Records</div>
                    <div className="font-medium">{dataset.rows?.toLocaleString() ?? 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Last Updated</div>
                    <div className="font-medium">{dataset.lastUpdated}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Status</div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(dataset.status ?? '')}`}
                    >
                      {dataset.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Version</div>
                    <div className="font-medium">{dataset.version}</div>
                  </div>
                  {/* Source Dataset Links (Conditional) - Updated map */}
                  {dataset.type === 'Derived' && dataset.sourceDatasetIds && dataset.sourceDatasetIds.length > 0 && (
                    <div className="col-span-2 mt-2">
                      <div className="text-muted mb-1">Derived From</div>
                      <div className="flex flex-wrap gap-2">
                        {dataset.sourceDatasetIds.map((sourceId: string) => {
                          const sourceName = mockDatasets.find(d => d.id === sourceId)?.name;
                          return sourceName ? (
                            <Link
                              key={sourceId}
                              href={`/datasets/${sourceId}`}
                              className="text-primary hover:underline flex items-center text-sm bg-primary/10 px-2 py-1 rounded"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              {sourceName}
                            </Link>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Data Quality Card - NEW */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <h3 className="text-lg font-medium mb-4">Data Quality Assessment</h3>
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <GaugeChart value={dataset.stats?.quality ?? 0} title="Overall Quality" />
                  <GaugeChart value={dataset.stats?.completeness ?? 0} title="Completeness" />
                  <GaugeChart value={dataset.stats?.uniqueness ?? 0} title="Uniqueness" />
                  <GaugeChart value={dataset.stats?.consistency ?? 0} title="Consistency" />
                </div>
              </div>
              
              {/* Preview Card (placeholder) */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Data Preview</h3>
                  <button className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded">
                    Full Explorer
                  </button>
                </div>
                
                {/* Data Preview Table */}
                <div className="border border-border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        {(dataset.schema?.slice(0, 5) ?? []).map((col) => (
                          <th key={col.name} className="px-3 py-2 text-left font-medium text-foreground">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map((row) => (
                        <tr key={row} className={`border-t border-border ${row % 2 === 0 ? 'bg-secondary/20' : ''}`}>
                          {(dataset.schema?.slice(0, 5) ?? []).map((col, i) => (
                            <td key={`${row}-${col.name}`} className="px-3 py-2 text-foreground">
                              {/* This is mock data - in a real app this would be actual data */}
                              {col.type === 'UUID' ? `${col.name.charAt(0)}${row}e2d5f-${i}${row}ab` : 
                               col.type === 'TIMESTAMP' ? `2023-07-${row < 10 ? '0' + row : row}` :
                               col.type === 'INT' ? Math.floor(Math.random() * 80) + 20 :
                               `Sample ${col.name} ${row}`}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-muted mt-2">Showing 4 of {dataset.rows?.toLocaleString() ?? 'N/A'} records</div>
              </div>
              
              {/* Data Distribution Card - NEW */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <h3 className="text-lg font-medium mb-4">Data Distribution</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dataset.id === "1" && dataset.stats?.distribution.gender && dataset.stats?.distribution.ageBrackets ? (
                    <>
                      <DonutChart 
                        data={dataset.stats?.distribution.gender} 
                        title="Gender Distribution" 
                      />
                      <BarChart 
                        data={dataset.stats?.distribution.ageBrackets} 
                        title="Age Distribution" 
                      />
                    </>
                  ) : dataset.id === "2" && dataset.stats?.distribution.resolution && dataset.stats?.distribution.fileType ? (
                    <>
                      <DonutChart 
                        data={dataset.stats?.distribution.resolution} 
                        title="Resolution" 
                      />
                      <DonutChart 
                        data={dataset.stats?.distribution.fileType} 
                        title="File Types" 
                      />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            
            {/* Right Column - Source & Usage Info */}
            <div className="space-y-6">
              {/* Source Info Card */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <h3 className="text-lg font-medium mb-4">Source Information</h3>
                <div className="mb-3">
                  {(() => {
                     const sourceStyles = dataset.source?.type ? sourceTypeColors[dataset.source.type as keyof typeof sourceTypeColors] : defaultSourceStyle;
                     return (
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceStyles.bg} ${sourceStyles.text}`}>
                         {dataset.source?.type ?? 'Unknown'}
                       </span>
                     );
                  })()}
                </div>
                <div className="text-sm space-y-3">
                  <div>
                    <div className="text-muted mb-1">Location</div>
                    <div className="font-medium break-all">{dataset.source?.location}</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Last Synced</div>
                    <div className="font-medium">{dataset.source?.lastSync}</div>
                  </div>
                  
                  {/* Source Metadata */}
                  <div className="pt-3 border-t border-border mt-3">
                    <div className="text-muted mb-2">Source Details</div>
                    {Object.entries(dataset.source?.metadata || {}).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-1 mb-1 text-sm">
                        <span className="text-muted capitalize">{key}:</span>
                        <span className="col-span-2 font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Sync Button */}
                {dataset.source?.canSync && (
                  <button className="mt-4 w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-md flex items-center justify-center text-sm">
                    <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                    Sync Now
                  </button>
                )}
              </div>
              
              {/* Usage Trend Card - NEW */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <h3 className="text-lg font-medium mb-4">Usage Trend</h3>
                {dataset.stats?.distribution.usage && (
                  <>
                    <LineChart 
                      data={dataset.stats?.distribution.usage}
                      title="Monthly Usage" 
                    />
                    <div className="text-xs text-muted text-center mt-2">Number of model runs using this dataset</div>
                  </>
                )}
              </div>
              
              {/* Usage Summary */}
              <div className="bg-card border border-border rounded-lg p-5 shadow-card">
                <h3 className="text-lg font-medium mb-4">Usage Summary</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted mb-1">Used in Models</div>
                    <div className="font-medium">{(dataset.usedIn?.filter(u => u.type !== 'ETL') ?? []).length} models</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Used in Pipelines</div>
                    <div className="font-medium">{(dataset.usedIn?.filter(u => u.type === 'ETL') ?? []).length} pipelines</div>
                  </div>
                  <div>
                    <div className="text-muted mb-1">Version History</div>
                    <div className="font-medium">{dataset.history?.length ?? 0} versions</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="font-medium text-sm mb-2">Most Recent Usage</h4>
                  {(dataset.usedIn?.slice(0, 2) ?? []).map((usage) => (
                    <div key={usage.id} className="flex items-center mb-2 p-2 bg-secondary/20 rounded-md">
                      <div className="mr-3 p-1.5 rounded-md bg-primary/10">
                        {usage.type === 'Classification' || usage.type === 'Image Classification' ? (
                          <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 20h.01M7 20v-4" />
                            <path d="M12 20v-8" />
                            <path d="M17 20V8" />
                            <path d="M22 4v16" />
                          </svg>
                        ) : usage.type === 'Recommendation' ? (
                          <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        ) : usage.type === 'ETL' ? (
                          <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{usage.name}</div>
                        <div className="text-xs text-muted">{usage.type} • Last run {usage.lastRun}</div>
                      </div>
                    </div>
                  ))}
                  <Link 
                    href={`/datasets/${dataset.id}/usage`} 
                    className="text-xs text-primary hover:underline block mt-2"
                  >
                    View all usage →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-medium">Dataset Schema</h3>
              <p className="text-sm text-muted mt-1">This dataset contains {dataset.schema?.length ?? 0} fields</p>
            </div>
            
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-5 py-3 font-medium text-foreground">Field Name</th>
                  <th className="px-5 py-3 font-medium text-foreground">Type</th>
                  <th className="px-5 py-3 font-medium text-foreground">Nullable</th>
                  <th className="px-5 py-3 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {(dataset.schema ?? []).map((field, index) => (
                  <tr key={field.name} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                    <td className="px-5 py-3 font-medium">{field.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary">{field.type}</span>
                    </td>
                    <td className="px-5 py-3">
                      {field.nullable ? 
                        <span className="text-muted">Yes</span> : 
                        <span className="text-foreground font-medium">No</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-muted">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-medium">Models and Pipelines Using This Dataset</h3>
                <p className="text-sm text-muted mt-1">This dataset is used in {dataset.usedIn?.length ?? 0} models and pipelines</p>
              </div>
              
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-left">
                    <th className="px-5 py-3 font-medium text-foreground">Name</th>
                    <th className="px-5 py-3 font-medium text-foreground">Type</th>
                    <th className="px-5 py-3 font-medium text-foreground">Last Run</th>
                    <th className="px-5 py-3 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(dataset.usedIn ?? []).map((item, index) => (
                    <tr key={item.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}`}>
                      <td className="px-5 py-3 font-medium">{item.name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary">{item.type}</span>
                      </td>
                      <td className="px-5 py-3 text-muted">{item.lastRun}</td>
                      <td className="px-5 py-3">
                        <div className="flex space-x-2">
                          <button className="p-1 rounded-md hover:bg-secondary" title="View">
                            <svg className="w-4 h-4 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button className="p-1 rounded-md hover:bg-secondary" title="Run">
                            <svg className="w-4 h-4 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-5 shadow-card">
              <h3 className="text-lg font-medium mb-4">Usage Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="text-sm text-muted mb-1">Model Runs</div>
                  <div className="text-2xl font-bold">247</div>
                  <div className="text-xs text-muted mt-1">Last 30 days</div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="text-sm text-muted mb-1">Training Hours</div>
                  <div className="text-2xl font-bold">58.5</div>
                  <div className="text-xs text-muted mt-1">Last 30 days</div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="text-sm text-muted mb-1">Inference Calls</div>
                  <div className="text-2xl font-bold">12.4k</div>
                  <div className="text-xs text-muted mt-1">Last 30 days</div>
                </div>
              </div>
              
              {/* Usage Trend Chart - UPDATED */}
              <div className="h-64 p-4 border border-border rounded-lg">
                {dataset.stats?.distribution.usage && (
                  <LineChart 
                    data={dataset.stats?.distribution.usage}
                    title="Monthly Usage Trend" 
                    className="h-full"
                  />
                )}
              </div>
              
              {/* Usage by Model Type - NEW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Model Performance Impact</h4>
                  <div className="flex justify-center items-center h-40">
                    <svg className="w-full h-full" viewBox="0 0 200 100">
                      {/* X and Y axis */}
                      <line x1="20" y1="80" x2="180" y2="80" stroke="#64748b" strokeWidth="1" />
                      <line x1="20" y1="20" x2="20" y2="80" stroke="#64748b" strokeWidth="1" />
                      
                      {/* Data points */}
                      <circle cx="50" cy="50" r="5" fill="#4f46e5" />
                      <circle cx="80" cy="40" r="5" fill="#4f46e5" />
                      <circle cx="110" cy="30" r="5" fill="#4f46e5" />
                      <circle cx="140" cy="25" r="5" fill="#4f46e5" />
                      
                      {/* Trend line */}
                      <path 
                        d="M50,50 Q95,30 140,25" 
                        fill="none" 
                        stroke="#4f46e5" 
                        strokeWidth="2" 
                        strokeDasharray="3,3" 
                      />
                      
                      {/* Labels */}
                      <text x="180" y="85" fontSize="8" textAnchor="end" fill="#64748b">Dataset Version</text>
                      <text x="15" y="20" fontSize="8" textAnchor="end" fill="#64748b">Model Accuracy</text>
                      
                      <text x="50" y="90" fontSize="8" textAnchor="middle" fill="#64748b">v1.0</text>
                      <text x="80" y="90" fontSize="8" textAnchor="middle" fill="#64748b">v1.5</text>
                      <text x="110" y="90" fontSize="8" textAnchor="middle" fill="#64748b">v2.0</text>
                      <text x="140" y="90" fontSize="8" textAnchor="middle" fill="#64748b">v2.1</text>
                    </svg>
                  </div>
                  <div className="text-xs text-muted text-center mt-1">
                    Model accuracy improvement with dataset versions
                  </div>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Usage by Model Type</h4>
                  <div className="flex justify-center items-center">
                    <DonutChart 
                      data={
                        dataset.id === "1" 
                          ? { 'Classification': 45, 'Regression': 30, 'Clustering': 15, 'Other': 10 } 
                          : { 'Classification': 60, 'Object Detection': 25, 'GAN': 10, 'Other': 5 }
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Lineage Tab */}
        {activeTab === 'lineage' && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <h3 className="text-xl font-semibold mb-6">Data Lineage</h3>

            {/* Source Dataset Text Display */}
            {dataset.type === 'Source' && dataset.lineage && (
              <div className="space-y-4">
                <div className="flex items-center p-4 rounded-md bg-green-50 border border-green-200">
                  <Info className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    <strong className="font-medium">Source Dataset:</strong> This dataset is an original source, directly ingested via {dataset.lineage.details?.sourceType || 'unknown mechanism'}.
                  </p>
                </div>
              </div>
            )}

            {/* Derived Dataset Text Display */}
            {dataset.type === 'Derived' && dataset.lineage && (
              <div className="space-y-6">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <Workflow className="w-4 h-4 mr-2 text-primary" />
                    Generated By
                  </h4>
                  <div className="text-sm space-y-2">
                    <p>
                      <strong className="text-muted w-24 inline-block">Process:</strong>
                      {dataset.lineage.createdBy === 'Pipeline' ? 'Pipeline Run' : dataset.lineage.createdBy}
                    </p>
                    {dataset.lineage.pipelineId && (
                      <p>
                        <strong className="text-muted w-24 inline-block">Pipeline:</strong>
                        <Link href={`/pipelines/${dataset.lineage.pipelineId}`} className="text-primary hover:underline font-medium">
                          {(mockPipelines.find(p => p.id === dataset.lineage.pipelineId)?.name || dataset.lineage.pipelineId)}
                        </Link>
                      </p>
                    )}
                    {dataset.lineage.jobName && (
                      <p>
                        <strong className="text-muted w-24 inline-block">Step:</strong>
                        {(dataset.lineage.pipelineId && dataset.lineage.jobName) ? (
                          <Link href={`/pipelines/${dataset.lineage.pipelineId}/steps/${dataset.lineage.jobName}`} className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs text-primary hover:underline">
                            {dataset.lineage.jobName}
                          </Link>
                        ) : (
                          <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">{dataset.lineage.jobName}</span>
                        )}
                      </p>
                    )}
                    {dataset.lineage.pipelineRunId && (
                      <p>
                        <strong className="text-muted w-24 inline-block">Run ID:</strong>
                        {dataset.lineage.pipelineRunId}
                      </p>
                    )}
                    {dataset.lineage.details?.description && (
                      <p>
                        <strong className="text-muted w-24 inline-block">Description:</strong>
                        {dataset.lineage.details.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-primary" />
                    Inputs Used
                  </h4>
                  <div className="space-y-3">
                    {dataset.lineage.inputs && dataset.lineage.inputs.length > 0 ? (
                      dataset.lineage.inputs.map((input: LineageInput) => {
                        const inputDataset = mockDatasets.find(d => d.id === input.datasetId);
                        return (
                          <div key={input.datasetId} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                            <div className="flex items-center">
                              <Database className="w-4 h-4 mr-2 text-muted" />
                              <div>
                                <Link href={`/datasets/${input.datasetId}`} className="text-sm font-medium text-primary hover:underline">
                                  {inputDataset?.name || input.datasetId}
                                </Link>
                              </div>
                            </div>
                            <span className="text-xs text-muted bg-secondary px-1.5 py-0.5 rounded">
                              Version: {input.version}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted">(No input datasets specified in lineage)</p>
                    )}
                  </div>
                </div>

                {/* Visual Lineage Graph */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <GitBranch className="w-4 h-4 mr-2 text-primary" />
                    Visual Lineage Graph
                  </h4>
                  <DatasetLineageGraph 
                     currentDataset={dataset} 
                     allDatasets={mockDatasets} 
                     allPipelines={mockPipelines} 
                  />
                </div>
              </div>
            )}

            {/* Fallback for missing lineage data */}
            { !dataset.lineage && (
              <div className="flex items-center p-4 rounded-md bg-yellow-50 border border-yellow-200">
                <Info className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong className="font-medium">Lineage Unavailable:</strong> Lineage information is not available for this dataset.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-medium">Version History</h3>
              <p className="text-sm text-muted mt-1">Track changes to this dataset over time</p>
            </div>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 left-[39px] w-0.5 bg-border"></div>
              
              {/* Timeline items */}
              <div className="relative z-10">
                {(dataset.history ?? []).map((version, index) => (
                  <div key={version.version} className="flex p-5 border-t border-border">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    
                    <div className="ml-4">
                      <div className="flex items-center mb-1">
                        <h4 className="font-medium">Version {version.version}</h4>
                        {index === 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted mb-2">{formatDate(version.date)}</div>
                      <p className="text-sm">{version.changes}</p>
                      
                      {index !== 0 && (
                        <button className="mt-3 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded flex items-center w-fit">
                          <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
                            <path d="M12 8v4l3 3" />
                          </svg>
                          Revert to this version
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 