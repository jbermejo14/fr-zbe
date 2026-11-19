/** Reglas Crit'Air (arrêté du 21 juin 2016, simplificado por año). */

export type VehicleType = 'car' | 'van' | 'motorcycle';
export type Energy = 'electric_hydrogen' | 'petrol' | 'diesel' | 'plugin_hybrid' | 'gas';
export type EuroNorm = 'euro1' | 'euro2' | 'euro3' | 'euro4' | 'euro5' | 'euro6';
/** Clase Crit'Air. 'NC' = non classé (sin vignette). */
export type CritairClass = '0' | '1' | '2' | '3' | '4' | '5' | 'NC';

export interface VehicleInput {
  vehicleType: VehicleType;
  energy: Energy;
  /** Año de primera matriculación; se ignora si hay euroNorm. */
  registrationYear: number | null;
  euroNorm: EuroNorm | null;
}

export interface CritairResult {
  critair: CritairClass;
  /** Explicación en francés de la regla aplicada: « Diesel Euro 4 (2006-2010) ». */
  ruleLabel: string;
  /** Nota en francés si el año es frontera y se ha elegido la clase peor; si no, null. */
  borderlineNote: string | null;
}

/** Error de entrada del usuario; el mensaje está en francés y se muestra tal cual. */
export class CritairInputError extends Error {}

/** Orden de las clases, de la más limpia a la más contaminante. */
export const CRITAIR_ORDER: readonly CritairClass[] = ['0', '1', '2', '3', '4', '5', 'NC'];
export const FIRST_REGISTRATION_YEAR_MIN = 1950;

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Voiture',
  van: 'Utilitaire léger',
  motorcycle: 'Deux-roues motorisé',
};

export const ENERGY_LABELS: Record<Energy, string> = {
  electric_hydrogen: 'Électrique / hydrogène',
  petrol: 'Essence',
  diesel: 'Diesel',
  plugin_hybrid: 'Hybride rechargeable',
  gas: 'GPL / GNV',
};

export const EURO_NORM_LABELS: Record<EuroNorm, string> = {
  euro1: 'Euro 1',
  euro2: 'Euro 2',
  euro3: 'Euro 3',
  euro4: 'Euro 4',
  euro5: 'Euro 5',
  euro6: 'Euro 6',
};

const CAR_EURO_NORMS: readonly EuroNorm[] = ['euro1', 'euro2', 'euro3', 'euro4', 'euro5', 'euro6'];
const MOTORCYCLE_EURO_NORMS: readonly EuroNorm[] = ['euro1', 'euro2', 'euro3', 'euro4', 'euro5'];

/** Año en que un utilitaire cambia de NC a Euro 2 (1/10/1997): sin fecha exacta es frontera. */
const VAN_BORDERLINE_YEAR = 1997;
const MOTORCYCLE_THERMAL_LABEL = 'Deux-roues thermique';

const VAN_BORDERLINE_NOTE =
  "Pour un utilitaire immatriculé avant le 1er octobre 1997, la vignette est « Non classé » ; à partir de cette date, " +
  "il relève de la norme Euro 2. En l'absence de la date exacte, la classe la plus défavorable est retenue. " +
  'Indiquez la norme Euro pour un résultat précis.';
const MOTORCYCLE_2004_NOTE =
  "Pour un deux-roues immatriculé à partir du 1er juillet 2004, la vignette est Crit'Air 3. " +
  "En l'absence de la date exacte, la classe la plus défavorable est retenue.";
const MOTORCYCLE_2000_NOTE =
  "Pour un deux-roues immatriculé à partir du 1er juin 2000, la vignette est Crit'Air 4. " +
  "En l'absence de la date exacte, la classe la plus défavorable est retenue.";

const ERROR_MISSING_DATA = "Indiquez l'année de première immatriculation ou la norme Euro du véhicule.";

