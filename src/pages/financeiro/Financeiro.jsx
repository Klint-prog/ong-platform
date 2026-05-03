import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight,
  Search, Landmark, Wallet, ReceiptText, ClipboardCheck, AlertTriangle,
  Download, Printer, CheckCircle2, Clock, XCircle, Eye, Trash2, X,
  ShieldCheck, ShieldAlert, RefreshCw, FileSpreadsheet,
} from 'lucide-react'
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { deleteTransacaoStorage, listTransacoesStorage } from './transacoesStorage'
import { deleteComprovanteStorage, listComprovantesStorage, saveComprovantesStorage, updateComprovanteStorage } from './comprovantesStorage'
import {
  calcularTotaisGlobais, deleteContaStorage, deleteOrcamentoStorage,
  listContasStorage, listOrcamentosStorage, transacaoValidada,
} from './financeiroStorage'
import { loadInstitucional } from '../institucional/institucionalStorage'
import { AV_VADAI_LOGO_DATA_URL } from './financeiroLogo'

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

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
  PREVISTA:  { label: 'Prevista',  badge: 'badge-yellow', icon: Clock },
  PAGA:      { label: 'Paga',      badge: 'badge-green',  icon: CheckCircle2 },
  APROVADA:  { label: 'Aprovada',  badge: 'badge-blue',   icon: ClipboardCheck },
  VENCIDA:   { label: 'Vencida',   badge: 'badge-red',    icon: AlertTriangle },
  CANCELADA: { label: 'Cancelada', badge: 'badge-gray',   icon: XCircle },
}

