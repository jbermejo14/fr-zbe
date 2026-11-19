import { LegalPage } from '@/components/LegalPage';
import { getTitular, type Titular } from '@/lib/legal';
import { legalHolderValue, legalMetadata } from '@/lib/legal-text';
import { SITE_NAME } from '@/lib/site';

const PATH = '/mentions-legales';
const URL_CLOUDFLARE = 'https://www.cloudflare.com';
const URL_DATA_SOURCE = 'https://transport.data.gouv.fr/datasets/base-nationale-consolidee-des-zones-a-faibles-emissions';
const URL_LICENCE_ETALAB = 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/';
const URL_CERTIFICAT_AIR = 'https://www.certificat-air.gouv.fr/';

export const metadata = legalMetadata(
  PATH,
  'Mentions légales',
  `Mentions légales de ${SITE_NAME} : éditeur, hébergeur, source des données et limites de responsabilité.`
);

export default function MentionsLegalesPage() {
  const holder = getTitular();
  const field = (name: keyof Titular) => legalHolderValue(holder, name);

  return (
    <LegalPage title="Mentions légales" path={PATH}>
      <h2>Éditeur du site</h2>
      <p>
        Conformément à l&apos;article 6 III de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), ce site est édité par :
      </p>
      <ul>
        <li>Nom : {field('nombre')}</li>
        <li>Numéro d&apos;identification fiscale (NIF, Espagne) : {field('nif')}</li>
        <li>Adresse : {field('domicilio')}</li>
        <li>Adresse e-mail de contact : {field('email')}</li>
        {holder.tipo === 'empresa' && <li>Immatriculation au registre du commerce : {field('registroMercantil')}</li>}
      </ul>

      <h2>Directeur de la publication</h2>
      <p>Le directeur de la publication est l&apos;éditeur du site : {field('nombre')}.</p>

      <h2>Hébergeur</h2>
      <p>
        Le site est hébergé par Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis (<a href={URL_CLOUDFLARE} target="_blank" rel="noopener noreferrer">cloudflare.com</a>).
      </p>

      <h2>Objet du site</h2>
      <p>
        {SITE_NAME} présente les zones à faibles émissions mobilité (ZFE-m) de plusieurs grandes agglomérations françaises, avec une carte de leurs périmètres et un calculateur qui estime la vignette Crit&apos;Air d&apos;un véhicule à partir de son type, de son énergie et de sa date de première immatriculation (ou de sa norme Euro).
      </p>

      <h2>Source des données</h2>
      <p>
        Les périmètres et les restrictions proviennent de la{' '}
        <a href={URL_DATA_SOURCE} target="_blank" rel="noopener noreferrer">Base nationale des ZFE</a>{' '}
        publiée sur transport.data.gouv.fr et sont réutilisés sous{' '}
        <a href={URL_LICENCE_ETALAB} target="_blank" rel="noopener noreferrer">Licence Ouverte</a>, avec mention de la source.
      </p>
      <p>
        {SITE_NAME} est un site indépendant : il n&apos;est pas affilié à l&apos;administration ni à aucune collectivité, et ne bénéficie d&apos;aucun soutien de leur part.
      </p>

      <h2>Caractère indicatif des informations</h2>
      <p>
        Les périmètres, les horaires et les restrictions affichés sont donnés à titre indicatif. Les arrêtés de chaque collectivité et la signalisation sur place font foi : vérifiez-les sur le site officiel de la zone avant de circuler.
      </p>
      <p>
        La vignette calculée est une estimation et ne remplace pas la vignette officielle. Pour en obtenir une, rendez-vous sur le site du ministère :{' '}
        <a href={URL_CERTIFICAT_AIR} target="_blank" rel="noopener noreferrer">certificat-air.gouv.fr</a>.
      </p>
      <p>
        Dans la limite permise par la loi, l&apos;éditeur s&apos;efforce de reproduire fidèlement les données publiées, mais ne garantit ni leur exactitude ni leur actualité. Il ne saurait être tenu responsable des décisions prises ni des amendes ou préjudices résultant de l&apos;utilisation du site.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, la conception graphique, le code et les autres contenus propres au site sont la propriété de l&apos;éditeur et protégés par le Code de la propriété intellectuelle. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite, sauf pour un usage strictement personnel et avec mention de la source.
      </p>

      <h2>Cartographie</h2>
      <p>
        Les cartes affichent des données © les contributeurs d&apos;OpenStreetMap, soumises à la licence ODbL et à ses conditions d&apos;utilisation.
      </p>

      <h2>Droit applicable</h2>
      <p>
        Le site est édité depuis l&apos;Espagne. Les présentes mentions légales sont régies par le droit espagnol, sans préjudice des dispositions impératives de protection des consommateurs de votre pays de résidence.
      </p>
    </LegalPage>
  );
}
