/** Descripción en francés del subconjunto de `opening_hours` que usa la Base nationale des ZFE. */

export interface OpeningHoursDescription {
  text: string;
  recognized: boolean;
}

const RULE_SEPARATOR = ';';
const ALL_DAY_TEXT = '24 h/24';
const EVERY_DAY_TEXT = 'tous les jours';
const ALWAYS_OPEN = '24/7';
const PUBLIC_HOLIDAY_OFF = 'PH off';
const EXCEPT_HOLIDAYS_TEXT = 'sauf jours fériés';
const MAX_HOUR = 24;
const MAX_MINUTE = 59;
const MINUTES_PAD_LENGTH = 2;

const DAY_CODES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const DAY_NAMES_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;

const DAY_RANGE_PATTERN = /^([A-Z][a-z])-([A-Z][a-z])$/;
const TIME_RANGE_PATTERN = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/;
const UNRECOGNIZED = Symbol('unrecognized');

function openingHoursDayIndex(code: string): number {
  return (DAY_CODES as readonly string[]).indexOf(code);
}

function openingHoursDayItem(item: string): string | typeof UNRECOGNIZED {
  const range = DAY_RANGE_PATTERN.exec(item);
  if (range) {
    const from = openingHoursDayIndex(range[1]);
    const to = openingHoursDayIndex(range[2]);
    if (from < 0 || to < 0 || from >= to) return UNRECOGNIZED;
    return `du ${DAY_NAMES_FR[from]} au ${DAY_NAMES_FR[to]}`;
  }
  const single = openingHoursDayIndex(item);
  return single < 0 ? UNRECOGNIZED : `le ${DAY_NAMES_FR[single]}`;
}

function openingHoursJoin(parts: string[]): string {
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`;
}

function openingHoursCapitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function openingHoursDays(token: string): string | typeof UNRECOGNIZED {
  const parts: string[] = [];
  for (const item of token.split(',')) {
    const part = openingHoursDayItem(item);
    if (part === UNRECOGNIZED) return UNRECOGNIZED;
    parts.push(part);
  }
  return openingHoursJoin(parts);
}

function openingHoursClock(hours: number, minutes: number): string {
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(MINUTES_PAD_LENGTH, '0')}`;
}

/** Hora válida: 00:00-23:59, o 24:00 exacto. */
function openingHoursIsValidTime(hour: number, minute: number): boolean {
  return minute <= MAX_MINUTE && (hour < MAX_HOUR || (hour === MAX_HOUR && minute === 0));
}

function openingHoursTimeRange(item: string): string | typeof UNRECOGNIZED {
  const match = TIME_RANGE_PATTERN.exec(item);
  if (!match) return UNRECOGNIZED;
  const [startH, startM, endH, endM] = match.slice(1).map(Number);
  if (!openingHoursIsValidTime(startH, startM) || !openingHoursIsValidTime(endH, endM)) return UNRECOGNIZED;
  return `de ${openingHoursClock(startH, startM)} à ${openingHoursClock(endH, endM)}`;
}

function openingHoursTimes(token: string): string | typeof UNRECOGNIZED {
  const parts: string[] = [];
  for (const item of token.split(',')) {
    const part = openingHoursTimeRange(item);
    if (part === UNRECOGNIZED) return UNRECOGNIZED;
    parts.push(part);
  }
  return openingHoursJoin(parts);
}

/** Una regla es [días] [tramos]; devuelve su texto o UNRECOGNIZED. */
function openingHoursRule(rule: string): string | typeof UNRECOGNIZED {
  if (rule === ALWAYS_OPEN) return `${EVERY_DAY_TEXT}, ${ALL_DAY_TEXT}`;
  const tokens = rule.split(' ').filter((token) => token !== '');
  if (tokens.length === 0 || tokens.length > 2) return UNRECOGNIZED;
  const startsWithTime = /^\d/.test(tokens[0]);
  const daysToken = startsWithTime ? null : tokens[0];
  const timesToken = startsWithTime ? tokens[0] : (tokens[1] ?? null);
  if (startsWithTime && tokens.length > 1) return UNRECOGNIZED;
  const days = daysToken === null ? EVERY_DAY_TEXT : openingHoursDays(daysToken);
  const times = timesToken === null ? ALL_DAY_TEXT : openingHoursTimes(timesToken);
  if (days === UNRECOGNIZED || times === UNRECOGNIZED) return UNRECOGNIZED;
  return `${days}, ${times}`;
}

/**
 * Describe en francés un horario `opening_hours`. Subconjunto admitido, reglas separadas por "; ":
 * - "24/7" → "Tous les jours, 24 h/24"
 * - días: Mo Tu We Th Fr Sa Su, rangos "Mo-Fr", listas "Mo,We"
 * - tramos "08:00-20:00", varios separados por coma
 * - "PH off" → añade "sauf jours fériés"
 * Ejemplo: "Mo-Fr 08:00-20:00; PH off" → "Du lundi au vendredi, de 8 h à 20 h, sauf jours fériés".
 * Si no reconoce la cadena devuelve { text: <cadena original>, recognized: false }.
 */
export function describeOpeningHours(value: string): OpeningHoursDescription {
  const unrecognized = { text: value, recognized: false };
  const rules = value.split(RULE_SEPARATOR).map((rule) => rule.trim());
  const holidaysOff = rules.includes(PUBLIC_HOLIDAY_OFF);
  const descriptions: string[] = [];
  for (const rule of rules.filter((item) => item !== PUBLIC_HOLIDAY_OFF)) {
    const description = openingHoursRule(rule);
    if (description === UNRECOGNIZED) return unrecognized;
    descriptions.push(description);
  }
  if (descriptions.length === 0) return unrecognized;
  const base = openingHoursCapitalize(descriptions.join(`${RULE_SEPARATOR} `));
  return { text: holidaysOff ? `${base}, ${EXCEPT_HOLIDAYS_TEXT}` : base, recognized: true };
}
