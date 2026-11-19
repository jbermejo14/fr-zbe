'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAires } from '@/lib/use-aires';
import { ZfeMapLoader } from './ZfeMapLoader';

interface CityMiniMapProps {
  citySlug: string;
  /** 'yyyy-mm-dd' */
  isoDate: string;
}

/** Minimapa centrado en la ciudad; pulsar el área de otra ciudad lleva a su ficha. */
export function CityMiniMap({ citySlug, isoDate }: CityMiniMapProps) {
  const aires = useAires();
  const router = useRouter();

  const handleSelectCity = useCallback(
    (slug: string) => {
      if (slug !== citySlug) router.push(`/${slug}`);
    },
    [citySlug, router],
  );

  return (
    <div className="space-y-2">
      {aires.status === 'error' && (
        <p role="alert" className="text-sm font-semibold text-negative">{aires.error}</p>
      )}
      <ZfeMapLoader
        areas={aires.areas}
        critair={null}
        vehicleType="car"
        selectedCitySlug={citySlug}
        onSelectCity={handleSelectCity}
        isoDate={isoDate}
      />
    </div>
  );
}
