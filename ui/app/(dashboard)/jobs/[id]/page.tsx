'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  XCircle, 
  CheckCircle, 
  Clock
} from 'lucide-react';

interface Job {
  id: string;
  name: string;
  job_type: string;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  dataset_id: string | null;
  environment_id: string | null;
  config: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
}

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = params;
  const [job, setJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchJob();
    fetchJobLogs();

    // Set up polling for job updates
    const intervalId = setInterval(() => {
      fetchJob();
      if (job?.status === 'running' || job?.status === 'pending') {
        fetchJobLogs();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const data = await response.json();
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching job details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await fetch(`/api/jobs/${id}/logs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching job logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCancelJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }
      
      // Refresh job data
      fetchJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
      console.error('Error cancelling job:', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="container py-6 space-y-4">
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-4 text-red-800 text-sm flex items-center">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
      
      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span>Loading job details...</span>
          </CardContent>
        </Card>
      ) : job ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push('/jobs')}
                    className="pl-0 mb-2"
                    size="sm"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Jobs
                  </Button>
                  <CardTitle>{job.name}</CardTitle>
                  <CardDescription>
                    Job ID: {job.id}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusBadgeColor(job.status)}>
                    <span className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className="ml-1 capitalize">{job.status}</span>
                    </span>
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchJob}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                    <p>{job.job_type.replace(/_/g, ' ')}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created</h3>
                      <p>{format(new Date(job.created_at), 'PPp')}</p>
                    </div>
                    {job.completed_at && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                        <p>{format(new Date(job.completed_at), 'PPp')}</p>
                      </div>
                    )}
                  </div>
                  
                  {job.dataset_id && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Dataset</h3>
                      <p>{job.dataset_id}</p>
                    </div>
                  )}
                  
                  {job.environment_id && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Environment</h3>
                      <p>{job.environment_id}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              {job.status === 'running' && (
                <CardFooter>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelJob}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Job
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {job.error && (
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-700 flex items-center text-base">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 whitespace-pre-wrap font-mono text-sm">
                    {job.error}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {job.config && Object.keys(job.config).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Job Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(job.config, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            {job.result && Object.keys(job.result).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Job Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(job.result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="md:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Job Logs
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchJobLogs}
                    disabled={logsLoading}
                  >
                    {logsLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[600px] w-full">
                  <div className="p-4">
                    {logs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No logs available yet.
                      </p>
                    ) : (
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {logs.join('\n')}
                      </pre>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center py-8">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <span>Job not found</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 