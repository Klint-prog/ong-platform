import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './pages/dashboard/Dashboard'
import Pessoas from './pages/pessoas/Pessoas'
import Financeiro from './pages/financeiro/Financeiro'
import NovaTransacaoPage from './pages/financeiro/NovaTransacaoPage'
import Projetos from './pages/projetos/Projetos'
import ProjetoDetalhe from './pages/projetos/ProjetoDetalhe'
import Comunicacao from './pages/comunicacao/Comunicacao'
import Usuarios from './pages/usuarios/Usuarios'
import Login from './pages/auth/LoginRbac'
import NotasPaulista from './pages/notas/NotasPaulista'
import Institucional from './pages/institucional/Institucional'
import Beneficiarios from './pages/beneficiarios/Beneficiarios'
import BeneficiarioCadastroPage from './pages/beneficiarios/BeneficiarioCadastroPage'
import Documentos from './pages/documentos/Documentos'
import Captacao from './pages/captacao/Captacao'
import NovaOportunidadePage from './pages/captacao/NovaOportunidadePage'
import DossieOportunidadePage from './pages/captacao/DossieOportunidadePage'
import Relatorios from './pages/relatorios/Relatorios'
import { NovaPessoaPage, EditarPessoaPage, NovoEnvioPage, EditarInstitucionalPage } from './pages/cadastros/Cadastros'
import NovoProjetoPage from './pages/projetos/NovoProjetoPage'
import { Search, Bell, Settings, ShieldAlert } from 'lucide-react'
import Configuracoes from './pages/configuracoes/Configuracoes'
import { primeiroPathPermitido, usuarioPodePath, moduloPorPath, labelPapel, getUsuarioSessao, salvarUsuarioSessao, limparUsuarioSessao } from './services/authPermissions'

const SIDEBAR_COLLAPSED_KEY = 'ong_platform_sidebar_collapsed'

function carregarSidebarRecolhida() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

function AccessDenied({ user }) {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div className="card" style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
      <div className="stat-icon" style={{ width: 52, height: 52, background: 'var(--red-500)' }}><ShieldAlert size={24} color="#fff" /></div>
      <h1 className="page-title">Acesso não autorizado</h1>
      <p className="page-subtitle">Seu perfil atual não possui permissão para acessar esta área.</p>
      <div className="card-sm" style={{ background: 'var(--gray-50)' }}>
        <strong>Usuário:</strong> {user?.nome || 'Usuário'}<br />
        <strong>Papel:</strong> {labelPapel(user?.role)}<br />
        <strong>Módulo solicitado:</strong> {moduloPorPath(location.pathname)}
      </div>
      <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => navigate(primeiroPathPermitido(user), { replace: true })}>Ir para área permitida</button>
    </div>
  )
}

function ProtectedRoute({ user, children }) {
  const location = useLocation()
  if (!usuarioPodePath(user, location.pathname, 'visualizar')) return <AccessDenied user={user} />
  return children
}

