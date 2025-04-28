"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Define a mapping of path segments to readable names
const breadcrumbNameMap: Record<string, string> = {
  'pipelines': 'Pipelines',
  'projects': 'Projects',
  'models': 'Models',
  'datasets': 'Datasets',
  'new': 'New',
  'create': 'Create',
  // Add more mappings as needed
};

export default function Breadcrumb() {
  const pathname = usePathname();
  
  // If we're at the root path, don't show breadcrumbs
  if (pathname === "/") return null;

  // Split and filter the pathname into segments
  const pathSegments = pathname.split('/').filter(segment => segment);
  
  // If there's only one segment and it's the root dashboard, don't show breadcrumbs
  if (pathSegments.length === 0) return null;
  
  // Build an array of breadcrumb items with proper links
  const breadcrumbs = pathSegments.map((segment, index) => {
    // Build the href for this breadcrumb
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    
    // Get the display name for this segment (could be ID)
    let displayName = breadcrumbNameMap[segment] || segment;
    
    // For ID segments (typically UUIDs, numeric IDs, or slugs), we display a generic name
    if (index > 0 && !breadcrumbNameMap[segment] && segment !== 'new') {
      // If previous segment has a singular form, use that + "Details"
      const parentSegment = pathSegments[index - 1];
      if (parentSegment && breadcrumbNameMap[parentSegment]) {
        displayName = 'Details';
      }
    }
    
    return {
      href,
      displayName,
      isLast: index === pathSegments.length - 1
    };
  });
  
  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            Home
          </Link>
        </li>
        
        {breadcrumbs.map((breadcrumb) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
            {breadcrumb.isLast ? (
              <span className="text-gray-700 text-sm font-medium">
                {breadcrumb.displayName}
              </span>
            ) : (
              <Link 
                href={breadcrumb.href}
                className="text-indigo-600 hover:text-indigo-900 text-sm"
              >
                {breadcrumb.displayName}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 