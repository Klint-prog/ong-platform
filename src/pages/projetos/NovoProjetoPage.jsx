import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { buscarProjetoPorId, statusPadrao, upsertProjeto } from './projetosData'

const formVazio = { nome: '', descricao: '', inicio: '', fim: '', orcamento: '', status: 'EM_ANDAMENTO', tags: [], documentos: [], gasto: 0, pessoas: 0, tarefas: { total: 0, concluidas: 0 }, cor: '#3b82f6' }

export default function NovoProjetoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const projetoExistente = useMemo(() => id ? buscarProjetoPorId(id) : null, [id])
  const modoEdicao = Boolean(id)
  const [tagNome, setTagNome] = useState('')
  const [tagCor, setTagCor] = useState('#2563eb')
  const [form, setForm] = useState(() => projetoExistente ? { ...formVazio, ...projetoExistente } : formVazio)

  const addTag = () => {
    if (!tagNome.trim()) return
    setForm(prev => ({ ...prev, tags: [...(prev.tags || []), { nome: tagNome.trim(), cor: tagCor }] }))
    setTagNome('')
  }

  const removerTag = (nome) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag.nome !== nome) }))
  }

  const onDocs = (e) => {
    const files = Array.from(e.target.files || [])
    Promise.all(files.map(file => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ nome: file.name, url: reader.result })
      reader.readAsDataURL(file)
    }))).then(docs => setForm(prev => ({ ...prev, documentos: [...(prev.documentos || []), ...docs] })))
  }

  const removerDocumento = (nome) => {
    setForm(prev => ({ ...prev, documentos: (prev.documentos || []).filter(doc => doc.nome !== nome) }))
  }

  const salvar = (e) => {
    e.preventDefault()
    upsertProjeto(form, id)
    navigate('/projetos')
  }

  if (modoEdicao && !projetoExistente) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <h1 className="page-title">Projeto não encontrado</h1>
        <button className="btn btn-outline" onClick={() => navigate('/projetos')}><ArrowLeft size={16} /> Voltar</button>
      </div>
    )
  }

  return (
    <form className="card" onSubmit={salvar} style={{ display: 'grid', gap: 12, maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{modoEdicao ? 'Editar projeto' : 'Novo projeto'}</h1>
          <p className="page-subtitle">{modoEdicao ? 'Altere as informações do projeto selecionado.' : 'Cadastre um novo projeto da organização.'}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/projetos')}><ArrowLeft size={16} /> Voltar</button>
      </div>

      <input placeholder="Nome" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
      <textarea rows={4} placeholder="Descrição" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <input type="date" value={form.inicio || ''} onChange={e => setForm({ ...form, inicio: e.target.value })} />
        <input type="date" value={form.fim || ''} onChange={e => setForm({ ...form, fim: e.target.value })} />
      </div>
      <input type="number" placeholder="Orçamento" value={form.orcamento || ''} onChange={e => setForm({ ...form, orcamento: e.target.value })} />
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
        {(form.tags || []).map(tag => (
          <span key={tag.nome} className="badge" style={{ background: tag.cor + '25', color: tag.cor, border: `1px solid ${tag.cor}`, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            {tag.nome}
            <button type="button" onClick={() => removerTag(tag.nome)} style={{ border: 0, background: 'transparent', color: tag.cor, cursor: 'pointer', display: 'inline-flex' }}><X size={12} /></button>
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <strong>Documentos</strong>
        <input type="file" multiple onChange={onDocs} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(form.documentos || []).map(doc => (
            <span key={doc.nome} className="badge badge-gray" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              {doc.nome}
              <button type="button" onClick={() => removerDocumento(doc.nome)} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'inline-flex' }}><X size={12} /></button>
            </span>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" type="submit">{modoEdicao ? 'Salvar alterações' : 'Salvar projeto'}</button>
    </form>
  )
}
