import React, { useEffect, useState } from 'react';

type Probe = { label: string; url: string };

const orchBase = import.meta.env.VITE_ORCH_URL || 'http://127.0.0.1:8000';

const probes: Probe[] = [
  { label: 'Orchestrator /health', url: `${orchBase}/health` },
  { label: 'Orchestrator /ready', url: `${orchBase}/ready` },
];

const Preflight: React.FC = () => {
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const p of probes) {
        try {
          const res = await fetch(p.url, { method: 'GET' });
          next[p.label] = `HTTP ${res.status}`;
        } catch (e) {
          next[p.label] = 'UNREACHABLE';
        }
      }
      if (!cancelled) setResults(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Preflight — Real mode checks</h1>
      <div className="text-sm text-gray-600 mb-2">Orchestrator URL: <code>{orchBase}</code></div>
      <ul className="space-y-2">
        {probes.map((p) => (
          <li key={p.label} className="flex items-center justify-between border rounded px-3 py-2">
            <span>{p.label}</span>
            <span className="font-mono text-xs">{results[p.label] || '...'}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-xs text-gray-500">Set VITE_ORCH_URL to override base URL.</div>
    </div>
  );
};

export default Preflight;