/** Normas Euro válidas para el tipo (deux-roues: euro1..euro5). */
export function euroNormsFor(vehicleType: VehicleType): readonly EuroNorm[] {
  return vehicleType === 'motorcycle' ? MOTORCYCLE_EURO_NORMS : CAR_EURO_NORMS;
}

/** Etiqueta visible: '0' → "Crit'Air 0", 'NC' → "Non classé". */
export function critairLabel(critair: CritairClass): string {
  return critair === 'NC' ? 'Non classé' : `Crit'Air ${critair}`;
}

function critairFixed(critair: CritairClass, ruleLabel: string): CritairResult {
  return { critair, ruleLabel, borderlineNote: null };
}

type EuroTable = Partial<Record<EuroNorm, CritairClass>>;

const PETROL_BY_NORM: EuroTable = { euro1: 'NC', euro2: '3', euro3: '3', euro4: '2', euro5: '1', euro6: '1' };
const DIESEL_BY_NORM: EuroTable = { euro1: 'NC', euro2: '5', euro3: '4', euro4: '3', euro5: '2', euro6: '2' };
const MOTORCYCLE_BY_NORM: EuroTable = { euro1: '4', euro2: '3', euro3: '2', euro4: '1', euro5: '1' };

function byNormResult(table: EuroTable, energyLabel: string, norm: EuroNorm): CritairResult {
  const critair = table[norm] as CritairClass;
  return critairFixed(critair, `${energyLabel} ${EURO_NORM_LABELS[norm]}`);
}

/** Tramo por año de primera matriculación: vale desde `fromYear` hasta el inicio del tramo siguiente. */
interface YearRule {
  fromYear: number;
  critair: CritairClass;
  /** Tramo en francés, p. ej. « (2011 et après) ». */
  label: string;
  borderlineNote: string | null;
}

/** Tablas ordenadas de más reciente a más antigua; la última cubre todo año anterior. */
const PETROL_YEAR_RULES: readonly YearRule[] = [
  { fromYear: 2011, critair: '1', label: '(2011 et après)', borderlineNote: null },
  { fromYear: 2006, critair: '2', label: '(2006-2010)', borderlineNote: null },
  { fromYear: 1997, critair: '3', label: '(1997-2005)', borderlineNote: null },
  { fromYear: FIRST_REGISTRATION_YEAR_MIN, critair: 'NC', label: '(1996 et avant)', borderlineNote: null },
];

const DIESEL_YEAR_RULES: readonly YearRule[] = [
  { fromYear: 2011, critair: '2', label: '(2011 et après)', borderlineNote: null },
  { fromYear: 2006, critair: '3', label: '(2006-2010)', borderlineNote: null },
  { fromYear: 2001, critair: '4', label: '(2001-2005)', borderlineNote: null },
  { fromYear: 1997, critair: '5', label: '(1997-2000)', borderlineNote: null },
  { fromYear: FIRST_REGISTRATION_YEAR_MIN, critair: 'NC', label: '(1996 et avant)', borderlineNote: null },
];

const MOTORCYCLE_YEAR_RULES: readonly YearRule[] = [
  { fromYear: 2017, critair: '1', label: '(2017 et après)', borderlineNote: null },
  { fromYear: 2007, critair: '2', label: '(2007-2016)', borderlineNote: null },
  { fromYear: 2005, critair: '3', label: '(2005-2006)', borderlineNote: null },
  { fromYear: 2004, critair: '4', label: '(2004)', borderlineNote: MOTORCYCLE_2004_NOTE },
  { fromYear: 2001, critair: '4', label: '(2001-2003)', borderlineNote: null },
  { fromYear: 2000, critair: 'NC', label: '(2000)', borderlineNote: MOTORCYCLE_2000_NOTE },
  { fromYear: FIRST_REGISTRATION_YEAR_MIN, critair: 'NC', label: '(avant 2000)', borderlineNote: null },
];

