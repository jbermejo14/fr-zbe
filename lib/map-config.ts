import type { CritairClass, VehicleType } from './critair';
import { categoryFor } from './zfe-areas';
import type { ZfeArea } from './zfe-areas';
import { isAllowed } from './zfe-rules';

/**
 * Configuración del mapa de las ZFE. Teselas de OpenStreetMap en los dos temas
 * (sin CARTO: sus basemaps exigen clave de API).
 */

const MAP_OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MAP_TILE_MAX_ZOOM = 19;
const MAP_TILE_SUBDOMAINS = 'abc';

export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_OPTIONS = {
  attribution: MAP_OSM_ATTRIBUTION,
  maxZoom: MAP_TILE_MAX_ZOOM,
  subdomains: MAP_TILE_SUBDOMAINS,
};

/** Vista inicial: Francia metropolitana. [lat, lon] */
export const MAP_FRANCE_CENTER: [number, number] = [46.6, 2.5];
export const MAP_FRANCE_ZOOM = 5;
export const MAP_MIN_ZOOM = 5;
export const MAP_FLY_DURATION_SECONDS = 0.8;
/** Margen en píxeles [horizontal, vertical] al encuadrar las áreas de una ciudad. */
export const MAP_FLY_PADDING: [number, number] = [32, 32];

export const MAP_AREA_WEIGHT = 2.5;
export const MAP_AREA_WEIGHT_HOVER = 4;
/** Trazo del área de la ciudad seleccionada. */
export const MAP_AREA_WEIGHT_SELECTED = 5;
export const MAP_AREA_OPACITY = 0.9;
export const MAP_AREA_FILL_OPACITY = 0.25;

/** Estado de un área en el mapa: permitido, prohibido o sin dato (sin vignette o sin regla). */
export type MapAreaState = 'allowed' | 'restricted' | 'neutral';

/** Variable CSS que da el color de cada estado (se leen en el cliente, sin hex a mano). */
export const MAP_STATE_COLOR_VARIABLES: Record<MapAreaState, { stroke: string; fill: string }> = {
  allowed: { stroke: '--color-critair-0', fill: '--color-critair-0' },
  restricted: { stroke: '--negative', fill: '--negative' },
  neutral: { stroke: '--text-secondary', fill: '--border-hover' },
};

export const MAP_STATE_LABELS: Record<MapAreaState, string> = {
  allowed: 'Autorisé',
  restricted: 'Interdit',
  neutral: 'Aucune règle, ou vignette non choisie',
};

/** Estado de un área para una vignette y un tipo de vehículo. */
export function mapAreaState(
  area: ZfeArea,
  critair: CritairClass | null,
  vehicleType: VehicleType,
): MapAreaState {
  const rule = area.rules[categoryFor(vehicleType)];
  if (critair === null || rule === undefined) return 'neutral';
  return isAllowed(critair, rule.threshold) ? 'allowed' : 'restricted';
}

/** Valor de una variable CSS del tema en el <html>. Solo en el navegador. */
export function mapReadCssVariable(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}
