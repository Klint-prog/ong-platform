import { useMemo, useState } from 'react'
import { UsersRound, Plus, Search, MapPin, FileSignature, HeartHandshake, Trash2, Pencil, Check, X } from 'lucide-react'
import { TIPOS_PADRAO, listarTipos, salvarTipos } from './tiposBeneficiario'
import { listarBeneficiarios, salvarBeneficiarios } from './beneficiariosStorage'

const formatarTipo = (tipo = '') => tipo.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase())
const normalizarTipo = (tipo = '') => tipo.trim().toUpperCase().replaceAll(' ', '_')

const formInicial = (tipoPadrao = 'FAMILIA') => ({
  nome: '',
  tipo: tipoPadrao,
  comunidade: '',
  projeto: '',
  telefone: '',
  status: 'ATIVO',
  termoLgpd: false,
  atendimentos: 0,
})

export default function Beneficiarios() {
  const [beneficiarios, setBeneficiarios] = useState(() => listarBeneficiarios())
  const [busca, setBusca] = useState('')
  const [tipos, setTipos] = useState(() => listarTipos())
  const [novoTipo, setNovoTipo] = useState('')
  const [editandoTipo, setEditandoTipo] = useState(null)
  const [valorEdicaoTipo, setValorEdicaoTipo] = useState('')
  const [modoFormulario, setModoFormulario] = useState('novo')
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(() => formInicial(listarTipos()[0] || 'FAMILIA'))

  const tipoDisponivel = tipos.includes(form.tipo) ? form.tipo : tipos[0] || 'FAMILIA'

  const comunidades = useMemo(() => new Set(beneficiarios.map((b) => b.comunidade).filter(Boolean)).size, [beneficiarios])
  const filtrados = useMemo(() => beneficiarios.filter((b) => {
    const termo = busca.toLowerCase()
    return [b.nome, b.comunidade, b.projeto, b.telefone].join(' ').toLowerCase().includes(termo)
  }), [beneficiarios, busca])

  const persistirBeneficiarios = (next) => {
    setBeneficiarios(next)
    salvarBeneficiarios(next)
  }

  const atualizarCampo = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

  const adicionarTipo = () => {
    const normalizado = normalizarTipo(novoTipo)
    if (!normalizado || tipos.includes(normalizado)) return
    const atualizados = [...tipos, normalizado]
    setTipos(atualizados)
    salvarTipos(atualizados)
    setForm((atual) => ({ ...atual, tipo: normalizado }))
    setNovoTipo('')
  }

  const salvarEdicaoTipo = () => {
    if (!editandoTipo) return
    const normalizado = normalizarTipo(valorEdicaoTipo)
    if (!normalizado) return
    const atualizados = Array.from(new Set(tipos.map((tipo) => (tipo === editandoTipo ? normalizado : tipo))))
    setTipos(atualizados)
    salvarTipos(atualizados)
    persistirBeneficiarios(beneficiarios.map((b) => (b.tipo === editandoTipo ? { ...b, tipo: normalizado } : b)))
    setForm((atual) => (atual.tipo === editandoTipo ? { ...atual, tipo: normalizado } : atual))
    setEditandoTipo(null)
    setValorEdicaoTipo('')
  }

  const excluirTipo = (tipo) => {
    if (TIPOS_PADRAO.includes(tipo)) return
    const atualizados = tipos.filter((t) => t !== tipo)
    setTipos(atualizados)
    salvarTipos(atualizados)
    persistirBeneficiarios(beneficiarios.map((b) => (b.tipo === tipo ? { ...b, tipo: 'FAMILIA' } : b)))
    setForm((atual) => (atual.tipo === tipo ? { ...atual, tipo: 'FAMILIA' } : atual))
  }

  const remover = (id) => {
    if (confirm('Deseja remover este beneficiário da listagem?')) {
      persistirBeneficiarios(beneficiarios.filter((b) => b.id !== id))
    }
  }

  const resetarFormulario = () => {
    setForm(formInicial(tipos[0] || 'FAMILIA'))
    setModoFormulario('novo')
    setEditandoId(null)
  }

  const iniciarEdicao = (beneficiario) => {
    setModoFormulario('edicao')
    setEditandoId(beneficiario.id)
    setForm({ ...beneficiario })
  }

  const salvarBeneficiario = (e) => {
    e.preventDefault()
    if (!form.nome.trim() || !form.comunidade.trim() || !form.projeto.trim()) return
    const payload = { ...form, nome: form.nome.trim(), tipo: tipoDisponivel, atendimentos: Number(form.atendimentos) || 0 }
    if (modoFormulario === 'edicao' && editandoId) {
      persistirBeneficiarios(beneficiarios.map((b) => (b.id === editandoId ? { ...b, ...payload } : b)))
      resetarFormulario()
      return
    }
    const novo = { ...payload, id: Math.max(0, ...beneficiarios.map((b) => Number(b.id) || 0)) + 1 }
    persistirBeneficiarios([novo, ...beneficiarios])
    resetarFormulario()
  }

  return (
    <div className="mod-beneficiarios animate-fade-in">
      <div className="page-header"><div><h1 className="page-title">Beneficiários</h1><p className="page-subtitle">Cadastro de famílias, grupos e pessoas atendidas pelos projetos sociais</p></div><button className="btn btn-primary" onClick={resetarFormulario}><Plus size={16} /> Novo beneficiário</button></div>
      <form className="card" style={{ marginBottom: 20 }} onSubmit={salvarBeneficiario}>
        <h3 style={{ marginBottom: 12 }}>{modoFormulario === 'edicao' ? 'Alterar beneficiário' : 'Cadastrar beneficiário'}</h3>
        <div className="grid-4" style={{ marginBottom: 12 }}><input value={form.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} placeholder="Nome do beneficiário" required /><input value={form.comunidade} onChange={(e) => atualizarCampo('comunidade', e.target.value)} placeholder="Comunidade" required /><input value={form.projeto} onChange={(e) => atualizarCampo('projeto', e.target.value)} placeholder="Projeto" required /><input value={form.telefone} onChange={(e) => atualizarCampo('telefone', e.target.value)} placeholder="Telefone" /></div>
        <div className="grid-4" style={{ marginBottom: 12 }}><select value={tipoDisponivel} onChange={(e) => atualizarCampo('tipo', e.target.value)}>{tipos.map((tipo) => <option value={tipo} key={tipo}>{formatarTipo(tipo)}</option>)}</select><select value={form.status} onChange={(e) => atualizarCampo('status', e.target.value)}><option value="ATIVO">Ativo</option><option value="ACOMPANHAMENTO">Acompanhamento</option></select><input type="number" min="0" value={form.atendimentos} onChange={(e) => atualizarCampo('atendimentos', e.target.value)} placeholder="Atendimentos" /><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><input type="checkbox" checked={form.termoLgpd} onChange={(e) => atualizarCampo('termoLgpd', e.target.checked)} /> Termo LGPD assinado</label></div>
        <div style={{ display: 'flex', gap: 8 }}><button type="submit" className="btn btn-primary">{modoFormulario === 'edicao' ? 'Salvar alterações' : 'Cadastrar beneficiário'}</button>{modoFormulario === 'edicao' && <button type="button" className="btn btn-ghost" onClick={resetarFormulario}>Cancelar</button>}</div>
      </form>
      <div className="grid-4" style={{ marginBottom: 24 }}><div className="stat-card mod-beneficiarios"><div className="stat-icon"><UsersRound size={20} /></div><div><div className="stat-label">Beneficiários</div><div className="stat-value">{beneficiarios.length}</div></div></div><div className="stat-card mod-projetos"><div className="stat-icon"><HeartHandshake size={20} /></div><div><div className="stat-label">Atendimentos</div><div className="stat-value">{beneficiarios.reduce((acc, b) => acc + Number(b.atendimentos || 0), 0)}</div></div></div><div className="stat-card mod-documentos"><div className="stat-icon"><FileSignature size={20} /></div><div><div className="stat-label">Termos LGPD</div><div className="stat-value">{beneficiarios.filter((b) => b.termoLgpd).length}</div></div></div><div className="stat-card mod-dashboard"><div className="stat-icon"><MapPin size={20} /></div><div><div className="stat-label">Comunidades</div><div className="stat-value">{comunidades}</div></div></div></div>
      <div className="card" style={{ marginBottom: 20 }}><div style={{ position: 'relative' }}><Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busca rápida por nome, comunidade ou projeto" style={{ paddingLeft: 38 }} /></div></div>
      <div className="card" style={{ marginBottom: 20 }}><h3 style={{ marginBottom: 10 }}>Tipos de beneficiário</h3><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><input value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} placeholder="Novo tipo (ex: Idoso)" /><button className="btn btn-outline" onClick={adicionarTipo} type="button"><Plus size={14} /> Adicionar tipo</button></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{tipos.map((tipo) => <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--gray-200)', borderRadius: 999, padding: '6px 10px' }}>{editandoTipo === tipo ? <><input value={valorEdicaoTipo} onChange={(e) => setValorEdicaoTipo(e.target.value)} style={{ width: 140, padding: '4px 8px' }} /><button className="btn btn-ghost btn-icon btn-sm" onClick={salvarEdicaoTipo} type="button"><Check size={14} /></button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditandoTipo(null)} type="button"><X size={14} /></button></> : <><span style={{ fontSize: 12 }}>{formatarTipo(tipo)}</span><button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditandoTipo(tipo); setValorEdicaoTipo(tipo) }} type="button"><Pencil size={14} /></button>{!TIPOS_PADRAO.includes(tipo) && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => excluirTipo(tipo)} type="button"><Trash2 size={14} /></button>}</>}</div>)}</div></div>
      <div className="card"><div className="table-wrap"><table><thead><tr><th>Beneficiário</th><th>Tipo</th><th>Comunidade</th><th>Projeto</th><th>Atendimentos</th><th>LGPD</th><th>Status</th><th></th></tr></thead><tbody>{filtrados.map((b) => <tr key={b.id}><td><strong>{b.nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{b.telefone}</div></td><td><span className="badge badge-blue">{formatarTipo(b.tipo)}</span></td><td>{b.comunidade}</td><td>{b.projeto}</td><td><strong>{b.atendimentos}</strong></td><td><span className={`badge ${b.termoLgpd ? 'badge-green' : 'badge-yellow'}`}>{b.termoLgpd ? 'Assinado' : 'Pendente'}</span></td><td><span className="badge badge-green">{b.status === 'ATIVO' ? 'Ativo' : 'Acompanhamento'}</span></td><td><div style={{ display: 'flex', gap: 6 }}><button className="btn btn-ghost btn-icon btn-sm" onClick={() => iniciarEdicao(b)} title="Alterar cadastro"><Pencil size={15} /></button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => remover(b.id)} title="Remover beneficiário"><Trash2 size={15} /></button></div></td></tr>)}{filtrados.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum beneficiário cadastrado.</td></tr>}</tbody></table></div></div>
    </div>
  )
}
