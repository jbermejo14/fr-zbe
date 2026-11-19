const FORMAT_DATE_FIRST_DAY_PATTERN = /^1 /;

/** Fecha 'yyyy-mm-dd' en francés de Francia: « 19 novembre 2026 ». */
export function formatIsoDateFr(isoDate: string): string {
  const text = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
  // Según la versión de ICU, el día 1 sale « 1 » en lugar de « 1er ».
  return text.replace(FORMAT_DATE_FIRST_DAY_PATTERN, '1er ');
}
