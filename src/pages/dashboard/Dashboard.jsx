import { Users, DollarSign, FolderKanban, Heart, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { loadPessoas } from '../pessoas/pessoasStorage'
import { carregarProjetos, statusConfig } from '../projetos/projetosData'
import { listTransacoesStorage } from '../financeiro/transacoesStorage'
import { listComprovantesStorage } from '../financeiro/comprovantesStorage'
import { getOportunidades } from '../captacao/captacaoStorage'
import { listarBeneficiarios } from '../beneficiarios/beneficiariosStorage'
import { listarDocumentos } from '../documentos/documentosStorage'

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const tipoIcon = { done: CheckCircle2, alert: AlertCircle, info: Clock }
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function gerarFluxoMensal(transacoes) {
  const mapa = new Map()
  transacoes.forEach((t) => {
    const data = t.data ? new Date(`${t.data}T12:00:00`) : null
    if (!data || Number.isNaN(data.getTime())) return
    const chave = `${data.getFullYear()}-${data.getMonth()}`
    const atual = mapa.get(chave) || { mes: meses[data.getMonth()], receitas: 0, despesas: 0 }
    if (t.tipo === 'RECEITA') atual.receitas += Number(t.valor || 0)
    if (t.tipo === 'DESPESA') atual.despesas += Number(t.valor || 0)
    mapa.set(chave, atual)
  })
  return Array.from(mapa.values())
}

function gerarProjetosStatus(projetos) {
  const contagem = projetos.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {})
  return Object.entries(contagem).map(([status, total]) => ({ status: statusConfig[status]?.label || status, total, cor: status === 'EM_ANDAMENTO' ? '#3b82f6' : status === 'CONCLUIDO' ? '#22c55e' : status === 'CANCELADO' ? '#ef4444' : '#9d9a8e' }))
}

function gerarAtividades({ transacoes, pessoas, projetos, beneficiarios, oportunidades, documentos, comprovantes }) {
  const items = []
  transacoes.slice(0, 2).forEach((t) => items.push({ tipo: t.tipo === 'RECEITA' ? 'done' : 'alert', texto: `${t.tipo === 'RECEITA' ? 'Receita' : 'Despesa'} cadastrada: ${t.descricao} — ${fmt(t.valor)}`, tempo: 'registro local', cor: t.tipo === 'RECEITA' ? '#22c55e' : '#ef4444' }))
  pessoas.slice(0, 1).forEach((p) => items.push({ tipo: 'info', texto: `Pessoa cadastrada: ${p.nome}`, tempo: 'registro local', cor: '#a855f7' }))
  projetos.slice(0, 1).forEach((p) => items.push({ tipo: 'done', texto: `Projeto cadastrado: ${p.nome}`, tempo: 'registro local', cor: '#3b82f6' }))
  beneficiarios.slice(0, 1).forEach((b) => items.push({ tipo: 'info', texto: `Beneficiário cadastrado: ${b.nome}`, tempo: 'registro local', cor: '#22c55e' }))
  oportunidades.slice(0, 1).forEach((o) => items.push({ tipo: 'alert', texto: `Oportunidade em captação: ${o.nome}`, tempo: 'registro local', cor: '#eab308' }))
  documentos.slice(0, 1).forEach((d) => items.push({ tipo: 'info', texto: `Documento cadastrado: ${d.nome}`, tempo: 'registro local', cor: '#64748b' }))
  comprovantes.filter((c) => c.status === 'PENDENTE').slice(0, 1).forEach((c) => items.push({ tipo: 'alert', texto: `Comprovante pendente: ${c.documento}`, tempo: 'validação pendente', cor: '#ef4444' }))
  return items.slice(0, 6)
}