function gerarReferencia(prefixo = 'FIN') {
  const d = new Date()
  return `${prefixo}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
}

function baixarArquivoTexto(nome, conteudo) {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nome
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

function gerarFluxoMensal(transacoes) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const mapa = new Map()
  transacoes.forEach((t) => {
    const data = t.data ? new Date(`${t.data}T12:00:00`) : null
    if (!data || Number.isNaN(data.getTime())) return
    // Só conta transações com status operacional válido
    const statusOk = t.tipo === 'RECEITA'
      ? ['RECEBIDA','APROVADA','PREVISTA'].includes(t.status)
      : ['PAGA','APROVADA','PREVISTA','VENCIDA'].includes(t.status)
    if (!statusOk) return
    const chave = `${data.getFullYear()}-${data.getMonth()}`
    const atual = mapa.get(chave) || { mes: meses[data.getMonth()], receitas: 0, despesas: 0 }
    if (t.tipo === 'RECEITA') atual.receitas += Number(t.valor || 0)
    if (t.tipo === 'DESPESA') atual.despesas += Number(t.valor || 0)
    mapa.set(chave, atual)
  })
  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

function tituloDocumentoFinanceiro(tipo, item) {
  if (tipo === 'orcamento') return 'Orçamento financeiro'
  if (tipo === 'comprovante') return item.status === 'VALIDO' ? 'Comprovante validado' : 'Comprovante para validação'
  if (item.tipo === 'RECEITA') return 'Comprovante de recebimento'
  if (item.tipo === 'DESPESA') return 'Comprovante de despesa / pagamento'
  return 'Documento financeiro'
}

function montarLinhasDocumento(tipo, item) {
  if (tipo === 'orcamento') {
    return [
      ['Projeto', item.projeto || '-'],
      ['Categoria', item.categoria || '-'],
      ['Valor previsto', fmt(item.previsto)],
      ['Valor aprovado', fmt(item.aprovado)],
      ['Valor realizado', fmt(item.realizado)],
      ['Saldo disponível', fmt(Number(item.aprovado || 0) - Number(item.realizado || 0))],
      ['Status', item.status || '-'],
    ]
  }
  if (tipo === 'comprovante') {
    return [
      ['Documento', item.documento || '-'],
      ['Tipo', item.tipo || '-'],
      ['Lançamento', item.lancamento || '-'],
      ['Projeto', item.projeto || '-'],
      ['Valor', fmt(item.valor)],
      ['Status', item.status === 'VALIDO' ? 'Validado' : 'Pendente'],
      ['Validador', item.validador || '-'],
      ['Código de verificação', item.codigoVerificacao || '-'],
    ]
  }
  return [
    ['Descrição', item.descricao || '-'],
    ['Tipo', item.tipo === 'RECEITA' ? 'Receita / Doação' : 'Despesa'],
    ['Categoria', item.categoria || '-'],
    ['Projeto', item.projeto || '-'],
    ['Conta / Forma', item.conta || item.forma || '-'],
    ['Data do lançamento', item.data ? new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR') : '-'],
    ['Vencimento', item.vencimento ? new Date(`${item.vencimento}T12:00:00`).toLocaleDateString('pt-BR') : '-'],
    ['Status', statusConfig[item.status]?.label || item.status || '-'],
    ['Comprovante', item.comprovante === 'VALIDO' ? 'Validado' : 'Pendente de validação'],
    ['Valor', fmt(item.valor)],
  ]
}

export default function Financeiro() {
  const [aba, setAba] = useState('visao')
  const [busca, setBusca] = useState('')
  const [projetoFiltro, setProjetoFiltro] = useState('TODOS')
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [preview, setPreview] = useState(null)
  const [previewMaximizado, setPreviewMaximizado] = useState(false)
  const dadosOng = useMemo(() => loadInstitucional(), [])
  const navigate = useNavigate()

  // Estado derivado do storage — sempre lido fresco
  const [transacoesState, setTransacoesState] = useState(() => listTransacoesStorage())
  const [contasState, setContasState] = useState(() => listContasStorage())
  const [orcamentosState, setOrcamentosState] = useState(() => listOrcamentosStorage())
  const [comprovantesState, setComprovantesState] = useState(() => listComprovantesStorage())

  // Totais globais calculados com a mesma lógica das contas (consistência garantida)
  const totais = useMemo(() => calcularTotaisGlobais(), [transacoesState, orcamentosState])

  /** Recarrega todos os dados do storage em memória */
  const recarregarDados = useCallback(() => {
    setTransacoesState(listTransacoesStorage())
    setContasState(listContasStorage())
    setOrcamentosState(listOrcamentosStorage())
    setComprovantesState(listComprovantesStorage())
  }, [])

  const transacoes = transacoesState
  const fluxo = useMemo(() => gerarFluxoMensal(transacoes), [transacoes])
  const projetos = ['TODOS', ...new Set(transacoes.map((t) => t.projeto).filter(Boolean))]
  const tipos = ['TODOS', ...new Set(transacoes.map((t) => t.tipo).filter(Boolean))]

  const transacoesFiltradas = useMemo(() => transacoes.filter((t) => {
    const termo = busca.toLowerCase()
    const texto = [t.descricao, t.categoria, t.projeto, t.conta, t.origem, t.fornecedor].join(' ').toLowerCase()
    return (
      texto.includes(termo) &&
      (projetoFiltro === 'TODOS' || t.projeto === projetoFiltro) &&
      (tipoFiltro === 'TODOS' || t.tipo === tipoFiltro)
    )
  }), [busca, projetoFiltro, tipoFiltro, transacoes])

  const abrirDocumento = (tipo, item) => {
    const prefixo = tipo === 'orcamento' ? 'ORC' : tipo === 'comprovante' ? 'COMP' : item.tipo === 'RECEITA' ? 'REC' : 'DESP'
    setPreview({ tipo, item, referencia: gerarReferencia(prefixo) })
    setPreviewMaximizado(false)
  }

  const imprimirDocumento = (tipo, item) => {
    abrirDocumento(tipo, item)
    setTimeout(() => window.print(), 150)
  }

  const excluirTransacao = (transacao) => {
    if (!window.confirm(`Deseja excluir "${transacao.descricao}"? O comprovante vinculado também será removido.`)) return
    deleteTransacaoStorage(transacao.id)
    recarregarDados()
  }

  const excluirConta = (conta) => {
    if (!window.confirm(`Deseja excluir a conta "${conta.nome}"?`)) return
    deleteContaStorage(conta.id)
    recarregarDados()
  }

  const excluirOrcamento = (orc) => {
    if (!window.confirm(`Deseja excluir o orçamento "${orc.categoria || orc.projeto}"?`)) return
    deleteOrcamentoStorage(orc.id)
    recarregarDados()
  }

  const handleValidarComprovante = (doc) => {
    const atualizado = { ...doc, status: 'VALIDO', validador: 'Admin', validadoEm: new Date().toISOString() }
    updateComprovanteStorage(atualizado)
    // Recarrega tudo para refletir a validação nas contas também
    recarregarDados()
    abrirDocumento('comprovante', atualizado)
  }

  const handleExcluirComprovante = (doc) => {
    if (!window.confirm(`Deseja excluir o comprovante "${doc.documento}"?`)) return
    deleteComprovanteStorage(doc.id)
    recarregarDados()
  }

  const handleBaixarJson = (prefixo, item) =>
    baixarArquivoTexto(`${prefixo}-${item.id || Date.now()}.json`, JSON.stringify(item, null, 2))

  return (
    <div className="mod-financeiro animate-fade-in">
      {/* Cabeçalho */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">
            Receitas, despesas, contas, orçamento, comprovantes e prestação de contas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={recarregarDados} title="Atualizar dados">
            <RefreshCw size={15} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/financeiro/nova')}>
            <Plus size={16} /> Nova transação
          </button>
        </div>
      </div>

      {/* Abas */}
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

      {/* Filtros (todas as abas exceto Prestação) */}
      {aba !== 'prestacao' && (
        <div className="card no-print" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                placeholder="Buscar por descrição, projeto, categoria, conta…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
            <select value={projetoFiltro} onChange={(e) => setProjetoFiltro(e.target.value)} style={{ maxWidth: 240 }}>
              {projetos.map((p) => <option key={p} value={p}>{p === 'TODOS' ? 'Todos os projetos' : p}</option>)}
            </select>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={{ maxWidth: 200 }}>
              {tipos.map((t) => <option key={t} value={t}>{t === 'TODOS' ? 'Todos os tipos' : t}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* === VISÃO GERAL === */}
      {aba === 'visao' && (
        <>
          {/* Cards de totais — mesma lógica das contas */}
          <div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}>
            <StatCard mod="mod-dashboard" icon={DollarSign}
              label="Saldo atual"
              value={fmt(totais.saldoAtual)}
              trend={`${fmt(totais.receitasEfetivadas + totais.receitasPrevistas)} em receitas`}
              trendType="up"
            />
            <StatCard mod="mod-financeiro" icon={TrendingUp}
              label="Receitas efetivadas"
              value={fmt(totais.receitasEfetivadas)}
              trend={`+ ${fmt(totais.receitasPrevistas)} previstas`}
              trendType="up"
            />
            <StatCard mod="mod-pessoas" icon={TrendingDown}
              label="Despesas efetivadas"
              value={fmt(totais.despesasEfetivadas)}
              trend={`+ ${fmt(totais.despesasEmAberto)} em aberto`}
              trendType="down"
            />
            <StatCard mod="mod-projetos" icon={ShieldAlert}
              label="Pendentes de validação"
              value={String(totais.pendentesValidacao)}
              trend="Lançamentos sem comprovante validado"
              trendType="down"
            />
          </div>

          {/* Orçamentos — resumo executivo */}
          {orcamentosState.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <CardTitle
                title="Orçamentos aprovados"
                subtitle="Execução orçamentária do período"
                icon={FileSpreadsheet}
              />
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                <SummaryPill label="Aprovado" value={fmt(totais.orcamentoAprovado)} color="var(--blue-600)" />
                <SummaryPill label="Realizado" value={fmt(totais.orcamentoRealizado)} color="var(--red-500)" />
                <SummaryPill label="Disponível" value={fmt(totais.orcamentoDisponivel)} color="var(--green-600)" />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Projeto</th>
                      <th>Categoria</th>
                      <th style={{ textAlign: 'right' }}>Aprovado</th>
                      <th style={{ textAlign: 'right' }}>Realizado</th>
                      <th style={{ textAlign: 'right' }}>Disponível</th>
                      <th>Execução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orcamentosState.map((o) => {
                      const exec = o.aprovado ? Math.min(100, Math.round((o.realizado / o.aprovado) * 100)) : 0
                      return (
                        <tr key={o.id}>
                          <td>{o.projeto}</td>
                          <td><strong>{o.categoria}</strong></td>
                          <td style={{ textAlign: 'right' }}>{fmt(o.aprovado)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--red-600)' }}>{fmt(o.realizado)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--green-600)' }}>{fmt(Number(o.aprovado || 0) - Number(o.realizado || 0))}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--gray-100)' }}>
                                <div style={{ width: `${exec}%`, height: '100%', borderRadius: 4, background: exec >= 90 ? 'var(--red-500)' : exec >= 60 ? 'var(--yellow-500)' : 'var(--green-500)' }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{exec}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Gráfico de fluxo mensal */}
          <div className="card" style={{ marginBottom: 24 }}>
            <CardTitle
              title="Fluxo financeiro mensal"
              subtitle="Receitas e despesas efetivadas por mês"
            />
            {fluxo.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={fluxo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [fmt(v)]} />
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState texto="Nenhuma transação com status operacional para gerar o gráfico." />
            )}
          </div>

          {/* Resumo de contas com saldo */}
          {contasState.filter((c) => c.quantidadeLancamentos > 0).length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <CardTitle
                title="Posição das contas"
                subtitle="Saldo calculado a partir dos lançamentos"
                icon={Landmark}
              />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Conta</th>
                      <th style={{ textAlign: 'right' }}>Saldo atual</th>
                      <th style={{ textAlign: 'right' }}>Saldo validado</th>
                      <th>Lançamentos</th>
                      <th>Conformidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contasState
                      .filter((c) => c.quantidadeLancamentos > 0)
                      .map((c) => {
                        const total = c.quantidadeLancamentosEfetivados || 0
                        const naoVal = c.quantidadeLancamentosNaoValidados || 0
                        const validados = total - naoVal
                        return (
                          <tr key={c.id}>
                            <td>
                              <strong>{c.nome}</strong>
                              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{c.tipo}</div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(c.saldoAtual)}</td>
                            <td style={{ textAlign: 'right', color: 'var(--green-600)' }}>{fmt(c.saldoValidado)}</td>
                            <td>
                              <span className="badge badge-gray">{c.quantidadeLancamentos} total</span>
                            </td>
                            <td>
                              {naoVal === 0 ? (
                                <span className="badge badge-green"><ShieldCheck size={11} /> Conforme</span>
                              ) : (
                                <span className="badge badge-yellow"><ShieldAlert size={11} /> {naoVal} pendente{naoVal > 1 ? 's' : ''}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Últimas movimentações */}
          <TransactionsTable
            transacoes={transacoesFiltradas.slice(0, 6)}
            title="Últimas movimentações"
            onView={(item) => abrirDocumento('transacao', item)}
            onPdf={(item) => imprimirDocumento('transacao', item)}
            onDownload={(item) => handleBaixarJson('transacao', item)}
            onDelete={excluirTransacao}
          />
        </>
      )}

      {/* === RECEITAS === */}
      {aba === 'receitas' && (
        <TransactionsTable
          transacoes={transacoesFiltradas.filter((t) => t.tipo === 'RECEITA')}
          title="Receitas / Doações"
          onView={(item) => abrirDocumento('transacao', item)}
          onPdf={(item) => imprimirDocumento('transacao', item)}
          onDownload={(item) => handleBaixarJson('receita', item)}
          onDelete={excluirTransacao}
        />
      )}

      {/* === DESPESAS === */}
      {aba === 'despesas' && (
        <TransactionsTable
          transacoes={transacoesFiltradas.filter((t) => t.tipo === 'DESPESA')}
          title="Despesas"
          onView={(item) => abrirDocumento('transacao', item)}
          onPdf={(item) => imprimirDocumento('transacao', item)}
          onDownload={(item) => handleBaixarJson('despesa', item)}
          onDelete={excluirTransacao}
        />
      )}

      {/* === CONTAS === */}
      {aba === 'contas' && (
        <AccountsTable
          contas={contasState}
          onView={(item) => abrirDocumento('conta', item)}
          onDownload={(item) => handleBaixarJson('conta', item)}
          onDelete={excluirConta}
        />
      )}

      {/* === ORÇAMENTOS === */}
      {aba === 'orcamentos' && (
        <BudgetsTable
          orcamentos={orcamentosState}
          onView={(item) => abrirDocumento('orcamento', item)}
          onPdf={(item) => imprimirDocumento('orcamento', item)}
          onDownload={(item) => handleBaixarJson('orcamento', item)}
          onDelete={excluirOrcamento}
        />
      )}

      {/* === COMPROVANTES === */}
      {aba === 'comprovantes' && (
        <AttachmentsTable
          comprovantes={comprovantesState}
          onView={(item) => abrirDocumento('comprovante', item)}
          onValidate={handleValidarComprovante}
          onPdf={(item) => imprimirDocumento('comprovante', item)}
          onDownload={(item) => handleBaixarJson('comprovante', item)}
          onDelete={handleExcluirComprovante}
        />
      )}

      {/* === PRESTAÇÃO DE CONTAS === */}
      {aba === 'prestacao' && (
        <AccountabilityReport
          transacoes={transacoes}
          comprovantes={comprovantesState}
          orcamentos={orcamentosState}
          contas={contasState}
          totais={totais}
          dadosOng={dadosOng}
        />
      )}

      {/* Modal de preview */}
      {preview && (
        <FinanceiroPreviewModal
          preview={preview}
          dadosOng={dadosOng}
          maximizado={previewMaximizado}
          onToggleMaximizado={() => setPreviewMaximizado((v) => !v)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}

// ─── Componentes auxiliares ─────────────────────────────────────────────────

function EmptyState({ texto }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>{texto}</div>
}

function StatCard({ mod, icon: Icon, label, value, trend, trendType = 'up' }) {
  return (
    <div className={`stat-card ${mod}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ fontSize: 22 }}>{value}</div>
      </div>
      {trend && (
        <div className={`stat-trend ${trendType}`}>
          <TrendingUp size={13} /> {trend}
        </div>
      )}
    </div>
  )
}

