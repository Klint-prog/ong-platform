import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Heart, DollarSign,
  FolderKanban, Bell, Settings, LogOut, Leaf
} from 'lucide-react'

const NAV = [
  {
    section: 'Principal',
    items: [
      { to: '/',            label: 'Dashboard',    icon: LayoutDashboard, mod: 'mod-dashboard' },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { to: '/pessoas',     label: 'Pessoas',      icon: Heart,           mod: 'mod-pessoas' },
      { to: '/financeiro',  label: 'Financeiro',   icon: DollarSign,      mod: 'mod-financeiro' },
      { to: '/projetos',    label: 'Projetos',     icon: FolderKanban,    mod: 'mod-projetos' },
      { to: '/comunicacao', label: 'Comunicação',  icon: Bell,            mod: 'mod-comunicacao' },
    ],
  },
  {
    section: 'Administração',
    items: [
      { to: '/usuarios',    label: 'Usuários',     icon: Users,           mod: 'mod-usuarios' },
      { to: '/configuracoes',label: 'Configurações',icon: Settings,       mod: 'mod-usuarios' },
    ],
  },
]

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Leaf size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-logo-text">ONGPlatform</div>
          <div className="sidebar-logo-sub">Gestão Social</div>
        </div>
      </div>

      {/* Navegação */}
      {NAV.map((group) => (
        <nav key={group.section} className="sidebar-section">
          <div className="sidebar-section-label">{group.section}</div>
          {group.items.map(({ to, label, icon: Icon, mod }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item ${mod} ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">
                <Icon size={15} strokeWidth={2} color="#fff" />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      ))}

      {/* Usuário logado */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.nome?.charAt(0) ?? 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.nome ?? 'Administrador'}
          </div>
          <div className="sidebar-user-role">
            {user?.role?.toLowerCase() ?? 'admin'}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          style={{ color: 'rgba(255,255,255,.35)', padding: 6 }}
          title="Sair"
          onClick={onLogout}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
