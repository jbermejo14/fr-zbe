import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseAires } from './zfe-areas';
import type { ZfeArea } from './zfe-areas';

const AIRES_SERVER_RELATIVE_PATH = ['public', 'datos', 'aires.geojson'];

/**
 * Lee `public/datos/aires.geojson` con `fs` y lo convierte con `parseAires`. Solo para páginas de
 * servidor (compilación). Si falla, lanza el error con la ruta del fichero para que el build falle.
 */
export function loadAiresAtBuild(): ZfeArea[] {
  const file = path.join(process.cwd(), ...AIRES_SERVER_RELATIVE_PATH);
  try {
    return parseAires(JSON.parse(readFileSync(file, 'utf8')));
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`No se pudo cargar ${file}: ${detail}`);
  }
}
