import { LegalPage } from '@/components/LegalPage';
import { getAdSenseClient } from '@/components/AdSenseScript';
import { getTitular, type Titular } from '@/lib/legal';
import { legalHolderValue, legalMetadata } from '@/lib/legal-text';
import { SITE_NAME } from '@/lib/site';

const PATH = '/confidentialite';
const URL_AEPD = 'https://www.aepd.es';
const URL_CNIL_PLAINTE = 'https://www.cnil.fr/fr/plaintes';

export const metadata = legalMetadata(
  PATH,
  'Politique de confidentialité',
  `Comment ${SITE_NAME} traite les données personnelles, conformément au RGPD.`
);

export default function ConfidentialitePage() {
  const holder = getTitular();
  const field = (name: keyof Titular) => legalHolderValue(holder, name);
  const adsenseActive = getAdSenseClient() !== null;

  return (
    <LegalPage title="Politique de confidentialité" path={PATH} breadcrumbLabel="Confidentialité">
      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement est {field('nombre')} (NIF : {field('nif')}), domicilié à l&apos;adresse suivante : {field('domicilio')}. Contact : {field('email')}.
      </p>

      <h2>Données traitées</h2>
      <p>
        Ce site ne propose ni compte utilisateur ni formulaire, et ne collecte directement aucune donnée personnelle.
      </p>
      <ul>
        <li>
          Le calculateur Crit&apos;Air : le véhicule que vous choisissez (type, énergie, année ou norme Euro) est traité uniquement dans votre navigateur. Il n&apos;est envoyé à aucun serveur et n&apos;est pas conservé.
        </li>
        <li>
          Courrier électronique : si vous écrivez à l&apos;éditeur, votre message et votre adresse servent uniquement à vous répondre. La base légale est l&apos;intérêt légitime de l&apos;éditeur à répondre aux demandes qui lui sont adressées.
        </li>
      </ul>

      <h2>Données techniques reçues par des tiers</h2>
      <p>
        Lorsque vous consultez une page, votre navigateur télécharge des ressources auprès de tiers, qui reçoivent votre adresse IP et des données techniques (navigateur, langue). La base légale est l&apos;intérêt légitime au bon fonctionnement et à la sécurité du site{adsenseActive ? ' et, pour la publicité, votre consentement' : ''}.
      </p>
      <ul>
        <li>OpenStreetMap (tile.openstreetmap.org), qui fournit les fonds de carte lorsqu&apos;une carte s&apos;affiche.</li>
        <li>Cloudflare, Inc., hébergeur du site, qui peut enregistrer l&apos;adresse IP pour des raisons de sécurité.</li>
        {adsenseActive && (
          <li>
            Google AdSense (Google Ireland Ltd.), qui peut déposer des cookies et traiter des données de votre appareil uniquement si vous y consentez, au moyen de la plateforme de gestion du consentement de Google. Consultez la politique relative aux cookies.
          </li>
        )}
      </ul>

      <h2>Transferts hors de l&apos;Union européenne</h2>
      <p>
        Cloudflare, Inc. est établie aux États-Unis. Les transferts de données vers ce pays reposent sur le cadre de protection des données UE–États-Unis ou sur les clauses contractuelles types de la Commission européenne.
        {adsenseActive && ' Il en va de même pour Google, si vous acceptez ses cookies publicitaires.'}
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les courriers électroniques sont conservés le temps nécessaire au traitement de votre demande, puis pendant les délais de prescription légaux. Les données techniques sont conservées par chaque tiers selon sa propre politique.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition, de limitation du traitement et de portabilité. Pour les exercer, écrivez à {field('email')} en précisant le droit concerné.
        {adsenseActive && ' Vous pouvez retirer votre consentement à tout moment avec le bouton « Gérer les cookies » en bas de page.'}
      </p>

      <h2>Réclamation</h2>
      <p>
        Vous pouvez introduire une réclamation auprès de l&apos;Agencia Española de Protección de Datos (AEPD), autorité chef de file :{' '}
        <a href={URL_AEPD} target="_blank" rel="noopener noreferrer">aepd.es</a>, ou auprès de la CNIL, qui la transmettra à l&apos;autorité compétente :{' '}
        <a href={URL_CNIL_PLAINTE} target="_blank" rel="noopener noreferrer">cnil.fr/fr/plaintes</a>.
      </p>
    </LegalPage>
  );
}
