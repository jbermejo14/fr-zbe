import { LegalPage } from '@/components/LegalPage';
import { getAdSenseClient } from '@/components/AdSenseScript';
import { legalMetadata } from '@/lib/legal-text';
import { SITE_NAME } from '@/lib/site';

const PATH = '/cookies';
const URL_COOKIES_GOOGLE = 'https://policies.google.com/technologies/cookies?hl=fr';

export const metadata = legalMetadata(
  PATH,
  'Politique relative aux cookies',
  `Les cookies et le stockage local utilisés par ${SITE_NAME} : thème du site et publicité, base légale, consentement et gestion depuis votre navigateur.`
);

export default function CookiesPage() {
  const adsenseActive = getAdSenseClient() !== null;

  return (
    <LegalPage title="Politique relative aux cookies" path={PATH} breadcrumbLabel="Cookies">
      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Les cookies et technologies similaires (comme le stockage local du navigateur) enregistrent de petites données sur votre appareil. Leur usage est encadré par l&apos;article 82 de la loi « Informatique et Libertés » et par les lignes directrices de la CNIL.
      </p>

      <h2>Ce que ce site utilise</h2>
      <ul>
        <li>
          <code>ododex-theme</code> (<code>localStorage</code>) : mémorise le thème clair ou sombre que vous choisissez. Il s&apos;agit d&apos;une préférence demandée par vous, exemptée de consentement. Elle n&apos;expire pas.
        </li>
        {adsenseActive && (
          <li>
            Cookies de Google AdSense : publicité et mesure d&apos;audience, déposés par un tiers. Ils ne sont installés que si vous les acceptez dans le message de consentement de Google (plateforme de gestion du consentement conforme au cadre de transparence et de consentement de l&apos;IAB). Leur durée dépend de Google.
          </li>
        )}
      </ul>
      {adsenseActive ? (
        <p>
          Pour en savoir plus sur les cookies de Google, consultez <a href={URL_COOKIES_GOOGLE} target="_blank" rel="noopener noreferrer">policies.google.com</a>.
        </p>
      ) : (
        <p>
          Pour le moment, ce site n&apos;affiche aucune publicité et ne dépose aucun cookie publicitaire ni de mesure d&apos;audience. Si cela change, cette page sera mise à jour et votre consentement sera demandé avant tout dépôt.
        </p>
      )}

      {adsenseActive && (
        <>
          <h2>Modifier ou retirer votre consentement</h2>
          <p>
            Vous pouvez modifier votre choix à tout moment avec le bouton « Gérer les cookies » en bas de page.
          </p>
        </>
      )}

      <h2>Supprimer les cookies depuis votre navigateur</h2>
      <p>
        Vous pouvez bloquer ou supprimer les cookies et le stockage local dans les paramètres de confidentialité de votre navigateur. Si vous supprimez <code>ododex-theme</code>, le site reprendra le thème de votre système.
      </p>
    </LegalPage>
  );
}
