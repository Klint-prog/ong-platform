import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UsersRound, Plus, Search, MapPin, FileSignature, HeartHandshake, Trash2, Pencil, Check, X } from 'lucide-react'
import { listarTipos, salvarTipos, TIPOS_PADRAO } from './tiposBeneficiario'

const seedBeneficiarios = [
  { id: 1, nome: 'Família Silva', tipo: 'FAMILIA', comunidade: 'Engenho Sirigi', projeto: 'Horta Solidária', telefone: '(81) 98888-1111', status: 'ATIVO', termoLgpd: true, atendimentos: 7 },
  { id: 2, nome: 'Maria José dos Santos', tipo: 'MULHER_RURAL', comunidade: 'Assentamento Mariano Sales', projeto: 'Mulheres Empreendedoras', telefone: '(81) 97777-2222', status: 'ATIVO', termoLgpd: true, atendimentos: 4 },
  { id: 3, nome: 'João Pedro Lima', tipo: 'JOVEM', comunidade: 'Vila Rural', projeto: 'Escola Digital', telefone: '(81) 96666-3333', status: 'ACOMPANHAMENTO', termoLgpd: false, atendimentos: 2 },
  { id: 4, nome: 'Coletivo de Agricultores Sirigi', tipo: 'GRUPO', comunidade: 'Engenho Sirigi', projeto: 'Saúde Rural', telefone: '(81) 95555-4444', status: 'ATIVO', termoLgpd: true, atendimentos: 11 },
]

const formatarTipo = (tipo) => tipo.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase())

export default function Beneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState(seedBeneficiarios)
  const [busca, setBusca] = useState('')
  const [tipos, setTipos] = useState([])
  const [novoTipo, setNovoTipo] = useState('')
  const [editandoTipo, setEditandoTipo] = useState(null)
  const [valorEdicaoTipo, setValorEdicaoTipo] = useState('')
  const navigate = useNavigate()


  useEffect(() => {
    setTipos(listarTipos())
  }, [])

  const adicionarTipo = () => {
    const normalizado = novoTipo.trim().toUpperCase().replaceAll(' ', '_')
    if (!normalizado || tipos.includes(normalizado)) return
    const atualizados = [...tipos, normalizado]
    setTipos(atualizados)
    salvarTipos(atualizados)
    setNovoTipo('')
  }

  const salvarEdicaoTipo = () => {
    const normalizado = valorEdicaoTipo.trim().toUpperCase().replaceAll(' ', '_')
    if (!normalizado || tipos.includes(normalizado)) return
    const atualizados = tipos.map((t) => (t === editandoTipo ? normalizado : t))
    setTipos(atualizados)
    salvarTipos(atualizados)
    setBeneficiarios((atual) => atual.map((b) => (b.tipo === editandoTipo ? { ...b, tipo: normalizado } : b)))
    setEditandoTipo(null)
    setValorEdicaoTipo('')
  }

  const excluirTipo = (tipo) => {
    if (TIPOS_PADRAO.includes(tipo)) return
    const atualizados = tipos.filter((t) => t !== tipo)
    setTipos(atualizados)
    salvarTipos(atualizados)
  }
  const filtrados = useMemo(() => beneficiarios.filter((b) => {
    const termo = busca.toLowerCase()
    return b.nome.toLowerCase().includes(termo) || b.comunidade.toLowerCase().includes(termo) || b.projeto.toLowerCase().includes(termo)
  }), [beneficiarios, busca])

  const remover = (id) => {
    if (confirm('Deseja remover este beneficiário da listagem?')) {
      setBeneficiarios((atual) => atual.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="mod-beneficiarios animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficiários</h1>
          <p className="page-subtitle">Cadastro de famílias, grupos e pessoas atendidas pelos projetos sociais</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/beneficiarios/novo')}><Plus size={16} /> Novo beneficiário</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><UsersRound size={20} /></div><div><div className="stat-label">Beneficiários</div><div className="stat-value">{beneficiarios.length}</div></div></div>
        <div className="stat-card mod-projetos"><div className="stat-icon"><HeartHandshake size={20} /></div><div><div className="stat-label">Atendimentos</div><div className="stat-value">{beneficiarios.reduce((acc, b) => acc + b.atendimentos, 0)}</div></div></div>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileSignature size={20} /></div><div><div className="stat-label">Termos LGPD</div><div className="stat-value">{beneficiarios.filter((b) => b.termoLgpd).length}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><MapPin size={20} /></div><div><div className="stat-label">Comunidades</div><div className="stat-value">3</div></div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, comunidade ou projeto…" style={{ paddingLeft: 38 }} />
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 10 }}>Tipos de beneficiário</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} placeholder="Novo tipo (ex: Idoso)" />
          <button className="btn btn-outline" onClick={adicionarTipo} type="button"><Plus size={14} /> Adicionar tipo</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tipos.map((tipo) => (
            <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--gray-200)', borderRadius: 999, padding: '6px 10px' }}>
              {editandoTipo === tipo ? (
                <>
                  <input value={valorEdicaoTipo} onChange={(e) => setValorEdicaoTipo(e.target.value)} style={{ width: 140, padding: '4px 8px' }} />
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={salvarEdicaoTipo} type="button"><Check size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditandoTipo(null)} type="button"><X size={14} /></button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 12 }}>{formatarTipo(tipo)}</span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditandoTipo(tipo); setValorEdicaoTipo(tipo) }} type="button"><Pencil size={14} /></button>
                  {!TIPOS_PADRAO.includes(tipo) && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => excluirTipo(tipo)} type="button"><Trash2 size={14} /></button>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Beneficiário</th><th>Tipo</th><th>Comunidade</th><th>Projeto</th><th>Atendimentos</th><th>LGPD</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtrados.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{b.telefone}</div></td>
                  <td><span className="badge badge-blue">{formatarTipo(b.tipo)}</span></td>
                  <td>{b.comunidade}</td>
                  <td>{b.projeto}</td>
                  <td><strong>{b.atendimentos}</strong></td>
                  <td><span className={`badge ${b.termoLgpd ? 'badge-green' : 'badge-yellow'}`}>{b.termoLgpd ? 'Assinado' : 'Pendente'}</span></td>
                  <td><span className="badge badge-green">{b.status === 'ATIVO' ? 'Ativo' : 'Acompanhamento'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => navigate(`/beneficiarios/${b.id}/editar`)} title="Alterar cadastro"><Pencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remover(b.id)} title="Remover beneficiário"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
