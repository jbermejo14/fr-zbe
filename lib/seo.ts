/** Año actual, fijado al evaluar el módulo (en el build) para los títulos SEO. */
export const SEO_CURRENT_YEAR = new Date().getFullYear();

/** Longitud máxima recomendada de una meta description. */
export const SEO_META_DESCRIPTION_MAX = 160;

const SEO_ELLIPSIS = '…';

/** Recorta una descripción a SEO_META_DESCRIPTION_MAX caracteres, cortando en palabra y añadiendo «…». */
export function truncateMetaDescription(text: string): string {
  if (text.length <= SEO_META_DESCRIPTION_MAX) return text;
  const limit = SEO_META_DESCRIPTION_MAX - SEO_ELLIPSIS.length;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}${SEO_ELLIPSIS}`;
}
