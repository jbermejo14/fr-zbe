import { AdSlot } from '@/components/AdSlot';

/** Portada provisional: la sustituye el módulo C4 (calculadora y mapa). */
export default function HomePage() {
  return (
    <div className="main-wrapper">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
        Où pouvez-vous circuler ? Zones à faibles émissions et Crit&apos;Air
      </h1>
      <AdSlot />
    </div>
  );
}
