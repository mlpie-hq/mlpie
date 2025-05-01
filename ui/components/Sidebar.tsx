"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// SVG icons - these would be better replaced with a proper icon library later
const DashboardIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const PipelineIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h12" />
    <path d="M6 18h12" />
  </svg>
);

const ModelIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" y1="22" x2="12" y2="12" />
  </svg>
);

const ExperimentIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3L8 7.23 12 5l4 2.23L15 3h-6z" />
    <path d="M20 15a7 7 0 1 0-14 0" />
    <path d="M12 12v8" />
    <path d="M8 16h8" />
  </svg>
);

const PromptIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const DatasetIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M2 15h10" />
    <path d="M9 18H2" />
    <path d="M3 12h8" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PluginIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 22h4a2 2 0 0 0 2-2v-4" />
    <path d="M3 16v4a2 2 0 0 0 2 2h4" />
    <path d="M16 3h4a2 2 0 0 1 2 2v4" />
    <path d="M3 9V5a2 2 0 0 1 2-2h4" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const navItems = [
  { name: 'Projects', href: '/', icon: DashboardIcon },
  { name: 'Pipelines', href: '/pipelines', icon: PipelineIcon },
  { name: 'Models', href: '/models', icon: ModelIcon },
  { name: 'Experiments', href: '/models/experiments', icon: ExperimentIcon },
  { name: 'Datasets', href: '/datasets', icon: DatasetIcon },
  { name: 'Prompts', href: '/prompts', icon: PromptIcon },
  { name: 'Monitoring', href: '/monitoring', icon: MonitorIcon },
  { name: 'Plugins', href: '/plugins', icon: PluginIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-card text-foreground fixed border-r border-border flex flex-col">
      {/* Logo/Title Area */}
      <div className="px-5 py-6 flex items-center border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-3">
          <span className="text-primary-foreground font-bold">ML</span>
        </div>
        <h1 className="text-xl font-semibold">MLPie</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-3">
        <div className="mb-2 px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
          Main
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <span className="mr-3">
                    <item.icon />
                  </span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Area */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <Link href="/settings" className="block group -m-4 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-150">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
              UD
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600">Demo User</p>
              <p className="text-xs text-gray-500">user@example.com</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
} 