export default function PluginsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Plugins</h1>
      <p>Plugin management UI (install, enable, configure) will go here.</p>
      {/* Dummy data/content placeholder */}
      <div className="mt-8 p-4 border rounded bg-gray-50">
        <p>Plugin: Hugging Face Integration - Status: Enabled</p>
        <p>Plugin: Kafka Connector - Status: Disabled</p>
      </div>
    </div>
  );
} 