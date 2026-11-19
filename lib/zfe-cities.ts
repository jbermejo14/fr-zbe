import citiesJson from '../data/zfe-cities.json';
import type { ZfeArea } from './zfe-areas';

export interface ZfeCity {
  /** 'grand-paris' */
  slug: string;
  /** 'Grand Paris' */
  name: string;
  /** 'ZFE-m du Grand Paris' */
  zoneName: string;
  /** 'Métropole du Grand Paris' */
  authority: string;
  /** SIREN del EPCI: las áreas cuyo id empieza por él son de esta ciudad. */
  siren: string;
  /** [lat, lon] */
  center: [number, number];
  zoom: number;
  /** Descripción corta del perímetro en francés: « Intérieur de l'A86 (A86 exclue) ». */
  perimeterLabel: string;
  /** Sitio oficial de la ZFE. */
  infoUrl: string;
}

/** Las 10 ciudades, en el orden del selector. */
export const ZFE_CITIES: readonly ZfeCity[] = citiesJson.map((city) => ({
  ...city,
  center: [city.center[0], city.center[1]],
}));

export function findCityBySlug(slug: string): ZfeCity | null {
  return ZFE_CITIES.find((city) => city.slug === slug) ?? null;
}

/** Criterio único de pertenencia: el id oficial del área empieza por "<SIREN del EPCI>-". */
function citiesAreaBelongsTo(areaId: string, city: ZfeCity): boolean {
  return areaId.startsWith(`${city.siren}-`);
}

/** Ciudad a la que pertenece un área (su id empieza por el SIREN de la ciudad), o null. */
export function cityForAreaId(areaId: string): ZfeCity | null {
  return ZFE_CITIES.find((city) => citiesAreaBelongsTo(areaId, city)) ?? null;
}

/** Áreas de la ciudad (id empieza por city.siren). */
export function areasForCity(city: ZfeCity, areas: readonly ZfeArea[]): ZfeArea[] {
  return areas.filter((area) => citiesAreaBelongsTo(area.id, city));
}
