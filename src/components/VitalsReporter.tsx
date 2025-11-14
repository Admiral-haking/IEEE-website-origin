"use client";

import React from 'react';
import { flags } from '@/config/flags-client';

export default function VitalsReporter() {
  const [enabled, setEnabled] = React.useState<boolean>(!!flags.vitalsEnabled);
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/settings/public/features', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        if (typeof data?.vitalsEnabled === 'boolean') setEnabled(Boolean(data.vitalsEnabled));
      } catch {}
    })();
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      try {
        const mod = await import('web-vitals');
        const send = (metric: any) => {
          if (!active) return;
          try {
            const payload = {
              name: metric.name,
              value: metric.value,
              id: metric.id,
              label: (metric as any).label,
              delta: (metric as any).delta,
              rating: (metric as any).rating,
              pathname: window.location.pathname,
              ts: Date.now()
            };
            navigator.sendBeacon?.('/api/_ops/vitals', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
          } catch {}
        };
        mod.onCLS(send); mod.onLCP(send); mod.onINP(send); mod.onFCP(send); mod.onTTFB(send);
      } catch {}
    })();
    return () => { active = false; };
  }, [enabled]);
  return null;
}
