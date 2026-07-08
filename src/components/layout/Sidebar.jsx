import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Heart, DollarSign,
  FolderKanban, Bell, Settings, LogOut, Leaf, ScanLine,
  Building2, FileText, HandCoins, BarChart3, UsersRound,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { loadInstitucional } from '../../pages/institucional/institucionalStorage'
import { usuarioPode } from '../../services/authPermissions'

const NAV = [
  {
    section: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, mod: 'mod-dashboard', modulo: 'dashboard' },
      { to: '/institucional', label: 'Institucional', icon: Building2, mod: 'mod-institucional', modulo: 'institucional' },
    ],
  },
  {
    section: 'Operação social',
    items: [
      { to: '/projetos', label: 'Projetos', icon: FolderKanban, mod: 'mod-projetos', modulo: 'projetos' },
      { to: '/beneficiarios', label: 'Beneficiários', icon: UsersRound, mod: 'mod-beneficiarios', modulo: 'beneficiarios' },
      { to: '/pessoas', label: 'Pessoas', icon: Heart, mod: 'mod-pessoas', modulo: 'pessoas' },
      { to: '/documentos', label: 'Documentos', icon: FileText, mod: 'mod-documentos', modulo: 'documentos' },
    ],
  },
  {
    section: 'Recursos e prestação',
    items: [
      { to: '/financeiro', label: 'Financeiro', icon: DollarSign, mod: 'mod-financeiro', modulo: 'financeiro' },
      { to: '/captacao', label: 'Captação', icon: HandCoins, mod: 'mod-captacao', modulo: 'captacao' },
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3, mod: 'mod-relatorios', modulo: 'relatorios' },
      { to: '/notas-paulista', label: 'Notas Paulista', icon: ScanLine, mod: 'mod-financeiro', modulo: 'notasPaulista' },
    ],
  },
  {
    section: 'Administração',
    items: [
      { to: '/comunicacao', label: 'Comunicação', icon: Bell, mod: 'mod-comunicacao', modulo: 'comunicacao' },
      { to: '/usuarios', label: 'Usuários', icon: Users, mod: 'mod-usuarios', modulo: 'usuarios' },
      { to: '/configuracoes', label: 'Configurações', icon: Settings, mod: 'mod-usuarios', modulo: 'configuracoes' },
    ],
  },
]

export default function Sidebar({ user, onLogout, collapsed = false, onToggleCollapsed }) {
  const institucional = loadInstitucional()
  const logo = institucional.logoUrl
  const nome = institucional.nomeFantasia || institucional.nome || 'ONGPlatform'
  const slogan = institucional.slogan || 'Gestão Social'
  const gruposVisiveis = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => usuarioPode(user, item.modulo, 'visualizar')),
  })).filter((group) => group.items.length > 0)

  return (
    <aside className="app-sidebar" aria-label="Menu principal">
      <div className="sidebar-logo">
        <div className={`sidebar-logo-icon ${logo ? 'has-custom-logo' : ''}`} title={collapsed ? nome : undefined}>
          {logo ? <img src={logo} alt="Logo institucional" /> : <Leaf size={18} color="#fff" strokeWidth={2.5} />}
        </div>
        <div className="sidebar-logo-content">
          <div className="sidebar-logo-text">{nome}</div>
          <div className="sidebar-logo-sub">{slogan}</div>
        </div>
        <button className="sidebar-collapse-btn" type="button" title={collapsed ? 'Expandir menu' : 'Recolher menu'} aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} onClick={onToggleCollapsed}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {gruposVisiveis.map((group) => (
        <nav key={group.section} className="sidebar-section" aria-label={group.section}>
          <div className="sidebar-section-label">{group.section}</div>
          {group.items.map(({ to, label, icon: Icon, mod }) => (
            <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined} aria-label={label} className={({ isActive }) => `nav-item ${mod} ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><Icon size={15} strokeWidth={2} color="#fff" /></span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      ))}

      <div className="sidebar-user">
        <div className="sidebar-avatar" title={collapsed ? (user?.nome ?? 'Administrador') : undefined}>{user?.nome?.charAt(0) ?? 'A'}</div>
        <div className="sidebar-user-content"><div className="sidebar-user-name">{user?.nome ?? 'Administrador'}</div><div className="sidebar-user-role">{user?.role?.toLowerCase() ?? 'admin'}</div></div>
        <button className="btn btn-ghost btn-icon sidebar-logout-btn" title="Sair" onClick={onLogout}><LogOut size={15} /></button>
      </div>
    </aside>
  )
}
