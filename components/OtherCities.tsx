import React from 'react';
import Link from 'next/link';
import { ZFE_CITIES } from '@/lib/zfe-cities';

interface OtherCitiesProps {
  currentSlug: string;
}

/** Enlaces a las fichas de las demás ciudades. */
export function OtherCities({ currentSlug }: OtherCitiesProps) {
  return (
    <nav aria-label="Autres villes" className="flex flex-wrap gap-2">
      {ZFE_CITIES.filter((city) => city.slug !== currentSlug).map((city) => (
        <Link key={city.slug} href={`/${city.slug}`} className="tag inline-flex min-h-11 items-center hover:border-accent">
          ZFE {city.name}
        </Link>
      ))}
    </nav>
  );
}
