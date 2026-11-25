import { absoluteUrl } from './site';

/** Año actual, fijado al evaluar el módulo (en el build) para los títulos SEO. */
export const SEO_CURRENT_YEAR = new Date().getFullYear();

/** Longitud máxima recomendada de una meta description. */
export const SEO_META_DESCRIPTION_MAX = 160;

/** Imagen Open Graph compartida (1200×630), dentro de public/. */
const SEO_OG_IMAGE_PATH = '/brand/ododex-og.png';
const SEO_OG_IMAGE_WIDTH = 1200;
const SEO_OG_IMAGE_HEIGHT = 630;
const SEO_OG_IMAGE_ALT = "Ododex : zones à faibles émissions (ZFE) et vignette Crit'Air";

/** Imágenes de Open Graph y Twitter con URL absoluta. Cada página que redefine `openGraph` debe incluirlas. */
export function seoSocialImages(): { url: string; width: number; height: number; alt: string }[] {
  return [
    {
      url: absoluteUrl(SEO_OG_IMAGE_PATH),
      width: SEO_OG_IMAGE_WIDTH,
      height: SEO_OG_IMAGE_HEIGHT,
      alt: SEO_OG_IMAGE_ALT,
    },
  ];
}

const SEO_ELLIPSIS = '…';

/** Recorta una descripción a SEO_META_DESCRIPTION_MAX caracteres, cortando en palabra y añadiendo «…». */
export function truncateMetaDescription(text: string): string {
  if (text.length <= SEO_META_DESCRIPTION_MAX) return text;
  const limit = SEO_META_DESCRIPTION_MAX - SEO_ELLIPSIS.length;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}${SEO_ELLIPSIS}`;
}
