import type { Metadata } from 'next';
import { AdSlot } from '@/components/AdSlot';
import { SampleDataNotice } from '@/components/SampleDataNotice';
import { ZfeDashboard } from '@/components/ZfeDashboard';
import { SEO_CURRENT_YEAR, seoSocialImages, truncateMetaDescription } from '@/lib/seo';
import { absoluteUrl, SECTION_NAME, SITE_NAME } from '@/lib/site';
import { AIRES_DATA_IS_SAMPLE, sampleDataRobots } from '@/lib/zfe-source';

const HOME_URL = absoluteUrl('/');
const HOME_TITLE = `ZFE et Crit'Air ${SEO_CURRENT_YEAR} : carte et calculateur`;
const HOME_DESCRIPTION = truncateMetaDescription(
  "Calculez la vignette Crit'Air de votre véhicule et vérifiez où il peut circuler dans les zones à faibles émissions (ZFE) des principales métropoles françaises.",
);

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: HOME_URL },
  robots: sampleDataRobots(AIRES_DATA_IS_SAMPLE),
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: HOME_URL,
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
    images: seoSocialImages(),
  },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: `${SITE_NAME} · ${SECTION_NAME}`,
  url: HOME_URL,
  inLanguage: 'fr-FR',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'All',
  description: HOME_DESCRIPTION,
};

export default function HomePage() {
  return (
    <div className="main-wrapper">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight md:text-3xl">
        Où pouvez-vous circuler ? Zones à faibles émissions et Crit&apos;Air
      </h1>
      <SampleDataNotice />
      <ZfeDashboard />
      <AdSlot />
    </div>
  );
}
