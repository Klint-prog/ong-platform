import { useMemo, useState } from 'react'
import { UsersRound, Plus, MapPin, FileSignature, HeartHandshake, X, Search, Eye, Pencil } from 'lucide-react'

const seedBeneficiarios = [
  { id: 1, nome: 'Família Silva', tipo: 'FAMILIA', comunidade: 'Engenho Sirigi', projeto: 'Horta Solidária', telefone: '(81) 98888-1111', status: 'ATIVO', termoLgpd: true, atendimentos: 7 },
  { id: 2, nome: 'Maria José dos Santos', tipo: 'MULHER_RURAL', comunidade: 'Assentamento Mariano Sales', projeto: 'Mulheres Empreendedoras', telefone: '(81) 97777-2222', status: 'ATIVO', termoLgpd: true, atendimentos: 4 },
  { id: 3, nome: 'João Pedro Lima', tipo: 'JOVEM', comunidade: 'Vila Rural', projeto: 'Escola Digital', telefone: '(81) 96666-3333', status: 'ACOMPANHAMENTO', termoLgpd: false, atendimentos: 2 },
  { id: 4, nome: 'Coletivo de Agricultores Sirigi', tipo: 'GRUPO', comunidade: 'Engenho Sirigi', projeto: 'Saúde Rural', telefone: '(81) 95555-4444', status: 'ATIVO', termoLgpd: true, atendimentos: 11 },
]

const tiposIniciais = ['FAMILIA', 'MULHER_RURAL', 'JOVEM', 'GRUPO']
const formatarTipo = (tipo) => tipo.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase())

export default function Beneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState(seedBeneficiarios)
  const [tipos, setTipos] = useState(tiposIniciais)
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const [modoModal, setModoModal] = useState('novo')
  const [selecionado, setSelecionado] = useState(null)
  const [novoTipo, setNovoTipo] = useState('')
  const [form, setForm] = useState({ nome: '', tipo: 'FAMILIA', comunidade: '', projeto: '', telefone: '', status: 'ATIVO', termoLgpd: false, atendimentos: 0 })

  const comunidades = useMemo(() => new Set(beneficiarios.map((b) => b.comunidade)).size, [beneficiarios])
  const filtrados = useMemo(() => beneficiarios.filter((b) => {
    const t = busca.toLowerCase()
    return b.nome.toLowerCase().includes(t) || b.comunidade.toLowerCase().includes(t) || b.projeto.toLowerCase().includes(t)
  }), [beneficiarios, busca])

  const atualizar = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }))

  const abrirNovo = () => {
    setModoModal('novo')
    setSelecionado(null)
    setForm({ nome: '', tipo: 'FAMILIA', comunidade: '', projeto: '', telefone: '', status: 'ATIVO', termoLgpd: false, atendimentos: 0 })
    setAberto(true)
  }

  const visualizar = (b) => {
    setModoModal('visualizar')
    setSelecionado(b)
    setForm({ ...b })
    setAberto(true)
  }

  const editar = (b) => {
    setModoModal('editar')
    setSelecionado(b)
    setForm({ ...b })
    setAberto(true)
  }

  const adicionarTipo = () => {
    const tipo = novoTipo.trim().toUpperCase().replaceAll(' ', '_')
    if (!tipo || tipos.includes(tipo)) return
    setTipos((atual) => [...atual, tipo])
    setForm((atual) => ({ ...atual, tipo }))
    setNovoTipo('')
  }

  const salvar = (e) => {
    e.preventDefault()
    if (modoModal === 'visualizar') return

    if (modoModal === 'editar' && selecionado) {
      setBeneficiarios((atual) => atual.map((b) => (b.id === selecionado.id ? { ...form, id: b.id, atendimentos: Number(form.atendimentos) || 0 } : b)))
    } else {
      const novo = { ...form, id: Math.max(0, ...beneficiarios.map((b) => b.id)) + 1, atendimentos: Number(form.atendimentos) || 0 }
      setBeneficiarios((atual) => [novo, ...atual])
    }

    setAberto(false)
  }

  return (
    <div className="mod-beneficiarios animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficiários</h1>
          <p className="page-subtitle">Status dos atendimentos e lista de cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNovo}><Plus size={16} /> Novo beneficiário</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><UsersRound size={20} /></div><div><div className="stat-label">Beneficiários</div><div className="stat-value">{beneficiarios.length}</div></div></div>
        <div className="stat-card mod-projetos"><div className="stat-icon"><HeartHandshake size={20} /></div><div><div className="stat-label">Atendimentos</div><div className="stat-value">{beneficiarios.reduce((acc, b) => acc + b.atendimentos, 0)}</div></div></div>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileSignature size={20} /></div><div><div className="stat-label">Termos LGPD</div><div className="stat-value">{beneficiarios.filter((b) => b.termoLgpd).length}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><MapPin size={20} /></div><div><div className="stat-label">Comunidades</div><div className="stat-value">{comunidades}</div></div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busca rápida por nome, comunidade ou projeto" style={{ paddingLeft: 38 }} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Beneficiário</th><th>Tipo</th><th>Comunidade</th><th>Projeto</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtrados.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{b.telefone}</div></td>
                  <td><span className="badge badge-blue">{formatarTipo(b.tipo)}</span></td>
                  <td>{b.comunidade}</td>
                  <td>{b.projeto}</td>
                  <td><span className="badge badge-green">{b.status === 'ATIVO' ? 'Ativo' : 'Acompanhamento'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Visualizar" onClick={() => visualizar(b)}><Eye size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Alterar cadastro" onClick={() => editar(b)}><Pencil size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {aberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <form className="card" onSubmit={salvar} style={{ width: 'min(760px, 92vw)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3>{modoModal === 'novo' ? 'Cadastrar beneficiário' : modoModal === 'editar' ? 'Alterar cadastro' : 'Visualizar beneficiário'}</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setAberto(false)}><X size={16} /></button>
            </div>
            <div className="grid-4" style={{ marginBottom: 10 }}>
              <input required disabled={modoModal === 'visualizar'} value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} placeholder="Nome" />
              <select disabled={modoModal === 'visualizar'} value={form.tipo} onChange={(e) => atualizar('tipo', e.target.value)}>{tipos.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <input required disabled={modoModal === 'visualizar'} value={form.comunidade} onChange={(e) => atualizar('comunidade', e.target.value)} placeholder="Comunidade" />
              <input required disabled={modoModal === 'visualizar'} value={form.projeto} onChange={(e) => atualizar('projeto', e.target.value)} placeholder="Projeto" />
            </div>
            {modoModal !== 'visualizar' && (
              <div className="grid-4" style={{ marginBottom: 10 }}>
                <input value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} placeholder="Novo tipo" />
                <button type="button" className="btn btn-outline" onClick={adicionarTipo}><Plus size={14} /> Adicionar tipo</button>
                <input value={form.telefone} onChange={(e) => atualizar('telefone', e.target.value)} placeholder="Telefone" />
                <input type="number" min="0" value={form.atendimentos} onChange={(e) => atualizar('atendimentos', e.target.value)} placeholder="Atendimentos" />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8 }}><input disabled={modoModal === 'visualizar'} type="checkbox" checked={form.termoLgpd} onChange={(e) => atualizar('termoLgpd', e.target.checked)} />Termo LGPD assinado</label>
              {modoModal !== 'visualizar' && <button className="btn btn-primary" type="submit">Salvar</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
