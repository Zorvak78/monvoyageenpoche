/**
 * Builders d'URLs affiliées vers Booking, Airbnb, DiscoverCars, Skyscanner, TripAdvisor.
 *
 * Les IDs d'affiliation (AID, partner ID, etc.) sont des placeholders.
 * À remplacer par les vrais IDs une fois les programmes activés.
 */

const BOOKING_AID = '';
const AIRBNB_PID = '';
const SKYSCANNER_PARTNER = '';
const DISCOVERCARS_PARTNER = '';
const TRAINLINE_PARTNER = '';

/** IATA codes des villes de départ communes. */
const cityToIata: Record<string, string> = {
  'paris': 'PAR',
  'lyon': 'LYS',
  'marseille': 'MRS',
  'nice': 'NCE',
  'toulouse': 'TLS',
  'bordeaux': 'BOD',
  'nantes': 'NTE',
  'strasbourg': 'SXB',
  'bruxelles': 'BRU',
  'brussels': 'BRU',
  'geneve': 'GVA',
  'geneva': 'GVA',
  'zurich': 'ZRH',
  'luxembourg': 'LUX',
  'madrid': 'MAD',
  'londres': 'LON',
  'london': 'LON',
};

/** Données par pays : ville d'arrivée principale, prix indicatifs, recos transport. */
export const countriesData: Record<string, {
  mainCity: string;
  mainIata: string;
  flightPerAdult: number;
  carPerDay: number;
  trainRelevant: boolean;
  flightRecommendations?: string[];
  carRecommendations?: {
    vehicle: string;
    notes: string[];
  };
}> = {
  namibie: {
    mainCity: 'Windhoek',
    mainIata: 'WDH',
    flightPerAdult: 950,
    carPerDay: 95,
    trainRelevant: false,
    flightRecommendations: [
      'Pas de vol direct depuis la France : escales via Francfort, Doha ou Addis-Abeba.',
      'Temps de trajet total : 12 à 18 h selon les correspondances.',
      'Réserver 2 à 3 mois à l\'avance pour les meilleurs tarifs.',
    ],
    carRecommendations: {
      vehicle: '4x4 indispensable (Toyota Hilux ou équivalent)',
      notes: [
        'Tente de toit conseillée pour les nuits au plus près de la nature.',
        'Double roue de secours + jerrycan de carburant : non négociable.',
        'Permis international requis. Conduite à gauche.',
      ],
    },
  },
  italie: {
    mainCity: 'Rome',
    mainIata: 'ROM',
    flightPerAdult: 180,
    carPerDay: 55,
    trainRelevant: true,
    carRecommendations: {
      vehicle: 'Citadine ou compacte',
      notes: [
        'Privilégier les petits modèles pour les centres-villes anciens et les routes étroites.',
        'Boîte manuelle largement répandue ; boîte auto en supplément.',
      ],
    },
  },
  perou: {
    mainCity: 'Lima',
    mainIata: 'LIM',
    flightPerAdult: 850,
    carPerDay: 60,
    trainRelevant: false,
    flightRecommendations: [
      'Escale fréquente à Madrid, Amsterdam ou Bogota.',
      'Vols intérieurs (Cuzco, Arequipa) souvent utiles vu les distances.',
    ],
    carRecommendations: {
      vehicle: 'SUV recommandé, 4x4 pour la cordillère',
      notes: [
        'Routes de montagne, altitude élevée — bien vérifier l\'état du véhicule.',
      ],
    },
  },
  japon: {
    mainCity: 'Tokyo',
    mainIata: 'TYO',
    flightPerAdult: 900,
    carPerDay: 70,
    trainRelevant: true,
    carRecommendations: {
      vehicle: 'Citadine ou compacte (conduite à gauche)',
      notes: [
        'Réseau ferroviaire excellent : le train est souvent plus pratique que la voiture.',
        'JR Pass à étudier pour les longs trajets.',
      ],
    },
  },
};

export function cityIata(city: string | null): string {
  if (!city) return '';
  const k = city.trim().toLowerCase().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a');
  return cityToIata[k] || '';
}

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

/** Distance à vol d'oiseau en km (haversine). */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function discoverCarsUrl(opts: {
  pickupCity: string;
  pickupDate?: string;       // YYYY-MM-DD
  dropoffCity?: string;
  dropoffDate?: string;
}): string {
  const url = new URL('https://www.discovercars.com/');
  url.searchParams.set('pickup_location', opts.pickupCity);
  url.searchParams.set('dropoff_location', opts.dropoffCity || opts.pickupCity);
  if (opts.pickupDate) url.searchParams.set('pickup_date', opts.pickupDate);
  if (opts.dropoffDate) url.searchParams.set('dropoff_date', opts.dropoffDate);
  url.searchParams.set('pickup_time', '10:00');
  url.searchParams.set('dropoff_time', '10:00');
  if (DISCOVERCARS_PARTNER) url.searchParams.set('a_aid', DISCOVERCARS_PARTNER);
  return url.toString();
}

export function skyscannerUrl(opts: {
  fromCity: string;
  toCity?: string;
  fromIata?: string;
  toIata?: string;
  departDate?: string;       // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
}): string {
  const fromI = opts.fromIata || cityIata(opts.fromCity);
  const toI = opts.toIata || cityIata(opts.toCity || '');
  const yymmdd = (iso?: string) => iso ? iso.slice(2).replace(/-/g, '') : '';

  // Deep link si IATA connus
  if (fromI && toI && opts.departDate) {
    let path = `https://www.skyscanner.fr/transport/vols/${fromI.toLowerCase()}/${toI.toLowerCase()}/${yymmdd(opts.departDate)}/`;
    if (opts.returnDate) path += `${yymmdd(opts.returnDate)}/`;
    const params = new URLSearchParams();
    if (opts.adults) params.set('adultsv2', String(opts.adults));
    if (SKYSCANNER_PARTNER) params.set('associateid', SKYSCANNER_PARTNER);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  // Fallback : page d'accueil avec recherche libre
  const url = new URL('https://www.skyscanner.fr/');
  return url.toString();
}

export function trainlineUrl(opts: {
  fromCity: string;
  toCity: string;
  departDate?: string;
  adults?: number;
}): string {
  const url = new URL('https://www.thetrainline.com/');
  if (TRAINLINE_PARTNER) url.searchParams.set('utm_source', TRAINLINE_PARTNER);
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
