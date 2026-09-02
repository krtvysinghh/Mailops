import React, { useState } from 'react';

export default function DomainSetup() {
  const [domain, setDomain] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any[]>([]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setResults([]);

    try {
      const res = await fetch('http://localhost:8787/api/dns/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain, zoneId, apiToken })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to setup domain');

      setResults(data.results);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Setup Custom Domain Email</h2>
      <p className="text-gray-600 mb-6">
        Enter your Cloudflare details below. We will automatically configure the required MX, SPF, and DMARC records to enable free incoming emails.
      </p>

      <form onSubmit={handleSetup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Domain Name</label>
          <input
            type="text"
            required
            placeholder="e.g., mailops.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Cloudflare Zone ID</label>
          <input
            type="text"
            required
            placeholder="Found in your Cloudflare dashboard overview"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cloudflare API Token</label>
          <input
            type="password"
            required
            placeholder="Needs 'DNS:Edit' and 'Zone:Read' permissions"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {status === 'loading' ? 'Provisioning DNS...' : 'Auto-Configure Domain'}
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-green-800">Provisioning Complete</h3>
          <div className="mt-2 text-sm text-green-700">
            <ul className="list-disc pl-5 space-y-1">
              {results.map((r, i) => (
                <li key={i}>
                  {r.record ? `${r.record.type} ${r.record.name}` : r.type}: 
                  <span className="font-mono ml-2 font-bold">{r.status || r.result}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Error Provisioning DNS</h3>
          <p className="mt-2 text-sm text-red-700">
            Please check your API token permissions and Zone ID.
          </p>
        </div>
      )}
    </div>
  );
}
