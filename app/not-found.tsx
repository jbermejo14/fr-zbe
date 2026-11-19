import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="main-wrapper">
      <div className="card text-center">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">Page introuvable</h1>
        <p className="text-secondary mb-5">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="btn btn-primary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
