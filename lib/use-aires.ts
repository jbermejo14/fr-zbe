'use client';

import { useEffect, useState } from 'react';
import { assetPath } from './site';
import { parseAires } from './zfe-areas';
import type { ZfeArea } from './zfe-areas';
import { AIRES_PUBLIC_PATH } from './zfe-source';

export interface UseAiresResult {
  status: 'loading' | 'ready' | 'error';
  areas: ZfeArea[];
  /** Mensaje en francés listo para mostrar, o null si no hay error. */
  error: string | null;
}

/** Función con la forma de `fetch`; se inyecta en las pruebas para no usar la red. */
export type AiresFetchImpl = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

const AIRES_ERROR_PREFIX = 'Impossible de charger les zones : ';
const AIRES_LOADING_RESULT: UseAiresResult = { status: 'loading', areas: [], error: null };

/** Mensaje visible de un fallo de carga: « Impossible de charger les zones : … ». */
export function airesErrorMessage(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return `${AIRES_ERROR_PREFIX}${detail}`;
}

/** Descarga y convierte `aires.geojson`. Lanza si la respuesta no es 2xx o el JSON no es válido. */
export async function airesFetch(
  fetchImpl: AiresFetchImpl,
  url: string,
  signal?: AbortSignal,
): Promise<ZfeArea[]> {
  const response = await fetchImpl(url, { signal });
  if (!response.ok) {
    throw new Error(`le serveur a répondu ${response.status} pour ${url}.`);
  }
  return parseAires(await response.json());
}

/** Carga `aires.geojson` en el navegador y lo convierte con `parseAires`. */
export function useAires(): UseAiresResult {
  const [result, setResult] = useState<UseAiresResult>(AIRES_LOADING_RESULT);

  useEffect(() => {
    const controller = new AbortController();
    airesFetch(fetch, assetPath(AIRES_PUBLIC_PATH), controller.signal)
      .then((areas) => setResult({ status: 'ready', areas, error: null }))
      .catch((cause: unknown) => {
        // Abortar al desmontar no es un fallo: se ignora solo ese caso; el resto se muestra.
        if (controller.signal.aborted) return;
        setResult({ status: 'error', areas: [], error: airesErrorMessage(cause) });
      });
    return () => controller.abort();
  }, []);

  return result;
}
