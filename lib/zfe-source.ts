/** true mientras public/datos/aires.geojson sea el fichero de ejemplo. Las páginas muestran un aviso. */
export const AIRES_DATA_IS_SAMPLE = true;
export const AIRES_OFFICIAL_URL =
  'https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions';
/** Ruta pública del fichero, sin BASE_PATH. */
export const AIRES_PUBLIC_PATH = '/datos/aires.geojson';
export const CERTIFICAT_AIR_URL = 'https://www.certificat-air.gouv.fr/';

/**
 * Meta robots de las páginas: con datos de ejemplo no se indexan (noindex, follow);
 * con datos oficiales devuelve undefined y las páginas son indexables por defecto.
 */
export function sampleDataRobots(isSample: boolean): { index: false; follow: true } | undefined {
  return isSample ? { index: false, follow: true } : undefined;
}
