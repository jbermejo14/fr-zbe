import React from 'react';
import { Check, Minus, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { critairLabel } from '@/lib/critair';
import { summaryRows } from '@/lib/city-page';
import type { SummaryRow } from '@/lib/city-page';
import type { ZfeArea } from '@/lib/zfe-areas';
import type { AccessStatus } from '@/lib/zfe-rules';
import { CritairBadge } from './CritairBadge';

interface CritairSummaryTableProps {
  /** Áreas de la ciudad. */
  cityAreas: readonly ZfeArea[];
  /** 'yyyy-mm-dd' */
  isoDate: string;
}

const SUMMARY_COLUMNS: readonly { key: 'vp' | 'vul' | 'deux_rm'; label: string }[] = [
  { key: 'vp', label: 'Voitures' },
  { key: 'vul', label: 'Utilitaires' },
  { key: 'deux_rm', label: 'Deux-roues' },
];

const SUMMARY_STATUS: Record<AccessStatus, { text: string; Icon: LucideIcon; className: string }> = {
  allowed: { text: 'Autorisé', Icon: Check, className: 'text-positive' },
  restricted: { text: 'Interdit', Icon: X, className: 'text-negative' },
  no_rule: { text: 'Libre', Icon: Minus, className: 'text-secondary' },
};

function SummaryCell({ status }: { status: AccessStatus }) {
  const { text, Icon, className } = SUMMARY_STATUS[status];
  return (
    <td>
      <span className={`inline-flex items-center gap-1 font-semibold ${className}`}>
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
        {text}
      </span>
    </td>
  );
}

function SummaryRowView({ row }: { row: SummaryRow }) {
  return (
    <tr>
      <th scope="row">
        <span className="flex items-center gap-2 font-semibold text-fg">
          <CritairBadge critair={row.critair} size="sm" />
          {critairLabel(row.critair)}
        </span>
      </th>
      {SUMMARY_COLUMNS.map(({ key }) => (
        <SummaryCell key={key} status={row[key]} />
      ))}
    </tr>
  );
}

/** Tabla vignette × categoría con « Autorisé » / « Interdit » / « Libre ». Hace scroll dentro de su contenedor. */
export function CritairSummaryTable({ cityAreas, isoDate }: CritairSummaryTableProps) {
  return (
    <div className="table-responsive overflow-x-auto">
      <table className="guide-table">
        <caption className="sr-only">Vignettes Crit&apos;Air autorisées par catégorie de véhicule</caption>
        <thead>
          <tr>
            <th scope="col">Vignette</th>
            {SUMMARY_COLUMNS.map(({ key, label }) => (
              <th key={key} scope="col">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summaryRows(cityAreas, isoDate).map((row) => (
            <SummaryRowView key={row.critair} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
