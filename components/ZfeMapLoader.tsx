'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/** Leaflet necesita `window`: el mapa solo se carga en el navegador. */
export const ZfeMapLoader = dynamic(() => import('./ZfeMap').then((module) => module.ZfeMap), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="flex h-[420px] w-full items-center justify-center rounded-xl border border-line bg-elevated text-sm text-secondary lg:h-[560px]"
    >
      Chargement de la carte…
    </div>
  ),
});
