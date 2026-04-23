import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Inscription from './pages/Inscription'
import Catalogue from './pages/Catalogue'
import Recherche from './pages/Scanner'
import Panier from './pages/Panier'
import Historique from './pages/Historique'
import Admin from './pages/Admin'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>Chargement...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/catalogue" />} />
        <Route path="/inscription" element={!session ? <Inscription /> : <Navigate to="/catalogue" />} />
        <Route path="/catalogue" element={session ? <Catalogue /> : <Navigate to="/login" />} />
        <Route path="/recherche" element={session ? <Recherche /> : <Navigate to="/login" />} />
        <Route path="/panier" element={session ? <Panier /> : <Navigate to="/login" />} />
        <Route path="/historique" element={session ? <Historique /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to={session ? "/catalogue" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App