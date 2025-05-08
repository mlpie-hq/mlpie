'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Define the profiler types available
const PROFILER_TYPES = [
  { value: 'pandas', label: 'Pandas Profiler' },
  { value: 'aws_glue', label: 'AWS Glue Profiler' },
  { value: 'minimal', label: 'Minimal Profiler' },
  { value: 'custom', label: 'Custom Profiler' },
];

// Form schema
const profilerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  type: z.string({
    required_error: "Please select a profiler type."
  }),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  config: z.record(z.string(), z.any()).optional(),
  configJson: z.string().optional(),
  useSecretRef: z.boolean().default(false),
  secretRef: z.object({
    name: z.string().optional(),
    accessKeyIdKey: z.string().optional(),
    secretAccessKeyKey: z.string().optional(),
  }).optional(),
});

type ProfilerFormValues = z.infer<typeof profilerFormSchema>;

interface ProfilerConfigFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProfilerFormValues) => void;
  initialValues?: Partial<ProfilerFormValues>;
  environmentId?: string;
}

export function ProfilerConfigForm({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  environmentId,
}: ProfilerConfigFormProps) {
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // Set up form with default values
  const form = useForm<ProfilerFormValues>({
    resolver: zodResolver(profilerFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      type: initialValues?.type || 'pandas',
      enabled: initialValues?.enabled ?? true,
      isDefault: initialValues?.isDefault ?? false,
      configJson: initialValues?.config ? JSON.stringify(initialValues.config, null, 2) : JSON.stringify({
        correlation_threshold: 0.7,
        include_percentiles: true,
        sample_size: 20000
      }, null, 2),
      useSecretRef: !!initialValues?.secretRef,
      secretRef: initialValues?.secretRef || {
        name: '',
        accessKeyIdKey: '',
        secretAccessKeyKey: '',
      },
    }
  });

  // Handle form submission
  const handleSubmit = (values: ProfilerFormValues) => {
    // Parse JSON config if present
    let config = {};
    try {
      if (values.configJson) {
        config = JSON.parse(values.configJson);
      }
    } catch (error) {
      form.setError('configJson', { 
        type: 'manual', 
        message: 'Invalid JSON configuration' 
      });
      return;
    }

    // Prepare final form values
    const finalValues = {
      ...values,
      config,
    };
    
    // Remove configJson from final values
    delete finalValues.configJson;
    
    // If not using secret ref, remove it from submission
    if (!values.useSecretRef) {
      delete finalValues.secretRef;
    }
    
    onSubmit(finalValues);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialValues?.name ? 'Edit Profiler Configuration' : 'Add Profiler Configuration'}
          </DialogTitle>
          <DialogDescription>
            Configure a data profiler for automatic dataset profiling in this environment.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4">
              {/* Profiler Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profiler Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., pandas_profiler" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for this profiler configuration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Profiler Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profiler Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a profiler type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROFILER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of profiler to use for dataset analysis.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Enabled Switch */}
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enabled</FormLabel>
                      <FormDescription>
                        Enable or disable this profiler configuration.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Default Profiler */}
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Set as Default</FormLabel>
                      <FormDescription>
                        Make this the default profiler for dataset profiling jobs.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Profiler Configuration */}
              <FormField
                control={form.control}
                name="configJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="font-mono text-xs h-32"
                        placeholder="{ ... }"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      JSON configuration for the profiler.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Authentication Settings */}
              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="useSecretRef"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between mb-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Secret Reference</FormLabel>
                        <FormDescription>
                          Configure authentication using environment secrets.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch("useSecretRef") && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <h4 className="text-sm font-medium">Secret Reference</h4>
                    
                    {/* Secret Name */}
                    <FormField
                      control={form.control}
                      name="secretRef.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secret Name</FormLabel>
                          <FormControl>
                            <Input placeholder="aws-credentials" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Access Key ID Key */}
                    <FormField
                      control={form.control}
                      name="secretRef.accessKeyIdKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Key ID Key</FormLabel>
                          <FormControl>
                            <Input placeholder="aws_access_key_id" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Secret Access Key Key */}
                    <FormField
                      control={form.control}
                      name="secretRef.secretAccessKeyKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secret Access Key Key</FormLabel>
                          <FormControl>
                            <Input placeholder="aws_secret_access_key" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Configuration</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 