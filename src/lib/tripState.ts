/**
 * État du voyage de l'utilisateur, persisté en localStorage.
 * Partageable via URL (paramètre ?t=<base64>).
 */

export type Composition = 'couple' | 'famille' | 'amis' | 'solo';
export type Interest =
  | 'nature' | 'aventure' | 'culture' | 'gastronomie' | 'detente'
  | 'faune' | 'plages' | 'photographie' | 'vie-nocturne' | 'spiritualite';
export type Rythme = 'lent' | 'modere' | 'intense';

export interface ItineraryStep {
  id: string;
  slug: string;
  days: number;
}

export function makeStepId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export interface TripState {
  country: string | null;
  composition: Composition | null;
  rythme: Rythme;
  interests: Interest[];
  days: number | null;
  departureCity: string | null;
  startDate: string | null; // ISO YYYY-MM-DD
  itinerary: ItineraryStep[];
  updatedAt: number;
}

const STORAGE_KEY = 'mvep:trip';

const defaultState: TripState = {
  country: null,
  composition: null,
  rythme: 'modere',
  interests: [],
  days: null,
  departureCity: null,
  startDate: null,
  itinerary: [],
  updatedAt: 0,
};

function migrate(state: any): TripState {
  if (Array.isArray(state.itinerary)) {
    state.itinerary = state.itinerary.map((item: any) => {
      // string → object (very old format)
      if (typeof item === 'string') return { id: makeStepId(), slug: item, days: 1 };
      // object without id → add one
      if (!item.id) return { ...item, id: makeStepId() };
      return item;
    });
  }
  return { ...defaultState, ...state };
}

export function loadTrip(): TripState {
  if (typeof window === 'undefined') return { ...defaultState };

  const params = new URLSearchParams(window.location.search);
  const shared = params.get('t');
  if (shared) {
    try {
      const decoded = JSON.parse(atob(shared));
      const merged = migrate({ ...decoded, updatedAt: Date.now() });
      saveTrip(merged);
      return merged;
    } catch (e) {}
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return migrate(JSON.parse(raw));
  } catch (e) {
    return { ...defaultState };
  }
}

export function saveTrip(state: Partial<TripState>): TripState {
  const current = loadTripFromStorage();
  const next: TripState = { ...current, ...state, updatedAt: Date.now() };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetTrip(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function shareUrl(state: TripState, basePath = '/voyage/recap'): string {
  const encoded = btoa(JSON.stringify(state));
  const url = new URL(basePath, window.location.origin);
  url.searchParams.set('t', encoded);
  return url.toString();
}

function loadTripFromStorage(): TripState {
  if (typeof window === 'undefined') return { ...defaultState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return migrate(JSON.parse(raw));
  } catch (e) {
    return { ...defaultState };
  }
}
