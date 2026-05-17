/**
 * Builders d'URLs affiliées vers Booking, Airbnb, DiscoverCars, Skyscanner, TripAdvisor.
 *
 * Les IDs d'affiliation (AID, partner ID, etc.) sont des placeholders.
 * À remplacer par les vrais IDs une fois les programmes activés.
 */

const BOOKING_AID = ''; // ex: '1234567'
const AIRBNB_PID = '';
const SKYSCANNER_PARTNER = '';
const DISCOVERCARS_PARTNER = '';

export function adultsFromComposition(c: string | null): number {
  switch (c) {
    case 'couple': return 2;
    case 'famille': return 4;
    case 'amis': return 4;
    case 'solo': return 1;
    default: return 2;
  }
}

function ensureProtocol(s: string) {
  return s.startsWith('http') ? s : 'https://' + s;
}

export function bookingSearchUrl(opts: {
  destination: string;
  adults?: number;
  checkin?: string; // YYYY-MM-DD
  checkout?: string;
}): string {
  const url = new URL('https://www.booking.com/searchresults.html');
  url.searchParams.set('ss', opts.destination);
  if (opts.adults) url.searchParams.set('group_adults', String(opts.adults));
  if (opts.checkin) url.searchParams.set('checkin', opts.checkin);
  if (opts.checkout) url.searchParams.set('checkout', opts.checkout);
  if (BOOKING_AID) url.searchParams.set('aid', BOOKING_AID);
  url.searchParams.set('selected_currency', 'EUR');
  return url.toString();
}

export function airbnbSearchUrl(opts: {
  destination: string;
  adults?: number;
  checkin?: string;  // YYYY-MM-DD
  checkout?: string;
}): string {
  const place = encodeURIComponent(opts.destination);
  let url = `https://www.airbnb.fr/s/${place}/homes`;
  const params = new URLSearchParams();
  if (opts.checkin) params.set('checkin', opts.checkin);
  if (opts.checkout) params.set('checkout', opts.checkout);
  if (opts.adults) params.set('adults', String(opts.adults));
  if (AIRBNB_PID) params.set('source', AIRBNB_PID);
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Cascade les dates par étape de l'itinéraire à partir d'une date de départ.
 * Retourne pour chaque step un { checkin, checkout } au format YYYY-MM-DD.
 */
export function computeStepDates(
  startDate: string,
  itinerary: Array<{ id: string; days: number }>
): Map<string, { checkin: string; checkout: string }> {
  const dates = new Map<string, { checkin: string; checkout: string }>();
  const start = new Date(startDate + 'T00:00:00');
  let cumulative = 0;
  for (const step of itinerary) {
    const ci = new Date(start);
    ci.setDate(ci.getDate() + cumulative);
    const co = new Date(ci);
    co.setDate(co.getDate() + step.days);
    dates.set(step.id, {
      checkin: ci.toISOString().slice(0, 10),
      checkout: co.toISOString().slice(0, 10),
    });
    cumulative += step.days;
  }
  return dates;
}

export function formatDateFr(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function discoverCarsUrl(opts: {
  pickupCity: string;
  pickupDate?: string;
  dropoffCity?: string;
  dropoffDate?: string;
}): string {
  const url = new URL('https://www.discovercars.com');
  url.searchParams.set('pickup_location', opts.pickupCity);
  if (opts.dropoffCity) url.searchParams.set('dropoff_location', opts.dropoffCity);
  if (opts.pickupDate) url.searchParams.set('pickup_date', opts.pickupDate);
  if (opts.dropoffDate) url.searchParams.set('dropoff_date', opts.dropoffDate);
  if (DISCOVERCARS_PARTNER) url.searchParams.set('a_aid', DISCOVERCARS_PARTNER);
  return url.toString();
}

export function skyscannerUrl(opts: {
  fromCity: string;
  toCity: string;
  adults?: number;
}): string {
  const url = new URL('https://www.skyscanner.fr/transport/vols/');
  // Skyscanner uses IATA codes ideally; we fallback to city query string
  url.searchParams.set('from', opts.fromCity);
  url.searchParams.set('to', opts.toCity);
  if (opts.adults) url.searchParams.set('adults', String(opts.adults));
  if (SKYSCANNER_PARTNER) url.searchParams.set('associateid', SKYSCANNER_PARTNER);
  return url.toString();
}

export function tripadvisorSearchUrl(query: string): string {
  return `https://www.tripadvisor.fr/Search?q=${encodeURIComponent(query)}`;
}

/**
 * Estimation grossière du prix par nuit selon le pays et la composition.
 * Valeurs en EUR par nuit pour l'ensemble du groupe (pas par personne).
 */
const baseNightlyByCountry: Record<string, number> = {
  namibie: 110,   // lodge moyen
  italie: 130,
  perou: 70,
  japon: 140,
};

const compositionMultiplier: Record<string, number> = {
  solo: 0.7,
  couple: 1,
  famille: 1.45,
  amis: 1.5,
};

export function estimateNightlyPrice(country: string | null, composition: string | null): number {
  const base = (country && baseNightlyByCountry[country]) || 100;
  const mult = (composition && compositionMultiplier[composition]) || 1;
  return Math.round(base * mult);
}
