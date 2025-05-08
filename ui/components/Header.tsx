'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitPullRequest } from 'lucide-react';
import ProjectSelector from './ProjectSelector';
import { JobsProgress } from './JobsProgress';

interface SyncStatus {
  needs_sync: boolean;
  last_synced: string | null;
  sync_message: string;
  out_of_sync_count: number;
}

export default function Header() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sync status
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/repository/sync/status');
        if (!response.ok) {
          throw new Error('Failed to fetch sync status');
        }
        const data = await response.json();
        setSyncStatus(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching sync status:', err);
        setError('Failed to check sync status');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSyncStatus();

    // Polling every 30 seconds
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-10 w-full bg-card border-b border-border">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <ProjectSelector />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sync status indicator */}
          <div className="relative group">
            <Link
              href="/sync"
              className={`flex items-center justify-center p-2 rounded-md text-sm transition-colors ${
                syncStatus?.needs_sync 
                  ? 'bg-warning/10 text-warning hover:bg-warning/20' 
                  : 'text-muted hover:bg-secondary hover:text-foreground'
              }`}
              aria-label="View sync status"
            >
              <GitPullRequest size={18} />
              {syncStatus?.needs_sync && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full"></span>
              )}
            </Link>
            
            {/* Tooltip on hover */}
            <div className="absolute right-0 mt-2 w-64 p-3 bg-card border border-border rounded-md shadow-dropdown hidden group-hover:block">
              {loading ? (
                <p className="text-sm py-1 text-muted">Checking sync status...</p>
              ) : error ? (
                <p className="text-sm py-1 text-destructive">{error}</p>
              ) : (
                <div className="text-sm py-1">
                  <p className={syncStatus?.needs_sync ? 'text-warning' : 'text-success'}>
                    {syncStatus?.sync_message}
                  </p>
                  {syncStatus?.last_synced && (
                    <p className="text-muted text-xs mt-1">
                      Last synced: {new Date(syncStatus.last_synced).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Jobs Progress Indicator */}
          <JobsProgress />

          {/* User profile */}
          <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-xs font-medium text-secondary-foreground">
            UD
          </div>
        </div>
      </div>
    </header>
  );
} 