import React from 'react';
import Link from 'next/link';
import { Ban, Check, Minus } from 'lucide-react';
import type { AccessStatus, CityAccess } from '@/lib/zfe-rules';

interface CityAccessListProps {
  accesses: readonly CityAccess[];
}

const ACCESS_LABELS: Record<AccessStatus, string> = {
  allowed: 'Autorisé',
  restricted: 'Interdit',
  no_rule: 'Pas de restriction',
};

const ACCESS_TAG_CLASSES: Record<AccessStatus, string> = {
  allowed: 'tag tag-green',
  restricted: 'tag tag-red',
  no_rule: 'tag',
};

const ICON_CLASS = 'mr-1 inline h-3.5 w-3.5 align-text-bottom';

function AccessIcon({ status }: { status: AccessStatus }) {
  if (status === 'allowed') return <Check aria-hidden="true" className={ICON_CLASS} />;
  if (status === 'restricted') return <Ban aria-hidden="true" className={ICON_CLASS} />;
  return <Minus aria-hidden="true" className={ICON_CLASS} />;
}

/** Una fila por ciudad: nombre (enlace a su ficha) y píldora con icono y texto del acceso. */
export function CityAccessList({ accesses }: CityAccessListProps) {
  return (
    <ul className="divide-y divide-line">
      {accesses.map((access) => (
        <li key={access.city.slug} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
          <Link
            href={`/${access.city.slug}`}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-fg hover:text-accent"
          >
            {access.city.name}
          </Link>
          <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
            <span className={ACCESS_TAG_CLASSES[access.status]}>
              <AccessIcon status={access.status} />
              {ACCESS_LABELS[access.status]}
            </span>
            {access.status === 'restricted' && access.hoursText !== null && (
              <span className="text-xs text-muted">{access.hoursText}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
