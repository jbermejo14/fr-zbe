import React from 'react';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';
import { ConsentSettingsButton } from '@/components/ConsentSettingsButton';

const DATA_SOURCE_URL = 'https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions';
const OPEN_LICENCE_URL = 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/';

const LINK_CLASS = 'text-muted hover:text-accent transition-colors';

export interface FooterProps {
  /** Muestra el botón para cambiar el consentimiento; solo si AdSense está configurado. */
  showConsent?: boolean;
}

export function Footer({ showConsent = false }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <p className="footer-text">
          <strong>{SITE_NAME}</strong> &bull; Zones à faibles émissions (ZFE) et vignette Crit&apos;Air en France.
        </p>
        <p className="footer-subtext">
          Données :{' '}
          <a href={DATA_SOURCE_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Base nationale des ZFE (transport.data.gouv.fr)
          </a>
          ,{' '}
          <a href={OPEN_LICENCE_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            Licence Ouverte
          </a>
          . {SITE_NAME} n&apos;est pas affilié à l&apos;administration.
        </p>
        <nav aria-label="Informations légales" className="footer-legal">
          <Link href="/">Accueil</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/cookies">Cookies</Link>
          {showConsent && <ConsentSettingsButton />}
        </nav>
      </div>
    </footer>
  );
}
