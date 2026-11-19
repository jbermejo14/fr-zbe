import { CRITAIR_ORDER, type CritairClass, type VehicleType } from './critair';
import { describeOpeningHours } from './opening-hours';
import { categoryFor, isAreaActive } from './zfe-areas';
import type { CategoryRule, CritairThreshold, RestrictedCategory, ZfeArea } from './zfe-areas';
import { ZFE_CITIES, areasForCity } from './zfe-cities';
import type { ZfeCity } from './zfe-cities';

export type AccessStatus = 'allowed' | 'restricted' | 'no_rule';

export interface CityAccess {
  city: ZfeCity;
  /** no_rule: ninguna área vigente restringe esa categoría. */
  status: AccessStatus;
  /** Regla más estricta vigente para la categoría, o null. */
  rule: CategoryRule | null;
  /** describeOpeningHours(rule.openingHours).text */
  hoursText: string | null;
}

const CLASS_BY_THRESHOLD: Record<CritairThreshold, CritairClass> = {
  EL: '0',
  V1: '1',
  V2: '2',
  V3: '3',
  V4: '4',
  V5: '5',
  NC: 'NC',
};

/** Clase Crit'Air equivalente a un umbral de la Base nationale (EL = clase 0). */
export function thresholdToClass(threshold: CritairThreshold): CritairClass {
  return CLASS_BY_THRESHOLD[threshold];
}

function rulesRank(critair: CritairClass): number {
  return CRITAIR_ORDER.indexOf(critair);
}

function rulesThresholdRank(threshold: CritairThreshold): number {
  return rulesRank(CLASS_BY_THRESHOLD[threshold]);
}

/** true si la vignette puede circular con ese umbral: rango(critair) < rango(threshold). */
export function isAllowed(critair: CritairClass, threshold: CritairThreshold): boolean {
  return rulesRank(critair) < rulesThresholdRank(threshold);
}

/** Umbral más estricto (el de menor rango) entre las áreas vigentes de la ciudad para la categoría. */
export function strictestRule(
  areas: readonly ZfeArea[],
  category: RestrictedCategory,
  isoDate: string,
): CategoryRule | null {
  let strictest: CategoryRule | null = null;
  for (const area of areas) {
    const rule = area.rules[category];
    if (!rule || !isAreaActive(area, isoDate)) continue;
    if (strictest === null || rulesThresholdRank(rule.threshold) < rulesThresholdRank(strictest.threshold)) {
      strictest = rule;
    }
  }
  return strictest;
}

function rulesEvaluateCity(
  city: ZfeCity,
  critair: CritairClass,
  category: RestrictedCategory,
  areas: readonly ZfeArea[],
  isoDate: string,
): CityAccess {
  const rule = strictestRule(areasForCity(city, areas), category, isoDate);
  if (rule === null) return { city, status: 'no_rule', rule: null, hoursText: null };
  const status: AccessStatus = isAllowed(critair, rule.threshold) ? 'allowed' : 'restricted';
  return { city, status, rule, hoursText: describeOpeningHours(rule.openingHours).text };
}

/** Acceso de una vignette a cada ciudad en una fecha. Mismo orden que ZFE_CITIES. */
export function evaluateCities(
  critair: CritairClass,
  vehicleType: VehicleType,
  areas: readonly ZfeArea[],
  isoDate: string,
): CityAccess[] {
  const category = categoryFor(vehicleType);
  return ZFE_CITIES.map((city) => rulesEvaluateCity(city, critair, category, areas, isoDate));
}

/** Áreas de la ciudad que empiezan después de isoDate, ordenadas por startDate (« prochaines étapes »). */
export function upcomingAreas(cityAreas: readonly ZfeArea[], isoDate: string): ZfeArea[] {
  return cityAreas
    .filter((area) => area.startDate > isoDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