function CardTitle({ title, subtitle, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      {Icon && <Icon size={16} color="var(--gray-500)" />}
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 2 }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function SummaryPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 18, color }}>{value}</span>
    </div>
  )
}

function ActionButtons({ item, onView, onPdf, onDownload, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button className="btn btn-sm btn-outline" onClick={() => onView(item)}><Eye size={13} /> Ver</button>
      {onPdf && <button className="btn btn-sm btn-primary" onClick={() => onPdf(item)}><Printer size={13} /> PDF</button>}
      <button className="btn btn-sm btn-outline" onClick={() => onDownload(item)}><Download size={13} /> JSON</button>
      <button className="btn btn-sm btn-outline" onClick={() => onDelete(item)}><Trash2 size={13} /> Excluir</button>
    </div>
  )
}

function TransactionsTable({ transacoes, title, onView, onPdf, onDownload, onDelete }) {
  return (
    <div className="card animate-fade-up delay-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{title}</div>
        <span className="badge badge-blue">PDF institucional disponível por registro</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Projeto</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Data</th>
              <th>Status</th>
              <th>Comprovante</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t) => {
              const cfg = statusConfig[t.status] || statusConfig.PREVISTA
              const Icon = cfg.icon
              const validado = transacaoValidada(t)
              return (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: t.tipo === 'RECEITA' ? 'var(--green-50)' : 'var(--red-50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {t.tipo === 'RECEITA'
                          ? <ArrowUpRight size={15} color="var(--green-600)" />
                          : <ArrowDownRight size={15} color="var(--red-600)" />
                        }
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>{t.descricao}</span>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {t.data ? new Date(`${t.data}T12:00:00`).toLocaleDateString('pt-BR') : '-'}
                          {' · '}{(t.anexos || []).length} anexo(s)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{t.projeto}</td>
                  <td><span className="badge badge-gray">{t.categoria}</span></td>
                  <td>{t.conta}</td>
                  <td>{t.data ? new Date(`${t.data}T12:00:00`).toLocaleDateString('pt-BR') : '-'}</td>
                  <td><span className={`badge ${cfg.badge}`}><Icon size={11} /> {cfg.label}</span></td>
                  <td>
                    <span className={`badge ${validado ? 'badge-green' : 'badge-yellow'}`}>
                      {validado ? <><ShieldCheck size={11} /> Validado</> : <><ShieldAlert size={11} /> Pendente</>}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: t.tipo === 'RECEITA' ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}
                  </td>
                  <td>
                    <ActionButtons item={t} onView={onView} onPdf={onPdf} onDownload={onDownload} onDelete={onDelete} />
                  </td>
                </tr>
              )
            })}
            {transacoes.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountsTable({ contas, onView, onDownload, onDelete }) {
  return (
    <div className="card">
      <CardTitle
        title="Contas financeiras"
        subtitle="Saldo calculado automaticamente a partir dos lançamentos — sem necessidade de validação para aparecer"
        icon={Landmark}
      />
      {contas.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Conta</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Saldo inicial</th>
                <th style={{ textAlign: 'right' }}>Entradas</th>
                <th style={{ textAlign: 'right' }}>Saídas</th>
                <th style={{ textAlign: 'right' }}>Saldo atual</th>
                <th style={{ textAlign: 'right' }}>Saldo validado</th>
                <th>Conformidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => {
                const naoVal = c.quantidadeLancamentosNaoValidados || 0
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.nome}</strong>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{c.responsavel}</div>
                    </td>
                    <td><span className="badge badge-blue"><Landmark size={11} /> {c.tipo}</span></td>
                    <td style={{ textAlign: 'right' }}>{fmt(c.saldoInicial)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--green-600)' }}>+{fmt(c.totalReceitas)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--red-600)' }}>-{fmt(c.totalDespesas)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(c.saldoAtual)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--green-700)', fontWeight: 600 }}>{fmt(c.saldoValidado)}</td>
                    <td>
                      {naoVal === 0
                        ? <span className="badge badge-green"><ShieldCheck size={11} /> Conforme</span>
                        : <span className="badge badge-yellow"><ShieldAlert size={11} /> {naoVal} pendente{naoVal > 1 ? 's' : ''}</span>
                      }
                    </td>
                    <td>
                      <ActionButtons item={c} onView={onView} onDownload={onDownload} onDelete={onDelete} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState texto="Nenhuma conta cadastrada. As contas são criadas automaticamente quando você lança transações." />
      )}
    </div>
  )
}

