/**
 * Cloudflare Pages Function — enregistre les clics sur les liens affiliés.
 *
 * Pour l'instant, les événements sont simplement écrits dans les logs
 * Cloudflare (visibles 24 h dans le dashboard). Quand le volume justifiera,
 * binder un namespace KV ou Analytics Engine pour la persistance.
 *
 * Payload attendu (JSON ou texte brut via sendBeacon) :
 *   {
 *     type: 'booking' | 'flight' | 'car' | 'train',
 *     context: string,        // ex: 'florence', 'kyoto-3', 'paris-tokyo'
 *     partner?: string,       // 'booking' | 'airbnb' | 'skyscanner' …
 *     href?: string,
 *     ts: number,
 *   }
 */

interface Env {}

const ALLOWED_ORIGIN_SUFFIXES = [
  '.monvoyageenpoche.fr',
  'monvoyageenpoche.fr',
  '.pages.dev',
  'localhost',
  '127.0.0.1',
];

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  try {
    const host = new URL(origin).hostname;
    const allowed = ALLOWED_ORIGIN_SUFFIXES.some(s => host === s || host.endsWith(s));
    if (!allowed) return {};
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  } catch {
    return {};
  }
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  const origin = request.headers.get('Origin');
  let body: unknown;
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: 'invalid_json' };
  }

  // Log pour Cloudflare Pages logs (visibles 24 h dans le dashboard)
  console.log('[track-click]', JSON.stringify({
    ...(body as object),
    ip: request.headers.get('CF-Connecting-IP'),
    country: (request as any).cf?.country,
    referer: request.headers.get('Referer'),
    at: Date.now(),
  }));

  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};
