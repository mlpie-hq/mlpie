'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Database, 
  Activity,
  Server,
  BarChart2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define profiler types
interface ProfilerSecretRef {
  name: string;
  accessKeyIdKey?: string;
  secretAccessKeyKey?: string;
}

interface ProfilerAuth {
  secretRef?: ProfilerSecretRef;
}

interface ProfilerConfig {
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  auth?: ProfilerAuth;
}

interface EnvironmentProfilers {
  default?: string;
  configurations?: ProfilerConfig[];
}

interface Environment {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  spec: {
    profilers?: EnvironmentProfilers;
  };
}

// Mock environment data - In a real app, this would be fetched from the API
const mockEnvironment: Environment = {
  id: "env-1",
  name: "Development",
  description: "Development environment for testing",
  status: "Active",
  created_at: "2023-09-01T00:00:00Z",
  updated_at: "2023-09-15T00:00:00Z",
  spec: {
    profilers: {
      default: "pandas_profiler",
      configurations: [
        {
          name: "pandas_profiler",
          type: "pandas",
          enabled: true,
          config: {
            correlation_threshold: 0.7,
            include_percentiles: true,
            numerical_distribution_analysis: true,
            text_length_analysis: true,
            max_memory_usage: "4G"
          }
        },
        {
          name: "minimal_profiler",
          type: "pandas",
          enabled: true,
          config: {
            correlation_threshold: 0.5,
            include_percentiles: false,
            sample_size: 10000,
            numerical_distribution_analysis: false,
            text_length_analysis: false
          }
        },
        {
          name: "glue_profiler",
          type: "aws_glue",
          enabled: false,
          config: {
            region: "us-west-2",
            role_arn: "arn:aws:iam::123456789012:role/GlueProfilerRole",
            job_timeout_minutes: 60
          },
          auth: {
            secretRef: {
              name: "aws-credentials",
              accessKeyIdKey: "aws_access_key_id",
              secretAccessKeyKey: "aws_secret_access_key"
            }
          }
        }
      ]
    }
  }
};

export default function EnvironmentDetailPage() {
  const params = useParams();
  const [environment, setEnvironment] = useState<Environment>(mockEnvironment);
  const [activeTab, setActiveTab] = useState("overview");
  
  // In a real app, fetch the environment data
  useEffect(() => {
    // Fetch environment data
    // For now, we use mock data
    setEnvironment(mockEnvironment);
  }, [params.envId]);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center">
        <Link 
          href={`/projects/${params.id}`}
          className="mr-4 p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{environment.name}</h1>
            <Badge className={getStatusClass(environment.status)}>{environment.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{environment.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Server className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profilers">
            <BarChart2 className="h-4 w-4 mr-2" />
            Profilers
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Database className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Details</CardTitle>
              <CardDescription>
                Configuration and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p className="mt-1">{environment.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="mt-1">
                    <Badge className={getStatusClass(environment.status)}>
                      {environment.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="mt-1">{new Date(environment.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="mt-1">{new Date(environment.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profilers" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profiler Configurations</CardTitle>
              <CardDescription>
                Dataset profiler settings for this environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {environment.spec?.profilers?.configurations?.length ? (
                <div className="space-y-6">
                  {environment.spec.profilers.default && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Default Profiler</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {environment.spec.profilers.default}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="grid gap-4">
                    {environment.spec.profilers.configurations?.map((profiler) => (
                      <Card key={profiler.name} className={profiler.enabled ? '' : 'opacity-60'}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-base">{profiler.name}</CardTitle>
                              {!profiler.enabled && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                  Disabled
                                </Badge>
                              )}
                              {environment.spec?.profilers?.default === profiler.name && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription>Type: {profiler.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Configuration</h4>
                            <pre className="bg-gray-50 p-2 rounded-md text-xs overflow-auto">
                              {JSON.stringify(profiler.config, null, 2)}
                            </pre>
                            
                            {profiler.auth && (
                              <div className="mt-4">
                                <h4 className="text-sm font-medium">Authentication</h4>
                                <div className="text-sm mt-1">
                                  <span className="text-muted-foreground">Secret Reference: </span>
                                  <span className="font-mono">{profiler.auth.secretRef?.name}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No profiler configurations found for this environment.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Resources</CardTitle>
              <CardDescription>
                Resources deployed in this environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                No resources found for this environment.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Environment Monitoring</CardTitle>
              <CardDescription>
                Monitoring metrics and alerts for this environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                No monitoring data available for this environment.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}