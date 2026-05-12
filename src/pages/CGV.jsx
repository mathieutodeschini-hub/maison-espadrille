import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const articles = [
  {
    titre: 'Article 1 – Identification du vendeur',
    contenu: `La présente application est éditée par :

La société S.A.R.L. La Maison de l'Espadrille au capital de 150 000 euros, inscrite au R.C.S. de Dax sous le numéro 344 100 284 00100, dont le siège social est situé au 180 Chemin Pey de l'Ancre – 40660 MESSANGES (FRANCE).

Téléphone : 05.58.48.02.96 / 05.58.35.10.01
Email : contact@maisonespadrille.fr
Représentant : Arauzo Jean-Claude`,
  },
  {
    titre: 'Article 2 – Dispositions générales',
    contenu: `Les présentes Conditions Générales de Vente (CGV) sont applicables exclusivement à la passation de commandes professionnelles via l'application de réassort La Maison de l'Espadrille, réservée aux revendeurs agréés.

Les CGV sont opposables au client qui reconnaît, lors de la validation de sa commande, en avoir eu connaissance et les avoir acceptées. La validation de la commande vaut adhésion aux CGV en vigueur.`,
  },
  {
    titre: 'Article 3 – Description des produits',
    contenu: `Les produits présentés (chaussures et accessoires) font l'objet d'une fiche détaillant leurs caractéristiques essentielles : référence, coloris, tailles disponibles et prix HT.

Les photographies illustrant les produits ne constituent pas un document contractuel. Les produits sont conformes aux prescriptions du droit français en vigueur.`,
  },
  {
    titre: 'Article 4 – Accès et espace client',
    contenu: `L'accès à l'application est réservé aux revendeurs agréés disposant d'un code d'accès fourni par La Maison de l'Espadrille. Chaque client s'engage à conserver la confidentialité de ses identifiants et à ne pas les communiquer à des tiers.

En cas de perte ou d'utilisation frauduleuse, le client doit en informer sans délai La Maison de l'Espadrille à l'adresse contact@maisonespadrille.fr.`,
  },
  {
    titre: 'Article 5 – Commandes',
    contenu: `Les commandes sont passées directement depuis l'application. Le client sélectionne les modèles, coloris et quantités souhaitées, puis valide sa commande via le bouton "Bon pour accord".

La validation de la commande sur l'application vaut signature électronique et engagement ferme du client.

La Maison de l'Espadrille se réserve le droit de ne pas valider une commande en cas d'indisponibilité produit, de litige en cours ou de non-respect des présentes CGV. Le client sera informé dans les meilleurs délais.`,
  },
  {
    titre: 'Article 6 – Minimum de commande et franco',
    contenu: `Minimum de commande : 10 paires par commande.

Franco de port : à partir de 1 500 € HT. En dessous de ce seuil, des frais de port pourront être appliqués selon le tarif en vigueur communiqué par le représentant commercial.`,
  },
  {
    titre: 'Article 7 – Prix',
    contenu: `Les prix sont indiqués en euros hors taxes (HT). La TVA applicable est de 20 %. Le total TTC est indiqué dans le bon de commande joint à la confirmation.

Les prix sont ceux en vigueur au moment de la validation de la commande. La Maison de l'Espadrille se réserve le droit de modifier ses tarifs à tout moment, sans que cela affecte les commandes déjà confirmées.`,
  },
  {
    titre: 'Article 8 – Modalités de paiement',
    contenu: `Règlement à 30 jours fin de mois à compter de la date de facturation, sauf conditions particulières convenues avec le représentant commercial.

Tout retard de paiement entraînera l'application de pénalités de retard au taux légal en vigueur, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € conformément à l'article L.441-6 du Code de Commerce.`,
  },
  {
    titre: 'Article 9 – Livraison',
    contenu: `Les produits sont livrés à l'adresse de livraison renseignée dans le profil du client. Il appartient au client de vérifier l'exactitude de cette adresse avant validation.

Le délai de livraison est communiqué par le représentant commercial selon la disponibilité des stocks et la période de la saison. La Maison de l'Espadrille ne saurait être tenue responsable des retards imputables à des causes extérieures (transporteur, force majeure).`,
  },
  {
    titre: 'Article 10 – Réserve de propriété',
    contenu: `La Maison de l'Espadrille conserve la propriété des produits livrés jusqu'à complet paiement du prix par le client, en ce compris les éventuels frais annexes.`,
  },
  {
    titre: 'Article 11 – Retours et réclamations',
    contenu: `Toute réclamation pour non-conformité ou vice apparent doit être formulée dans un délai de 14 jours à compter de la réception des produits, par email à contact@maisonespadrille.fr, avec photos et références à l'appui.

Les retours ne sont acceptés qu'après accord écrit de La Maison de l'Espadrille. Les produits doivent être retournés dans leur état et emballage d'origine.

Les retours liés à un excès de commande ou à un changement de décision ne seront pas automatiquement acceptés et feront l'objet d'un examen au cas par cas.`,
  },
  {
    titre: 'Article 12 – Responsabilité',
    contenu: `La Maison de l'Espadrille ne saurait être tenue responsable de l'inexécution du contrat en cas de force majeure ou de fait imprévisible d'un tiers. La responsabilité de La Maison de l'Espadrille est limitée au montant de la commande en cause.`,
  },
  {
    titre: 'Article 13 – Données personnelles',
    contenu: `Les données personnelles collectées (nom, magasin, adresses, email) sont traitées conformément au RGPD et utilisées exclusivement dans le cadre de la relation commerciale. Elles ne sont ni vendues ni cédées à des tiers.

Pour exercer vos droits d'accès, de rectification ou de suppression : contact@maisonespadrille.fr`,
  },
  {
    titre: 'Article 14 – Droit applicable et litiges',
    contenu: `Les présentes CGV sont régies par le droit français.

En cas de litige, le client doit d'abord contacter le service commercial : contact@maisonespadrille.fr ou 05.58.35.10.01.

À défaut de résolution amiable, le litige sera soumis aux tribunaux compétents du ressort du siège social de La Maison de l'Espadrille (Dax).`,
  },
]

