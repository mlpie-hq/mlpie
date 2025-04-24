export default function MonitoringPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Monitoring</h1>
      <p>Dashboards for model performance, pipeline health, and GenAI quality will go here.</p>
      {/* Dummy data/content placeholder */}
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <p>Dashboard: Model Latency - Status: OK</p>
        <p>Dashboard: Pipeline Errors - Status: Alerting</p>
      </div>
    </div>
  );
} 