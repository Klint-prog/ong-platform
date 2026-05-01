import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FolderKanban, Plus, Pencil, Trash2 } from 'lucide-react'
import { carregarProjetos, fmt, salvarProjetos, statusConfig } from './projetosData'

export default function Projetos() {
  const [filtro, setFiltro] = useState('TODOS')
  const [projetos, setProjetos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setProjetos(carregarProjetos())
  }, [])

  const excluirProjeto = (id) => {
    const restantes = projetos.filter(projeto => projeto.id !== id)
    setProjetos(restantes)
    salvarProjetos(restantes)
  }

  const filtrados = useMemo(() => projetos.filter(p => filtro === 'TODOS' || p.status === filtro), [projetos, filtro])

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
          <div key={p.id} className="card" style={{ display: 'grid', gap: 12 }}>
            <Link to={`/projetos/${p.id}`} style={{ display: 'grid', gap: 12, textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FolderKanban size={18} color={p.cor || '#3b82f6'} />
                <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{p.nome}</div>
              </div>
              <span className={`badge ${statusConfig[p.status]?.badge || 'badge-gray'}`} style={{ width: 'fit-content' }}>{statusConfig[p.status]?.label || p.status}</span>
              <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{p.descricao}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(p.tags || []).map(t => (
                  <span key={t.nome || t} className="badge" style={{ background: (t.cor || '#e5e7eb') + '25', color: t.cor || 'var(--gray-700)', border: `1px solid ${t.cor || '#e5e7eb'}` }}>{t.nome || t}</span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{p.inicio} → {p.fim} • {fmt(p.orcamento)}</div>
            </Link>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/projetos/${p.id}/editar`)}><Pencil size={14} /> Editar</button>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--red-600)', borderColor: 'var(--red-200)' }} onClick={() => excluirProjeto(p.id)}><Trash2 size={14} /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
