import React from 'react';
import { Info } from 'lucide-react';
import { AIRES_DATA_IS_SAMPLE } from '@/lib/zfe-source';

interface SampleDataNoticeProps {
  /** Por defecto `AIRES_DATA_IS_SAMPLE`; el parámetro existe para poder probar el caso `false`. */
  isSample?: boolean;
}

/** Aviso visible mientras los datos de las zonas sean de ejemplo. */
export function SampleDataNotice({ isSample = AIRES_DATA_IS_SAMPLE }: SampleDataNoticeProps) {
  if (!isSample) return null;
  return (
    <p
      role="note"
      className="mb-4 flex items-start gap-2 rounded-lg border border-warning-line bg-warning-soft p-3 text-sm text-fg"
    >
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <span>
        <strong>Données d&apos;exemple :</strong> les périmètres et les restrictions affichés sont indicatifs en
        attendant le chargement de la Base nationale des ZFE. Vérifiez toujours sur le site officiel de chaque zone.
      </span>
    </p>
  );
}
