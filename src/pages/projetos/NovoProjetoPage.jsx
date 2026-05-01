import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { salvarProjetos, carregarProjetos, statusPadrao } from './projetosData'

export default function NovoProjetoPage() {
  const navigate = useNavigate()
  const [tagNome, setTagNome] = useState('')
  const [tagCor, setTagCor] = useState('#2563eb')
  const [form, setForm] = useState({ nome: '', descricao: '', inicio: '', fim: '', orcamento: '', status: 'EM_ANDAMENTO', tags: [], documentos: [] })

  const addTag = () => {
    if (!tagNome.trim()) return
    setForm(prev => ({ ...prev, tags: [...prev.tags, { nome: tagNome.trim(), cor: tagCor }] }))
    setTagNome('')
  }

  const onDocs = (e) => {
    const files = Array.from(e.target.files || [])
    Promise.all(files.map(file => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ nome: file.name, url: reader.result })
      reader.readAsDataURL(file)
    }))).then(docs => setForm(prev => ({ ...prev, documentos: [...prev.documentos, ...docs] })))
  }

  const salvar = (e) => {
    e.preventDefault()
    const existentes = carregarProjetos()
    const novo = {
      ...form,
      id: Date.now(),
      orcamento: Number(form.orcamento || 0),
      gasto: 0,
      pessoas: 0,
      tarefas: { total: 0, concluidas: 0 },
      cor: '#3b82f6',
    }
    salvarProjetos([...existentes, novo])
    navigate('/projetos')
  }

  return (
    <form className="card" onSubmit={salvar} style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
      <h1 className="page-title">Novo projeto</h1>
      <input placeholder="Nome" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
      <textarea rows={4} placeholder="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <input type="date" value={form.inicio} onChange={e => setForm({ ...form, inicio: e.target.value })} />
        <input type="date" value={form.fim} onChange={e => setForm({ ...form, fim: e.target.value })} />
      </div>
      <input type="number" placeholder="Orçamento" value={form.orcamento} onChange={e => setForm({ ...form, orcamento: e.target.value })} />
      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
        {statusPadrao.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <div style={{ display: 'grid', gap: 8 }}>
        <strong>Tags</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Nome da tag" value={tagNome} onChange={e => setTagNome(e.target.value)} />
          <input type="color" value={tagCor} onChange={e => setTagCor(e.target.value)} style={{ width: 52 }} />
          <button type="button" className="btn btn-outline" onClick={addTag}>Adicionar tag</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {form.tags.map(tag => <span key={tag.nome} className="badge" style={{ background: tag.cor + '25', color: tag.cor, border: `1px solid ${tag.cor}` }}>{tag.nome}</span>)}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <strong>Documentos</strong>
        <input type="file" multiple onChange={onDocs} />
        {form.documentos.map(doc => <span key={doc.nome} className="badge badge-gray">{doc.nome}</span>)}
      </div>

      <button className="btn btn-primary" type="submit">Salvar projeto</button>
    </form>
  )
}
