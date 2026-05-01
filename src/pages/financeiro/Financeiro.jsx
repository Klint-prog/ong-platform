import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight,
  Search, Landmark, Wallet, ReceiptText, FileCheck2, ClipboardCheck,
  AlertTriangle, Download, Printer, CheckCircle2, Clock, XCircle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts'

const fmt = (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const contas = [
  { id: 1, nome: 'Conta principal ONG', tipo: 'Conta corrente', banco: 'Banco do Brasil', saldoInicial: 8000, saldoAtual: 16420, responsavel: 'Tesouraria', status: 'ATIVA' },
  { id: 2, nome: 'Caixa físico', tipo: 'Dinheiro', banco: 'Interno', saldoInicial: 500, saldoAtual: 1180, responsavel: 'Financeiro', status: 'ATIVA' },
  { id: 3, nome: 'Projeto Horta Solidária', tipo: 'Conta por projeto', banco: 'Caixa', saldoInicial: 0, saldoAtual: 11500, responsavel: 'Coordenação de Projetos', status: 'ATIVA' },
  { id: 4, nome: 'Carteira PIX Doações', tipo: 'Carteira digital', banco: 'PIX', saldoInicial: 0, saldoAtual: 2450, responsavel: 'Diretoria', status: 'ATIVA' },
]

const transacoesSeed = [
  { id: 1, descricao: 'Doação — Maria Silva', tipo: 'RECEITA', valor: 500, categoria: 'Doações', data: '2026-04-12', vencimento: '2026-04-12', pagamento: '2026-04-12', status: 'RECEBIDA', projeto: 'Fundo Geral', conta: 'Carteira PIX Doações', origem: 'Pessoa física', forma: 'PIX', comprovante: 'VALIDO' },
  { id: 2, descricao: 'Aluguel da sede — Abril', tipo: 'DESPESA', valor: 1800, categoria: 'Aluguel', data: '2026-04-05', vencimento: '2026-04-05', pagamento: '2026-04-05', status: 'PAGA', projeto: 'Administrativo', conta: 'Conta principal ONG', fornecedor: 'Imobiliária Local', forma: 'Transferência', comprovante: 'VALIDO' },
  { id: 3, descricao: 'Edital — Projeto Horta Solidária', tipo: 'RECEITA', valor: 30000, categoria: 'Editais', data: '2026-04-01', vencimento: '2026-04-01', pagamento: '2026-04-01', status: 'RECEBIDA', projeto: 'Horta Solidária', conta: 'Projeto Horta Solidária', origem: 'Fundação privada', forma: 'Transferência', comprovante: 'VALIDO' },
  { id: 4, descricao: 'Compra de sementes e adubo', tipo: 'DESPESA', valor: 4200, categoria: 'Material agrícola', data: '2026-04-10', vencimento: '2026-04-15', pagamento: '2026-04-15', status: 'PAGA', projeto: 'Horta Solidária', conta: 'Projeto Horta Solidária', fornecedor: 'Agropecuária Sirigi', forma: 'PIX', comprovante: 'PENDENTE' },
  { id: 5, descricao: 'Patrocínio Empresa Parceira', tipo: 'RECEITA', valor: 12000, categoria: 'Patrocínios', data: '2026-04-20', vencimento: '2026-05-05', pagamento: null, status: 'PREVISTA', projeto: 'Escola Digital', conta: 'Conta principal ONG', origem: 'Empresa', forma: 'Transferência', comprovante: 'PENDENTE' },
  { id: 6, descricao: 'Transporte para oficina rural', tipo: 'DESPESA', valor: 850, categoria: 'Transporte', data: '2026-04-18', vencimento: '2026-04-25', pagamento: null, status: 'APROVADA', projeto: 'Horta Solidária', conta: 'Caixa físico', fornecedor: 'Motorista local', forma: 'Dinheiro', comprovante: 'PENDENTE' },
  { id: 7, descricao: 'Internet e telefone', tipo: 'DESPESA', valor: 260, categoria: 'Serviços', data: '2026-04-07', vencimento: '2026-04-12', pagamento: '2026-04-12', status: 'PAGA', projeto: 'Administrativo', conta: 'Conta principal ONG', fornecedor: 'Operadora', forma: 'Boleto', comprovante: 'VALIDO' },
  { id: 8, descricao: 'Doação anônima em dinheiro', tipo: 'RECEITA', valor: 680, categoria: 'Doações', data: '2026-04-24', vencimento: '2026-04-24', pagamento: '2026-04-24', status: 'RECEBIDA', projeto: 'Fundo Geral', conta: 'Caixa físico', origem: 'Pessoa física', forma: 'Dinheiro', comprovante: 'VALIDO' },
]

const orcamentos = [
  { projeto: 'Horta Solidária', categoria: 'Material agrícola', previsto: 12000, aprovado: 12000, realizado: 4200 },
  { projeto: 'Horta Solidária', categoria: 'Transporte', previsto: 3000, aprovado: 3000, realizado: 850 },
  { projeto: 'Horta Solidária', categoria: 'Alimentação', previsto: 5000, aprovado: 4800, realizado: 0 },
  { projeto: 'Escola Digital', categoria: 'Equipamentos', previsto: 15000, aprovado: 12000, realizado: 0 },
  { projeto: 'Administrativo', categoria: 'Aluguel', previsto: 21600, aprovado: 21600, realizado: 1800 },
  { projeto: 'Administrativo', categoria: 'Serviços', previsto: 5000, aprovado: 5000, realizado: 260 },
]

const comprovantes = [
  { id: 1, documento: 'comprovante-pix-maria.pdf', tipo: 'Comprovante PIX', lancamento: 'Doação — Maria Silva', projeto: 'Fundo Geral', valor: 500, status: 'VALIDO', validador: 'Tesouraria' },
  { id: 2, documento: 'recibo-aluguel-abril.pdf', tipo: 'Recibo', lancamento: 'Aluguel da sede — Abril', projeto: 'Administrativo', valor: 1800, status: 'VALIDO', validador: 'Conselho fiscal' },
  { id: 3, documento: 'nf-sementes-adubo.pdf', tipo: 'Nota fiscal', lancamento: 'Compra de sementes e adubo', projeto: 'Horta Solidária', valor: 4200, status: 'PENDENTE', validador: '-' },
  { id: 4, documento: 'recibo-transporte-oficina.pdf', tipo: 'Recibo simples', lancamento: 'Transporte para oficina rural', projeto: 'Horta Solidária', valor: 850, status: 'PENDENTE', validador: '-' },
]

const fluxo = [
  { mes: 'Jan', receitas: 6400, despesas: 3900, saldo: 2500 },
  { mes: 'Fev', receitas: 8200, despesas: 4300, saldo: 3900 },
  { mes: 'Mar', receitas: 5700, despesas: 5100, saldo: 600 },
  { mes: 'Abr', receitas: 31180, despesas: 6260, saldo: 24920 },
  { mes: 'Mai', receitas: 12000, despesas: 3500, saldo: 8500 },
  { mes: 'Jun', receitas: 9000, despesas: 4200, saldo: 4800 },
]

const origemReceitas = [
  { name: 'Editais', value: 30000, cor: '#3b82f6' },
  { name: 'Patrocínios', value: 12000, cor: '#a855f7' },
  { name: 'Doações', value: 1180, cor: '#22c55e' },
  { name: 'Outros', value: 600, cor: '#eab308' },
]

const tabs = [
  { id: 'visao', label: 'Visão geral' },
  { id: 'receitas', label: 'Receitas' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'contas', label: 'Contas' },
  { id: 'orcamentos', label: 'Orçamentos' },
  { id: 'comprovantes', label: 'Comprovantes' },
  { id: 'prestacao', label: 'Prestação' },
]

const statusConfig = {
  RECEBIDA: { label: 'Recebida', badge: 'badge-green', icon: CheckCircle2 },
  PREVISTA: { label: 'Prevista', badge: 'badge-yellow', icon: Clock },
  PAGA: { label: 'Paga', badge: 'badge-green', icon: CheckCircle2 },
  APROVADA: { label: 'Aprovada', badge: 'badge-blue', icon: ClipboardCheck },
  VENCIDA: { label: 'Vencida', badge: 'badge-red', icon: AlertTriangle },
  CANCELADA: { label: 'Cancelada', badge: 'badge-gray', icon: XCircle },
}

export default function Financeiro() {
  const [aba, setAba] = useState('visao')
  const [busca, setBusca] = useState('')
  const [projetoFiltro, setProjetoFiltro] = useState('TODOS')
  const navigate = useNavigate()

  const projetos = ['TODOS', ...new Set(transacoesSeed.map((t) => t.projeto))]

  const transacoesFiltradas = useMemo(() => transacoesSeed.filter((t) => {
    const termo = busca.toLowerCase()
    const texto = [t.descricao, t.categoria, t.projeto, t.conta, t.origem, t.fornecedor].join(' ').toLowerCase()
    const matchBusca = texto.includes(termo)
    const matchProjeto = projetoFiltro === 'TODOS' || t.projeto === projetoFiltro
    return matchBusca && matchProjeto
  }), [busca, projetoFiltro])

  const receitas = transacoesSeed.filter((t) => t.tipo === 'RECEITA' && t.status === 'RECEBIDA').reduce((s, t) => s + t.valor, 0)
  const receitasPrevistas = transacoesSeed.filter((t) => t.tipo === 'RECEITA' && t.status === 'PREVISTA').reduce((s, t) => s + t.valor, 0)
  const despesas = transacoesSeed.filter((t) => t.tipo === 'DESPESA' && t.status === 'PAGA').reduce((s, t) => s + t.valor, 0)
  const despesasAbertas = transacoesSeed.filter((t) => t.tipo === 'DESPESA' && t.status !== 'PAGA').reduce((s, t) => s + t.valor, 0)
  const saldo = contas.reduce((s, conta) => s + conta.saldoAtual, 0)
  const pendentes = comprovantes.filter((c) => c.status === 'PENDENTE').length

  return (
    <div className="mod-financeiro animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Receitas, despesas, contas, orçamento, comprovantes e prestação de contas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/financeiro/nova')}>
          <Plus size={16} /> Nova transação
        </button>
      </div>

      <div className="card no-print" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`btn btn-sm ${aba === tab.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAba(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {aba !== 'prestacao' && (
        <div className="card no-print" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input placeholder="Buscar por descrição, projeto, categoria, conta ou fornecedor…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ paddingLeft: 38 }} />
            </div>
            <select value={projetoFiltro} onChange={(e) => setProjetoFiltro(e.target.value)} style={{ maxWidth: 240 }}>
              {projetos.map((projeto) => <option key={projeto} value={projeto}>{projeto === 'TODOS' ? 'Todos os projetos' : projeto}</option>)}
            </select>
          </div>
        </div>
      )}

      {aba === 'visao' && (
        <>
          <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
            <StatCard mod="mod-dashboard" icon={DollarSign} label="Saldo total" value={fmt(saldo)} />
            <StatCard mod="mod-financeiro" icon={TrendingUp} label="Receitas recebidas" value={fmt(receitas)} trend={`${fmt(receitasPrevistas)} previstas`} trendType="up" />
            <StatCard mod="mod-pessoas" icon={TrendingDown} label="Despesas pagas" value={fmt(despesas)} trend={`${fmt(despesasAbertas)} em aberto`} trendType="down" />
            <StatCard mod="mod-projetos" icon={ReceiptText} label="Comprovantes pendentes" value={String(pendentes)} trend="Exigem validação" trendType="down" />
          </div>

          <div className="grid-2 animate-fade-up delay-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <CardTitle title="Fluxo financeiro" subtitle="Receitas, despesas e saldo por mês" />
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={fluxo}>
                  <defs>
                    <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.22}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: 10, border: '1px solid var(--gray-100)', fontSize: 13 }} />
                  <Area type="monotone" dataKey="saldo" stroke="#22c55e" strokeWidth={2.5} fill="url(#saldoFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <CardTitle title="Receitas por origem" subtitle="Distribuição dos recursos captados" />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <ResponsiveContainer width={160} height={170}>
                  <PieChart>
                    <Pie data={origemReceitas} cx="50%" cy="50%" innerRadius={46} outerRadius={72} dataKey="value" strokeWidth={0}>
                      {origemReceitas.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {origemReceitas.map((p) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: p.cor, flexShrink: 0 }}/>
                      <span style={{ fontSize: 13, color: 'var(--gray-600)', flex: 1 }}>{p.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{fmt(p.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <TransactionsTable transacoes={transacoesFiltradas.slice(0, 6)} title="Últimas movimentações" />
        </>
      )}

      {aba === 'receitas' && <TransactionsTable transacoes={transacoesFiltradas.filter((t) => t.tipo === 'RECEITA')} title="Receitas" />}
      {aba === 'despesas' && <TransactionsTable transacoes={transacoesFiltradas.filter((t) => t.tipo === 'DESPESA')} title="Despesas" />}
      {aba === 'contas' && <AccountsTable contas={contas} />}
      {aba === 'orcamentos' && <BudgetsTable orcamentos={orcamentos} />}
      {aba === 'comprovantes' && <AttachmentsTable comprovantes={comprovantes} />}
      {aba === 'prestacao' && <AccountabilityReport transacoes={transacoesSeed} orcamentos={orcamentos} comprovantes={comprovantes} />}
    </div>
  )
}

function StatCard({ mod, icon: Icon, label, value, trend, trendType = 'up' }) {
  return (
    <div className={`stat-card ${mod}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
      </div>
      {trend && <div className={`stat-trend ${trendType}`}><TrendingUp size={13} /> {trend}</div>}
    </div>
  )
}

function CardTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{subtitle}</div>
    </div>
  )
}