function AppShell({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const [storageOffline, setStorageOffline] = useState(false)

  useEffect(() => {
    const marcarOffline = () => setStorageOffline(true)
    window.addEventListener('ong:storage-offline', marcarOffline)
    return () => window.removeEventListener('ong:storage-offline', marcarOffline)
  }, [])
  const [sidebarRecolhida, setSidebarRecolhida] = useState(() => carregarSidebarRecolhida())
  const [perfilDraft, setPerfilDraft] = useState(() => ({
    nome: user?.nome || '',
    fotoUrl: user?.fotoUrl || '',
    telefone: user?.telefone || '',
    bio: user?.bio || '',
  }))

  const avatarInicial = useMemo(() => (perfilDraft?.nome?.charAt(0) || user?.nome?.charAt(0) || 'A'), [perfilDraft?.nome, user?.nome])

  const salvarPerfil = () => {
    const atualizado = salvarUsuarioSessao({ ...user, ...perfilDraft })
    onUserUpdate(atualizado)
    setMenuAberto(false)
  }

  const alternarSidebar = () => {
    setSidebarRecolhida((atual) => {
      const proximo = !atual
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(proximo))
      return proximo
    })
  }

  return (
    <div className={`app-shell ${sidebarRecolhida ? 'sidebar-collapsed' : ''}`}>
      <Sidebar user={user} onLogout={onLogout} collapsed={sidebarRecolhida} onToggleCollapsed={alternarSidebar} />

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
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/configuracoes')}>
            <Settings size={18} color="var(--gray-500)" />
          </button>
          <div style={{ width: 1, height: 24, background: 'var(--gray-100)', margin: '0 4px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative' }} onClick={() => setMenuAberto((v) => !v)}>
            <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--purple-500), var(--pink-500))' }}>{avatarInicial}</div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{perfilDraft?.nome || user?.nome}</div><div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{labelPapel(user?.role)}</div></div>

            {menuAberto && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 280, background: '#fff', border: '1px solid var(--gray-100)', borderRadius: 12, boxShadow: '0 12px 30px rgba(17, 24, 39, 0.12)', padding: 12, zIndex: 20 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }} onClick={() => onLogout()}>Sair</button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 8 }} onClick={() => onLogout()}>Trocar usuário</button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 10 }} onClick={() => navigate('/configuracoes')}>Abrir configurações gerais</button>
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

      <main className="app-main">
        {storageOffline && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={15} />
            <span><strong>Atenção:</strong> o servidor de dados está inacessível. Alterações feitas agora podem ser perdidas ao fechar o navegador. Verifique se os containers <code>ong-backend</code> e <code>ong-postgres</code> estão no ar.</span>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={() => setStorageOffline(false)}>Dispensar</button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
          <Route path="/institucional" element={<ProtectedRoute user={user}><Institucional /></ProtectedRoute>} />
          <Route path="/institucional/editar" element={<ProtectedRoute user={user}><EditarInstitucionalPage /></ProtectedRoute>} />
          <Route path="/pessoas" element={<ProtectedRoute user={user}><Pessoas /></ProtectedRoute>} />
          <Route path="/pessoas/nova" element={<ProtectedRoute user={user}><NovaPessoaPage /></ProtectedRoute>} />
          <Route path="/pessoas/:id/editar" element={<ProtectedRoute user={user}><EditarPessoaPage /></ProtectedRoute>} />
          <Route path="/beneficiarios" element={<ProtectedRoute user={user}><Beneficiarios /></ProtectedRoute>} />
          <Route path="/beneficiarios/novo" element={<ProtectedRoute user={user}><BeneficiarioCadastroPage /></ProtectedRoute>} />
          <Route path="/beneficiarios/:id/editar" element={<ProtectedRoute user={user}><BeneficiarioCadastroPage /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute user={user}><Financeiro /></ProtectedRoute>} />
          <Route path="/financeiro/nova" element={<ProtectedRoute user={user}><NovaTransacaoPage /></ProtectedRoute>} />
          <Route path="/projetos" element={<ProtectedRoute user={user}><Projetos /></ProtectedRoute>} />
          <Route path="/projetos/:id" element={<ProtectedRoute user={user}><ProjetoDetalhe /></ProtectedRoute>} />
          <Route path="/projetos/novo" element={<ProtectedRoute user={user}><NovoProjetoPage /></ProtectedRoute>} />
          <Route path="/projetos/:id/editar" element={<ProtectedRoute user={user}><NovoProjetoPage /></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute user={user}><Documentos /></ProtectedRoute>} />
          <Route path="/captacao" element={<ProtectedRoute user={user}><Captacao /></ProtectedRoute>} />
          <Route path="/captacao/nova" element={<ProtectedRoute user={user}><NovaOportunidadePage /></ProtectedRoute>} />
          <Route path="/captacao/:id/dossie" element={<ProtectedRoute user={user}><DossieOportunidadePage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute user={user}><Relatorios /></ProtectedRoute>} />
          <Route path="/comunicacao" element={<ProtectedRoute user={user}><Comunicacao /></ProtectedRoute>} />
          <Route path="/comunicacao/novo" element={<ProtectedRoute user={user}><NovoEnvioPage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute user={user}><Usuarios /></ProtectedRoute>} />
          <Route path="/notas-paulista" element={<ProtectedRoute user={user}><NotasPaulista /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute user={user}><Configuracoes /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={primeiroPathPermitido(user)} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => getUsuarioSessao())

  const handleLogin = (usuario) => setUser(usuario)
  const handleLogout = () => { limparUsuarioSessao(); setUser(null) }

  if (!user) return <Login onLogin={handleLogin} />
  return <BrowserRouter><AppShell user={user} onLogout={handleLogout} onUserUpdate={setUser} /></BrowserRouter>
}
