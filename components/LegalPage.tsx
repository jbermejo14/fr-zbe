import React from 'react';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { legalReviewDate } from '@/lib/legal-text';

interface LegalPageProps {
  title: string;
  /** Ruta de la página (sin ruta base), para la última miga. */
  path: string;
  /** Etiqueta de la miga; por defecto, el título. */
  breadcrumbLabel?: string;
  children: ReactNode;
}

/** Maquetación común de las páginas legales: migas, título, tarjeta con el texto y fecha de revisión. */
export function LegalPage({ title, path, breadcrumbLabel, children }: LegalPageProps) {
  return (
    <div className="main-wrapper">
      <Breadcrumbs
        items={[
          { name: 'Accueil', url: '/' },
          { name: breadcrumbLabel ?? title, url: path }
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">{title}</h1>
      <div className="card legal-text">
        {children}
        <p className="text-xs text-muted">Dernière mise à jour : {legalReviewDate()}</p>
      </div>
    </div>
  );
}
