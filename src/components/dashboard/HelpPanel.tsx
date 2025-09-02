'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  /**
   * Section key like "profile", "athletics", "media", "photos", "highlights",
   * "blog", "settings", "teams", "stats", "schedule", "performance", "dashboard"
   */
  sectionKey?: string;
  defaultOpen?: boolean;
};

function usePersistedToggle(key: string, initial: boolean) {
  const [open, setOpen] = useState(initial);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw === 'open') setOpen(true);
      if (raw === 'closed') setOpen(false);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, open ? 'open' : 'closed');
      }
    } catch {}
  }, [key, open]);

  return { open, setOpen };
}

function resolveSectionFromPath(pathname: string | null): string {
  const p = pathname || '';
  if (p.startsWith('/dashboard/profile')) return 'profile';
  if (p.startsWith('/dashboard/athletics')) return 'athletics';
  if (p.startsWith('/dashboard/photos')) return 'photos';
  if (p.startsWith('/dashboard/highlights')) return 'highlights';
  if (p.startsWith('/dashboard/media')) return 'media';
  if (p.startsWith('/dashboard/blog')) return 'blog';
  if (p.startsWith('/dashboard/settings')) return 'settings';
  if (p.startsWith('/dashboard/teams')) return 'teams';
  if (p.startsWith('/dashboard/stats')) return 'stats';
  if (p.startsWith('/dashboard/schedule')) return 'schedule';
  if (p.startsWith('/dashboard/performance')) return 'performance';
  return 'dashboard';
}

function SectionContent({ section }: { section: string }) {
  const commonExportHelp = (
    <li>
      Backups and migration: use Settings → Export JSON for profile/teams/blog drafts, and Export Assets ZIP for files under /uploads. Restore with the matching Import actions.
    </li>
  );

  switch (section) {
    case 'profile':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Complete your public profile: basics, academics, recruiting links, and photos configuration.</li>
          <li>Edits are saved as a draft in your browser. When ready, click Publish (top bar) to push changes to your public site.</li>
          <li>Use consistent image choices so exported URLs remain valid across environments.</li>
          {commonExportHelp}
        </ul>
      );
    case 'athletics':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Central place for athletic info: teams, stats, schedule, and performance.</li>
          <li>Keep coach contact details current; ensure emails are valid to pass validation.</li>
          <li>Stats/schedule updates reflect on your public page after Publish.</li>
          {commonExportHelp}
        </ul>
      );
    case 'media':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Manage visual media. Use Photos to upload images and Highlights to add video links and thumbnails.</li>
          <li>Failed uploads show per-item errors—use the Retry button on the row to retry a single file.</li>
          <li>Local uploads are stored under /public/uploads/your-id and can be exported via Settings → Export Assets ZIP.</li>
          {commonExportHelp}
        </ul>
      );
    case 'photos':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Upload images for your gallery or use them across the site (e.g., blog posts, hero).</li>
          <li>Each upload shows progress and status; click Retry on a row to reattempt a failed file.</li>
          <li>Prefer appropriately sized images to improve performance and avoid layout shifts.</li>
          {commonExportHelp}
        </ul>
      );
    case 'highlights':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Add highlight entries with a video URL and optional thumbnail image.</li>
          <li>Use stable links (e.g., a final-cut playlist) to avoid broken embeds on the public site.</li>
          <li>Publish to push updates live; export/import moves the metadata and referenced local thumbnails.</li>
          {commonExportHelp}
        </ul>
      );
    case 'blog':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Draft posts with title, summary, content, optional hero image, and tags.</li>
          <li>Drafts are stored locally in your browser for quick editing; use Settings → Export JSON to move drafts to another device.</li>
          <li>Only posts marked published appear on your public blog.</li>
          {commonExportHelp}
        </ul>
      );
    case 'settings':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Update account details, theme colors for the hero area, and change your password.</li>
          <li>Export/Import: use Export JSON for profile/teams/blog drafts. Use Export Assets ZIP to download all files under /uploads, and Import Assets ZIP to restore them.</li>
          <li>After an import, refresh your public site to see changes.</li>
        </ul>
      );
    case 'teams':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Maintain School and Travel team information visible to recruiters.</li>
          <li>Coach email must be valid when provided; socials are managed via their dedicated actions.</li>
          <li>Changes appear publicly after you click Publish in the top bar.</li>
          {commonExportHelp}
        </ul>
      );
    case 'stats':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Record season-by-season statistics relevant to your sport.</li>
          <li>Keep entries consistent (e.g., units and naming) for a clean public presentation.</li>
          {commonExportHelp}
        </ul>
      );
    case 'schedule':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Add upcoming games/events. Include opponent, date/time, and location if available.</li>
          <li>Outdated items can be removed to keep things tidy; publish to update the site.</li>
          {commonExportHelp}
        </ul>
      );
    case 'performance':
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Track performance metrics (e.g., speed, strength) to highlight your progress.</li>
          <li>Update periodically and publish to reflect improvements on your site.</li>
          {commonExportHelp}
        </ul>
      );
    default:
      return (
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li>Use the tabs to navigate between Profile, Athletics, Media, Blog, and Settings.</li>
          <li>Edits are drafted locally; use the Publish button (top bar) to push updates live.</li>
          {commonExportHelp}
        </ul>
      );
  }
}

export default function HelpPanel({ sectionKey, defaultOpen = true }: Props) {
  const pathname = usePathname();
  const resolved = useMemo(
    () => sectionKey || resolveSectionFromPath(pathname),
    [sectionKey, pathname],
  );

  const storageKey = `pp:help:state:${resolved}`;
  const { open, setOpen } = usePersistedToggle(storageKey, defaultOpen);

  return (
    <section
      className="card p-4 mb-6 border-l-4 border-[var(--brand-green)] bg-white"
      aria-label="Help"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">Help</h2>
        <button
          className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
          aria-expanded={open}
          aria-controls={`help-panel-${resolved}`}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      <div id={`help-panel-${resolved}`} hidden={!open} className="mt-3">
        <SectionContent section={resolved} />
      </div>
    </section>
  );
}