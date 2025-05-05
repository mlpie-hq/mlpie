'use client';

import { useEffect, useState } from 'react';
import { 
  GitPullRequest, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';

interface SyncStatus {
  needs_sync: boolean;
  last_synced: string | null;
  sync_message: string;
  out_of_sync_count: number;
}

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Fetch sync status
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
      setError('Failed to load sync status');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  // Function to trigger sync
  const triggerSync = async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      // Call the API endpoint to trigger sync
      const response = await fetch('/api/repository/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger sync process');
      }
      
      // Wait a moment to allow background process to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refetch sync status after sync
      await fetchSyncStatus();
    } catch (err) {
      console.error('Error triggering sync:', err);
      setError('Failed to sync repository');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground flex items-center">
          <GitPullRequest className="mr-2" size={22} />
          Repository Sync
        </h1>
        
        <button
          onClick={fetchSyncStatus}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-secondary transition-colors flex items-center"
        >
          <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-md shadow-card">
        <div className="p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Repository Status</h2>
            {syncStatus && (
              <p className={`mt-1 text-sm ${!syncStatus.needs_sync ? 'text-success' : 'text-warning'}`}>
                {syncStatus.sync_message}
              </p>
            )}
          </div>
          
          <button
            onClick={triggerSync}
            disabled={loading || syncing || !syncStatus?.needs_sync}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
              syncStatus && syncStatus.needs_sync
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-secondary text-muted cursor-not-allowed'
            }`}
          >
            {syncing && <RefreshCw size={14} className="mr-2 animate-spin" />}
            {!syncing && <GitPullRequest size={14} className="mr-2" />}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Repository Information</h2>
          <p className="text-sm text-muted mt-1">
            {loading 
              ? 'Loading repository information...' 
              : !syncStatus 
                ? 'Unable to retrieve repository status' 
                : syncStatus.needs_sync
                  ? 'Repository needs to be synchronized' 
                  : 'Repository is in sync with the database'
            }
          </p>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <RefreshCw size={22} className="animate-spin text-muted" />
          </div>
        ) : !syncStatus ? (
          <div className="p-6 text-center">
            <AlertCircle size={28} className="mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium text-foreground">Unable to fetch sync status</h3>
            <p className="text-muted mt-2">
              Please check if the repository is configured properly
            </p>
          </div>
        ) : syncStatus.needs_sync ? (
          <div className="p-6 text-center">
            <GitPullRequest size={28} className="mx-auto mb-4 text-warning" />
            <h3 className="text-lg font-medium text-foreground">Repository needs synchronization</h3>
            <p className="text-muted mt-2">
              Click the &quot;Sync Now&quot; button to update the database with the latest repository state
            </p>
            {syncStatus.last_synced && (
              <p className="text-xs text-muted mt-3">
                Last synchronized: {new Date(syncStatus.last_synced).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle size={28} className="mx-auto mb-4 text-success" />
            <h3 className="text-lg font-medium text-foreground">Repository is up to date</h3>
            <p className="text-muted mt-2">
              The repository is fully synchronized with the database
            </p>
            {syncStatus.last_synced && (
              <p className="text-xs text-muted mt-3">
                Last synchronized: {new Date(syncStatus.last_synced).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 