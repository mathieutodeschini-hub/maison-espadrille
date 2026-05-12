import { useNavigate } from 'react-router-dom'

export default function MentionsLegales() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnRetour} onClick={() => navigate(-1)}>‹</button>
        <h1 style={styles.titre}>Mentions légales</h1>
        <div style={{ width: '38px' }} />
      </div>

      <div style={styles.content}>

        <section style={styles.section}>
          <h2 style={styles.h2}>Éditeur de l'application</h2>
          <p style={styles.p}>
            <strong>SOCIÉTÉ LA MAISON DE L'ESPADRILLE</strong><br />
            Société S.A.R.L. au capital de 150 000 euros<br />
            Siège social : 180 Chemin Pey de l'Ancre — 40660 MESSANGES<br />
            Immatriculée au RCS de Dax sous le numéro <strong>344 100 284 00100</strong><br />
            N° TVA Intracommunautaire : <strong>FR 92 344 100 284</strong>
          </p>
          <p style={styles.p}>
            Téléphone : 05.58.48.02.96<br />
            Email : <a style={styles.link} href="mailto:contact@maisonespadrille.fr">contact@maisonespadrille.fr</a>
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Représentant légal</h2>
          <p style={styles.p}>Arauzo Jean-Claude</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Hébergement</h2>
          <p style={styles.p}>
            Cette application est hébergée par :<br />
            <strong>Vercel Inc.</strong> — 340 Pine Street, Suite 700, San Francisco, CA 94104, USA
          </p>
          <p style={styles.p}>
            Base de données hébergée par :<br />
            <strong>Supabase Inc.</strong> — 970 Toa Payoh North, Singapour
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Propriété intellectuelle</h2>
          <p style={styles.p}>
            L'ensemble des contenus présents sur cette application (textes, images, données produits, structure) sont la propriété exclusive de la Société La Maison de l'Espadrille. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Données personnelles</h2>
          <p style={styles.p}>
            Les données collectées (nom, magasin, adresses, email) sont utilisées exclusivement dans le cadre de la relation commerciale entre La Maison de l'Espadrille et ses revendeurs agréés. Elles ne sont ni vendues ni transmises à des tiers.
          </p>
          <p style={styles.p}>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez : <a style={styles.link} href="mailto:contact@maisonespadrille.fr">contact@maisonespadrille.fr</a>
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Cookies</h2>
          <p style={styles.p}>
            Cette application utilise le stockage local (localStorage) uniquement pour sauvegarder votre panier en cours et vos préférences de navigation. Aucun cookie publicitaire ou de tracking n'est utilisé.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Droit applicable</h2>
          <p style={styles.p}>
            Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux compétents seront ceux du ressort du siège social de La Maison de l'Espadrille.
          </p>
        </section>

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
    fontSize: '1.05rem', fontFamily: 'Playfair Display, serif',
    color: 'var(--brown-dark)', fontWeight: '600',
  },
  content: { padding: '1.5rem 1.25rem' },
  section: {
    background: 'var(--beige-card)', borderRadius: '14px',
    padding: '1.1rem 1.25rem', marginBottom: '1rem',
    border: '1px solid var(--border)',
  },
  h2: {
    fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--text-muted)',
    marginBottom: '0.65rem', marginTop: 0,
  },
  p: {
    fontSize: '0.88rem', color: 'var(--brown-dark)',
    lineHeight: 1.7, margin: '0 0 0.6rem 0',
  },
  link: { color: 'var(--brown-mid)', textDecoration: 'none' },
  maj: {
    fontSize: '0.72rem', color: 'var(--text-muted)',
    textAlign: 'center', marginTop: '1rem',
  },
}
