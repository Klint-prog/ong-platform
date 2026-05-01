import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { salvarProjetos, carregarProjetos, statusPadrao } from './projetosData'

const vazio = { nome: '', descricao: '', inicio: '', fim: '', orcamento: '', status: 'EM_ANDAMENTO', tags: [], documentos: [] }

export default function NovoProjetoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editando = Boolean(id)
  const [tagNome, setTagNome] = useState('')
  const [tagCor, setTagCor] = useState('#2563eb')
  const [form, setForm] = useState(vazio)

  const projetos = useMemo(() => carregarProjetos(), [])

  useEffect(() => {
    if (!editando) return
    const projeto = projetos.find(item => String(item.id) === String(id))
    if (!projeto) return
    setForm({ ...vazio, ...projeto, orcamento: projeto.orcamento ?? '' })
  }, [editando, id, projetos])

  const addTag = () => {
    if (!tagNome.trim()) return
    setForm(prev => ({ ...prev, tags: [...prev.tags, { nome: tagNome.trim(), cor: tagCor }] }))
    setTagNome('')
  }

  const removerTag = (nomeTag) => setForm(prev => ({ ...prev, tags: prev.tags.filter(tag => tag.nome !== nomeTag) }))

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
    const payload = {
      ...form,
      id: editando ? Number(id) : Date.now(),
      orcamento: Number(form.orcamento || 0),
      gasto: form.gasto || 0,
      pessoas: form.pessoas || 0,
      tarefas: form.tarefas || { total: 0, concluidas: 0 },
      cor: form.cor || '#3b82f6',
    }

    const atualizados = editando
      ? existentes.map(item => (String(item.id) === String(id) ? payload : item))
      : [...existentes, payload]

    salvarProjetos(atualizados)
    navigate('/projetos')
  }

  return (
    <form className="card" onSubmit={salvar} style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
      <h1 className="page-title">{editando ? 'Editar projeto' : 'Novo projeto'}</h1>
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
        {form.tags.map(tag => (
          <button key={tag.nome} type="button" className="badge" onClick={() => removerTag(tag.nome)} style={{ background: tag.cor + '25', color: tag.cor, border: `1px solid ${tag.cor}` }}>{tag.nome} ×</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <strong>Documentos</strong>
        <input type="file" multiple onChange={onDocs} />
        {form.documentos.map(doc => <span key={doc.nome} className="badge badge-gray">{doc.nome}</span>)}
      </div>

      <button className="btn btn-primary" type="submit">{editando ? 'Salvar alterações' : 'Salvar projeto'}</button>
    </form>
  )
}
