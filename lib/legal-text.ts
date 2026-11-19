import type { Metadata } from 'next';
import { FECHA_TEXTOS_LEGALES } from './legal.ts';
import type { Titular } from './legal.ts';
import { absoluteUrl } from './site.ts';

/** Robots de las páginas legales: no se indexan, pero se siguen sus enlaces. */
export const LEGAL_ROBOTS = { index: false, follow: true } as const;

/** Nombre en francés de cada campo del titular, para el marcador visible. */
export const HOLDER_FIELD_LABELS: Record<keyof Titular, string> = {
  tipo: 'type',
  nombre: 'nom',
  nif: "numéro d'identification fiscale (NIF)",
  domicilio: 'adresse',
  email: 'e-mail',
  registroMercantil: 'immatriculation au registre du commerce'
};

/** Valor del campo del titular o el marcador visible « [à compléter : champ] » si está vacío. */
export function legalHolderValue(holder: Titular, field: keyof Titular): string {
  const value = holder[field];
  return value.trim() === '' ? `[à compléter : ${HOLDER_FIELD_LABELS[field]}]` : value;
}

/** Fecha de revisión en francés (« 19 novembre 2026 »), en UTC para no depender de la zona horaria. */
export function legalReviewDate(isoDate: string = FECHA_TEXTOS_LEGALES): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(isoDate));
}

/** Metadatos de una página legal: título, descripción, canonical y sin indexar. */
export function legalMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: LEGAL_ROBOTS,
    alternates: { canonical: absoluteUrl(path) }
  };
}
