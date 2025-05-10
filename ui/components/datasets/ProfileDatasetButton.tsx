'use client';

import { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';

export interface ProfileDatasetButtonProps {
  datasetId: string;
  environmentId?: string;
  availableProfilers?: string[];
  disabled?: boolean;
}

export function ProfileDatasetButton({
  datasetId,
  environmentId,
  availableProfilers = [],
  disabled = false,
}: ProfileDatasetButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProfiler, setSelectedProfiler] = useState<string>('');

  // Set the first available profiler as default when component mounts
  useEffect(() => {
    if (availableProfilers.length > 0) {
      setSelectedProfiler(availableProfilers[0]);
    }
  }, [availableProfilers]);

  const handleProfileDataset = async () => {
    if (!datasetId) {
      alert('Dataset ID is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/jobs/profile-dataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: datasetId,
          profiler_name: selectedProfiler || undefined,
          environment_id: environmentId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start profiling job');
      }

      const data = await response.json();

      alert(`Profiling job ${data.job_id} has been started.`);

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error starting profiling job:', error);
      alert(error instanceof Error ? error.message : 'Failed to start profiling job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center"
        disabled={disabled}
        onClick={() => setIsModalOpen(true)}
      >
        <BarChart2 className="h-4 w-4 mr-2" />
        Profile Dataset
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Dataset</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create a profile for this dataset to analyze its statistics and distributions.
              </p>
            </div>

            <div className="space-y-4 my-4">
              {availableProfilers.length > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-sm font-medium text-right text-gray-700">
                    Profiler
                  </div>
                  <div className="col-span-3">
                    <select
                      value={selectedProfiler}
                      onChange={(e) => setSelectedProfiler(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Select profiler"
                      id="profiler-select"
                    >
                      {availableProfilers.map((profiler) => (
                        <option key={profiler} value={profiler}>
                          {profiler}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="text-right text-sm text-gray-500 mt-2">
                {environmentId
                  ? 'Using environment configurations for profiling'
                  : 'Using default profiling configuration'}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                onClick={handleProfileDataset}
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Start Profiling'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}