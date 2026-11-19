import React from 'react';
import Link from 'next/link';
import { describeOpeningHours } from '@/lib/opening-hours';
import { critairLabel } from '@/lib/critair';
import type { CritairClass } from '@/lib/critair';
import { formatIsoDateFr } from '@/lib/format-date';
import { isAreaActive } from '@/lib/zfe-areas';
import type { RestrictedCategory, ZfeArea } from '@/lib/zfe-areas';
import { areasForCity } from '@/lib/zfe-cities';
import type { ZfeCity } from '@/lib/zfe-cities';
import { strictestRule, thresholdToClass, upcomingAreas } from '@/lib/zfe-rules';
import { CritairBadge } from './CritairBadge';

interface CityRulesCardProps {
  city: ZfeCity;
  /** Áreas de la ciudad (si se pasan más, se filtran por SIREN). */
  areas: readonly ZfeArea[];
  /** 'yyyy-mm-dd' */
  isoDate: string;
}

const RULES_CATEGORIES: readonly { category: RestrictedCategory; label: string }[] = [
  { category: 'vp', label: 'Voitures' },
  { category: 'vul', label: 'Utilitaires' },
  { category: 'deux_rm', label: 'Deux-roues' },
];

const RULES_LINK_CLASS = 'inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline';

/** « interdit à partir de Crit'Air 3 »; el umbral NC solo afecta a los véhicules no clasificados. */
function rulesRestrictionText(critair: CritairClass): string {
  return critair === 'NC' ? 'interdit aux véhicules non classés' : `interdit à partir de ${critairLabel(critair)}`;
}

function RulesCategoryRows({ cityAreas, isoDate }: { cityAreas: readonly ZfeArea[]; isoDate: string }) {
  return (
    <>
      {RULES_CATEGORIES.map(({ category, label }) => {
        const rule = strictestRule(cityAreas, category, isoDate);
        return (
          <tr key={category}>
            <th scope="row" className="font-semibold text-fg">{label}</th>
            {rule === null ? (
              <td colSpan={2}>Aucune restriction</td>
            ) : (
              <>
                <td>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-secondary">Interdit à partir de</span>
                    <CritairBadge critair={thresholdToClass(rule.threshold)} size="sm" />
                  </span>
                </td>
                <td>{describeOpeningHours(rule.openingHours).text}</td>
              </>
            )}
          </tr>
        );
      })}
    </>
  );
}

function RulesUpcoming({ upcoming, titleId }: { upcoming: readonly ZfeArea[]; titleId: string }) {
  if (upcoming.length === 0) return null;
  return (
    <section aria-labelledby={titleId} className="mt-4">
      <h4 id={titleId} className="mb-1 text-sm font-bold text-fg">Prochaines étapes</h4>
      <ul className="space-y-2 text-sm text-secondary">
        {upcoming.map((area) => (
          <li key={area.id}>
            <span className="font-semibold text-fg">À partir du {formatIsoDateFr(area.startDate)}</span>
            {RULES_CATEGORIES.map(({ category, label }) => {
              const rule = area.rules[category];
              if (!rule) return null;
              return (
                <span key={category} className="ml-2 inline-flex items-center gap-1">
                  {label} : {rulesRestrictionText(thresholdToClass(rule.threshold))}
                </span>
              );
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Ficha de una ZFE: restricciones por categoría, horarios, próximas etapas y enlaces oficiales. */
export function CityRulesCard({ city, areas, isoDate }: CityRulesCardProps) {
  const cityAreas = areasForCity(city, areas);
  const activeAreas = cityAreas.filter((area) => isAreaActive(area, isoDate));
  const decreeUrl = activeAreas.find((area) => area.decreeUrl !== null)?.decreeUrl ?? null;

  return (
    <article className="card card-compact min-w-0" aria-labelledby={`rules-${city.slug}`}>
      <h3 id={`rules-${city.slug}`} className="text-lg font-bold text-fg">{city.zoneName}</h3>
      <p className="text-sm text-secondary">{city.authority}</p>
      <p className="mb-3 text-sm text-secondary">Périmètre : {city.perimeterLabel}</p>

      {activeAreas.length === 0 ? (
        <p className="text-sm text-secondary">Aucune zone en vigueur à cette date.</p>
      ) : (
        <div className="table-responsive">
          <table className="guide-table">
            <thead>
              <tr>
                <th scope="col">Véhicule</th>
                <th scope="col">Restriction</th>
                <th scope="col">Horaires</th>
              </tr>
            </thead>
            <tbody>
              <RulesCategoryRows cityAreas={activeAreas} isoDate={isoDate} />
            </tbody>
          </table>
        </div>
      )}

      <RulesUpcoming upcoming={upcomingAreas(cityAreas, isoDate)} titleId={`rules-upcoming-${city.slug}`} />

      <div className="mt-3 flex flex-wrap gap-x-4">
        {decreeUrl !== null && (
          <a href={decreeUrl} target="_blank" rel="noopener noreferrer" className={RULES_LINK_CLASS}>
            Arrêté
          </a>
        )}
        <a href={city.infoUrl} target="_blank" rel="noopener noreferrer" className={RULES_LINK_CLASS}>
          Site officiel
        </a>
        <Link href={`/${city.slug}`} className={RULES_LINK_CLASS}>
          Voir la fiche complète
        </Link>
      </div>
    </article>
  );
}
