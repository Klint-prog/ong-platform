import { useState } from 'react'
import { Users, Plus, Shield, UserCog, Eye, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react'

const USUARIOS = [
  { id: 1, nome: 'Admin Geral',     email: 'admin@suaong.org',  role: 'ADMIN',        ativo: true,  login: 'Hoje, 09:12',      inicial: 'AG', cor: '#7c3aed' },
  { id: 2, nome: 'Clara Andrade',   email: 'clara@ong.org',     role: 'COORDENADOR',  ativo: true,  login: 'Hoje, 08:45',      inicial: 'CA', cor: '#ec4899' },
  { id: 3, nome: 'Paulo Ferreira',  email: 'paulo@ong.org',     role: 'VOLUNTARIO',   ativo: true,  login: 'Ontem, 17:30',     inicial: 'PF', cor: '#3b82f6' },
  { id: 4, nome: 'Beatriz Souza',   email: 'bea@ong.org',       role: 'COORDENADOR',  ativo: true,  login: 'Ontem, 14:00',     inicial: 'BS', cor: '#22c55e' },
  { id: 5, nome: 'Marcos Lima',     email: 'marcos@ong.org',    role: 'VISUALIZADOR', ativo: false, login: 'Há 15 dias',       inicial: 'ML', cor: '#9d9a8e' },
  { id: 6, nome: 'Sofia Ramos',     email: 'sofia@ong.org',     role: 'VOLUNTARIO',   ativo: true,  login: 'Há 2 dias',        inicial: 'SR', cor: '#eab308' },
]

const roleConfig = {
  ADMIN:        { label: 'Admin',        badge: 'badge-purple', icon: Shield },
  COORDENADOR:  { label: 'Coordenador',  badge: 'badge-blue',   icon: UserCog },
  VOLUNTARIO:   { label: 'Voluntário',   badge: 'badge-pink',   icon: Users },
  VISUALIZADOR: { label: 'Visualizador', badge: 'badge-gray',   icon: Eye },
}

export default function Usuarios() {
  const [filtro, setFiltro] = useState('TODOS')

  const filtrados = USUARIOS.filter(u => filtro === 'TODOS' || u.role === filtro)

  return (
    <div className="mod-usuarios animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Gerencie contas e permissões de acesso à plataforma</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Novo usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total de usuários', value: String(USUARIOS.length), mod: 'mod-usuarios',   icon: Users },
          { label: 'Admins',            value: String(USUARIOS.filter(u => u.role === 'ADMIN').length), mod: 'mod-comunicacao', icon: Shield },
          { label: 'Coordenadores',     value: String(USUARIOS.filter(u => u.role === 'COORDENADOR').length), mod: 'mod-dashboard', icon: UserCog },
          { label: 'Usuários ativos',   value: String(USUARIOS.filter(u => u.ativo).length), mod: 'mod-financeiro', icon: CheckCircle },
        ].map(({ label, value, mod, icon: Icon }, i) => (
          <div key={label} className={`stat-card ${mod} delay-${i + 1}`}>
            <div className="stat-icon"><Icon size={20} /></div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }} className="animate-fade-up delay-2">
        {['TODOS', 'ADMIN', 'COORDENADOR', 'VOLUNTARIO', 'VISUALIZADOR'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-outline'}`}
            style={filtro === f ? { '--mod-color': 'var(--purple-500)' } : {}}>
            {f === 'TODOS' ? 'Todos' : roleConfig[f]?.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card animate-fade-up delay-3">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Papel</th>
                <th>Último acesso</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => {
                const cfg = roleConfig[u.role]
                const Icon = cfg.icon
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar avatar-md" style={{ background: u.cor }}>{u.inicial}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-800)' }}>{u.nome}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cfg.badge}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{u.login}</td>
                    <td>
                      <span className={`badge ${u.ativo ? 'badge-green' : 'badge-gray'}`}>
                        {u.ativo ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
