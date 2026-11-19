import type { VehicleType } from './critair';

export type RestrictedCategory = 'vp' | 'vul' | 'deux_rm';
/** Valor del esquema: vignette a partir de la cual se prohíbe. */
export type CritairThreshold = 'EL' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'NC';

export interface CategoryRule {
  threshold: CritairThreshold;
  openingHours: string;
}

export interface GeoJsonPolygonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface ZfeArea {
  id: string;
  /** 'yyyy-mm-dd' */
  startDate: string;
  endDate: string | null;
  /** Si falta la clave, esa categoría no tiene restricción. */
  rules: Partial<Record<RestrictedCategory, CategoryRule>>;
  decreeUrl: string | null;
  infoUrl: string | null;
  /** Geometría GeoJSON tal cual (Polygon o MultiPolygon), para Leaflet. */
  geometry: GeoJsonPolygonGeometry;
}

export class AiresFormatError extends Error {}

const RESTRICTED_CATEGORIES: readonly RestrictedCategory[] = ['vp', 'vul', 'deux_rm'];
const CRITAIR_THRESHOLDS: readonly string[] = ['EL', 'V1', 'V2', 'V3', 'V4', 'V5', 'NC'];
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const CATEGORY_BY_VEHICLE_TYPE: Record<VehicleType, RestrictedCategory> = {
  car: 'vp',
  van: 'vul',
  motorcycle: 'deux_rm',
};

type JsonObject = Record<string, unknown>;

function areasIsObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function areasFail(index: number, field: string, problem: string): never {
  throw new AiresFormatError(`aires.geojson, feature ${index}, campo "${field}": ${problem}.`);
}

function areasIsValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function areasReadId(props: JsonObject, index: number): string {
  if (typeof props.id !== 'string' || props.id === '') areasFail(index, 'id', 'falta o no es una cadena');
  return props.id;
}

function areasReadRequiredDate(props: JsonObject, index: number, field: string): string {
  const value = props[field];
  if (!areasIsValidIsoDate(value)) areasFail(index, field, 'debe ser una fecha con formato yyyy-mm-dd');
  return value;
}

function areasReadOptionalDate(props: JsonObject, index: number, field: string): string | null {
  const value = props[field];
  if (value === undefined || value === null) return null;
  return areasReadRequiredDate(props, index, field);
}

function areasReadOptionalString(props: JsonObject, field: string): string | null {
  const value = props[field];
  return typeof value === 'string' && value !== '' ? value : null;
}

function areasReadRule(props: JsonObject, index: number, category: RestrictedCategory): CategoryRule | null {
  const thresholdField = `${category}_critair`;
  const hoursField = `${category}_horaires`;
  const threshold = props[thresholdField] ?? null;
  const hours = props[hoursField] ?? null;
  if (threshold === null && hours === null) return null;
  if (threshold === null) areasFail(index, thresholdField, `falta, pero existe ${hoursField}`);
  if (hours === null) areasFail(index, hoursField, `falta, pero existe ${thresholdField}`);
  if (typeof threshold !== 'string' || !CRITAIR_THRESHOLDS.includes(threshold)) {
    areasFail(index, thresholdField, `valor no válido (se esperaba ${CRITAIR_THRESHOLDS.join(', ')})`);
  }
  if (typeof hours !== 'string') areasFail(index, hoursField, 'debe ser una cadena');
  return { threshold: threshold as CritairThreshold, openingHours: hours };
}

function areasReadRules(props: JsonObject, index: number): Partial<Record<RestrictedCategory, CategoryRule>> {
  const rules: Partial<Record<RestrictedCategory, CategoryRule>> = {};
  for (const category of RESTRICTED_CATEGORIES) {
    const rule = areasReadRule(props, index, category);
    if (rule !== null) rules[category] = rule;
  }
  return rules;
}

function areasReadGeometry(feature: JsonObject, index: number): GeoJsonPolygonGeometry {
  const geometry = feature.geometry;
  const validType = areasIsObject(geometry) && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon');
  if (!validType || !Array.isArray(geometry.coordinates)) {
    areasFail(index, 'geometry', 'debe ser Polygon o MultiPolygon con coordinates');
  }
  return geometry as unknown as GeoJsonPolygonGeometry;
}

function areasParseFeature(feature: unknown, index: number): ZfeArea {
  if (!areasIsObject(feature)) areasFail(index, 'feature', 'no es un objeto');
  if (!areasIsObject(feature.properties)) areasFail(index, 'properties', 'falta o no es un objeto');
  const props = feature.properties;
  return {
    id: areasReadId(props, index),
    startDate: areasReadRequiredDate(props, index, 'date_debut'),
    endDate: areasReadOptionalDate(props, index, 'date_fin'),
    rules: areasReadRules(props, index),
    decreeUrl: areasReadOptionalString(props, 'url_arrete'),
    infoUrl: areasReadOptionalString(props, 'url_site_information'),
    geometry: areasReadGeometry(feature, index),
  };
}

/**
 * Convierte el GeoJSON (ya parseado con JSON.parse) en áreas. Lanza `AiresFormatError` con el
 * índice del feature y el campo si: no es FeatureCollection, falta id o date_debut, una fecha no
 * es yyyy-mm-dd, un *_critair no está en el enum, un *_critair no tiene su *_horaires (o al revés),
 * o la geometría no es Polygon/MultiPolygon. Ignora las propiedades desconocidas.
 */
export function parseAires(json: unknown): ZfeArea[] {
  if (!areasIsObject(json) || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new AiresFormatError('aires.geojson no es un FeatureCollection válido (falta "type" o "features").');
  }
  return json.features.map((feature, index) => areasParseFeature(feature, index));
}

/** Vigente en `isoDate` ('yyyy-mm-dd'): startDate <= isoDate y (endDate null o isoDate <= endDate). */
export function isAreaActive(area: ZfeArea, isoDate: string): boolean {
  return area.startDate <= isoDate && (area.endDate === null || isoDate <= area.endDate);
}

/** VehicleType de C2 → categoría: car → vp, van → vul, motorcycle → deux_rm. */
export function categoryFor(vehicleType: VehicleType): RestrictedCategory {
  return CATEGORY_BY_VEHICLE_TYPE[vehicleType];
}
