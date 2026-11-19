import React from 'react';
import type { CritairClass } from '@/lib/critair';

export type CritairBadgeSize = 'sm' | 'md' | 'lg';

interface CritairBadgeProps {
  critair: CritairClass;
  size?: CritairBadgeSize;
}

const BADGE_SIZE_CLASSES: Record<CritairBadgeSize, { box: string; brand: string; value: string }> = {
  sm: { box: 'h-11 w-11', brand: 'text-[0.5rem]', value: 'text-lg' },
  md: { box: 'h-16 w-16', brand: 'text-[0.625rem]', value: 'text-3xl' },
  lg: { box: 'h-24 w-24', brand: 'text-xs', value: 'text-5xl' },
};

/** Clases de fondo y de texto de cada vignette: tokens `critair-*` de globals.css. */
const BADGE_COLOR_CLASSES: Record<Exclude<CritairClass, 'NC'>, string> = {
  '0': 'bg-critair-0 text-on-critair-0',
  '1': 'bg-critair-1 text-on-critair-1',
  '2': 'bg-critair-2 text-on-critair-2',
  '3': 'bg-critair-3 text-on-critair-3',
  '4': 'bg-critair-4 text-on-critair-4',
  '5': 'bg-critair-5 text-on-critair-5',
};

/**
 * El NC usa `border-secondary`: `border-line` apenas se distingue sobre el fondo (ver ARCHITECTURE.md, sección 4).
 * Su texto « Non classé » usa el mismo tamaño que la marca « Crit'Air » de cada tamaño.
 */
const BADGE_NC_BORDER_CLASSES = 'border-2 border-dashed border-secondary text-fg';

const BADGE_BASE_CLASSES = 'inline-flex shrink-0 flex-col items-center justify-center rounded-full leading-none';

/** Texto accesible de la vignette: « Vignette Crit'Air 3 » o « Non classé ». */
export function critairBadgeLabel(critair: CritairClass): string {
  return critair === 'NC' ? 'Non classé' : `Vignette Crit'Air ${critair}`;
}

/** Vignette Crit'Air redonda. `NC` es un círculo de borde discontinuo con « Non classé ». */
export function CritairBadge({ critair, size = 'md' }: CritairBadgeProps) {
  const sizes = BADGE_SIZE_CLASSES[size];
  const label = critairBadgeLabel(critair);

  if (critair === 'NC') {
    return (
      <span
        role="img"
        aria-label={label}
        className={`${BADGE_BASE_CLASSES} ${sizes.box} ${BADGE_NC_BORDER_CLASSES}`}
      >
        <span aria-hidden="true" className={`${sizes.brand} text-center font-bold`}>
          Non
          <br />
          classé
        </span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={`${BADGE_BASE_CLASSES} ${sizes.box} ${BADGE_COLOR_CLASSES[critair]}`}
    >
      <span aria-hidden="true" className={`${sizes.brand} font-bold`}>
        Crit&apos;Air
      </span>
      <span aria-hidden="true" className={`${sizes.value} font-black`}>
        {critair}
      </span>
    </span>
  );
}
