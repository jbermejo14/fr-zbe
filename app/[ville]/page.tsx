import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AdSlot } from '@/components/AdSlot';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CityFaq } from '@/components/CityFaq';
import { CityMiniMap } from '@/components/CityMiniMap';
import { CityRulesCard } from '@/components/CityRulesCard';
import { CritairSummaryTable } from '@/components/CritairSummaryTable';
import { OtherCities } from '@/components/OtherCities';
import { SampleDataNotice } from '@/components/SampleDataNotice';
import { cityFaq, cityMetadata } from '@/lib/city-page';
import { seoSocialImages } from '@/lib/seo';
import { formatIsoDateFr, todayIsoInParis } from '@/lib/format-date';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { loadAiresAtBuild } from '@/lib/zfe-areas-server';
import { AIRES_DATA_IS_SAMPLE, sampleDataRobots } from '@/lib/zfe-source';
import { ZFE_CITIES, areasForCity, findCityBySlug } from '@/lib/zfe-cities';

interface CityPageProps {
  params: Promise<{ ville: string }>;
}

export const dynamicParams = false;

/** Fecha de compilación en hora de París: las reglas se muestran « en vigueur » a ese día. */
const CITY_PAGE_BUILD_DATE = todayIsoInParis(new Date());

export function generateStaticParams() {
  return ZFE_CITIES.map((city) => ({ ville: city.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { ville } = await params;
  const city = findCityBySlug(ville);
  if (city === null) return { title: 'Ville introuvable' };
  const { title, description } = cityMetadata(city, areasForCity(city, loadAiresAtBuild()), CITY_PAGE_BUILD_DATE);
  const url = absoluteUrl(`/${city.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: sampleDataRobots(AIRES_DATA_IS_SAMPLE),
    openGraph: { title, description, url, siteName: SITE_NAME, locale: 'fr_FR', type: 'article', images: seoSocialImages() },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { ville } = await params;
  const city = findCityBySlug(ville);
  if (city === null) notFound();

  const cityAreas = areasForCity(city, loadAiresAtBuild());
  const faq = cityFaq(city, cityAreas, CITY_PAGE_BUILD_DATE);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };

  return (
    <div className="main-wrapper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ name: 'Accueil', url: '/' }, { name: `ZFE ${city.name}`, url: `/${city.slug}` }]} />
      <h1 className="mb-2 text-2xl font-extrabold tracking-tight md:text-3xl">
        ZFE {city.ofName} : vignettes Crit&apos;Air autorisées
      </h1>
      <p className="mb-4 text-sm text-secondary">
        Règles en vigueur au {formatIsoDateFr(CITY_PAGE_BUILD_DATE)}
      </p>
      <SampleDataNotice />

      <div className="space-y-8">
        <section aria-labelledby="summary-title" className="min-w-0 space-y-3">
          <h2 id="summary-title" className="text-lg font-bold text-fg">Quelles vignettes peuvent circuler ?</h2>
          <CritairSummaryTable cityAreas={cityAreas} isoDate={CITY_PAGE_BUILD_DATE} />
        </section>

        <CityRulesCard city={city} areas={cityAreas} isoDate={CITY_PAGE_BUILD_DATE} showFullPageLink={false} />
        <AdSlot />

        <section aria-labelledby="map-title" className="min-w-0 space-y-3">
          <h2 id="map-title" className="text-lg font-bold text-fg">Carte de la zone</h2>
          <CityMiniMap citySlug={city.slug} isoDate={CITY_PAGE_BUILD_DATE} />
        </section>

        <section aria-labelledby="faq-title" className="min-w-0 space-y-3">
          <h2 id="faq-title" className="text-lg font-bold text-fg">Questions fréquentes</h2>
          <CityFaq entries={faq} />
        </section>

        <section aria-labelledby="others-title" className="min-w-0 space-y-3">
          <h2 id="others-title" className="text-lg font-bold text-fg">Les autres ZFE</h2>
          <OtherCities currentSlug={city.slug} />
        </section>
        <AdSlot />
      </div>
    </div>
  );
}
