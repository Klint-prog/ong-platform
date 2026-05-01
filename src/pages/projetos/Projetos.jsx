import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { carregarProjetos, excluirProjeto, fmt, statusConfig } from './projetosData'

export default function Projetos() {
  const [filtro, setFiltro] = useState('TODOS')
  const [projetos, setProjetos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setProjetos(carregarProjetos())
  }, [])

  const filtrados = useMemo(() => projetos.filter(p => filtro === 'TODOS' || p.status === filtro), [projetos, filtro])

  const removerProjeto = (event, projeto) => {
    event.stopPropagation()
    if (!window.confirm(`Deseja excluir o projeto "${projeto.nome}"?`)) return
    setProjetos(excluirProjeto(projeto.id))
  }

  const editarProjeto = (event, projeto) => {
    event.stopPropagation()
    navigate(`/projetos/${projeto.id}/editar`)
  }

  const abrirProjeto = (projeto) => {
    navigate(`/projetos/${projeto.id}/editar`)
  }

  return (
    <div className="mod-projetos animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projetos</h1>
          <p className="page-subtitle">Gerencie projetos, tarefas e indicadores de impacto</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projetos/novo')}>
          <Plus size={16} /> Novo projeto
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['TODOS', 'EM_ANDAMENTO', 'CONCLUIDO', 'RASCUNHO', 'CANCELADO'].map(f => {
          const cfg = statusConfig[f]
          return (
            <button key={f} onClick={() => setFiltro(f)} className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-outline'}`}>
              {f === 'TODOS' ? 'Todos' : cfg.label}
            </button>
          )
        })}
      </div>

      <div className="grid-3 animate-fade-up delay-3">
        {filtrados.map(p => (
          <div key={p.id} className="card" style={{ display: 'grid', gap: 12, cursor: 'pointer' }} onClick={() => abrirProjeto(p)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderKanban size={18} color={p.cor || '#3b82f6'} />
              <div style={{ fontWeight: 700, color: 'var(--gray-800)', flex: 1 }}>{p.nome}</div>
            </div>
            <span className={`badge ${statusConfig[p.status]?.badge || 'badge-gray'}`} style={{ width: 'fit-content' }}>{statusConfig[p.status]?.label || p.status}</span>
            <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{p.descricao || 'Sem descrição cadastrada.'}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(p.tags || []).map(t => (
                <span key={t.nome || t} className="badge" style={{ background: (t.cor || '#e5e7eb') + '25', color: t.cor || 'var(--gray-700)', border: `1px solid ${t.cor || '#e5e7eb'}` }}>{t.nome || t}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.inicio || '-'} → {p.fim || '-'} • {fmt(p.orcamento)}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button type="button" className="btn btn-sm btn-outline" onClick={(event) => editarProjeto(event, p)}><Pencil size={13} /> Editar</button>
              <button type="button" className="btn btn-sm btn-outline" onClick={(event) => abrirProjeto(p)}><Eye size={13} /> Abrir</button>
              <button type="button" className="btn btn-sm btn-outline" onClick={(event) => removerProjeto(event, p)}><Trash2 size={13} /> Excluir</button>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--gray-400)' }}>
            Nenhum projeto cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
