import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { ZFE_CITIES } from '@/lib/zfe-cities';

// Exportación estática: el sitemap se genera en el build.
export const dynamic = 'force-static';

const SITEMAP_HOME_PRIORITY = 1.0;
const SITEMAP_CITY_PRIORITY = 0.8;

/** La portada y las fichas de ciudad; las páginas legales quedan fuera (noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const cityRoutes: MetadataRoute.Sitemap = ZFE_CITIES.map((city) => ({
    url: absoluteUrl(`/${city.slug}`),
    lastModified,
    changeFrequency: 'weekly',
    priority: SITEMAP_CITY_PRIORITY,
  }));
  return [
    { url: absoluteUrl('/'), lastModified, changeFrequency: 'daily', priority: SITEMAP_HOME_PRIORITY },
    ...cityRoutes,
  ];
}
