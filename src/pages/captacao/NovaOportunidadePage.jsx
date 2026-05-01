import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOportunidades, getStatusList, saveOportunidades, saveStatusList } from './captacaoStorage'

export default function NovaOportunidadePage() {
  const navigate = useNavigate()
  const [statusList, setStatusList] = useState(getStatusList)
  const [novoStatusNome, setNovoStatusNome] = useState('')
  const [novoStatusCor, setNovoStatusCor] = useState('#7C3AED')
  const [form, setForm] = useState({ nome: '', fonte: '', valor: '', prazo: '', responsavel: '', status: statusList[0]?.id || '' })

  const criarStatusPersonalizado = () => {
    const nome = novoStatusNome.trim()
    if (!nome) return
    const novo = { id: `CUSTOM_${Date.now()}`, label: nome, color: novoStatusCor }
    const lista = [...statusList, novo]
    setStatusList(lista)
    saveStatusList(lista)
    setForm((prev) => ({ ...prev, status: novo.id }))
    setNovoStatusNome('')
  }

  const salvar = (e) => {
    e.preventDefault()
    const nova = { id: Date.now(), nome: form.nome.trim(), fonte: form.fonte.trim(), valor: Number(form.valor) || 0, prazo: form.prazo, responsavel: form.responsavel.trim(), status: form.status, observacoes: '' }
    if (!nova.nome || !nova.fonte || !nova.prazo || !nova.responsavel) return
    const list = [nova, ...getOportunidades()]
    saveOportunidades(list)
    navigate('/captacao')
  }

  return <form className="card" onSubmit={salvar} style={{ display: 'grid', gap: 12 }}><h2>Nova oportunidade</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
    <input placeholder="Nome" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
    <input placeholder="Fonte" value={form.fonte} onChange={(e) => setForm((p) => ({ ...p, fonte: e.target.value }))} />
    <input type="number" placeholder="Valor" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} />
    <input type="date" value={form.prazo} onChange={(e) => setForm((p) => ({ ...p, prazo: e.target.value }))} />
    <input placeholder="Responsável" value={form.responsavel} onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))} />
    <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{statusList.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
  </div><div style={{ display: 'flex', gap: 8 }}><input placeholder="Novo status" value={novoStatusNome} onChange={(e) => setNovoStatusNome(e.target.value)} /><input type="color" value={novoStatusCor} onChange={(e) => setNovoStatusCor(e.target.value)} /><button type="button" className="btn btn-outline" onClick={criarStatusPersonalizado}>Adicionar tag</button><button className="btn btn-primary" type="submit">Cadastrar</button></div></form>
}
