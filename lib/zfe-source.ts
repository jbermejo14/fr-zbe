/** false: public/datos/aires.geojson contiene los datos oficiales de la Base Nationale des ZFE. */
export const AIRES_DATA_IS_SAMPLE = false;
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
