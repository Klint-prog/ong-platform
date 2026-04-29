import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FolderKanban, Users, Clock, FileText } from 'lucide-react'
import { PROJETOS, statusConfig, fmt } from './Projetos'

const RECURSOS = {
  1: ['Plano de cultivo trimestral', 'Lista de famílias beneficiadas', 'Checklist de irrigação'],
  2: ['Cronograma das oficinas', 'Cadastro dos alunos', 'Plano de aula de informática'],
  3: ['Relatório de impacto final', 'Registro de atendimentos', 'Termo de encerramento'],
  4: ['Canvas do projeto', 'Orçamento inicial', 'Roadmap de execução'],
  5: ['Agenda das oficinas', 'Lista de materiais', 'Relatório de frequência'],
}

export default function ProjetoDetalhe() {
  const { id } = useParams()
  const projeto = useMemo(() => PROJETOS.find(item => String(item.id) === id), [id])

  if (!projeto) {
    return (
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Projeto não encontrado</h2>
        <Link to="/projetos" className="btn btn-outline" style={{ marginTop: 16, width: 'fit-content' }}>Voltar</Link>
      </div>
    )
  }

  const cfg = statusConfig[projeto.status]
  const recursos = RECURSOS[projeto.id] ?? []

  return (
    <div className="mod-projetos animate-fade-in" style={{ display: 'grid', gap: 16 }}>
      <div className="card" style={{ display: 'grid', gap: 16 }}>
        <Link to="/projetos" className="btn btn-ghost" style={{ width: 'fit-content' }}>
          <ArrowLeft size={14} /> Voltar para projetos
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 8 }}>{projeto.nome}</h1>
            <p className="page-subtitle">{projeto.descricao}</p>
          </div>
          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
        </div>

        <div className="grid-4">
          <div className="stat-card mod-projetos"><FolderKanban size={18} /><div><div className="stat-label">Orçamento</div><div className="stat-value">{fmt(projeto.orcamento)}</div></div></div>
          <div className="stat-card mod-financeiro"><FileText size={18} /><div><div className="stat-label">Executado</div><div className="stat-value">{fmt(projeto.gasto)}</div></div></div>
          <div className="stat-card mod-dashboard"><Users size={18} /><div><div className="stat-label">Pessoas</div><div className="stat-value">{projeto.pessoas}</div></div></div>
          <div className="stat-card mod-pessoas"><Clock size={18} /><div><div className="stat-label">Período</div><div className="stat-value" style={{ fontSize: 14 }}>{projeto.inicio} - {projeto.fim}</div></div></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Recursos do projeto</h3>
        <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>Acesse e atualize os recursos operacionais deste projeto.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {recursos.map(recurso => (
            <button key={recurso} className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
              {recurso}
              <span className="badge badge-gray">Abrir</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
