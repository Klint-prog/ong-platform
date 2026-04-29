import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/dashboard/Dashboard'
import Pessoas from './pages/pessoas/Pessoas'
import Financeiro from './pages/financeiro/Financeiro'
import Projetos from './pages/projetos/Projetos'
import Comunicacao from './pages/comunicacao/Comunicacao'
import Usuarios from './pages/usuarios/Usuarios'
import Login from './pages/auth/Login'
import { Search, Bell, Settings } from 'lucide-react'
import NovoCadastro from './pages/shared/NovoCadastro'

function AppShell({ user, onLogout }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} />

      {/* Topbar */}
      <header className="app-topbar">
        <div style={{ flex: 1, position: 'relative', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input placeholder="Buscar…" style={{ paddingLeft: 38, background: 'var(--gray-50)', border: '1.5px solid var(--gray-100)', fontSize: 13 }} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }} onClick={() => navigate('/comunicacao')}>
            <Bell size={18} color="var(--gray-500)" />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--lilac-500)', border: '1.5px solid #fff' }} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/configuracoes')}>
            <Settings size={18} color="var(--gray-500)" />
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--gray-100)', margin: '0 4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            onClick={onLogout}>
            <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--purple-500), var(--pink-500))' }}>
              {user?.nome?.charAt(0) ?? 'A'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{user?.nome}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{user?.role?.toLowerCase()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="app-main">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/pessoas"       element={<Pessoas />} />
          <Route path="/financeiro"    element={<Financeiro />} />
          <Route path="/projetos"      element={<Projetos />} />
          <Route path="/comunicacao"   element={<Comunicacao />} />
          <Route path="/usuarios"      element={<Usuarios />} />
          <Route path="/configuracoes" element={<div className="card"><h2 style={{ fontFamily: 'var(--font-display)' }}>Configurações</h2><p style={{ color: 'var(--gray-400)', marginTop: 8 }}>Ajustes básicos já disponíveis no menu lateral e topo.</p></div>} />
          <Route path="/:modulo/novo" element={<NovoCadastro />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)

  if (!user) return <Login onLogin={setUser} />
  return (
    <BrowserRouter>
      <AppShell user={user} onLogout={() => setUser(null)} />
    </BrowserRouter>
  )
}