export default function Dashboard() {
  const pessoas = loadPessoas()
  const projetos = carregarProjetos()
  const transacoes = listTransacoesStorage()
  const comprovantes = listComprovantesStorage()
  const oportunidades = getOportunidades()
  const beneficiarios = listarBeneficiarios()
  const documentos = listarDocumentos()

  const fluxoMensal = gerarFluxoMensal(transacoes)
  const projetosStatus = gerarProjetosStatus(projetos)
  const receitasMes = transacoes.filter((t) => t.tipo === 'RECEITA' && t.status === 'RECEBIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0)
  const despesasMes = transacoes.filter((t) => t.tipo === 'DESPESA' && ['PAGA', 'APROVADA'].includes(t.status)).reduce((acc, t) => acc + Number(t.valor || 0), 0)
  const saldo = receitasMes - despesasMes
  const pessoasAtivas = pessoas.filter((p) => p.status !== 'INATIVO').length
  const projetosAtivos = projetos.filter((p) => p.status === 'EM_ANDAMENTO').length
  const comprovantesPendentes = comprovantes.filter((c) => c.status === 'PENDENTE').length
  const atividades = gerarAtividades({ transacoes, pessoas, projetos, beneficiarios, oportunidades, documentos, comprovantes })

  const stats = [
    { label: 'Pessoas ativas', value: String(pessoasAtivas), trend: `${beneficiarios.length} beneficiários`, up: true, mod: 'mod-pessoas', icon: Heart },
    { label: 'Saldo financeiro', value: fmt(saldo), trend: `${fmt(receitasMes)} receitas`, up: saldo >= 0, mod: 'mod-financeiro', icon: DollarSign },
    { label: 'Projetos ativos', value: String(projetosAtivos), trend: `${projetos.length} cadastrados`, up: true, mod: 'mod-projetos', icon: FolderKanban },
    { label: 'Comprovantes pendentes', value: String(comprovantesPendentes), trend: `${documentos.length} documentos`, up: comprovantesPendentes === 0, mod: 'mod-comunicacao', icon: Users },
  ]

  return (
    <div className="mod-dashboard animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Resumo calculado somente com dados cadastrados na plataforma</p></div>
        <span className="badge badge-blue">Dados reais</span>
      </div>

      <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
        {stats.map(({ label, value, trend, up, mod, icon: Icon }, i) => <div key={label} className={`stat-card ${mod} delay-${i + 1}`}><div className="stat-icon"><Icon size={20} strokeWidth={2} /></div><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div><div className={`stat-trend ${up ? 'up' : 'down'}`}>{up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{trend}</div></div>)}
      </div>

      <div className="grid-2 animate-fade-up delay-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ marginBottom: 20 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>Fluxo financeiro real</div><div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>Receitas vs despesas cadastradas</div></div>
          {fluxoMensal.length ? <ResponsiveContainer width="100%" height={200}><AreaChart data={fluxoMensal}><CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} /><XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v, n) => [fmt(v), n === 'receitas' ? 'Receitas' : 'Despesas']} contentStyle={{ borderRadius: 10, border: '1px solid var(--gray-100)', fontSize: 13 }} /><Area type="monotone" dataKey="receitas" stroke="#22c55e" strokeWidth={2} fill="#22c55e22" /><Area type="monotone" dataKey="despesas" stroke="#fb7185" strokeWidth={2} fill="#fb718522" /></AreaChart></ResponsiveContainer> : <EmptyState texto="Cadastre receitas e despesas para visualizar o fluxo financeiro." />}
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 4 }}>Projetos por status</div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>{projetos.length} projetos cadastrados</div>
          {projetosStatus.length ? <><ResponsiveContainer width="100%" height={160}><BarChart data={projetosStatus} layout="vertical" barSize={14}><XAxis type="number" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="status" tick={{ fontSize: 13, fill: 'var(--gray-600)' }} axisLine={false} tickLine={false} width={110} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--gray-100)', fontSize: 13 }} /><Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#3b82f6" /></BarChart></ResponsiveContainer><div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>{projetosStatus.map(p => <span key={p.status} className="badge" style={{ background: p.cor + '18', color: p.cor }}>{p.total} {p.status}</span>)}</div></> : <EmptyState texto="Cadastre projetos para visualizar o status." />}
        </div>
      </div>

      <div className="grid-2 animate-fade-up delay-3">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)' }}>Atividade recente</div><button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>Ver tudo <ArrowRight size={13} /></button></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{atividades.length ? atividades.map((a, i) => { const Icon = tipoIcon[a.tipo]; return <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><div style={{ width: 32, height: 32, borderRadius: '50%', background: a.cor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Icon size={15} color={a.cor} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, color: 'var(--gray-700)', fontWeight: 500 }}>{a.texto}</div><div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 2 }}>{a.tempo}</div></div></div> }) : <EmptyState texto="Nenhuma atividade real cadastrada ainda." />}</div>
        </div>
        <div className="card"><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 20 }}>Resumo operacional</div><div style={{ display: 'grid', gap: 12 }}><ResumoLinha label="Oportunidades de captação" valor={oportunidades.length} /><ResumoLinha label="Beneficiários" valor={beneficiarios.length} /><ResumoLinha label="Documentos" valor={documentos.length} /><ResumoLinha label="Comprovantes pendentes" valor={comprovantesPendentes} /></div></div>
      </div>
    </div>
  )
}

function EmptyState({ texto }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>{texto}</div>
}

function ResumoLinha({ label, valor }) {
  return <div style={{ padding: '14px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--gray-100)' }}><span style={{ fontSize: 13.5, color: 'var(--gray-700)', fontWeight: 500 }}>{label}</span><strong>{valor}</strong></div>
}
