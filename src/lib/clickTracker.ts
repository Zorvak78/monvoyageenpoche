/**
 * Tracking côté client des clics sur les liens affiliés.
 *
 * Tout `<a data-track="...">` déclenche un POST navigator.sendBeacon vers
 * `/api/track-click` avant que la navigation ne se produise.
 *
 * Usage dans un template :
 *   <a href={url}
 *      data-track="booking"
 *      data-track-context="florence"
 *      data-track-partner="booking">…</a>
 */

interface TrackPayload {
  type: string;
  context?: string;
  partner?: string;
  href?: string;
  ts: number;
}

export function setupClickTracking() {
  if (typeof document === 'undefined') return;
  if ((window as any).__mvepTracking) return;
  (window as any).__mvepTracking = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const link = target?.closest('[data-track]') as HTMLAnchorElement | null;
    if (!link) return;

    const payload: TrackPayload = {
      type: link.dataset.track || 'unknown',
      context: link.dataset.trackContext,
      partner: link.dataset.trackPartner,
      href: link.href || undefined,
      ts: Date.now(),
    };

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/track-click', blob);
    } catch {
      // Silent fail — ne doit pas bloquer la navigation utilisateur
    }
  }, { capture: true });
}
