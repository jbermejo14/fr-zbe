import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { CritairResult } from '@/lib/critair';
import { critairLabel } from '@/lib/critair';
import type { CityAccess } from '@/lib/zfe-rules';
import { CERTIFICAT_AIR_URL } from '@/lib/zfe-source';
import { CityAccessList } from './CityAccessList';
import { CritairBadge } from './CritairBadge';

interface CritairResultCardProps {
  result: CritairResult;
  /** Acceso a cada ciudad; solo se usa cuando `airesStatus` es 'ready'. */
  accesses: readonly CityAccess[];
  airesStatus: 'loading' | 'ready' | 'error';
}

const OFFICIAL_SITE_NOTE =
  'Site officiel du ministère. Méfiez-vous des sites non officiels qui facturent la vignette plus cher.';

function ResultAccessSection({ accesses, airesStatus }: Omit<CritairResultCardProps, 'result'>) {
  if (airesStatus === 'loading') return <p className="text-sm text-secondary">Chargement des zones…</p>;
  // El detalle del error de carga lo muestra el panel una sola vez, junto al mapa.
  if (airesStatus === 'error') return <p className="text-sm text-secondary">Les zones ne sont pas disponibles pour le moment.</p>;
  return <CityAccessList accesses={accesses} />;
}

/** Resultado de la calculadora: vignette, regla aplicada, acceso por ciudad y enlace oficial. */
export function CritairResultCard({ result, accesses, airesStatus }: CritairResultCardProps) {
  return (
    <section className="card card-compact space-y-4" aria-label="Résultat" aria-live="polite">
      <div className="flex items-center gap-4">
        <CritairBadge critair={result.critair} size="lg" />
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-fg">{critairLabel(result.critair)}</h2>
          <p className="text-sm text-secondary">{result.ruleLabel}</p>
        </div>
      </div>

      {result.borderlineNote !== null && (
        <p className="rounded-lg border border-warning-line bg-warning-soft p-3 text-sm text-fg">
          {result.borderlineNote}
        </p>
      )}

      <div>
        <h3 className="mb-1 text-sm font-bold text-fg">Pouvez-vous circuler ?</h3>
        <ResultAccessSection accesses={accesses} airesStatus={airesStatus} />
      </div>

      <div>
        <a
          href={CERTIFICAT_AIR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary w-full text-center"
        >
          Commander la vignette sur certificat-air.gouv.fr
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
        <p className="mt-2 text-xs text-muted">{OFFICIAL_SITE_NOTE}</p>
      </div>
    </section>
  );
}

/** Mensaje mientras el formulario no da una vignette. */
export function CritairResultPlaceholder() {
  return (
    <section className="card card-compact text-sm text-secondary" aria-label="Résultat">
      Renseignez votre véhicule pour connaître sa vignette Crit&apos;Air et les zones où vous pouvez circuler.
    </section>
  );
}
