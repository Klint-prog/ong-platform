import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Plus, Target, Users, Clock, CheckCircle2, AlertCircle, PauseCircle, FileText } from 'lucide-react'

const PROJETOS = [
  {
    id: 1, nome: 'Horta Solidária', status: 'EM_ANDAMENTO',
    descricao: 'Implantação de hortas comunitárias em 5 bairros da periferia.',
    orcamento: 12000, gasto: 7400, inicio: 'Jan/2025', fim: 'Ago/2025',
    pessoas: 12, tarefas: { total: 18, concluidas: 11 },
    cor: '#22c55e', tags: ['Alimentação', 'Comunidade'],
  },
  {
    id: 2, nome: 'Escola Digital', status: 'EM_ANDAMENTO',
    descricao: 'Inclusão digital para jovens de 14-18 anos em situação de vulnerabilidade.',
    orcamento: 25000, gasto: 9800, inicio: 'Mar/2025', fim: 'Dez/2025',
    pessoas: 8, tarefas: { total: 24, concluidas: 7 },
    cor: '#3b82f6', tags: ['Educação', 'Tecnologia'],
  },
  {
    id: 3, nome: 'Saúde Rural', status: 'CONCLUIDO',
    descricao: 'Atendimento médico e odontológico gratuito em áreas rurais do agreste.',
    orcamento: 18000, gasto: 17200, inicio: 'Jan/2025', fim: 'Mai/2025',
    pessoas: 20, tarefas: { total: 15, concluidas: 15 },
    cor: '#ec4899', tags: ['Saúde', 'Rural'],
  },
  {
    id: 4, nome: 'Mulheres Empreendedoras', status: 'RASCUNHO',
    descricao: 'Capacitação em empreendedorismo e geração de renda para mulheres.',
    orcamento: 9000, gasto: 0, inicio: 'Set/2025', fim: 'Dez/2025',
    pessoas: 0, tarefas: { total: 6, concluidas: 0 },
    cor: '#a855f7', tags: ['Empreendedorismo', 'Gênero'],
  },
  {
    id: 5, nome: 'Arte & Cidadania', status: 'SUSPENSO',
    descricao: 'Oficinas de arte e cultura para crianças e adolescentes.',
    orcamento: 7500, gasto: 3200, inicio: 'Abr/2025', fim: 'Out/2025',
    pessoas: 6, tarefas: { total: 12, concluidas: 4 },
    cor: '#eab308', tags: ['Cultura', 'Juventude'],
  },
]

const statusConfig = {
  EM_ANDAMENTO: { label: 'Em andamento', badge: 'badge-blue',   icon: Clock,         bg: '#eff6ff' },
  CONCLUIDO:    { label: 'Concluído',    badge: 'badge-green',  icon: CheckCircle2,  bg: '#f0fdf4' },
  RASCUNHO:     { label: 'Rascunho',    badge: 'badge-gray',   icon: FileText,      bg: '#f8f7f5' },
  SUSPENSO:     { label: 'Suspenso',    badge: 'badge-yellow', icon: PauseCircle,   bg: '#fefce8' },
  CANCELADO:    { label: 'Cancelado',   badge: 'badge-red',    icon: AlertCircle,   bg: '#fff1f2' },
}

const fmt = v => `R$ ${v.toLocaleString('pt-BR')}`

export default function Projetos() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('TODOS')

  const filtrados = PROJETOS.filter(p => filtro === 'TODOS' || p.status === filtro)

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

      {/* Stats */}
      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        {[
          { label: 'Em andamento', value: '8',  mod: 'mod-dashboard',   icon: Clock },
          { label: 'Concluídos',   value: '14', mod: 'mod-financeiro',  icon: CheckCircle2 },
          { label: 'Rascunhos',    value: '3',  mod: 'mod-projetos',    icon: FileText },
          { label: 'Suspensos',    value: '2',  mod: 'mod-pessoas',     icon: PauseCircle },
        ].map(({ label, value, mod, icon: Icon }, i) => (
          <div key={label} className={`stat-card ${mod} delay-${i + 1}`}>
            <div className="stat-icon"><Icon size={20} strokeWidth={2} /></div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }} className="animate-fade-up delay-2">
        {['TODOS', 'EM_ANDAMENTO', 'CONCLUIDO', 'RASCUNHO', 'SUSPENSO'].map(f => {
          const cfg = statusConfig[f]
          return (
            <button key={f} onClick={() => setFiltro(f)}
              className={`btn btn-sm ${filtro === f ? 'btn-primary' : 'btn-outline'}`}
              style={filtro === f ? { '--mod-color': 'var(--yellow-500)' } : {}}>
              {f === 'TODOS' ? 'Todos' : cfg.label}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      <div className="grid-3 animate-fade-up delay-3">
        {filtrados.map(p => {
          const cfg = statusConfig[p.status]
          const StatusIcon = cfg.icon
          const pct = p.orcamento ? Math.min(100, Math.round((p.gasto / p.orcamento) * 100)) : 0
          const pctTarefas = p.tarefas.total ? Math.round((p.tarefas.concluidas / p.tarefas.total) * 100) : 0

          return (
            <div key={p.id} className="card" style={{ cursor: 'pointer', transition: 'transform var(--transition), box-shadow var(--transition)', display: 'flex', flexDirection: 'column', gap: 16 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>

              {/* Header */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: p.cor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FolderKanban size={20} color={p.cor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</div>
                  <span className={`badge ${cfg.badge}`} style={{ marginTop: 4 }}>
                    <StatusIcon size={10} /> {cfg.label}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.55, flexGrow: 1 }}>{p.descricao}</p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {p.tags.map(t => (
                  <span key={t} className="badge badge-gray" style={{ fontSize: 11 }}>{t}</span>
                ))}
              </div>

              {/* Tarefas */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-400)', marginBottom: 6 }}>
                  <span>Tarefas</span>
                  <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>{p.tarefas.concluidas}/{p.tarefas.total} ({pctTarefas}%)</span>
                </div>
                <div className="progress" style={{ '--mod-color': p.cor }}>
                  <div className="progress-bar" style={{ width: `${pctTarefas}%`, background: p.cor }} />
                </div>
              </div>

              {/* Orçamento */}
              {p.orcamento > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-400)', marginBottom: 6 }}>
                    <span>Orçamento</span>
                    <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>{fmt(p.gasto)} / {fmt(p.orcamento)}</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${pct}%`, background: pct > 85 ? 'var(--red-500)' : p.cor }} />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', gap: 16, paddingTop: 4, borderTop: '1px solid var(--gray-100)', fontSize: 12, color: 'var(--gray-400)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={12} /> {p.pessoas} pessoas
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} /> {p.inicio} → {p.fim}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
