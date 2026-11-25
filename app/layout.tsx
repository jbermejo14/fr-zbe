import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdSenseScript, getAdSenseClient } from '@/components/AdSenseScript';
import { seoSocialImages } from '@/lib/seo';
import { getSiteUrl, SITE_NAME } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

/**
 * Fija el tema antes de pintar para evitar el parpadeo: primero la elección guardada
 * y, si no hay, la preferencia del sistema. El try/catch cubre un localStorage no disponible.
 */
const THEME_SCRIPT = `
  (function() {
    var theme = null;
    try {
      var saved = localStorage.getItem('ododex-theme');
      if (saved === 'light' || saved === 'dark') theme = saved;
      if (!theme) {
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      }
    } catch (e) {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Zones à faibles émissions (ZFE) et vignette Crit'Air",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Vérifiez dans quelles zones à faibles émissions (ZFE) de France votre véhicule peut circuler selon sa vignette Crit'Air. Calculateur et carte interactive des principales métropoles.",
  keywords: [
    'ZFE',
    'zones à faibles émissions',
    "vignette Crit'Air",
    "Crit'Air",
    'ZFE-m',
    'ZFE Paris',
    'ZFE Lyon',
    'véhicules interdits ZFE',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
    images: seoSocialImages(),
  },
  twitter: {
    card: 'summary_large_image',
    images: seoSocialImages(),
  },
  // Sin `robots` global: indexar es el valor por defecto, y un `index, follow` aquí
  // se sumaría al `noindex` que Next pone en la página 404.
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer showConsent={getAdSenseClient() !== null} />
        <AdSenseScript />
      </body>
    </html>
  );
}
