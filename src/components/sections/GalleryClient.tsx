'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { PhotoRecord } from '@/lib/photos/types';

type Props = {
  photos: PhotoRecord[];
};

export function GalleryClient({ photos }: Props) {
  const items = useMemo(
    () => (Array.isArray(photos) ? photos : []).filter(Boolean),
    [photos]
  );

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  const openAt = useCallback((i: number) => {
    lastActiveRef.current = (document.activeElement as HTMLElement) || null;
    setIndex(i);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Restore focus
    const last = lastActiveRef.current;
    if (last && typeof last.focus === 'function') {
      setTimeout(() => last.focus(), 0);
    }
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  // Keyboard controls + focus trap
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'Tab') {
        // naive trap: keep focus inside dialog
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-gallery-dialog] button, [data-gallery-dialog] a, [data-gallery-dialog] [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener('keydown', onKey);
    // Focus close button initially
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, prev, next]);

  if (!items.length) return null;

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((p, i) => {
          const isExternal = /^https?:\/\//i.test(p.url);
          const isSvg = /\.svg($|\?)/i.test(p.url);
          const alt = p.alt || p.title || 'Gallery image';
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openAt(i)}
                className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cool)] rounded-md overflow-hidden"
                aria-label={`Open image: ${alt}`}
              >
                <div className="relative w-full pt-[75%] bg-slate-100 border border-slate-200 rounded-md">
                  {isExternal || isSvg ? (
                    <img
                      src={p.url}
                      alt={alt}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={p.url}
                      alt={alt}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 25vw"
                      className="object-cover"
                      priority={false}
                    />
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          data-gallery-dialog
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={close}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative max-w-5xl w-full">
              {/* Image */}
              <div className="relative w-full pt-[56%] bg-black">
                {(() => {
                  const p = items[index];
                  const isExternal = /^https?:\/\//i.test(p.url);
                  const isSvg = /\.svg($|\?)/i.test(p.url);
                  const alt = p.alt || p.title || 'Gallery image';
                  return isExternal || isSvg ? (
                    <img
                      src={p.url}
                      alt={alt}
                      width={1600}
                      height={900}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src={p.url}
                      alt={alt}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      priority
                    />
                  );
                })()}
              </div>

              {/* Controls */}
              <div className="absolute inset-x-0 -bottom-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    className="rounded-md border border-slate-300 bg-white/90 px-3 py-1.5 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-md border border-slate-300 bg-white/90 px-3 py-1.5 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
                  >
                    Next
                  </button>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={close}
                  className="rounded-md border border-slate-300 bg-white/90 px-3 py-1.5 text-sm font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default GalleryClient;