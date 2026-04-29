import { Users, DollarSign, FolderKanban, Heart, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const fluxoMensal = [
  { mes: 'Jan', receitas: 8400,  despesas: 5200 },
  { mes: 'Fev', receitas: 9200,  despesas: 4800 },
  { mes: 'Mar', receitas: 7800,  despesas: 6100 },
  { mes: 'Abr', receitas: 12400, despesas: 5900 },
  { mes: 'Mai', receitas: 11200, despesas: 7200 },
  { mes: 'Jun', receitas: 13800, despesas: 6400 },
]

const projetosStatus = [
  { status: 'Em andamento', total: 8,  cor: '#3b82f6' },
  { status: 'Concluídos',   total: 14, cor: '#22c55e' },
  { status: 'Rascunho',     total: 3,  cor: '#9d9a8e' },
  { status: 'Suspensos',    total: 2,  cor: '#ef4444' },
]

const atividades = [
  { tipo: 'done',   texto: 'Projeto "Horta Solidária" concluído',  tempo: '5 min atrás',  cor: '#22c55e' },
  { tipo: 'alert',  texto: 'Doação de R$ 500 recebida de Maria S.', tempo: '32 min atrás', cor: '#eab308' },
  { tipo: 'info',   texto: 'Nova voluntária: Ana Beatriz cadastrada',tempo: '1h atrás',    cor: '#a855f7' },
  { tipo: 'done',   texto: 'Meta do mês atingida: 45 beneficiários', tempo: '2h atrás',   cor: '#22c55e' },
  { tipo: 'alert',  texto: 'Pagamento de aluguel vence em 3 dias',  tempo: '3h atrás',    cor: '#ef4444' },
]

const tarefasUrgentes = [
  { titulo: 'Enviar relatório ao Ministério', projeto: 'Educação +', prazo: 'Hoje', prioridade: 'urgente' },
  { titulo: 'Reunião com patrocinadores',     projeto: 'Saúde Rural', prazo: 'Amanhã', prioridade: 'alta' },
  { titulo: 'Atualizar cadastro de voluntários', projeto: 'Geral', prazo: 'Sexta', prioridade: 'media' },
]

const STATS = [
  { label: 'Pessoas ativas',      value: '247',   trend: '+12%',   up: true,  mod: 'mod-pessoas',    icon: Heart },
  { label: 'Receita do mês',      value: 'R$ 13,8k', trend: '+18%', up: true, mod: 'mod-financeiro', icon: DollarSign },
  { label: 'Projetos ativos',     value: '8',     trend: '2 novos', up: true,  mod: 'mod-projetos',   icon: FolderKanban },
  { label: 'Horas voluntariadas', value: '1.240', trend: '+340h',  up: true,  mod: 'mod-comunicacao', icon: Users },
]

const tipoIcon = { done: CheckCircle2, alert: AlertCircle, info: Clock }

export default function Dashboard() {
  return (
    <div className="mod-dashboard animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bem-vindo de volta — aqui está um resumo de hoje</p>
        </div>
        <span className="badge badge-blue">Junho 2025</span>
      </div>

      {/* Stat cards */}
      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        {STATS.map(({ label, value, trend, up, mod, icon: Icon }, i) => (
          <div key={label} className={`stat-card ${mod} delay-${i + 1}`}>
            <div className="stat-icon">
              <Icon size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
            <div className={`stat-trend ${up ? 'up' : 'down'}`}>
              {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {trend} este mês
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid-2 animate-fade-up delay-2" style={{ marginBottom: 24 }}>
        {/* Fluxo financeiro */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>
                Fluxo financeiro
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Receitas vs despesas — 2025</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-500)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }}/>
                Receitas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-500)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fb7185', display: 'inline-block' }}/>
                Despesas
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={fluxoMensal}>
              <defs>
                <linearGradient id="gReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [`R$ ${v.toLocaleString('pt-BR')}`, n === 'receitas' ? 'Receitas' : 'Despesas']} contentStyle={{ borderRadius: 10, border: '1px solid var(--gray-100)', fontSize: 13 }} />
              <Area type="monotone" dataKey="receitas" stroke="#22c55e" strokeWidth={2} fill="url(#gReceita)" />
              <Area type="monotone" dataKey="despesas" stroke="#fb7185" strokeWidth={2} fill="url(#gDespesa)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Projetos por status */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 4 }}>
            Projetos por status
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>27 projetos no total</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={projetosStatus} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 13, fill: 'var(--gray-600)' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--gray-100)', fontSize: 13 }} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}
                fill="#3b82f6"
                label={{ position: 'right', fontSize: 12, fill: 'var(--gray-500)' }}
              />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {projetosStatus.map(p => (
              <span key={p.status} className="badge" style={{ background: p.cor + '18', color: p.cor }}>
                {p.total} {p.status}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Atividade + Tarefas */}
      <div className="grid-2 animate-fade-up delay-3">
        {/* Atividade recente */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>
              Atividade recente
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              Ver tudo <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {atividades.map((a, i) => {
              const Icon = tipoIcon[a.tipo]
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.cor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Icon size={15} color={a.cor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: 'var(--gray-700)', fontWeight: 500 }}>{a.texto}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 2 }}>{a.tempo}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tarefas urgentes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>
              Tarefas pendentes
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              Ver projetos <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tarefasUrgentes.map((t, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 12, alignItems: 'center', border: '1px solid var(--gray-100)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gray-800)' }}>{t.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 3 }}>Projeto: {t.projeto}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span className={`badge badge-${t.prioridade === 'urgente' ? 'red' : t.prioridade === 'alta' ? 'yellow' : 'gray'}`}>
                    {t.prioridade}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.prazo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