function BudgetsTable({ orcamentos, onView, onPdf, onDownload, onDelete }) {
  return (
    <div className="card">
      <CardTitle title="Orçamentos" subtitle="Previsão e execução orçamentária por projeto/categoria" icon={FileSpreadsheet} />
      {orcamentos.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Previsto</th>
                <th style={{ textAlign: 'right' }}>Aprovado</th>
                <th style={{ textAlign: 'right' }}>Realizado</th>
                <th style={{ textAlign: 'right' }}>Disponível</th>
                <th>Execução</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o) => {
                const exec = o.aprovado ? Math.min(100, Math.round((o.realizado / o.aprovado) * 100)) : 0
                const cor = exec >= 90 ? 'var(--red-500)' : exec >= 60 ? 'var(--yellow-500)' : 'var(--green-500)'
                return (
                  <tr key={o.id}>
                    <td>{o.projeto}</td>
                    <td><strong>{o.categoria}</strong></td>
                    <td style={{ textAlign: 'right' }}>{fmt(o.previsto)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(o.aprovado)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--red-600)' }}>{fmt(o.realizado)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--green-600)', fontWeight: 700 }}>
                      {fmt(Number(o.aprovado || 0) - Number(o.realizado || 0))}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--gray-100)' }}>
                          <div style={{ width: `${exec}%`, height: '100%', borderRadius: 4, background: cor }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: cor }}>{exec}%</span>
                      </div>
                    </td>
                    <td>
                      <ActionButtons item={o} onView={onView} onPdf={onPdf} onDownload={onDownload} onDelete={onDelete} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState texto="Nenhum orçamento cadastrado." />
      )}
    </div>
  )
}

