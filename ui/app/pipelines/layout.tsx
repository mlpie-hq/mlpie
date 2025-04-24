"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, Filter, Download, UploadCloud } from "lucide-react";

interface PipelinesLayoutProps {
  children: ReactNode;
}

export default function PipelinesLayout({ children }: PipelinesLayoutProps) {
  const pathname = usePathname();
  
  // Determine if we're on the main pipelines page or a detail page
  const isMainPage = pathname === "/pipelines";
  
  return (
    <div className="p-6">
      {isMainPage && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pipelines</h1>
            <p className="text-gray-500">Manage and monitor your data processing workflows</p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/pipelines/new" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <PlusCircle size={16} />
              New Pipeline
            </Link>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center gap-2">
              <Filter size={16} />
              Filter
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center gap-2">
              <UploadCloud size={16} />
              Import
            </button>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
} 