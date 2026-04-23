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
    else navigate('/catalogue')
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>La Maison<br/>de l'Espadrille</h1>
        <p style={styles.subtitle}>Espace commandes</p>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <Link to="/inscription" style={styles.link}>
          Première connexion ? Créer mon compte
        </Link>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#F5EFE6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.8rem',
    color: '#1A1209',
    lineHeight: 1.2,
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#9B8B7A',
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  input: {
    border: '1px solid #E8DDD0',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    fontSize: '1rem',
    outline: 'none',
    width: '100%',
  },
  button: {
    background: '#1A1209',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#C0392B',
    fontSize: '0.85rem',
  },
  link: {
    color: '#8B6F47',
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
}