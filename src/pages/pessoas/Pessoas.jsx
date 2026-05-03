import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, Handshake, Heart, Mail, Pencil, Phone, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react'

import { excluirPessoa, formatarTipoPessoa, listarTiposPessoa, loadPessoas } from './pessoasStorage'

const tipoIconMap = {
  VOLUNTARIO: UserCheck,
  BENEFICIARIO: Users,
  MEMBRO: Handshake,
  DOADOR: Gift,
}

const tipoBadgeMap = {
  VOLUNTARIO: 'badge-pink',
  BENEFICIARIO: 'badge-blue',
  MEMBRO: 'badge-purple',
  DOADOR: 'badge-green',
}

function getTipoConfig(tipo) {
  return {
    label: formatarTipoPessoa(tipo),
    badge: tipoBadgeMap[tipo] || 'badge-gray',
    icon: tipoIconMap[tipo] || Users,
  }
}

export default function Pessoas() {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [pessoas, setPessoas] = useState([])
  const [tipos, setTipos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setPessoas(loadPessoas())
    setTipos(listarTiposPessoa())
  }, [])

  const filtradas = pessoas.filter(p => {
    const termo = busca.toLowerCase()
    const matchBusca = [p.nome, p.email, p.telefone, p.tipo].join(' ').toLowerCase().includes(termo)
    const matchTipo = tipoFiltro === 'TODOS' || p.tipo === tipoFiltro
    return matchBusca && matchTipo
  })

  const stats = useMemo(() => {
    const voluntarios = pessoas.filter((p) => p.tipo === 'VOLUNTARIO').length
    const beneficiarios = pessoas.filter((p) => p.tipo === 'BENEFICIARIO').length
    const doadores = pessoas.filter((p) => p.tipo === 'DOADOR').length
    return [
      { label: 'Total de pessoas', value: String(pessoas.length), mod: 'mod-pessoas', icon: Heart },
      { label: 'Voluntários', value: String(voluntarios), mod: 'mod-comunicacao', icon: UserCheck },
      { label: 'Beneficiários', value: String(beneficiarios), mod: 'mod-dashboard', icon: Users },
      { label: 'Doadores', value: String(doadores), mod: 'mod-financeiro', icon: Gift },
    ]
  }, [pessoas])

  const removerPessoa = (pessoa) => {
    if (!window.confirm(`Deseja excluir o registro de "${pessoa.nome}"?`)) return
    setPessoas(excluirPessoa(pessoa.id))
  }

  return (
    <div className="mod-pessoas animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pessoas</h1>
          <p className="page-subtitle">Gerencie membros, voluntários, beneficiários, doadores e demais perfis da organização</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pessoas/nova')}>
          <Plus size={16} /> Nova pessoa
        </button>
      </div>

      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        {stats.map(({ label, value, mod, icon: Icon }, i) => (
          <div key={label} className={`stat-card ${mod} delay-${i + 1}`}>
            <div className="stat-icon"><Icon size={20} strokeWidth={2} /></div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card animate-fade-up delay-2" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input placeholder="Buscar por nome, e-mail, telefone ou tipo…" value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['TODOS', ...tipos].map(t => (
              <button key={t} onClick={() => setTipoFiltro(t)}
                className={`btn btn-sm ${tipoFiltro === t ? 'btn-primary' : 'btn-outline'}`}
                style={tipoFiltro === t ? { '--mod-color': 'var(--pink-500)' } : {}}>
                {t === 'TODOS' ? 'Todos' : formatarTipoPessoa(t)}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(p => {
                const cfg = getTipoConfig(p.tipo)
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
                          <Phone size={11} /> {p.telefone || '-'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Mail size={11} /> {p.email || '-'}
                        </span>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{Number(p.horas || 0)}h</span></td>
                    <td><span className="badge badge-blue">{Number(p.projetos || 0)}</span></td>
                    <td>
                      <span className={`badge ${p.status === 'ATIVO' ? 'badge-green' : 'badge-gray'}`}>
                        {p.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/pessoas/${p.id}/editar`)}>
                          <Pencil size={14} /> Editar
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => removerPessoa(p)}>
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma pessoa cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
