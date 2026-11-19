import React from 'react';
import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
import { ThemeSwitch } from './ThemeSwitch';
import { SECTION_NAME } from '@/lib/site';

/** En-tête : logo, nom de la section et sélecteur de thème. */
export function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link href="/" className="brand">
          <BrandLogo />
          <span className="brand-separator" aria-hidden="true" />
          <span className="brand-section">{SECTION_NAME}</span>
        </Link>

        <div className="header-actions">
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
