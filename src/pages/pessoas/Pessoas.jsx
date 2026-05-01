import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Plus, Search, Phone, Mail, Pencil, Users, UserCheck, Handshake, Gift } from 'lucide-react'

import { loadPessoas } from './pessoasStorage'

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
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [pessoas, setPessoas] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setPessoas(loadPessoas())
  }, [])

  const filtradas = pessoas.filter(p => {
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
        <button className="btn btn-primary" onClick={() => navigate('/pessoas/nova')}>
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
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/pessoas/${p.id}/editar`)}>
                        <Pencil size={14} /> Editar
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