function TransactionsTable({ transacoes, title }) {
  return (
    <div className="card animate-fade-up delay-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-outline"><Download size={14} /> Exportar</button>
          <button className="btn btn-sm btn-outline" onClick={() => window.print()}><Printer size={14} /> PDF</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Projeto</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Comprovante</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t) => {
              const cfg = statusConfig[t.status] || statusConfig.PREVISTA
              const Icon = cfg.icon
              return (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: t.tipo === 'RECEITA' ? 'var(--green-50)' : 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.tipo === 'RECEITA'
                          ? <ArrowUpRight size={15} color="var(--green-600)" />
                          : <ArrowDownRight size={15} color="var(--red-600)" />}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>{t.descricao}</span>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(`${t.data}T12:00:00`).toLocaleDateString('pt-BR')} • {t.forma}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.projeto}</td>
                  <td><span className="badge badge-gray">{t.categoria}</span></td>
                  <td>{t.conta}</td>
                  <td>{new Date(`${t.vencimento}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                  <td><span className={`badge ${cfg.badge}`}><Icon size={11} /> {cfg.label}</span></td>
                  <td><span className={`badge ${t.comprovante === 'VALIDO' ? 'badge-green' : 'badge-yellow'}`}>{t.comprovante === 'VALIDO' ? 'Validado' : 'Pendente'}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.tipo === 'RECEITA' ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountsTable({ contas }) {
  return (
    <div className="card">
      <CardTitle title="Contas financeiras" subtitle="Caixa, contas bancárias, PIX e contas por projeto" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Conta</th><th>Tipo</th><th>Banco</th><th>Saldo inicial</th><th>Saldo atual</th><th>Responsável</th><th>Status</th></tr></thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id}>
                <td><strong>{conta.nome}</strong></td>
                <td><span className="badge badge-blue"><Landmark size={11} /> {conta.tipo}</span></td>
                <td>{conta.banco}</td>
                <td>{fmt(conta.saldoInicial)}</td>
                <td><strong>{fmt(conta.saldoAtual)}</strong></td>
                <td>{conta.responsavel}</td>
                <td><span className="badge badge-green">Ativa</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BudgetsTable({ orcamentos }) {
  const chartData = orcamentos.map((item) => ({ categoria: item.categoria, aprovado: item.aprovado, realizado: item.realizado }))

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="card">
        <CardTitle title="Orçado x realizado" subtitle="Execução orçamentária por categoria" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
            <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
            <Legend />
            <Bar dataKey="aprovado" name="Aprovado" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="realizado" name="Realizado" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Projeto</th><th>Categoria</th><th>Previsto</th><th>Aprovado</th><th>Realizado</th><th>Saldo</th><th>Execução</th></tr></thead>
            <tbody>
              {orcamentos.map((item) => {
                const saldo = item.aprovado - item.realizado
                const pct = item.aprovado ? Math.round((item.realizado / item.aprovado) * 100) : 0
                return (
                  <tr key={`${item.projeto}-${item.categoria}`}>
                    <td>{item.projeto}</td>
                    <td><strong>{item.categoria}</strong></td>
                    <td>{fmt(item.previsto)}</td>
                    <td>{fmt(item.aprovado)}</td>
                    <td>{fmt(item.realizado)}</td>
                    <td style={{ color: saldo >= 0 ? 'var(--green-600)' : 'var(--red-600)', fontWeight: 700 }}>{fmt(saldo)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress" style={{ width: 90 }}><div className="progress-bar" style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? 'var(--red-500)' : 'var(--green-500)' }} /></div>
                        <strong>{pct}%</strong>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AttachmentsTable({ comprovantes }) {
  return (
    <div className="card">
      <CardTitle title="Comprovantes financeiros" subtitle="Notas fiscais, recibos, PIX, contratos e evidências" />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Documento</th><th>Tipo</th><th>Lançamento</th><th>Projeto</th><th>Valor</th><th>Status</th><th>Validador</th><th>Ações</th></tr></thead>
          <tbody>
            {comprovantes.map((doc) => (
              <tr key={doc.id}>
                <td><strong>{doc.documento}</strong></td>
                <td>{doc.tipo}</td>
                <td>{doc.lancamento}</td>
                <td>{doc.projeto}</td>
                <td>{fmt(doc.valor)}</td>
                <td><span className={`badge ${doc.status === 'VALIDO' ? 'badge-green' : 'badge-yellow'}`}>{doc.status === 'VALIDO' ? 'Validado' : 'Pendente'}</span></td>
                <td>{doc.validador}</td>
                <td><button className="btn btn-sm btn-outline">Ver e validar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountabilityReport({ transacoes, orcamentos, comprovantes }) {
  const receitas = transacoes.filter((t) => t.tipo === 'RECEITA' && t.status === 'RECEBIDA').reduce((s, t) => s + t.valor, 0)
  const despesas = transacoes.filter((t) => t.tipo === 'DESPESA' && t.status === 'PAGA').reduce((s, t) => s + t.valor, 0)
  const pendencias = comprovantes.filter((c) => c.status === 'PENDENTE').length

  return (
    <div className="mod-financeiro">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Prestação de contas</h1>
          <p className="page-subtitle">Relatório financeiro consolidado por projeto, período e fonte de recurso</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Gerar PDF</button>
      </div>

      <section className="card" style={{ marginBottom: 24, borderLeft: '5px solid var(--green-500)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' }}>
          <div>
            <div className="badge badge-green" style={{ marginBottom: 12 }}>Relatório financeiro</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gray-900)' }}>Prestação de Contas — ONG Platform</h2>
            <p style={{ color: 'var(--gray-500)', maxWidth: 760, marginTop: 8 }}>Documento consolidado com receitas, despesas, orçamento executado, comprovantes e pendências para diretoria, conselho fiscal, parceiros e financiadores.</p>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--gray-400)', fontSize: 13 }}>
            <strong style={{ color: 'var(--gray-700)' }}>Período:</strong> Abril/2026<br />
            <strong style={{ color: 'var(--gray-700)' }}>Gerado em:</strong> {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </section>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard mod="mod-financeiro" icon={TrendingUp} label="Receitas recebidas" value={fmt(receitas)} />
        <StatCard mod="mod-pessoas" icon={TrendingDown} label="Despesas pagas" value={fmt(despesas)} />
        <StatCard mod="mod-dashboard" icon={Wallet} label="Saldo do período" value={fmt(receitas - despesas)} />
        <StatCard mod="mod-projetos" icon={AlertTriangle} label="Pendências" value={String(pendencias)} />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <CardTitle title="Resumo por categoria orçamentária" subtitle="Valores previstos, aprovados, realizados e saldo" />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Projeto</th><th>Categoria</th><th>Aprovado</th><th>Realizado</th><th>Saldo</th></tr></thead>
            <tbody>
              {orcamentos.map((item) => (
                <tr key={`${item.projeto}-${item.categoria}-report`}>
                  <td>{item.projeto}</td>
                  <td>{item.categoria}</td>
                  <td>{fmt(item.aprovado)}</td>
                  <td>{fmt(item.realizado)}</td>
                  <td>{fmt(item.aprovado - item.realizado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <CardTitle title="Pendências de comprovação" subtitle="Itens que precisam de validação antes do fechamento" />
        <div style={{ display: 'grid', gap: 10 }}>
          {comprovantes.filter((c) => c.status === 'PENDENTE').map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: 12, border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
              <div><strong>{c.lancamento}</strong><div style={{ color: 'var(--gray-400)', fontSize: 12 }}>{c.projeto} • {c.tipo}</div></div>
              <div style={{ fontWeight: 700 }}>{fmt(c.valor)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {['Presidência', 'Tesouraria', 'Conselho Fiscal'].map((assinatura) => (
          <div key={assinatura} style={{ borderTop: '1px solid var(--gray-300)', textAlign: 'center', paddingTop: 8, color: 'var(--gray-500)', fontSize: 13 }}>{assinatura}</div>
        ))}
      </div>
    </div>
  )
}
