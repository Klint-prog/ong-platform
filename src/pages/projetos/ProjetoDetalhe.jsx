import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { carregarProjetos, fmt, statusConfig } from './projetosData'

export default function ProjetoDetalhe() {
  const { id } = useParams()
  const projetos = carregarProjetos()
  const projeto = useMemo(() => projetos.find(item => String(item.id) === id), [id, projetos])

  if (!projeto) return <div className="card">Projeto não encontrado</div>

  return (
    <div className="mod-projetos animate-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ display: 'grid', gap: 16 }}>
        <Link to="/projetos" className="btn btn-ghost" style={{ width: 'fit-content' }}><ArrowLeft size={14} /> Voltar para projetos</Link>
        <h1 className="page-title">{projeto.nome}</h1>
        <span className={`badge ${statusConfig[projeto.status]?.badge || 'badge-gray'}`} style={{ width: 'fit-content' }}>{statusConfig[projeto.status]?.label || projeto.status}</span>
        <p className="page-subtitle">{projeto.descricao}</p>
        <div>Orçamento: <strong>{fmt(projeto.orcamento)}</strong></div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Documentos do projeto</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {(projeto.documentos || []).length === 0 && <p style={{ color: 'var(--gray-500)' }}>Nenhum documento anexado.</p>}
          {(projeto.documentos || []).map(doc => (
            <a key={doc.nome} href={doc.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
              {doc.nome} <span className="badge badge-gray">Abrir</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
