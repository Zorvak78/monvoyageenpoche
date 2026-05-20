/**
 * Cloudflare Pages Function — envoie le récap d'un voyage par email via Resend.
 *
 * Configuration requise côté Cloudflare Pages :
 *   - Variable d'environnement RESEND_API_KEY (depuis https://resend.com)
 *   - Variable optionnelle FROM_EMAIL (défaut "Mon Voyage en Poche <onboarding@resend.dev>")
 *     ⚠ Pour envoyer depuis monvoyageenpoche.fr, le domaine doit être vérifié sur Resend.
 */

interface Env {
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

interface ItineraryStep {
  id: string;
  slug: string;
  days: number;
}

interface TripPayload {
  country: string | null;
  composition: string | null;
  rythme: string;
  interests: string[];
  days: number | null;
  departureCity: string | null;
  startDate: string | null;
  itinerary: ItineraryStep[];
}

interface RequestBody {
  email: string;
  trip: TripPayload;
  shareLink: string;
}

const ALLOWED_ORIGIN_SUFFIXES = [
  '.monvoyageenpoche.fr',
  'monvoyageenpoche.fr',
  '.pages.dev',
  'localhost',
  '127.0.0.1',
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  } as Record<string, string>)[c]);
}

function buildHtml(trip: TripPayload, shareLink: string): string {
  const country = trip.country
    ? trip.country.charAt(0).toUpperCase() + trip.country.slice(1)
    : 'Ton voyage';
  const totalDays = trip.itinerary.reduce((s, x) => s + x.days, 0);
  const stepsHtml = trip.itinerary.map((s, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #F5F1EB;font-weight:600;color:#0F4C5C;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F5F1EB;color:#2D2D2D;">${escapeHtml(s.slug.replace(/-/g, ' '))}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #F5F1EB;color:#5A5A5A;text-align:right;">${s.days}j</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ton voyage en ${escapeHtml(country)}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2D2D2D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #F5F1EB;">
          <tr>
            <td style="padding:32px 32px 16px;text-align:center;background:linear-gradient(135deg,#0F4C5C 0%,#1B3A4B 100%);color:#FFFFFF;">
              <p style="margin:0 0 4px;font-style:italic;color:#D4A03C;font-size:14px;">Mon Voyage en Poche</p>
              <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;">Ton voyage en ${escapeHtml(country)}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                ${totalDays} jours · ${escapeHtml(trip.composition || '—')}${trip.startDate ? ' · à partir du ' + escapeHtml(trip.startDate) : ''}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <h2 style="margin:0 0 12px;font-family:Georgia,serif;color:#0F4C5C;font-size:18px;">Ton parcours</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${stepsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <h2 style="margin:0 0 12px;font-family:Georgia,serif;color:#0F4C5C;font-size:18px;">Reprendre la planification</h2>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#5A5A5A;">
                Ton voyage est sauvegardé. Clique ci-dessous pour le rouvrir et finaliser tes réservations.
              </p>
              <a href="${escapeHtml(shareLink)}" style="display:inline-block;padding:12px 24px;background:#D4A03C;color:#2D2D2D;font-weight:700;text-decoration:none;border-radius:999px;">
                Ouvrir mon voyage
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;background:#F5F1EB;font-size:12px;color:#5A5A5A;text-align:center;">
              Cet email a été envoyé par Mon Voyage en Poche à ta demande.
              Tu n'es pas inscrit·e à une newsletter.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS / origine
  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      const allowed = ALLOWED_ORIGIN_SUFFIXES.some(s =>
        host === s || host.endsWith(s)
      );
      if (!allowed) {
        return jsonResponse({ error: 'Origine non autorisée.' }, 403);
      }
    } catch {
      return jsonResponse({ error: 'Origine invalide.' }, 400);
    }
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({
      error: "L'envoi par email n'est pas encore configuré côté serveur. Ajoute la clé RESEND_API_KEY dans les variables d'environnement Cloudflare Pages.",
    }, 503);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Payload JSON invalide.' }, 400);
  }

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return jsonResponse({ error: 'Adresse email invalide.' }, 400);
  }
  if (!body.trip || !body.shareLink) {
    return jsonResponse({ error: 'Payload incomplet.' }, 400);
  }

  const from = env.FROM_EMAIL || 'Mon Voyage en Poche <onboarding@resend.dev>';
  const country = body.trip.country
    ? body.trip.country.charAt(0).toUpperCase() + body.trip.country.slice(1)
    : 'ton voyage';

  const resendBody = {
    from,
    to: body.email,
    subject: `Ton voyage en ${country} — récap complet`,
    html: buildHtml(body.trip, body.shareLink),
  };

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resendBody),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return jsonResponse({
      error: 'Envoi impossible, vérifie ta configuration Resend.',
      details: text.slice(0, 300),
    }, 502);
  }

  return jsonResponse({ ok: true });
};
