'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Activity, Archive, AlertTriangle, ChevronRight, RefreshCw, XCircle } from 'lucide-react';

interface Job {
  id: string;
  name: string;
  job_type: string;
  status: string;
  created_at: string;
}

export function JobsProgress() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [failedJobs, setFailedJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobsData();
    
    // Poll for updates every 5 seconds
    const intervalId = setInterval(fetchJobsData, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchJobsData = async () => {
    try {
      setLoading(true);
      
      // Fetch failed jobs
      const failedResponse = await fetch('/api/v1/jobs?status=failed&limit=5');
      const failedData = await failedResponse.json();
      
      // Get details of active jobs
      const activeJobsResponse = await fetch('/api/v1/jobs?status=running,pending&limit=5');
      const activeJobsData = await activeJobsResponse.json();
      
      setActiveJobs(activeJobsData || []);
      setFailedJobs(failedData || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading jobs');
      console.error('Error fetching jobs data:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewJobDetails = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const viewAllJobs = () => {
    router.push('/jobs');
  };

  const activeJobsCount = activeJobs.length;
  const failedJobsCount = failedJobs.length;

  if (loading && activeJobsCount === 0 && failedJobsCount === 0) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        Loading Jobs...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="ghost" size="sm" className="text-red-600" onClick={fetchJobsData}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Error: Retry
      </Button>
    );
  }

  if (activeJobsCount === 0 && failedJobsCount === 0) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={viewAllJobs}>
        <Archive className="mr-2 h-4 w-4" />
        No Active Jobs
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={failedJobsCount > 0 ? "text-red-600" : ""}>
          {activeJobsCount > 0 ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-pulse" />
              {activeJobsCount} Active {activeJobsCount === 1 ? 'Job' : 'Jobs'}
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              {failedJobsCount} Failed {failedJobsCount === 1 ? 'Job' : 'Jobs'}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {activeJobsCount > 0 && (
          <>
            <DropdownMenuLabel>
              <div className="flex items-center">
                <Activity className="mr-2 h-4 w-4 text-blue-600" />
                Active Jobs
              </div>
            </DropdownMenuLabel>
            {activeJobs.map((job) => (
              <DropdownMenuItem 
                key={job.id} 
                onClick={() => viewJobDetails(job.id)}
                className="flex justify-between"
              >
                <div className="flex-1 truncate">
                  <span className="font-medium">{job.name}</span>
                  <div className="text-xs text-muted-foreground">
                    {job.job_type.replace(/_/g, ' ')}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </DropdownMenuItem>
            ))}
            {activeJobsCount > 5 && (
              <DropdownMenuItem onClick={viewAllJobs} className="text-sm text-blue-600">
                View all active jobs...
              </DropdownMenuItem>
            )}
          </>
        )}
        
        {activeJobsCount > 0 && failedJobsCount > 0 && (
          <DropdownMenuSeparator />
        )}
        
        {failedJobsCount > 0 && (
          <>
            <DropdownMenuLabel>
              <div className="flex items-center">
                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                Failed Jobs
              </div>
            </DropdownMenuLabel>
            {failedJobs.map((job) => (
              <DropdownMenuItem 
                key={job.id} 
                onClick={() => viewJobDetails(job.id)}
                className="flex justify-between"
              >
                <div className="flex-1 truncate">
                  <span className="font-medium">{job.name}</span>
                  <div className="text-xs text-muted-foreground">
                    {job.job_type.replace(/_/g, ' ')}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </DropdownMenuItem>
            ))}
            {failedJobsCount > 5 && (
              <DropdownMenuItem onClick={viewAllJobs} className="text-sm text-red-600">
                View all failed jobs...
              </DropdownMenuItem>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={viewAllJobs}>
          <div className="flex items-center w-full justify-center">
            View All Jobs
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 