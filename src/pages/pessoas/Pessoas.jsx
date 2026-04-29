import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Plus, Search, Filter, Phone, Mail, MoreHorizontal, Users, UserCheck, Handshake, Gift } from 'lucide-react'

const PESSOAS = [
  { id: 1, nome: 'Maria Silva',      tipo: 'VOLUNTARIO',    status: 'ATIVO',    telefone: '(81) 99123-4567', email: 'maria@email.com',   horas: 124, projetos: 3, inicial: 'MS', cor: '#ec4899' },
  { id: 2, nome: 'João Costa',       tipo: 'BENEFICIARIO',  status: 'ATIVO',    telefone: '(81) 98765-4321', email: 'joao@email.com',    horas: 0,   projetos: 1, inicial: 'JC', cor: '#a855f7' },
  { id: 3, nome: 'Ana Beatriz',      tipo: 'MEMBRO',        status: 'ATIVO',    telefone: '(81) 99234-5678', email: 'ana@email.com',     horas: 80,  projetos: 5, inicial: 'AB', cor: '#3b82f6' },
  { id: 4, nome: 'Carlos Mendes',    tipo: 'DOADOR',        status: 'ATIVO',    telefone: '(81) 97654-3210', email: 'carlos@email.com',  horas: 0,   projetos: 0, inicial: 'CM', cor: '#22c55e' },
  { id: 5, nome: 'Fernanda Lima',    tipo: 'VOLUNTARIO',    status: 'INATIVO',  telefone: '(81) 96543-2109', email: 'fer@email.com',     horas: 56,  projetos: 2, inicial: 'FL', cor: '#eab308' },
  { id: 6, nome: 'Roberto Santos',   tipo: 'BENEFICIARIO',  status: 'ATIVO',    telefone: '(81) 95432-1098', email: 'rob@email.com',     horas: 0,   projetos: 2, inicial: 'RS', cor: '#ef4444' },
]

const tipoConfig = {
  VOLUNTARIO:   { label: 'Voluntário',   badge: 'badge-pink',   icon: UserCheck },
  BENEFICIARIO: { label: 'Beneficiário', badge: 'badge-blue',   icon: Users },
  MEMBRO:       { label: 'Membro',       badge: 'badge-purple', icon: Handshake },
  DOADOR:       { label: 'Doador',       badge: 'badge-green',  icon: Gift },
}

const STATS = [
  { label: 'Total de pessoas', value: '247', mod: 'mod-pessoas',    icon: Heart },
  { label: 'Voluntários',      value: '89',  mod: 'mod-comunicacao',icon: UserCheck },
  { label: 'Beneficiários',    value: '134', mod: 'mod-dashboard',  icon: Users },
  { label: 'Doadores',         value: '24',  mod: 'mod-financeiro', icon: Gift },
]

export default function Pessoas() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')

  const filtradas = PESSOAS.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.email.includes(busca)
    const matchTipo = tipoFiltro === 'TODOS' || p.tipo === tipoFiltro
    return matchBusca && matchTipo
  })

  return (
    <div className="mod-pessoas animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pessoas</h1>
          <p className="page-subtitle">Gerencie membros, voluntários, beneficiários e doadores</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pessoas/novo')}>
          <Plus size={16} /> Nova pessoa
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        {STATS.map(({ label, value, mod, icon: Icon }, i) => (
          <div key={label} className={`stat-card ${mod} delay-${i + 1}`}>
            <div className="stat-icon"><Icon size={20} strokeWidth={2} /></div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card animate-fade-up delay-2" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input placeholder="Buscar por nome ou e-mail…" value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['TODOS', 'VOLUNTARIO', 'BENEFICIARIO', 'MEMBRO', 'DOADOR'].map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`btn btn-sm ${tipoFiltro === t ? 'btn-primary' : 'btn-outline'}`}
                style={tipoFiltro === t ? { '--mod-color': 'var(--pink-500)' } : {}}>
                {t === 'TODOS' ? 'Todos' : tipoConfig[t]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card animate-fade-up delay-3">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Tipo</th>
                <th>Contato</th>
                <th>Horas vol.</th>
                <th>Projetos</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(p => {
                const cfg = tipoConfig[p.tipo]
                const Icon = cfg.icon
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-md" style={{ background: p.cor }}>{p.inicial}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 14 }}>{p.nome}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cfg.badge}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={11} /> {p.telefone}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Mail size={11} /> {p.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{p.horas}h</span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{p.projetos}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'ATIVO' ? 'badge-green' : 'badge-gray'}`}>
                        {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
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