export default function CGV() {
  const navigate = useNavigate()
  const [ouvert, setOuvert] = useState(null)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnRetour} onClick={() => navigate(-1)}>‹</button>
        <h1 style={styles.titre}>Conditions Générales de Vente</h1>
        <div style={{ width: '38px' }} />
      </div>

      <div style={styles.content}>
        <div style={styles.intro}>
          <p style={styles.introText}>
            Conditions applicables aux commandes passées via l'application de réassort La Maison de l'Espadrille, réservée aux revendeurs agréés.
          </p>
        </div>

        {articles.map((art, i) => (
          <div
            key={i}
            style={{ ...styles.articleCard, ...(ouvert === i ? styles.articleOuvert : {}) }}
          >
            <button
              style={styles.articleHeader}
              onClick={() => setOuvert(ouvert === i ? null : i)}
            >
              <span style={styles.articleTitre}>{art.titre}</span>
              <span style={styles.articleChevron}>{ouvert === i ? '∧' : '∨'}</span>
            </button>
            {ouvert === i && (
              <div style={styles.articleBody}>
                {art.contenu.split('\n\n').map((para, j) => (
                  <p key={j} style={styles.p}>{para}</p>
                ))}
              </div>
            )}
          </div>
        ))}

        <div style={styles.maj}>Mis à jour le 01/03/2025</div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', paddingBottom: '3rem' },
  header: {
    background: 'var(--beige-card)', padding: '1rem 1.25rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10,
  },
  btnRetour: {
    background: 'none', border: 'none', fontSize: '1.8rem',
    color: 'var(--brown-dark)', cursor: 'pointer', lineHeight: 1,
    width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  titre: {
    fontSize: '0.95rem', fontFamily: 'Playfair Display, serif',
    color: 'var(--brown-dark)', fontWeight: '600', textAlign: 'center', flex: 1,
  },
  content: { padding: '1.25rem 1.25rem' },
  intro: {
    background: 'var(--brown-dark)', borderRadius: '14px',
    padding: '1rem 1.25rem', marginBottom: '1rem',
  },
  introText: {
    color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem',
    lineHeight: 1.6, margin: 0,
  },
  articleCard: {
    background: 'var(--beige-card)', borderRadius: '12px',
    border: '1px solid var(--border)', marginBottom: '0.6rem',
    overflow: 'hidden',
  },
  articleOuvert: {
    border: '1px solid var(--brown-mid)',
  },
  articleHeader: {
    width: '100%', background: 'none', border: 'none',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.85rem 1.1rem', cursor: 'pointer', textAlign: 'left',
  },
  articleTitre: {
    fontSize: '0.85rem', fontWeight: '600',
    color: 'var(--brown-dark)', flex: 1, paddingRight: '0.5rem',
    lineHeight: 1.4,
  },
  articleChevron: {
    fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0,
  },
  articleBody: {
    padding: '0 1.1rem 1rem',
    borderTop: '1px solid var(--border)',
  },
  p: {
    fontSize: '0.84rem', color: 'var(--brown-dark)',
    lineHeight: 1.7, margin: '0.75rem 0 0 0',
  },
  maj: {
    fontSize: '0.72rem', color: 'var(--text-muted)',
    textAlign: 'center', marginTop: '1.25rem',
  },
}
