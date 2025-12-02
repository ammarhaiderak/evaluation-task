'use client';

import { useState } from 'react';
import { AccessToken } from '@/types';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [scopes, setScopes] = useState('read, write');
  const [expiry, setExpiry] = useState(60);
  const [response, setResponse] = useState<AccessToken | null>(null);
  const [viewUserId, setViewUserId] = useState('');
  const [tokenList, setTokenList] = useState<AccessToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createToken = async () => {
    // Client-side validation
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }
    if (!scopes.trim()) {
      setError('At least one scope is required');
      return;
    }
    if (expiry <= 0 || !Number.isInteger(expiry)) {
      setError('Expiry must be a positive integer');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          scopes: scopes
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          expiresInMinutes: Number(expiry),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
      setError(null);
      // Clear form after successful creation
      setUserId('');
      setScopes('read, write');
      setExpiry(60);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const listTokens = async () => {
    if (!viewUserId.trim()) {
      setError('User ID is required to fetch tokens');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens?userId=${encodeURIComponent(viewUserId.trim())}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setTokenList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(errorMessage);
      setTokenList([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10 max-w-4xl mx-auto space-y-12 font-sans text-slate-800">
      <header className="border-b pb-4 mb-4">
        <h1 className="text-3xl font-bold text-slate-900">Token Management Service</h1>
        <p className="text-slate-500">Technical Assignment Submission</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Create Token</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. 123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scopes (comma separated)</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires (minutes)</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                value={expiry}
                onChange={(e) => setExpiry(Number(e.target.value))}
              />
            </div>
            <button
              onClick={createToken}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Generate Token'}
            </button>
          </div>
          {response && (
            <div className="mt-4 bg-slate-50 p-4 rounded text-xs font-mono overflow-auto border">
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* List Section */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">View Active Tokens</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 border p-2 rounded"
              placeholder="Filter by User ID"
              value={viewUserId}
              onChange={(e) => setViewUserId(e.target.value)}
            />
            <button
              onClick={listTokens}
              disabled={loading}
              className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Fetch'}
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {tokenList.length === 0 && <p className="text-slate-400 text-sm">No active tokens found.</p>}
            {tokenList.map((t: AccessToken) => (
              <div key={t.id} className="p-3 bg-slate-50 border rounded text-sm">
                <div className="flex justify-between font-semibold  text-slate-700">
                  <span>ID: {t.id?.slice(0, 21)}...</span>
                  <span className="text-green-600 text-xs border border-green-200 bg-green-50 px-1 rounded">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  Token: {t.token.substring(0, 8)}...{t.token.substring(t.token.length - 8)}
                </div>
                <div className="text-xs text-slate-500 mt-1">Scopes: {t.scopes.join(', ')}</div>
                <div className="text-xs text-slate-400 mt-2">Expires: {new Date(t.expiresAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