function resultByYear(rules: readonly YearRule[], energyLabel: string, year: number): CritairResult {
  const rule = rules.find((candidate) => year >= candidate.fromYear) ?? rules[rules.length - 1];
  return { critair: rule.critair, ruleLabel: `${energyLabel} ${rule.label}`, borderlineNote: rule.borderlineNote };
}

/** Los utilitaires de 1997 sin norma: Euro 2 empieza el 1/10/1997, se toma la clase peor. */
function vanBorderlineResult(energy: Energy): CritairResult {
  return {
    critair: 'NC',
    ruleLabel: `${ENERGY_LABELS[energy]} (${VAN_BORDERLINE_YEAR})`,
    borderlineNote: VAN_BORDERLINE_NOTE,
  };
}

function assertValidYear(year: number, currentYear: number): void {
  if (!Number.isInteger(year) || year < FIRST_REGISTRATION_YEAR_MIN || year > currentYear) {
    throw new CritairInputError(
      `L'année de première immatriculation doit être comprise entre ${FIRST_REGISTRATION_YEAR_MIN} et ${currentYear}.`,
    );
  }
}

function assertValidNorm(norm: EuroNorm, vehicleType: VehicleType): void {
  if (!euroNormsFor(vehicleType).includes(norm)) {
    throw new CritairInputError(
      `La norme ${EURO_NORM_LABELS[norm]} ne s'applique pas à ce type de véhicule.`,
    );
  }
}

function computeMotorcycle(input: VehicleInput, currentYear: number): CritairResult {
  if (input.euroNorm !== null) {
    assertValidNorm(input.euroNorm, input.vehicleType);
    return byNormResult(MOTORCYCLE_BY_NORM, MOTORCYCLE_THERMAL_LABEL, input.euroNorm);
  }
  if (input.registrationYear === null) throw new CritairInputError(ERROR_MISSING_DATA);
  assertValidYear(input.registrationYear, currentYear);
  return resultByYear(MOTORCYCLE_YEAR_RULES, MOTORCYCLE_THERMAL_LABEL, input.registrationYear);
}

function computeCombustionCarOrVan(input: VehicleInput, currentYear: number): CritairResult {
  const isDiesel = input.energy === 'diesel';
  if (input.euroNorm !== null) {
    assertValidNorm(input.euroNorm, input.vehicleType);
    const table = isDiesel ? DIESEL_BY_NORM : PETROL_BY_NORM;
    return byNormResult(table, ENERGY_LABELS[input.energy], input.euroNorm);
  }
  if (input.registrationYear === null) throw new CritairInputError(ERROR_MISSING_DATA);
  assertValidYear(input.registrationYear, currentYear);
  if (input.vehicleType === 'van' && input.registrationYear === VAN_BORDERLINE_YEAR) {
    return vanBorderlineResult(input.energy);
  }
  const rules = isDiesel ? DIESEL_YEAR_RULES : PETROL_YEAR_RULES;
  return resultByYear(rules, ENERGY_LABELS[input.energy], input.registrationYear);
}

/**
 * Calcula la vignette. Lanza `CritairInputError` (mensaje en francés, se muestra al usuario) si
 * faltan año y norma en una energía que los necesita, si el año es menor que
 * FIRST_REGISTRATION_YEAR_MIN o mayor que `currentYear`, o si la norma no vale para el tipo.
 * Eléctrico, hybride rechargeable y gas no necesitan año ni norma (salvo en deux-roues, donde
 * todo lo que no es eléctrico se trata como térmico).
 */
export function computeCritair(input: VehicleInput, currentYear: number): CritairResult {
  if (input.energy === 'electric_hydrogen') {
    return critairFixed('0', 'Électrique / hydrogène');
  }
  if (input.vehicleType === 'motorcycle') {
    return computeMotorcycle(input, currentYear);
  }
  if (input.energy === 'plugin_hybrid' || input.energy === 'gas') {
    return critairFixed('1', ENERGY_LABELS[input.energy]);
  }
  return computeCombustionCarOrVan(input, currentYear);
}
