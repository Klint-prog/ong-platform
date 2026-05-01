import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/dashboard/Dashboard'
import Pessoas from './pages/pessoas/Pessoas'
import Financeiro from './pages/financeiro/Financeiro'
import Projetos from './pages/projetos/Projetos'
import ProjetoDetalhe from './pages/projetos/ProjetoDetalhe'
import Comunicacao from './pages/comunicacao/Comunicacao'
import Usuarios from './pages/usuarios/Usuarios'
import Login from './pages/auth/Login'
import NotasPaulista from './pages/notas/NotasPaulista'
import Institucional from './pages/institucional/Institucional'
import Beneficiarios from './pages/beneficiarios/Beneficiarios'
import Documentos from './pages/documentos/Documentos'
import Captacao from './pages/captacao/Captacao'
import NovaOportunidadePage from './pages/captacao/NovaOportunidadePage'
import DossieOportunidadePage from './pages/captacao/DossieOportunidadePage'
import Relatorios from './pages/relatorios/Relatorios'
import { NovaPessoaPage, EditarPessoaPage, NovaTransacaoPage, NovoEnvioPage, EditarInstitucionalPage } from './pages/cadastros/Cadastros'
import NovoProjetoPage from './pages/projetos/NovoProjetoPage'
import { Search, Bell, Settings } from 'lucide-react'

function AppShell({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar user={user} />

      {/* Topbar */}
      <header className="app-topbar">
        <div style={{ flex: 1, position: 'relative', maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input placeholder="Buscar projeto, beneficiário, documento…" style={{ paddingLeft: 38, background: 'var(--gray-50)', border: '1.5px solid var(--gray-100)', fontSize: 13 }} />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
            <Bell size={18} color="var(--gray-500)" />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--lilac-500)', border: '1.5px solid #fff' }} />
          </button>
          <button className="btn btn-ghost btn-icon">
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
          <Route path="/institucional" element={<Institucional />} />
          <Route path="/institucional/editar" element={<EditarInstitucionalPage />} />
          <Route path="/pessoas"       element={<Pessoas />} />
          <Route path="/pessoas/nova"  element={<NovaPessoaPage />} />
          <Route path="/pessoas/:id/editar"  element={<EditarPessoaPage />} />
          <Route path="/beneficiarios" element={<Beneficiarios />} />
          <Route path="/financeiro"    element={<Financeiro />} />
          <Route path="/financeiro/nova" element={<NovaTransacaoPage />} />
          <Route path="/projetos"      element={<Projetos />} />
          <Route path="/projetos/:id"  element={<ProjetoDetalhe />} />
          <Route path="/projetos/novo" element={<NovoProjetoPage />} />
          <Route path="/documentos"    element={<Documentos />} />
          <Route path="/captacao"      element={<Captacao />} />
          <Route path="/captacao/nova" element={<NovaOportunidadePage />} />
          <Route path="/captacao/:id/dossie" element={<DossieOportunidadePage />} />
          <Route path="/relatorios"    element={<Relatorios />} />
          <Route path="/comunicacao"   element={<Comunicacao />} />
          <Route path="/comunicacao/novo" element={<NovoEnvioPage />} />
          <Route path="/usuarios"      element={<Usuarios />} />
          <Route path="/notas-paulista" element={<NotasPaulista />} />
          <Route path="/configuracoes" element={<div className="card"><h2 style={{ fontFamily: 'var(--font-display)' }}>Configurações</h2><p style={{ color: 'var(--gray-400)', marginTop: 8 }}>Em breve.</p></div>} />
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
