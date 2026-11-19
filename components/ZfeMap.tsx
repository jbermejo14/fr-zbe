'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ban, Check, Minus } from 'lucide-react';
import type { CritairClass, VehicleType } from '@/lib/critair';
import {
  MAP_AREA_FILL_OPACITY,
  MAP_AREA_OPACITY,
  MAP_AREA_WEIGHT,
  MAP_AREA_WEIGHT_HOVER,
  MAP_AREA_WEIGHT_SELECTED,
  MAP_FLY_DURATION_SECONDS,
  MAP_FLY_PADDING,
  MAP_FRANCE_CENTER,
  MAP_FRANCE_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STATE_COLOR_VARIABLES,
  MAP_STATE_LABELS,
  MAP_TILE_OPTIONS,
  MAP_TILE_URL,
  mapAreaState,
  mapReadCssVariable,
} from '@/lib/map-config';
import type { MapAreaState } from '@/lib/map-config';
import { isAreaActive } from '@/lib/zfe-areas';
import type { ZfeArea } from '@/lib/zfe-areas';
import { areasForCity, cityForAreaId, findCityBySlug } from '@/lib/zfe-cities';
import type { ZfeCity } from '@/lib/zfe-cities';

export interface ZfeMapProps {
  areas: readonly ZfeArea[];
  /** Vignette elegida; null pinta todas las áreas en gris. */
  critair: CritairClass | null;
  vehicleType: VehicleType;
  selectedCitySlug: string | null;
  /** Debe ser estable entre renders (useCallback o un setState). */
  onSelectCity: (slug: string) => void;
  /** 'yyyy-mm-dd': solo se pintan las áreas vigentes ese día. */
  isoDate: string;
  /**
   * Contador que sube cada vez que el usuario pide ver una ciudad: permite volver a encuadrar
   * la ciudad ya seleccionada. Opcional (el minimapa de una ciudad no lo usa).
   */
  focusRequest?: number;
}

const LEGEND_STATES: readonly MapAreaState[] = ['allowed', 'restricted', 'neutral'];
/**
 * Clases de la muestra de la leyenda. `bg-critair-0` garantiza que Tailwind emite `--color-critair-0`,
 * la variable que el mapa lee desde JS para pintar las áreas permitidas.
 */
const LEGEND_SWATCH_CLASSES: Record<MapAreaState, string> = {
  allowed: 'bg-critair-0',
  restricted: 'bg-negative',
  neutral: 'bg-line-hover border border-secondary',
};
const LEGEND_ICON_CLASS = 'h-3.5 w-3.5';

function MapLegendIcon({ state }: { state: MapAreaState }) {
  if (state === 'allowed') return <Check aria-hidden="true" className={LEGEND_ICON_CLASS} />;
  if (state === 'restricted') return <Ban aria-hidden="true" className={LEGEND_ICON_CLASS} />;
  return <Minus aria-hidden="true" className={LEGEND_ICON_CLASS} />;
}

type MapStateStyles = Record<MapAreaState, L.PathOptions>;

const MAP_THEME_ATTRIBUTE = 'data-theme';

/** Estilos de los tres estados; lee las variables CSS una sola vez por pasada de pintado. */
function mapReadStateStyles(): MapStateStyles {
  const styleFor = (state: MapAreaState): L.PathOptions => {
    const colors = MAP_STATE_COLOR_VARIABLES[state];
    return {
      color: mapReadCssVariable(colors.stroke),
      fillColor: mapReadCssVariable(colors.fill),
      weight: MAP_AREA_WEIGHT,
      opacity: MAP_AREA_OPACITY,
      fillOpacity: MAP_AREA_FILL_OPACITY,
    };
  };
  return { allowed: styleFor('allowed'), restricted: styleFor('restricted'), neutral: styleFor('neutral') };
}

/** Texto del tooltip de un área: ciudad y estado (nunca solo color). */
function mapTooltipText(area: ZfeArea, state: MapAreaState, hasCritair: boolean): string {
  const cityName = cityForAreaId(area.id)?.name ?? area.id;
  return hasCritair ? `${cityName} : ${MAP_STATE_LABELS[state]}` : cityName;
}

function mapCreate(container: HTMLElement): L.Map {
  const map = L.map(container, { center: MAP_FRANCE_CENTER, zoom: MAP_FRANCE_ZOOM, minZoom: MAP_MIN_ZOOM });
  L.tileLayer(MAP_TILE_URL, MAP_TILE_OPTIONS).addTo(map);
  return map;
}

