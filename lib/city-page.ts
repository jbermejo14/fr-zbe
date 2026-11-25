import { CRITAIR_ORDER, critairLabel } from './critair';
import type { CritairClass } from './critair';
import { formatIsoDateFr } from './format-date';
import { describeOpeningHours } from './opening-hours';
import { truncateMetaDescription } from './seo';
import { CERTIFICAT_AIR_URL } from './zfe-source';
import type { CritairThreshold, RestrictedCategory, ZfeArea } from './zfe-areas';
import type { ZfeCity } from './zfe-cities';
import { isAllowed, strictestRule, thresholdToClass, upcomingAreas } from './zfe-rules';
import type { AccessStatus } from './zfe-rules';

/** Amende por circuler con una vignette interdite: contravention de 3e classe (voitures, utilitaires, deux-roues). */
export const CITY_PAGE_FINE_EUROS = 68;

export interface SummaryRow {
  critair: CritairClass;
  vp: AccessStatus;
  vul: AccessStatus;
  deux_rm: AccessStatus;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface CityMetadata {
  title: string;
  description: string;
}

interface CityPageCategory {
  category: RestrictedCategory;
  /** Plural en minúscula para frases: « les voitures ». */
  plural: string;
  /** Con mayúscula inicial para encabezados: « Voitures ». */
  title: string;
}

const CITY_PAGE_CATEGORIES: readonly CityPageCategory[] = [
  { category: 'vp', plural: 'les voitures', title: 'Voitures' },
  { category: 'vul', plural: 'les utilitaires', title: 'Utilitaires' },
  { category: 'deux_rm', plural: 'les deux-roues', title: 'Deux-roues' },
];

const CITY_PAGE_NO_RESTRICTION = "aucune restriction n'est en vigueur à ce jour.";
const CITY_PAGE_NON_CLASSIFIED_TEXT = 'les véhicules non classés';
const CITY_PAGE_NON_CLASSIFIED_FROM = 'des véhicules non classés';
const CITY_PAGE_YEAR_LENGTH = 4;

function cityPageStatus(
  cityAreas: readonly ZfeArea[],
  category: RestrictedCategory,
  critair: CritairClass,
  isoDate: string,
): AccessStatus {
  const rule = strictestRule(cityAreas, category, isoDate);
  if (rule === null) return 'no_rule';
  return isAllowed(critair, rule.threshold) ? 'allowed' : 'restricted';
}

/** Una fila por vignette (orden de CRITAIR_ORDER) con el estado de cada categoría. */
export function summaryRows(cityAreas: readonly ZfeArea[], isoDate: string): SummaryRow[] {
  return CRITAIR_ORDER.map((critair) => ({
    critair,
    vp: cityPageStatus(cityAreas, 'vp', critair, isoDate),
    vul: cityPageStatus(cityAreas, 'vul', critair, isoDate),
    deux_rm: cityPageStatus(cityAreas, 'deux_rm', critair, isoDate),
  }));
}

function cityPageJoinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

/** « les véhicules Crit'Air 3, 4 et 5 et les véhicules non classés »: todo lo que prohíbe el umbral. */
function cityPageBannedText(threshold: CritairThreshold): string {
  const banned = CRITAIR_ORDER.filter((critair) => !isAllowed(critair, threshold));
  const numbers = banned.filter((critair) => critair !== 'NC');
  const parts: string[] = [];
  if (numbers.length > 0) parts.push(`les véhicules Crit'Air ${cityPageJoinList(numbers)}`);
  if (banned.includes('NC')) parts.push(CITY_PAGE_NON_CLASSIFIED_TEXT);
  return parts.join(' et ');
}

/** Complemento de « à partir » con su preposición: « de Crit'Air 3 » o « des véhicules non classés ». */
function cityPageFromComplement(critair: CritairClass): string {
  return critair === 'NC' ? CITY_PAGE_NON_CLASSIFIED_FROM : `de ${critairLabel(critair)}`;
}

function cityPageBannedAnswer(city: ZfeCity, cityAreas: readonly ZfeArea[], isoDate: string): string {
  const sentences = CITY_PAGE_CATEGORIES.flatMap(({ category, plural }) => {
    const rule = strictestRule(cityAreas, category, isoDate);
    if (rule === null) return [];
    return [`pour ${plural}, sont interdits ${cityPageBannedText(rule.threshold)}`];
  });
  if (sentences.length === 0) return `Dans la ZFE ${city.ofName}, ${CITY_PAGE_NO_RESTRICTION}`;
  return `Au ${formatIsoDateFr(isoDate)}, dans la ZFE ${city.ofName} : ${sentences.join(' ; ')}.`;
}

function cityPageLowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function cityPageHoursAnswer(city: ZfeCity, cityAreas: readonly ZfeArea[], isoDate: string): string {
  const sentences = CITY_PAGE_CATEGORIES.flatMap(({ category, title }) => {
    const rule = strictestRule(cityAreas, category, isoDate);
    if (rule === null) return [];
    return [`${title} : ${cityPageLowerFirst(describeOpeningHours(rule.openingHours).text)}.`];
  });
  if (sentences.length === 0) return `Dans la ZFE ${city.ofName}, ${CITY_PAGE_NO_RESTRICTION}`;
  return sentences.join(' ');
}

function cityPageUpcomingAnswer(cityAreas: readonly ZfeArea[], isoDate: string): string {
  return upcomingAreas(cityAreas, isoDate)
    .map((area) => {
      const details = CITY_PAGE_CATEGORIES.flatMap(({ category, plural }) => {
        const rule = area.rules[category];
        if (!rule) return [];
        return [`${plural} : interdits à partir ${cityPageFromComplement(thresholdToClass(rule.threshold))}`];
      });
      return `À partir du ${formatIsoDateFr(area.startDate)}, ${details.join(' ; ')}.`;
    })
    .join(' ');
}

/**
 * Preguntas frecuentes generadas con los datos de la ciudad. « Prochaines étapes » solo aparece
 * si hay áreas que empiezan después de `isoDate`.
 */
export function cityFaq(city: ZfeCity, cityAreas: readonly ZfeArea[], isoDate: string): FaqEntry[] {
  const entries: FaqEntry[] = [
    {
      question: `Quelles vignettes Crit'Air sont interdites dans la ZFE ${city.ofName} ?`,
      answer: cityPageBannedAnswer(city, cityAreas, isoDate),
    },
    {
      question: `Quels sont les horaires de la ZFE ${city.ofName} ?`,
      answer: cityPageHoursAnswer(city, cityAreas, isoDate),
    },
  ];
  if (upcomingAreas(cityAreas, isoDate).length > 0) {
    entries.push({
      question: `Quelles sont les prochaines étapes de la ZFE ${city.ofName} ?`,
      answer: cityPageUpcomingAnswer(cityAreas, isoDate),
    });
  }
  entries.push(
    {
      question: "Comment obtenir la vignette Crit'Air ?",
      answer: `La vignette Crit'Air se commande en ligne sur le site officiel ${CERTIFICAT_AIR_URL}, à partir du certificat d'immatriculation de votre véhicule. Méfiez-vous des sites qui facturent un supplément.`,
    },
    {
      question: 'Existe-t-il des dérogations ?',
      answer: `Oui, certaines dérogations existent (petits rouleurs, véhicules de collection, carte mobilité inclusion, etc.). Elles varient d'une zone à l'autre : consultez le site officiel de la ZFE ${city.ofName} (${city.infoUrl}).`,
    },
    {
      question: "Quelle amende en cas d'infraction ?",
      answer: `Circuler dans la ZFE avec une vignette interdite est puni d'une amende de ${CITY_PAGE_FINE_EUROS} € (contravention de 3e classe) pour les voitures, les utilitaires et les deux-roues.`,
    },
  );
  return entries;
}

/** Título (con el año de `isoDate`) y descripción únicos por ciudad, con la vignette a partir de la cual se prohíbe. */
export function cityMetadata(city: ZfeCity, cityAreas: readonly ZfeArea[], isoDate: string): CityMetadata {
  const rule = strictestRule(cityAreas, 'vp', isoDate);
  const banned =
    rule === null
      ? "aucune vignette n'est interdite aux voitures à ce jour"
      : `les voitures sont interdites à partir ${cityPageFromComplement(thresholdToClass(rule.threshold))}`;
  return {
    title: `ZFE ${city.name} ${isoDate.slice(0, CITY_PAGE_YEAR_LENGTH)} : Crit'Air interdits, horaires`,
    description: truncateMetaDescription(
      `ZFE ${city.ofName} : ${banned}. Horaires, amende de ${CITY_PAGE_FINE_EUROS} €, dérogations et carte du périmètre.`,
    ),
  };
}
