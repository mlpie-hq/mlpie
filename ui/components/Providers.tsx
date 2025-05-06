"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectProvider } from "@/contexts/ProjectContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configure default query options if needed
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </QueryClientProvider>
  );
} 