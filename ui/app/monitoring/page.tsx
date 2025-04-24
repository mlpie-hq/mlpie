"use client";

import React from 'react';
// Removed import for Card components as they don't exist
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"; 
import { Activity, AlertTriangle, Cpu, MemoryStick, Server } from "lucide-react"; // Icons for visual representation

// Mock data for demonstration
const systemMetrics = {
  cpuUsage: 75,
  memoryUsage: 60,
  activeServices: 5,
  pendingJobs: 2,
};

const recentAlerts = [
  { id: 1, severity: "High", message: "Service 'Data Ingestor' unresponsive.", timestamp: "2 minutes ago", icon: AlertTriangle },
  { id: 2, severity: "Medium", message: "High latency detected on 'Model Serving API'.", timestamp: "15 minutes ago", icon: AlertTriangle },
  { id: 3, severity: "Low", message: "Disk space nearing capacity on worker node 3.", timestamp: "1 hour ago", icon: AlertTriangle },
];

const activeServices = [
  { id: 'svc-1', name: 'Model Serving API', status: 'Running', uptime: '99.98%' },
  { id: 'svc-2', name: 'Data Ingestor', status: 'Running', uptime: '99.95%' },
  { id: 'svc-3', name: 'Training Scheduler', status: 'Running', uptime: '100%' },
  { id: 'svc-4', name: 'Data Processing Worker', status: 'Running', uptime: '99.90%' },
  { id: 'svc-5', name: 'Frontend Web Server', status: 'Running', uptime: '100%' },
]

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'running': return 'text-green-500';
    case 'degraded': return 'text-yellow-500';
    case 'error': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

// Helper function to get alert severity color
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-blue-600';
    default: return 'text-gray-500';
  }
}

// Define basic card styles using Tailwind
const cardClasses = "bg-white border border-gray-200 rounded-lg shadow-sm";
const cardHeaderClasses = "p-4 border-b border-gray-200";
const cardTitleClasses = "text-lg font-semibold text-gray-800"; // Slightly larger title
const cardDescriptionClasses = "text-sm text-gray-500 mt-1";
const cardContentClasses = "p-4";

export default function MonitoringPage() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen"> {/* Added background */}
      <h1 className="text-2xl font-semibold text-gray-900">System Monitoring</h1>

      {/* Key Metrics Overview - Replaced Card with div */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU Usage Card */}
        <div className={cardClasses}>
          <div className={`${cardHeaderClasses} flex flex-row items-center justify-between space-y-0 pb-2`}>
            <h3 className="text-sm font-medium">CPU Usage</h3>
            <Cpu className="h-4 w-4 text-gray-400" /> {/* Adjusted text color */}
          </div>
          <div className={cardContentClasses}>
            <div className="text-2xl font-bold">{systemMetrics.cpuUsage}%</div>
            <p className="text-xs text-gray-500">Current utilization</p>
          </div>
        </div>
        {/* Memory Usage Card */}
        <div className={cardClasses}>
          <div className={`${cardHeaderClasses} flex flex-row items-center justify-between space-y-0 pb-2`}>
            <h3 className="text-sm font-medium">Memory Usage</h3>
            <MemoryStick className="h-4 w-4 text-gray-400" />
          </div>
          <div className={cardContentClasses}>
            <div className="text-2xl font-bold">{systemMetrics.memoryUsage}%</div>
            <p className="text-xs text-gray-500">Current utilization</p>
          </div>
        </div>
        {/* Active Services Card */}
        <div className={cardClasses}>
          <div className={`${cardHeaderClasses} flex flex-row items-center justify-between space-y-0 pb-2`}>
            <h3 className="text-sm font-medium">Active Services</h3>
            <Server className="h-4 w-4 text-gray-400" />
          </div>
          <div className={cardContentClasses}>
            <div className="text-2xl font-bold">{systemMetrics.activeServices}</div>
            <p className="text-xs text-gray-500">Currently running</p>
          </div>
        </div>
         {/* Pending Jobs Card */}
         <div className={cardClasses}>
          <div className={`${cardHeaderClasses} flex flex-row items-center justify-between space-y-0 pb-2`}>
            <h3 className="text-sm font-medium">Pending Jobs</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div className={cardContentClasses}>
            <div className="text-2xl font-bold">{systemMetrics.pendingJobs}</div>
            <p className="text-xs text-gray-500">In queue</p>
          </div>
        </div>
      </div>

      {/* Active Services List - Replaced Card with div */}
       <div className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h3 className={cardTitleClasses}>Active Services</h3>
          <p className={cardDescriptionClasses}>Status and uptime of running services.</p>
        </div>
        <div className={cardContentClasses}>
          <div className="space-y-4">
            {activeServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-800">{service.name}</p>
                  <p className={`text-xs ${getStatusColor(service.status)}`}>{service.status}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm text-gray-700">Uptime: {service.uptime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts List - Replaced Card with div */}
      <div className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h3 className={cardTitleClasses}>Recent Alerts</h3>
          <p className={cardDescriptionClasses}>Critical system events and warnings.</p>
        </div>
        <div className={cardContentClasses}>
           <div className="space-y-3">
             {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 border-b border-gray-200 last:border-b-0">
                <alert.icon className={`h-5 w-5 mt-0.5 shrink-0 ${getSeverityColor(alert.severity)}`} />
                <div>
                  <p className={`text-sm font-medium ${getSeverityColor(alert.severity)}`}>{alert.severity}</p>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.timestamp}</p>
                </div>
              </div>
             ))}
             {recentAlerts.length === 0 && <p className="text-sm text-gray-500">No recent alerts.</p>}
           </div>
        </div>
      </div>

      {/* Placeholder for historical charts/logs - Replaced Card with div */}
       <div className={cardClasses}>
        <div className={cardHeaderClasses}>
          <h3 className={cardTitleClasses}>Historical Performance</h3>
          <p className={cardDescriptionClasses}>View trends over time.</p>
        </div>
        <div className={cardContentClasses}>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center text-gray-500 border border-gray-200">
            (Placeholder for interactive charts: CPU, Memory, Network, etc.)
          </div>
        </div>
      </div>

    </div>
  );
} 