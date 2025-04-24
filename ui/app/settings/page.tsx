"use client";

import { useState } from "react";
import { User, Bell, KeyRound, Palette, ShieldCheck } from "lucide-react"; // Removed CreditCard

// Define settings sections
const settingsSections = [
  { key: 'profile', label: 'Profile', icon: User },
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

/* // Removed BillingSettings component
const BillingSettings = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4">Billing</h2>
    <p className="text-gray-600">View subscription details, payment methods, and invoices.</p>
    <div className="mt-6 text-sm text-gray-500">(Billing information placeholder)</div>
  </div>
);
*/

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


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState(settingsSections[0].key);

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'apiKeys':
        return <ApiKeySettings />;
      /* case 'billing': // Removed Billing case
        return <BillingSettings />; */
      case 'appearance':
        return <AppearanceSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
       <h1 className="text-2xl font-semibold mb-6">Settings</h1>
       {/* Tab Navigation */}
       <div className="border-b border-gray-200 mb-6">
         <nav className="-mb-px flex space-x-8" aria-label="Tabs">
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