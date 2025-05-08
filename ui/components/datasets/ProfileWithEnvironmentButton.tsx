'use client';

import { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BarChart2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileDatasetButton } from './ProfileDatasetButton';

interface Environment {
  id: string;
  name: string;
  description?: string;
  spec?: {
    profilers?: {
      default?: string;
      configurations?: Array<{
        name: string;
        enabled: boolean;
      }>;
    };
  };
}

interface ProfileWithEnvironmentButtonProps {
  datasetId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

export function ProfileWithEnvironmentButton({
  datasetId,
  variant = 'default',
  size = 'default',
  disabled = false,
}: ProfileWithEnvironmentButtonProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [showProfiler, setShowProfiler] = useState(false);

  // Fetch available environments on component mount
  useEffect(() => {
    const fetchEnvironments = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/environments');
        if (!response.ok) {
          throw new Error('Failed to fetch environments');
        }
        const data = await response.json();
        setEnvironments(data.environments || []);
        
        // Set default environment if available
        if (data.environments && data.environments.length > 0) {
          setSelectedEnv(data.environments[0]);
        }
      } catch (error) {
        console.error('Error fetching environments:', error);
        toast.error('Failed to load environments');
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironments();
  }, []);

  const handleSelectEnvironment = (env: Environment) => {
    setSelectedEnv(env);
    setShowProfiler(true);
  };

  // Get available profilers for the selected environment
  const getAvailableProfilers = () => {
    if (!selectedEnv?.spec?.profilers?.configurations) {
      return [];
    }
    
    return selectedEnv.spec.profilers.configurations
      .filter(p => p.enabled)
      .map(p => p.name);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            disabled={disabled || loading || environments.length === 0}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Profile Dataset
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Select Environment</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {environments.length > 0 ? (
            environments.map((env) => (
              <DropdownMenuItem 
                key={env.id}
                onClick={() => handleSelectEnvironment(env)}
              >
                {env.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No environments available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showProfiler && selectedEnv && (
        <ProfileDatasetButton
          datasetId={datasetId}
          environmentId={selectedEnv.id}
          availableProfilers={getAvailableProfilers()}
          open={showProfiler}
          onOpenChange={setShowProfiler}
        />
      )}
    </>
  );
} 