interface MapLayerContext {
  styles: MapStateStyles;
  critair: CritairClass | null;
  vehicleType: VehicleType;
  selectedCitySlug: string | null;
  onSelectCity: (slug: string) => void;
}

function mapBuildLayer(area: ZfeArea, context: MapLayerContext): L.GeoJSON {
  const state = mapAreaState(area, context.critair, context.vehicleType);
  const city = cityForAreaId(area.id);
  const baseWeight = city !== null && city.slug === context.selectedCitySlug ? MAP_AREA_WEIGHT_SELECTED : MAP_AREA_WEIGHT;
  const feature = { type: 'Feature', properties: {}, geometry: area.geometry } as GeoJSON.Feature;
  const layer = L.geoJSON(feature, { style: { ...context.styles[state], weight: baseWeight } });
  layer.bindTooltip(mapTooltipText(area, state, context.critair !== null), { sticky: true });
  layer.on('mouseover', () => layer.setStyle({ weight: MAP_AREA_WEIGHT_HOVER }));
  layer.on('mouseout', () => layer.setStyle({ weight: baseWeight }));
  layer.on('click', () => {
    if (city !== null) context.onSelectCity(city.slug);
  });
  return layer;
}

/** Límites de las áreas vigentes de la ciudad, o null si no hay ninguna cargada. */
function mapCityBounds(city: ZfeCity, areas: readonly ZfeArea[], isoDate: string): L.LatLngBounds | null {
  const cityAreas = areasForCity(city, areas).filter((area) => isAreaActive(area, isoDate));
  if (cityAreas.length === 0) return null;
  const group = L.featureGroup(
    cityAreas.map((area) => L.geoJSON({ type: 'Feature', properties: {}, geometry: area.geometry } as GeoJSON.Feature)),
  );
  return group.getBounds();
}

function mapFlyToCity(map: L.Map, city: ZfeCity, bounds: L.LatLngBounds | null): void {
  if (bounds === null) {
    map.flyTo(city.center, city.zoom, { duration: MAP_FLY_DURATION_SECONDS });
    return;
  }
  map.flyToBounds(bounds, { padding: MAP_FLY_PADDING, duration: MAP_FLY_DURATION_SECONDS });
}

/** Sube cada vez que cambia `data-theme` de <html>, para repintar con los colores del nuevo tema. */
function useMapThemeVersion(): number {
  const [themeVersion, setThemeVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion((version) => version + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [MAP_THEME_ATTRIBUTE] });
    return () => observer.disconnect();
  }, []);
  return themeVersion;
}

/** Mapa Leaflet de las ZFE vigentes, coloreadas según la vignette elegida. Solo cliente. */
export function ZfeMap({
  areas,
  critair,
  vehicleType,
  selectedCitySlug,
  onSelectCity,
  isoDate,
  focusRequest = 0,
}: ZfeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const themeVersion = useMapThemeVersion();

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const map = mapCreate(container);
    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);
    // El contenedor cambia de tamaño después del init de Leaflet: sin esto solo pinta una franja de teselas.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (group === null) return;
    group.clearLayers();
    const context: MapLayerContext = { styles: mapReadStateStyles(), critair, vehicleType, selectedCitySlug, onSelectCity };
    for (const area of areas.filter((candidate) => isAreaActive(candidate, isoDate))) {
      mapBuildLayer(area, context).addTo(group);
    }
  }, [areas, critair, vehicleType, selectedCitySlug, onSelectCity, isoDate, themeVersion]);

  useEffect(() => {
    const city = selectedCitySlug === null ? null : findCityBySlug(selectedCitySlug);
    if (city === null || mapRef.current === null) return;
    mapFlyToCity(mapRef.current, city, mapCityBounds(city, areas, isoDate));
  }, [selectedCitySlug, focusRequest, areas, isoDate]);

  return (
    <div>
      <div
        role="region"
        aria-label="Carte des zones à faibles émissions"
        className="isolate h-[420px] w-full overflow-hidden rounded-xl border border-line lg:h-[560px]"
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary" aria-label="Légende de la carte">
        {LEGEND_STATES.map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${LEGEND_SWATCH_CLASSES[state]}`} />
            <MapLegendIcon state={state} />
            {MAP_STATE_LABELS[state]}
          </li>
        ))}
      </ul>
    </div>
  );
}
