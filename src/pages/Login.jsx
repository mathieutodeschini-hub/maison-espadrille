import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe incorrect')
    else navigate('/accueil')
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      {/* Hero visuel */}
      <div style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitre}>La Maison de<br />l'Espadrille</h1>
          <p style={styles.heroSub}>Espace commandes professionnels</p>
        </div>
      </div>

      {/* Formulaire */}
      <div style={styles.formWrap}>
        <div style={styles.formCard}>
          <h2 style={styles.formTitre}>Connexion</h2>
          <p style={styles.formSub}>Accédez à votre espace commandes</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Adresse email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Mot de passe</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button style={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>ou</span>
            <div style={styles.dividerLine} />
          </div>

          <Link to="/inscription" style={styles.btnSecondary}>
            Créer mon compte
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', display: 'flex', flexDirection: 'column' },
  hero: {
    height: '220px', position: 'relative',
    background: 'linear-gradient(135deg, #2C1A0E 0%, #8B6F47 60%, #C4A882 100%)',
    overflow: 'hidden',
  },
  heroOverlay: { position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.2)' },
  heroContent: { position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', textAlign: 'center' },
  heroTitre: { fontFamily: 'Playfair Display, serif', fontSize: '2rem', color: 'white', fontWeight: '700', lineHeight: 1.2, marginBottom: '0.5rem' },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', letterSpacing: '0.05em' },

  formWrap: { flex: 1, padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column' },
  formCard: { background: 'var(--beige-card)', borderRadius: '20px', padding: '1.75rem', border: '1px solid var(--border)' },
  formTitre: { fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: 'var(--brown-dark)', marginBottom: '0.3rem' },
  formSub: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  fieldLabel: { fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input: { border: '1px solid var(--border)', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.95rem', outline: 'none', background: 'var(--beige)', color: 'var(--brown-dark)', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FEE2E2', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--red)', textAlign: 'center' },
  btnPrimary: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.95rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '0.25rem' },
  divider: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' },
  dividerLine: { flex: 1, height: '1px', background: 'var(--border)' },
  dividerText: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  btnSecondary: { display: 'block', textAlign: 'center', background: 'none', color: 'var(--brown-dark)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' },
}