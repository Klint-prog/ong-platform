import { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import BeneficiarioCadastroPage from './pages/beneficiarios/BeneficiarioCadastroPage'
import Documentos from './pages/documentos/Documentos'
import Captacao from './pages/captacao/Captacao'
import NovaOportunidadePage from './pages/captacao/NovaOportunidadePage'
import DossieOportunidadePage from './pages/captacao/DossieOportunidadePage'
import Relatorios from './pages/relatorios/Relatorios'
import { NovaPessoaPage, EditarPessoaPage, NovaTransacaoPage, NovoEnvioPage, EditarInstitucionalPage } from './pages/cadastros/Cadastros'
import NovoProjetoPage from './pages/projetos/NovoProjetoPage'
import { Search, Bell, Settings } from 'lucide-react'
import Configuracoes from './pages/configuracoes/Configuracoes'

function AppShell({ user, onLogout }) {
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [perfilDraft, setPerfilDraft] = useState(() => ({
    nome: user?.nome || '',
    fotoUrl: user?.fotoUrl || '',
    telefone: user?.telefone || '',
    bio: user?.bio || '',
  }))

  const avatarInicial = useMemo(() => (perfilDraft?.nome?.charAt(0) || user?.nome?.charAt(0) || 'A'), [perfilDraft?.nome, user?.nome])

  const salvarPerfil = () => {
    setMenuAberto(false)
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} />

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
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative' }}
            onClick={() => setMenuAberto((v) => !v)}
          >
            <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--purple-500), var(--pink-500))' }}>
              {avatarInicial}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{perfilDraft?.nome || user?.nome}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{user?.role?.toLowerCase()}</div>
            </div>

            {menuAberto && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 280, background: '#fff', border: '1px solid var(--gray-100)', borderRadius: 12, boxShadow: '0 12px 30px rgba(17, 24, 39, 0.12)', padding: 12, zIndex: 20 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }} onClick={() => onLogout()}>
                  Sair
                </button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }} onClick={() => onLogout()}>
                  Trocar usuário
                </button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 10 }} onClick={() => navigate('/configuracoes')}>
                  Abrir configurações gerais
                </button>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--gray-600)' }}>Configurações do usuário</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <input value={perfilDraft.nome} onChange={(e) => setPerfilDraft((d) => ({ ...d, nome: e.target.value }))} placeholder="Nome" />
                  <input value={perfilDraft.fotoUrl} onChange={(e) => setPerfilDraft((d) => ({ ...d, fotoUrl: e.target.value }))} placeholder="URL da foto" />
                  <input value={perfilDraft.telefone} onChange={(e) => setPerfilDraft((d) => ({ ...d, telefone: e.target.value }))} placeholder="Telefone" />
                  <textarea value={perfilDraft.bio} onChange={(e) => setPerfilDraft((d) => ({ ...d, bio: e.target.value }))} placeholder="Informações adicionais" rows={3} />
                  <button className="btn btn-primary" onClick={salvarPerfil}>Salvar perfil</button>
                </div>
              </div>
            )}
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
          <Route path="/beneficiarios/novo" element={<BeneficiarioCadastroPage />} />
          <Route path="/beneficiarios/:id/editar" element={<BeneficiarioCadastroPage />} />
          <Route path="/financeiro"    element={<Financeiro />} />
          <Route path="/financeiro/nova" element={<NovaTransacaoPage />} />
          <Route path="/projetos"      element={<Projetos />} />
          <Route path="/projetos/:id"  element={<ProjetoDetalhe />} />
          <Route path="/projetos/novo" element={<NovoProjetoPage />} />
          <Route path="/projetos/:id/editar" element={<NovoProjetoPage />} />
          <Route path="/documentos"    element={<Documentos />} />
          <Route path="/captacao"      element={<Captacao />} />
          <Route path="/captacao/nova" element={<NovaOportunidadePage />} />
          <Route path="/captacao/:id/dossie" element={<DossieOportunidadePage />} />
          <Route path="/relatorios"    element={<Relatorios />} />
          <Route path="/comunicacao"   element={<Comunicacao />} />
          <Route path="/comunicacao/novo" element={<NovoEnvioPage />} />
          <Route path="/usuarios"      element={<Usuarios />} />
          <Route path="/notas-paulista" element={<NotasPaulista />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
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
