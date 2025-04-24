"use client";

import { ReactNode } from "react";

export default function PipelineDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <main>{children}</main>
    </div>
  );
} 