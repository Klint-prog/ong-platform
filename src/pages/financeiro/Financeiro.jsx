import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, Search, Landmark, Wallet, ReceiptText, ClipboardCheck, AlertTriangle, Download, Printer, CheckCircle2, Clock, XCircle, Eye, Trash2, X, FileText, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { deleteTransacaoStorage, listTransacoesStorage } from './transacoesStorage'
import { deleteComprovanteStorage, ensureComprovantesStorage, saveComprovantesStorage, updateComprovanteStorage } from './comprovantesStorage'
import { deleteContaStorage, deleteOrcamentoStorage, listContasStorage, listOrcamentosStorage } from './financeiroStorage'
import { loadInstitucional } from '../institucional/institucionalStorage'
import { AV_VADAI_LOGO_DATA_URL } from './financeiroLogo'

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
const comprovantes = []

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

function gerarReferencia(prefixo = 'FIN') {
  const agora = new Date()
  return `${prefixo}-${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}-${String(agora.getHours()).padStart(2, '0')}${String(agora.getMinutes()).padStart(2, '0')}`
}

function baixarArquivoTexto(nomeArquivo, conteudo) {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function gerarFluxoReal(transacoes) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
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

function tituloDocumentoFinanceiro(tipo, item) {
  if (tipo === 'orcamento') return 'Orçamento financeiro'
  if (tipo === 'comprovante') return item.status === 'VALIDO' ? 'Comprovante financeiro validado' : 'Comprovante financeiro para validação'
  if (item.tipo === 'RECEITA') return 'Comprovante de recebimento de doação'
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
    ]
  }

  return [
    ['Descrição', item.descricao || '-'],
    ['Tipo', item.tipo === 'RECEITA' ? 'Receita / Doação' : 'Despesa'],
    ['Categoria', item.categoria || '-'],
    ['Projeto', item.projeto || '-'],
    ['Conta', item.conta || '-'],
    ['Forma de pagamento', item.forma || '-'],
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
  const [transacoesState, setTransacoesState] = useState(() => listTransacoesStorage())
  const [contasState, setContasState] = useState(() => listContasStorage())
  const [orcamentosState, setOrcamentosState] = useState(() => listOrcamentosStorage())
  const [comprovantesState, setComprovantesState] = useState(() => ensureComprovantesStorage(comprovantes))
  const [preview, setPreview] = useState(null)
  const [previewMaximizado, setPreviewMaximizado] = useState(false)
  const dadosOng = useMemo(() => loadInstitucional(), [])
  const navigate = useNavigate()

  const transacoes = transacoesState
  const fluxo = useMemo(() => gerarFluxoReal(transacoes), [transacoes])
  const projetos = ['TODOS', ...new Set(transacoes.map((t) => t.projeto).filter(Boolean))]
  const tipos = ['TODOS', ...new Set(transacoes.map((t) => t.tipo).filter(Boolean))]

  const transacoesFiltradas = useMemo(() => transacoes.filter((t) => {
    const termo = busca.toLowerCase()
    const texto = [t.descricao, t.categoria, t.projeto, t.conta, t.origem, t.fornecedor].join(' ').toLowerCase()
    return texto.includes(termo) && (projetoFiltro === 'TODOS' || t.projeto === projetoFiltro) && (tipoFiltro === 'TODOS' || t.tipo === tipoFiltro)
  }), [busca, projetoFiltro, tipoFiltro, transacoes])

  const receitas = transacoes.filter((t) => t.tipo === 'RECEITA' && t.status === 'RECEBIDA').reduce((s, t) => s + Number(t.valor || 0), 0)
  const receitasPrevistas = transacoes.filter((t) => t.tipo === 'RECEITA' && t.status === 'PREVISTA').reduce((s, t) => s + Number(t.valor || 0), 0)
  const despesas = transacoes.filter((t) => t.tipo === 'DESPESA' && t.status === 'PAGA').reduce((s, t) => s + Number(t.valor || 0), 0)
  const despesasAbertas = transacoes.filter((t) => t.tipo === 'DESPESA' && t.status !== 'PAGA').reduce((s, t) => s + Number(t.valor || 0), 0)
  const saldo = receitas - despesas
  const pendentes = comprovantesState.filter((c) => c.status === 'PENDENTE').length

  const abrirDocumento = (tipo, item) => {
    setPreview({ tipo, item, referencia: gerarReferencia(tipo === 'orcamento' ? 'ORC' : tipo === 'comprovante' ? 'COMP' : item.tipo === 'RECEITA' ? 'REC' : 'DESP') })
    setPreviewMaximizado(false)
  }

  const imprimirDocumento = (tipo, item) => {
    abrirDocumento(tipo, item)
    setTimeout(() => window.print(), 150)
  }

  const persistirComprovantes = (next) => {
    setComprovantesState(next)
    saveComprovantesStorage(next)
  }

  const excluirTransacao = (transacao) => {
    if (!window.confirm(`Deseja excluir "${transacao.descricao}"? Isso também pode remover o comprovante vinculado.`)) return
    setTransacoesState(deleteTransacaoStorage(transacao.id))
    setComprovantesState(ensureComprovantesStorage(comprovantes))
  }

  const excluirConta = (conta) => {
    if (!window.confirm(`Deseja excluir a conta "${conta.nome}"?`)) return
    setContasState(deleteContaStorage(conta.id))
  }

  const excluirOrcamento = (orcamento) => {
    if (!window.confirm(`Deseja excluir o orçamento "${orcamento.categoria || orcamento.projeto}"?`)) return
    setOrcamentosState(deleteOrcamentoStorage(orcamento.id))
  }

  const handleValidarComprovante = (doc) => {
    const atualizado = { ...doc, status: 'VALIDO', validador: 'Admin', validadoEm: new Date().toISOString() }
    updateComprovanteStorage(atualizado)
    setComprovantesState((prev) => prev.map((item) => String(item.id) === String(doc.id) ? atualizado : item))
    abrirDocumento('comprovante', atualizado)
  }

  const handleBaixarJson = (prefixo, item) => baixarArquivoTexto(`${prefixo}-${item.id || Date.now()}.json`, JSON.stringify(item, null, 2))

  const handleExcluirComprovante = (doc) => {
    if (!window.confirm(`Deseja excluir o comprovante "${doc.documento}"?`)) return
    persistirComprovantes(deleteComprovanteStorage(doc.id))
  }

  return (
    <div className="mod-financeiro animate-fade-in">
      <div className="page-header no-print"><div><h1 className="page-title">Financeiro</h1><p className="page-subtitle">Receitas, despesas, contas, orçamento, comprovantes e prestação de contas com emissão de PDF institucional</p></div><button className="btn btn-primary" onClick={() => navigate('/financeiro/nova')}><Plus size={16} /> Nova transação</button></div>
      <div className="card no-print" style={{ marginBottom: 20 }}><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{tabs.map((tab) => <button key={tab.id} className={`btn btn-sm ${aba === tab.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAba(tab.id)}>{tab.label}</button>)}</div></div>
      {aba !== 'prestacao' && <div className="card no-print" style={{ marginBottom: 20 }}><div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div style={{ position: 'relative', flex: 1, minWidth: 220 }}><Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} /><input placeholder="Buscar por descrição, projeto, categoria, conta ou fornecedor…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ paddingLeft: 38 }} /></div><select value={projetoFiltro} onChange={(e) => setProjetoFiltro(e.target.value)} style={{ maxWidth: 240 }}>{projetos.map((projeto) => <option key={projeto} value={projeto}>{projeto === 'TODOS' ? 'Todos os projetos' : projeto}</option>)}</select><select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={{ maxWidth: 200 }}>{tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo === 'TODOS' ? 'Todos os tipos' : tipo}</option>)}</select></div></div>}

      {aba === 'visao' && <><div className="grid-4 animate-fade-up" style={{ marginBottom: 24 }}><StatCard mod="mod-dashboard" icon={DollarSign} label="Saldo real" value={fmt(saldo)} /><StatCard mod="mod-financeiro" icon={TrendingUp} label="Receitas recebidas" value={fmt(receitas)} trend={`${fmt(receitasPrevistas)} previstas`} trendType="up" /><StatCard mod="mod-pessoas" icon={TrendingDown} label="Despesas pagas" value={fmt(despesas)} trend={`${fmt(despesasAbertas)} em aberto`} trendType="down" /><StatCard mod="mod-projetos" icon={ReceiptText} label="Comprovantes pendentes" value={String(pendentes)} trend="Exigem validação" trendType="down" /></div><div className="card" style={{ marginBottom: 24 }}><CardTitle title="Fluxo financeiro real" subtitle="Calculado apenas pelas transações cadastradas" />{fluxo.length ? <ResponsiveContainer width="100%" height={230}><BarChart data={fluxo}><CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} /><XAxis dataKey="mes" /><YAxis /><Tooltip formatter={(v) => [fmt(v)]} /><Legend /><Bar dataKey="receitas" name="Receitas" fill="#22c55e" /><Bar dataKey="despesas" name="Despesas" fill="#ef4444" /></BarChart></ResponsiveContainer> : <EmptyState texto="Nenhuma transação cadastrada para gerar gráfico." />}</div><TransactionsTable transacoes={transacoesFiltradas.slice(0, 6)} title="Últimas movimentações" onView={(item) => abrirDocumento('transacao', item)} onPdf={(item) => imprimirDocumento('transacao', item)} onDownload={(item) => handleBaixarJson('transacao', item)} onDelete={excluirTransacao} /></>}
      {aba === 'receitas' && <TransactionsTable transacoes={transacoesFiltradas.filter((t) => t.tipo === 'RECEITA')} title="Receitas / Doações" onView={(item) => abrirDocumento('transacao', item)} onPdf={(item) => imprimirDocumento('transacao', item)} onDownload={(item) => handleBaixarJson('receita', item)} onDelete={excluirTransacao} />}
      {aba === 'despesas' && <TransactionsTable transacoes={transacoesFiltradas.filter((t) => t.tipo === 'DESPESA')} title="Despesas" onView={(item) => abrirDocumento('transacao', item)} onPdf={(item) => imprimirDocumento('transacao', item)} onDownload={(item) => handleBaixarJson('despesa', item)} onDelete={excluirTransacao} />}
      {aba === 'contas' && <AccountsTable contas={contasState} onView={(item) => abrirDocumento('conta', item)} onDownload={(item) => handleBaixarJson('conta', item)} onDelete={excluirConta} />}
      {aba === 'orcamentos' && <BudgetsTable orcamentos={orcamentosState} onView={(item) => abrirDocumento('orcamento', item)} onPdf={(item) => imprimirDocumento('orcamento', item)} onDownload={(item) => handleBaixarJson('orcamento', item)} onDelete={excluirOrcamento} />}
      {aba === 'comprovantes' && <AttachmentsTable comprovantes={comprovantesState} onView={(item) => abrirDocumento('comprovante', item)} onValidate={handleValidarComprovante} onPdf={(item) => imprimirDocumento('comprovante', item)} onDownload={(item) => handleBaixarJson('comprovante', item)} onDelete={handleExcluirComprovante} />}
      {aba === 'prestacao' && <AccountabilityReport transacoes={transacoes} comprovantes={comprovantesState} dadosOng={dadosOng} />}

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

function FinanceiroPreviewModal({ preview, dadosOng, maximizado, onToggleMaximizado, onClose }) {
  const { tipo, item, referencia } = preview
  return (
    <div className="financeiro-preview-overlay">
      <div className={`financeiro-preview-shell ${maximizado ? 'is-maximized' : ''}`}>
        <div className="financeiro-preview-toolbar no-print">
          <div>
            <h2>Pré-visualização financeira</h2>
            <p>Documento institucional com identidade da ONG, pronto para salvar como PDF.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-outline" onClick={onToggleMaximizado}>{maximizado ? 'Restaurar' : 'Maximizar'}</button>
            <button className="btn btn-sm btn-primary" onClick={() => window.print()}><Printer size={14} /> Salvar PDF</button>
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
  const validado = item.status === 'VALIDO' || item.comprovante === 'VALIDO' || item.status === 'RECEBIDA' || item.status === 'PAGA'

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
          <span className={`badge ${validado ? 'badge-green' : 'badge-yellow'}`}>{validado ? 'Validado' : 'Pendente'}</span>
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
        <div><strong>Responsável</strong><span>{dadosOng.diretorFinanceiro && dadosOng.diretorFinanceiro !== 'A definir' ? dadosOng.diretorFinanceiro : dadosOng.presidente || 'Administração'}</span></div>
      </section>

      <section className="financeiro-doc-table">
        {linhas.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="financeiro-doc-declaracao">
        <p>
          Declaramos para os devidos fins que o lançamento acima foi registrado no módulo financeiro da organização,
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

function EmptyState({ texto }) { return <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>{texto}</div> }
function StatCard({ mod, icon: Icon, label, value, trend, trendType = 'up' }) { return <div className={`stat-card ${mod}`}><div className="stat-icon"><Icon size={20} /></div><div><div className="stat-label">{label}</div><div className="stat-value" style={{ fontSize: 22 }}>{value}</div></div>{trend && <div className={`stat-trend ${trendType}`}><TrendingUp size={13} /> {trend}</div>}</div> }
function CardTitle({ title, subtitle }) { return <div style={{ marginBottom: 18 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--gray-800)', marginBottom: 4 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{subtitle}</div></div> }
function ActionButtons({ item, onView, onPdf, onDownload, onDelete }) { return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button className="btn btn-sm btn-outline" onClick={() => onView(item)}><Eye size={13} /> Ver</button>{onPdf && <button className="btn btn-sm btn-primary" onClick={() => onPdf(item)}><Printer size={13} /> PDF</button>}<button className="btn btn-sm btn-outline" onClick={() => onDownload(item)}><Download size={13} /> JSON</button><button className="btn btn-sm btn-outline" onClick={() => onDelete(item)}><Trash2 size={13} /> Excluir</button></div> }

function TransactionsTable({ transacoes, title, onView, onPdf, onDownload, onDelete }) {
  return <div className="card animate-fade-up delay-3"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{title}</div><span className="badge badge-blue">PDF institucional disponível por registro</span></div><div className="table-wrap"><table><thead><tr><th>Descrição</th><th>Projeto</th><th>Categoria</th><th>Conta</th><th>Vencimento</th><th>Status</th><th>Comprovante</th><th style={{ textAlign: 'right' }}>Valor</th><th>Ações</th></tr></thead><tbody>{transacoes.map((t) => { const cfg = statusConfig[t.status] || statusConfig.PREVISTA; const Icon = cfg.icon; return <tr key={t.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: t.tipo === 'RECEITA' ? 'var(--green-50)' : 'var(--red-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.tipo === 'RECEITA' ? <ArrowUpRight size={15} color="var(--green-600)" /> : <ArrowDownRight size={15} color="var(--red-600)" />}</div><div><span style={{ fontWeight: 600 }}>{t.descricao}</span><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{t.data ? new Date(`${t.data}T12:00:00`).toLocaleDateString('pt-BR') : '-'} • {t.forma} • {(t.anexos || []).length} anexo(s)</div></div></div></td><td>{t.projeto}</td><td><span className="badge badge-gray">{t.categoria}</span></td><td>{t.conta}</td><td>{t.vencimento ? new Date(`${t.vencimento}T12:00:00`).toLocaleDateString('pt-BR') : '-'}</td><td><span className={`badge ${cfg.badge}`}><Icon size={11} /> {cfg.label}</span></td><td><span className={`badge ${t.comprovante === 'VALIDO' ? 'badge-green' : 'badge-yellow'}`}>{t.comprovante === 'VALIDO' ? 'Validado' : 'Pendente'}</span></td><td style={{ textAlign: 'right', fontWeight: 700, color: t.tipo === 'RECEITA' ? 'var(--green-600)' : 'var(--red-600)' }}>{t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}</td><td><ActionButtons item={t} onView={onView} onPdf={onPdf} onDownload={onDownload} onDelete={onDelete} /></td></tr> })}{transacoes.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum registro cadastrado.</td></tr>}</tbody></table></div></div>
}

function AccountsTable({ contas, onView, onDownload, onDelete }) { return <div className="card"><CardTitle title="Contas financeiras" subtitle="Dados reais cadastrados" />{contas.length ? <div className="table-wrap"><table><thead><tr><th>Conta</th><th>Tipo</th><th>Banco</th><th>Saldo inicial</th><th>Saldo atual</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody>{contas.map((conta) => <tr key={conta.id}><td><strong>{conta.nome}</strong></td><td><span className="badge badge-blue"><Landmark size={11} /> {conta.tipo}</span></td><td>{conta.banco}</td><td>{fmt(conta.saldoInicial)}</td><td><strong>{fmt(conta.saldoAtual)}</strong></td><td>{conta.responsavel}</td><td><span className="badge badge-green">{conta.status || 'Ativa'}</span></td><td><ActionButtons item={conta} onView={onView} onDownload={onDownload} onDelete={onDelete} /></td></tr>)}</tbody></table></div> : <EmptyState texto="Nenhuma conta cadastrada." />}</div> }
function BudgetsTable({ orcamentos, onView, onPdf, onDownload, onDelete }) { return <div className="card"><CardTitle title="Orçamentos" subtitle="Dados reais cadastrados" />{orcamentos.length ? <div className="table-wrap"><table><thead><tr><th>Projeto</th><th>Categoria</th><th>Previsto</th><th>Aprovado</th><th>Realizado</th><th>Saldo</th><th>Ações</th></tr></thead><tbody>{orcamentos.map((item) => <tr key={item.id}><td>{item.projeto}</td><td><strong>{item.categoria}</strong></td><td>{fmt(item.previsto)}</td><td>{fmt(item.aprovado)}</td><td>{fmt(item.realizado)}</td><td>{fmt(Number(item.aprovado || 0) - Number(item.realizado || 0))}</td><td><ActionButtons item={item} onView={onView} onPdf={onPdf} onDownload={onDownload} onDelete={onDelete} /></td></tr>)}</tbody></table></div> : <EmptyState texto="Nenhum orçamento cadastrado." />}</div> }

function AttachmentsTable({ comprovantes, onView, onValidate, onPdf, onDownload, onDelete }) {
  return <div className="card"><CardTitle title="Comprovantes financeiros" subtitle="Notas fiscais, recibos, PIX, contratos e evidências" /><div className="table-wrap"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Lançamento</th><th>Projeto</th><th>Valor</th><th>Status</th><th>Validador</th><th>Ações</th></tr></thead><tbody>{comprovantes.map((doc) => <tr key={doc.id}><td><strong>{doc.documento}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{(doc.anexos || []).length} anexo(s)</div></td><td>{doc.tipo}</td><td>{doc.lancamento}</td><td>{doc.projeto}</td><td>{fmt(doc.valor)}</td><td><span className={`badge ${doc.status === 'VALIDO' ? 'badge-green' : 'badge-yellow'}`}>{doc.status === 'VALIDO' ? 'Validado' : 'Pendente'}</span></td><td>{doc.validador}</td><td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button className="btn btn-sm btn-outline" onClick={() => onView(doc)}><Eye size={13} /> Ver</button>{doc.status !== 'VALIDO' && <button className="btn btn-sm btn-outline" onClick={() => onValidate(doc)}><CheckCircle2 size={13} /> Validar</button>}<button className="btn btn-sm btn-primary" onClick={() => onPdf(doc)}><Printer size={13} /> PDF</button><button className="btn btn-sm btn-outline" onClick={() => onDownload(doc)}><Download size={13} /> JSON</button><button className="btn btn-sm btn-outline" onClick={() => onDelete(doc)}><Trash2 size={13} /> Excluir</button></div></td></tr>)}{comprovantes.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum comprovante cadastrado.</td></tr>}</tbody></table></div></div>
}

function AccountabilityReport({ transacoes, comprovantes, dadosOng }) {
  const receitas = transacoes.filter((t) => t.tipo === 'RECEITA' && t.status === 'RECEBIDA').reduce((s, t) => s + Number(t.valor || 0), 0)
  const despesas = transacoes.filter((t) => t.tipo === 'DESPESA' && t.status === 'PAGA').reduce((s, t) => s + Number(t.valor || 0), 0)
  const pendencias = comprovantes.filter((c) => c.status === 'PENDENTE').length

  return <div className="mod-financeiro"><div className="page-header no-print"><div><h1 className="page-title">Prestação de contas</h1><p className="page-subtitle">Relatório financeiro real consolidado</p></div><button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Gerar PDF</button></div><div className="financeiro-documento-print"><header className="financeiro-doc-header"><div className="financeiro-doc-brand"><img src={AV_VADAI_LOGO_DATA_URL} alt="Logo da ONG" /><div><h1>{dadosOng.nome || 'AV Associação Vadai'}</h1><p>Prestação de contas consolidada</p></div></div><div className="financeiro-doc-meta"><span className="badge badge-blue">Relatório</span><strong>{gerarReferencia('PRES')}</strong><small>{new Date().toLocaleString('pt-BR')}</small></div></header><div className="grid-4" style={{ marginBottom: 24 }}><StatCard mod="mod-financeiro" icon={TrendingUp} label="Receitas recebidas" value={fmt(receitas)} /><StatCard mod="mod-pessoas" icon={TrendingDown} label="Despesas pagas" value={fmt(despesas)} /><StatCard mod="mod-dashboard" icon={Wallet} label="Saldo do período" value={fmt(receitas - despesas)} /><StatCard mod="mod-projetos" icon={AlertTriangle} label="Pendências" value={String(pendencias)} /></div><section className="financeiro-doc-declaracao"><p>Relatório gerado com base nas transações e comprovantes cadastrados no sistema de gestão social.</p></section></div></div>
}
