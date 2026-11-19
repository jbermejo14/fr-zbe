import React from 'react';
import { ZFE_CITIES } from '@/lib/zfe-cities';

interface CitySelectorProps {
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

const PILL_BASE_CLASSES =
  'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors';
const PILL_SELECTED_CLASSES = 'border-btn bg-btn text-on-btn';
const PILL_IDLE_CLASSES = 'border-line bg-elevated text-secondary hover:text-fg hover:border-line-hover';

/** Las ciudades como píldoras; en móvil la fila hace scroll horizontal y desde `sm:` las píldoras pasan a varias líneas. */
export function CitySelector({ selectedSlug, onSelect }: CitySelectorProps) {
  return (
    <div role="group" aria-label="Choisir une ville" className="flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
      {ZFE_CITIES.map((city) => (
        <button
          key={city.slug}
          type="button"
          aria-pressed={city.slug === selectedSlug}
          onClick={() => onSelect(city.slug)}
          className={`${PILL_BASE_CLASSES} ${city.slug === selectedSlug ? PILL_SELECTED_CLASSES : PILL_IDLE_CLASSES}`}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}
