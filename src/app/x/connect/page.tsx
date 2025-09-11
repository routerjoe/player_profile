'use client';

import React from 'react';

export default function ConnectXPage() {
  const [msg, setMsg] = React.useState('Preparing X OAuth…');
  const [detail, setDetail] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setBusy(true);
        setMsg('Requesting authorization URL…');

        const urlObj = new URL(window.location.href);
        const qpUser = urlObj.searchParams.get('devUserId') || '';
        const devUserId =
          qpUser ||
          (typeof window !== 'undefined' ? window.localStorage.getItem('pp_user_id') || '' : '');
        try {
          if (qpUser) {
            window.localStorage.setItem('pp_user_id', qpUser);
          }
        } catch {}

        const headers: Record<string, string> = {};
        if (devUserId) headers['x-user-id'] = devUserId;

        // Use the configured redirect URI from the server (X_REDIRECT_URI)
        // This avoids mismatches with the X app's allowed callback list.
        const res = await fetch('/api/x/auth-url', {
          method: 'GET',
          credentials: 'include',
          headers,
          cache: 'no-store',
        });

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        const body = ct.includes('application/json') ? await res.json().catch(() => ({})) : {};

        if (!res.ok) {
          if (cancelled) return;
          const message =
            body?.error ||
            (res.status === 401
              ? 'Unauthorized — please log in on your main tab first.'
              : `Request failed (${res.status})`);
          setMsg('Unable to start X connection');
          setDetail(message);
          setBusy(false);
          return;
        }

        const url = String(body?.url || '');
        if (!url) {
          if (cancelled) return;
          setMsg('Unable to start X connection');
          setDetail('Missing authorization URL from server.');
          setBusy(false);
          return;
        }

        // Leave this tab dedicated to the OAuth flow
        window.location.replace(url);
      } catch (e: any) {
        if (cancelled) return;
        setMsg('Network error starting X connection');
        setDetail(e?.message || 'Please try again.');
        setBusy(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
      }}
    >
      <div style={{ maxWidth: 520, padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Connect to X</h1>
        <p style={{ marginTop: 8, color: '#334155' }}>{msg}</p>
        {detail ? (
          <p style={{ marginTop: 4, color: '#ef4444' }} aria-live="polite">
            {detail}
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={() => window.location.reload()}
            disabled={busy}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: busy ? '#e2e8f0' : 'white',
              color: '#0f172a',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Retry
          </button>
          <a
            href="/dashboard/settings"
            target="_self"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#0f172a',
              textDecoration: 'none',
            }}
          >
            Open Settings
          </a>
          <button
            onClick={() => window.close()}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            Close Tab
          </button>
        </div>
      </div>
    </main>
  );
}