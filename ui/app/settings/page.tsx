"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { 
  configService, 
  SecretProviderConfigPayload, 
  CurrentSecretConfigResponse, 
  ConfigResponse, 
  RootSettingsResponse // Import the new response type
} from "@/services/configService"; // Adjust path
import { User, Bell, KeyRound, Palette, ShieldCheck, GitBranch, HardDrive } from "lucide-react"; // Replace Key with HardDrive for Base

// Define settings sections
const settingsSections = [
  { key: 'base', label: 'Base', icon: HardDrive },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'masterRepo', label: 'Master Repository', icon: GitBranch },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'apiKeys', label: 'API Keys', icon: KeyRound },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  // Add more sections as needed
];

// Placeholder components for each settings section
const ProfileSettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
    <p className="text-gray-600 mb-6">Update your personal information and password.</p>
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-4 border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" id="name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Your Name" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="email" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="your.email@example.com" readOnly />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
         <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
          <input type="password" id="currentPassword" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
          <input type="password" id="newPassword" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input type="password" id="confirmPassword" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Changes</button>
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
    <p className="text-gray-600 mb-6">Manage how you receive notifications.</p>
    <div className="space-y-4">
      <div className="flex items-center">
        <input id="emailNotifications" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
        <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">Email Notifications</label>
      </div>
      <div className="flex items-center">
        <input id="pushNotifications" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
        <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">Push Notifications</label>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Preferences</button>
    </div>
  </div>
);

const ApiKeySettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">API Keys</h2>
    <p className="text-gray-600 mb-6">Manage your API keys for integrations.</p>
    {/* Placeholder for API key list and generation */}
    <div className="text-sm text-gray-500">(API Key management placeholder)</div>
    <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Generate New Key</button>
  </div>
);

// NEW Base Settings Component
const BaseSettings = () => {
  const { 
    data: rootSettings, 
    isLoading, 
    error 
  }: UseQueryResult<RootSettingsResponse, Error> = useQuery<RootSettingsResponse, Error>({
    queryKey: ['rootConfig'],
    queryFn: configService.getRootConfig,
    staleTime: Infinity, // Root settings are unlikely to change while app is running
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <div>Loading base settings...</div>; 
  }

  if (error) {
    return <div className="text-red-600">Error loading base settings: {error.message}</div>;
  }

  if (!rootSettings) {
    return <div>No base settings found.</div>;
  }

  // Helper to render key-value pairs
  const renderSetting = (label: string, value: string | number | boolean) => (
    <div key={label} className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{String(value)}</dd>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Base Configuration</h2>
      <p className="text-gray-600 mb-6">Core application settings (read-only).</p>
      
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Info</h3>
        <dl className="divide-y divide-gray-200">
          {renderSetting("Application Name", rootSettings.APP_NAME)}
          {renderSetting("Application Version", rootSettings.APP_VERSION)}
          {renderSetting("Environment", rootSettings.ENV)}
        </dl>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Settings</h3>
        <dl className="divide-y divide-gray-200">
          {renderSetting("Host", rootSettings.api.HOST)}
          {renderSetting("Port", rootSettings.api.PORT)}
          {renderSetting("Debug Mode", rootSettings.api.DEBUG)}
          {renderSetting("Auto Reload", rootSettings.api.RELOAD)}
          {renderSetting("CORS Allowed Origins", rootSettings.api.CORS_ALLOWED_ORIGINS)}
        </dl>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Git Repository Settings</h3>
        <dl className="divide-y divide-gray-200">
          {renderSetting("Repository URL", rootSettings.git.REPO_URL)}
          {renderSetting("Username", rootSettings.git.REPO_USERNAME)}
          {renderSetting("Email", rootSettings.git.REPO_EMAIL)}
          {renderSetting("Auth Type", rootSettings.git.AUTH_TYPE)}
        </dl>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Settings</h3>
        <dl className="divide-y divide-gray-200">
          {renderSetting("Echo SQL", rootSettings.database.DATABASE_ECHO)}
          {/* DATABASE_URL is intentionally omitted */}
        </dl>
      </div>

    </div>
  );
};

const AppearanceSettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Appearance</h2>
    <p className="text-gray-600 mb-6">Customize the look and feel of the application.</p>
    <div className="space-y-4">
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">Theme</label>
        <select id="theme" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option>Light</option>
          <option>Dark</option>
          <option>System</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Apply Theme</button>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Security</h2>
    <p className="text-gray-600 mb-6">Manage your account security settings.</p>
    <div className="space-y-4">
       <div>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Change Password</button>
      </div>
       <div>
         <button className="px-4 py-2 border border-orange-500 text-orange-600 rounded-md hover:bg-orange-50">Enable Two-Factor Authentication</button>
      </div>
    </div>
  </div>
);

// New Placeholder for Master Repo Settings
const MasterRepoSettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Master Repository Configuration</h2>
    <p className="text-gray-600 mb-6">
      Configure the central Git repository used for managing project configurations and promoting GitOps practices.
    </p>
    <div className="space-y-4">
       <div>
        <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700">Repository URL</label>
        <input 
          type="text" 
          id="repoUrl" 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          placeholder="e.g., git@github.com:your-org/mlops-config.git" 
        />
      </div>
       <div>
        <label htmlFor="repoBranch" className="block text-sm font-medium text-gray-700">Branch</label>
        <input 
          type="text" 
          id="repoBranch" 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
          placeholder="e.g., main" 
        />
      </div>
      <div>
         {/* Placeholder for authentication/credentials */}
         <p className="text-xs text-gray-500 mt-1">Authentication details (e.g., SSH key or token) may need to be configured separately.</p>
      </div>
      <div className="pt-4">
         <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Configuration</button>
      </div>
    </div>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'apiKeys':
        return <ApiKeySettings />;
      case 'base':
        return <BaseSettings />;
      case 'masterRepo':
        return <MasterRepoSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="mx-auto">
       <h1 className="text-2xl font-semibold mb-6">Settings</h1>
       {/* Tab Navigation */}
       <div className="border-b border-gray-200 mb-6">
         <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
           {settingsSections.map((section) => (
             <button
               key={section.key}
               onClick={() => setActiveSection(section.key)}
               className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${ 
                 activeSection === section.key
                   ? 'border-indigo-500 text-indigo-600'
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               <section.icon className={`h-5 w-5 ${activeSection === section.key ? 'text-indigo-500' : 'text-gray-400'}`} />
               <span>{section.label}</span>
             </button>
           ))}
         </nav>
       </div>

      {/* Content Area */}
      <div className="bg-white p-6 rounded-lg shadow">
        {renderSection()}
      </div>
    </div>
  );
} 