function AttachmentsTable({ comprovantes, onView, onValidate, onPdf, onDownload, onDelete }) {
  return (
    <div className="card">
      <CardTitle title="Comprovantes financeiros" subtitle="Notas fiscais, recibos, PIX, contratos e evidências — base para prestação de contas" />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Tipo</th>
              <th>Lançamento</th>
              <th>Projeto</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Status</th>
              <th>Validador</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {comprovantes.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <strong>{doc.documento}</strong>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{(doc.anexos || []).length} anexo(s)</div>
                </td>
                <td>{doc.tipo}</td>
                <td>{doc.lancamento}</td>
                <td>{doc.projeto}</td>
                <td style={{ textAlign: 'right' }}>{fmt(doc.valor)}</td>
                <td>
                  <span className={`badge ${doc.status === 'VALIDO' ? 'badge-green' : 'badge-yellow'}`}>
                    {doc.status === 'VALIDO' ? <><ShieldCheck size={11} /> Validado</> : <><ShieldAlert size={11} /> Pendente</>}
                  </span>
                </td>
                <td>{doc.validador}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => onView(doc)}><Eye size={13} /> Ver</button>
                    {doc.status !== 'VALIDO' && (
                      <button className="btn btn-sm btn-outline" onClick={() => onValidate(doc)}>
                        <ShieldCheck size={13} /> Validar
                      </button>
                    )}
                    <button className="btn btn-sm btn-primary" onClick={() => onPdf(doc)}><Printer size={13} /> PDF</button>
                    <button className="btn btn-sm btn-outline" onClick={() => onDownload(doc)}><Download size={13} /> JSON</button>
                    <button className="btn btn-sm btn-outline" onClick={() => onDelete(doc)}><Trash2 size={13} /> Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {comprovantes.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum comprovante cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AccountabilityReport({ transacoes, comprovantes, orcamentos, contas, totais, dadosOng }) {
  const receitasPorCategoria = useMemo(() => {
    const mapa = {}
    transacoes
      .filter((t) => t.tipo === 'RECEITA' && ['RECEBIDA','APROVADA'].includes(t.status))
      .forEach((t) => {
        mapa[t.categoria] = (mapa[t.categoria] || 0) + Number(t.valor || 0)
      })
    return Object.entries(mapa).sort(([, a], [, b]) => b - a)
  }, [transacoes])

  const despesasPorCategoria = useMemo(() => {
    const mapa = {}
    transacoes
      .filter((t) => t.tipo === 'DESPESA' && ['PAGA','APROVADA'].includes(t.status))
      .forEach((t) => {
        mapa[t.categoria] = (mapa[t.categoria] || 0) + Number(t.valor || 0)
      })
    return Object.entries(mapa).sort(([, a], [, b]) => b - a)
  }, [transacoes])

  const naoValidados = comprovantes.filter((c) => c.status !== 'VALIDO').length
  const conformidade = comprovantes.length
    ? Math.round(((comprovantes.length - naoValidados) / comprovantes.length) * 100)
    : 100

  return (
    <div className="mod-financeiro">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Prestação de contas</h1>
          <p className="page-subtitle">Relatório financeiro consolidado — base para auditoria e conformidade</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Gerar PDF
        </button>
      </div>

      <div className="financeiro-documento-print">
        {/* Cabeçalho institucional */}
        <header className="financeiro-doc-header">
          <div className="financeiro-doc-brand">
            <img src={AV_VADAI_LOGO_DATA_URL} alt="Logo da ONG" />
            <div>
              <h1>{dadosOng.nome || 'AV Associação Vadai'}</h1>
              <p>Prestação de contas consolidada</p>
            </div>
          </div>
          <div className="financeiro-doc-meta">
            <span className="badge badge-blue">Relatório</span>
            <strong>{gerarReferencia('PRES')}</strong>
            <small>{new Date().toLocaleString('pt-BR')}</small>
          </div>
        </header>

        {/* Resumo executivo */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <StatCard mod="mod-financeiro" icon={TrendingUp} label="Receitas efetivadas" value={fmt(totais.receitasEfetivadas)} />
          <StatCard mod="mod-pessoas" icon={TrendingDown} label="Despesas efetivadas" value={fmt(totais.despesasEfetivadas)} />
          <StatCard mod="mod-dashboard" icon={Wallet} label="Saldo do período" value={fmt(totais.saldoAtual)} />
          <StatCard mod="mod-projetos" icon={ShieldCheck}
            label="Conformidade"
            value={`${conformidade}%`}
            trend={`${naoValidados} comprovante(s) pendente(s)`}
            trendType={naoValidados === 0 ? 'up' : 'down'}
          />
        </div>

        {/* Receitas por categoria */}
        {receitasPorCategoria.length > 0 && (
          <section className="financeiro-doc-table" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Receitas por categoria</div>
            {receitasPorCategoria.map(([cat, val]) => (
              <div key={cat}><span>{cat}</span><strong style={{ color: 'var(--green-600)' }}>{fmt(val)}</strong></div>
            ))}
          </section>
        )}

        {/* Despesas por categoria */}
        {despesasPorCategoria.length > 0 && (
          <section className="financeiro-doc-table" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Despesas por categoria</div>
            {despesasPorCategoria.map(([cat, val]) => (
              <div key={cat}><span>{cat}</span><strong style={{ color: 'var(--red-600)' }}>{fmt(val)}</strong></div>
            ))}
          </section>
        )}

        {/* Orçamentos */}
        {orcamentos.length > 0 && (
          <section className="financeiro-doc-table" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Execução orçamentária</div>
            {orcamentos.map((o) => (
              <div key={o.id}>
                <span>{o.projeto} — {o.categoria}</span>
                <strong>{fmt(o.realizado)} / {fmt(o.aprovado)}</strong>
              </div>
            ))}
          </section>
        )}

        {/* Contas */}
        {contas.filter((c) => c.quantidadeLancamentos > 0).length > 0 && (
          <section className="financeiro-doc-table" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Posição das contas</div>
            {contas
              .filter((c) => c.quantidadeLancamentos > 0)
              .map((c) => (
                <div key={c.id}>
                  <span>{c.nome} ({c.tipo})</span>
                  <strong>{fmt(c.saldoAtual)}</strong>
                </div>
              ))}
          </section>
        )}

        {/* Declaração */}
        <section className="financeiro-doc-declaracao">
          <p>
            Declaramos que o presente relatório foi gerado automaticamente com base nos lançamentos
            registrados no sistema de gestão financeira da organização, refletindo com fidelidade
            os dados cadastrados e os documentos comprobatórios vinculados ao processo administrativo.
          </p>
          <p>
            Total de comprovantes: <strong>{comprovantes.length}</strong> —
            Validados: <strong>{comprovantes.length - naoValidados}</strong> —
            Pendentes: <strong>{naoValidados}</strong> —
            Índice de conformidade: <strong>{conformidade}%</strong>
          </p>
        </section>

        <footer className="financeiro-doc-footer">
          <div>
            <strong>Assinatura institucional</strong>
            <span>{dadosOng.presidente || 'Presidência'} / Administração Financeira</span>
          </div>
          <div>
            <strong>CNPJ</strong>
            <span>{dadosOng.cnpj || 'Não informado'}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ─── Modal de preview ───────────────────────────────────────────────────────

function FinanceiroPreviewModal({ preview, dadosOng, maximizado, onToggleMaximizado, onClose }) {
  const { tipo, item, referencia } = preview
  return (
    <div className="financeiro-preview-overlay">
      <div className={`financeiro-preview-shell ${maximizado ? 'is-maximized' : ''}`}>
        <div className="financeiro-preview-toolbar no-print">
          <div>
            <h2>Pré-visualização financeira</h2>
            <p>Documento institucional pronto para salvar como PDF.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-outline" onClick={onToggleMaximizado}>
              {maximizado ? 'Restaurar' : 'Maximizar'}
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => window.print()}>
              <Printer size={14} /> Salvar PDF
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <FinanceiroDocumento dadosOng={dadosOng} tipo={tipo} item={item} referencia={referencia} />
      </div>
    </div>
  )
}

function FinanceiroDocumento({ dadosOng, tipo, item, referencia }) {
  const titulo = tituloDocumentoFinanceiro(tipo, item)
  const linhas = montarLinhasDocumento(tipo, item)
  const valorPrincipal = item.valor ?? item.aprovado ?? item.previsto ?? 0
  const validado = transacaoValidada(item) || item.status === 'VALIDO' || item.status === 'RECEBIDA' || item.status === 'PAGA'

  return (
    <article className="financeiro-documento-print">
      <header className="financeiro-doc-header">
        <div className="financeiro-doc-brand">
          <img src={AV_VADAI_LOGO_DATA_URL} alt="Logo da ONG" />
          <div>
            <h1>{dadosOng.nome || 'AV Associação Vadai'}</h1>
            <p>{dadosOng.atuacao || 'Caridade que motiva'}</p>
          </div>
        </div>
        <div className="financeiro-doc-meta">
          <span className={`badge ${validado ? 'badge-green' : 'badge-yellow'}`}>
            {validado ? 'Validado' : 'Pendente'}
          </span>
          <strong>{referencia}</strong>
          <small>Emitido em {new Date().toLocaleString('pt-BR')}</small>
        </div>
      </header>

      <section className="financeiro-doc-title">
        <div>
          <span>Documento financeiro</span>
          <h2>{titulo}</h2>
        </div>
        <div className={item.tipo === 'DESPESA' ? 'financeiro-doc-total despesa' : 'financeiro-doc-total receita'}>
          <small>Valor</small>
          <strong>{fmt(valorPrincipal)}</strong>
        </div>
      </section>

      <section className="financeiro-doc-org">
        <div><strong>CNPJ</strong><span>{dadosOng.cnpj || 'Não informado'}</span></div>
        <div><strong>Endereço</strong><span>{dadosOng.endereco || 'Não informado'}</span></div>
        <div>
          <strong>Responsável</strong>
          <span>{dadosOng.diretorFinanceiro && dadosOng.diretorFinanceiro !== 'A definir'
            ? dadosOng.diretorFinanceiro
            : dadosOng.presidente || 'Administração'}
          </span>
        </div>
      </section>

      <section className="financeiro-doc-table">
        {linhas.map(([label, value]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </section>

      <section className="financeiro-doc-declaracao">
        <p>
          Declaramos que o lançamento acima foi registrado no módulo financeiro da organização,
          com base nas informações cadastradas e nos documentos de comprovação vinculados ao processo administrativo.
        </p>
        {item.tipo === 'RECEITA' && (
          <p>Este documento pode ser entregue ao associado, doador ou parceiro como comprovante institucional de recebimento.</p>
        )}
      </section>

      <footer className="financeiro-doc-footer">
        <div>
          <strong>Assinatura institucional</strong>
          <span>{dadosOng.presidente || 'Presidência'} / Administração Financeira</span>
        </div>
        <div>
          <strong>Validação</strong>
          <span>{validado ? 'Documento validado eletronicamente no sistema' : 'Documento aguardando validação interna'}</span>
        </div>
      </footer>
    </article>
  )
}
