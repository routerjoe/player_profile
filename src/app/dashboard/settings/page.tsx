'use client';

import React, { useEffect, useState } from 'react';
import {
  exportDraft,
  importDraft,
  resetDraft,
  getDraft,
  getRawDraft,
} from '@/lib/dashboard/storage';

type Issue = { path: string; message: string };

const field =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const area =
  'block w-full min-h-[180px] rounded-lg border border-slate-300 bg-white p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const label = 'text-sm font-medium text-slate-700';
const section = 'card p-5 space-y-4';
const sectionTitle = 'text-base font-semibold text-slate-800';
const btn =
  'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]';
const btnPrimary = `${btn} bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]`;
const btnGhost = `${btn} border border-slate-300 hover:bg-slate-50 text-slate-800`;
const btnDanger = `${btn} bg-red-600 text-white hover:bg-red-700`;

export default function DashboardSettingsPage() {
  // Export
  const [exportText, setExportText] = useState('');
  const [copied, setCopied] = useState(false);

  // Import
  const [importText, setImportText] = useState('');
  const [importOk, setImportOk] = useState<boolean | null>(null);
  const [importErrors, setImportErrors] = useState<Issue[] | undefined>(undefined);

  // Reset
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  function refreshExport(preferValid = true) {
    const text = exportDraft(preferValid);
    setExportText(text);
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  function handleImport() {
    const res = importDraft(importText);
    setImportOk(res.valid);
    setImportErrors(res.errors);
  }

  function handleReset() {
    const ok = window.confirm('This will clear your local draft (raw and last-valid). Continue?');
    if (!ok) return;
    resetDraft();
    refreshExport(true);
    setImportText('');
    setImportOk(null);
    setImportErrors(undefined);
    setResetMsg('Draft cleared from this browser.');
    setTimeout(() => setResetMsg(null), 2000);
  }

  useEffect(() => {
    refreshExport(true);
    // Prime import box with current raw for convenience
    const raw = getRawDraft() ?? getDraft() ?? {};
    try {
      setImportText(JSON.stringify(raw, null, 2));
    } catch {
      setImportText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Export */}
      <section className={section}>
        <h2 className={sectionTitle}>Export Draft JSON</h2>
        <p className="text-sm text-slate-600">
          The exported JSON includes the last valid snapshot (when available), otherwise the raw form
          state. You can copy or download and use it later to import.
        </p>
        <div className="flex items-center gap-2">
          <button className={btnPrimary} onClick={() => refreshExport(true)} aria-label="Refresh export">
            Refresh
          </button>
          <button className={btnGhost} onClick={copyExport} aria-label="Copy export JSON">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <textarea className={area} value={exportText} readOnly aria-label="Export JSON" />
      </section>

      {/* Import */}
      <section className={section}>
        <h2 className={sectionTitle}>Import Draft JSON</h2>
        <p className="text-sm text-slate-600">
          Paste a JSON payload that matches the Profile schema. Valid data will immediately persist
          to your browser storage.
        </p>
        <div className="space-y-2">
          <label className={label}>JSON</label>
          <textarea
            className={area}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="{ ... }"
            aria-label="Import JSON"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className={btnPrimary} onClick={handleImport} aria-label="Validate and Import">
            Validate & Import
          </button>
          <button className={btnGhost} onClick={() => refreshExport(true)} aria-label="Refresh after import">
            Refresh Export
          </button>
        </div>

        {importOk === true && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Import successful. Draft validated and saved.
          </div>
        )}
        {importOk === false && importErrors && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-sm font-medium text-red-800">Validation issues</p>
            <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
              {importErrors.map((e, i) => (
                <li key={i}>
                  <code>{e.path || '(root)'}</code> — {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className={section}>
        <h2 className={sectionTitle}>Danger Zone</h2>
        <p className="text-sm text-slate-600">
          Reset will clear both the raw draft and the last-valid snapshot from this browser.
        </p>
        <button className={btnDanger} onClick={handleReset} aria-label="Reset local draft">
          Reset Local Draft
        </button>
        {resetMsg && (
          <div className="text-sm text-slate-600" role="status" aria-live="polite">
            {resetMsg}
          </div>
        )}
      </section>
    </div>
  );
}