'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { CritairResult, VehicleInput, VehicleType } from '@/lib/critair';
import { DEFAULT_VEHICLE_TYPE } from '@/lib/critair-form';
import { useAires } from '@/lib/use-aires';
import { findCityBySlug } from '@/lib/zfe-cities';
import { evaluateCities } from '@/lib/zfe-rules';
import { CitySelector } from './CitySelector';
import { CityRulesCard } from './CityRulesCard';
import { CritairCalculator } from './CritairCalculator';
import { CritairResultCard, CritairResultPlaceholder } from './CritairResultCard';
import { ZfeMapLoader } from './ZfeMapLoader';

const ISO_MONTH_DIGITS = 2;

/** Fecha local de hoy como 'yyyy-mm-dd' (no UTC: el día que ve el usuario). */
function dashboardTodayIso(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(ISO_MONTH_DIGITS, '0');
  const day = String(now.getDate()).padStart(ISO_MONTH_DIGITS, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Portada interactiva: calculadora y resultado a la izquierda, mapa a la derecha, ficha de ciudad debajo. */
export function ZfeDashboard() {
  const aires = useAires();
  const [result, setResult] = useState<CritairResult | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>(DEFAULT_VEHICLE_TYPE);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(null);
  // Sube en cada petición de ciudad para que el mapa vuelva a encuadrar también la ya seleccionada.
  const [focusRequest, setFocusRequest] = useState(0);
  // Solo se usa con áreas ya cargadas, así que no afecta al HTML generado en el build.
  const [isoDate] = useState(() => dashboardTodayIso(new Date()));

  const handleResult = useCallback((nextResult: CritairResult | null, input: VehicleInput) => {
    setResult(nextResult);
    setVehicleType(input.vehicleType);
  }, []);

  const handleSelectCity = useCallback((slug: string) => {
    setSelectedCitySlug(slug);
    setFocusRequest((count) => count + 1);
  }, []);

  const critair = result?.critair ?? null;
  const accesses = useMemo(
    () => (critair === null ? [] : evaluateCities(critair, vehicleType, aires.areas, isoDate)),
    [critair, vehicleType, aires.areas, isoDate],
  );
  const selectedCity = selectedCitySlug === null ? null : findCityBySlug(selectedCitySlug);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="min-w-0 space-y-4">
          <CritairCalculator onResult={handleResult} />
          {result === null ? (
            <CritairResultPlaceholder />
          ) : (
            <CritairResultCard
              result={result}
              accesses={accesses}
              airesStatus={aires.status}
            />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          {aires.status === 'error' && (
            <p role="alert" className="text-sm font-semibold text-negative">{aires.error}</p>
          )}
          <ZfeMapLoader
            areas={aires.areas}
            critair={critair}
            vehicleType={vehicleType}
            selectedCitySlug={selectedCitySlug}
            onSelectCity={handleSelectCity}
            isoDate={isoDate}
            focusRequest={focusRequest}
          />
        </div>
      </div>

      <section aria-label="Fiche d'une ville" className="min-w-0 space-y-3">
        <h2 className="text-lg font-bold text-fg">Les règles ville par ville</h2>
        <CitySelector selectedSlug={selectedCitySlug} onSelect={handleSelectCity} />
        {selectedCity !== null && aires.status === 'ready' && (
          <CityRulesCard city={selectedCity} areas={aires.areas} isoDate={isoDate} />
        )}
        {selectedCity !== null && aires.status === 'loading' && (
          <p className="text-sm text-secondary">Chargement des zones…</p>
        )}
      </section>
    </div>
  );
}
