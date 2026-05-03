const CONTAS_KEY = 'ong_financeiro_contas'
const ORCAMENTOS_KEY = 'ong_financeiro_orcamentos'
const TRANSACOES_KEY = 'ong_financeiro_transacoes'
const CONTA_TAGS_KEY = 'ong_financeiro_conta_tags'

const TAGS_PADRAO = ['PIX', 'Conta Corrente', 'Boleto', 'Cartão']

function gerarId(prefixo = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function lerArray(key) {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function salvarArray(key, items) {
  if (typeof window === 'undefined') return []
  const normalized = Array.isArray(items) ? items : []
  window.localStorage.setItem(key, JSON.stringify(normalized))
  return normalized
}

function normalizarTexto(value) {
  return String(value || '').trim().toLowerCase()
}

function tituloConta(value) {
  return String(value || '').trim()
}

/**
 * Verifica se a transação tem comprovante validado (auditoria).
 * Usado para indicadores visuais e relatórios de conformidade,
 * NÃO como portão para bloquear a movimentação do saldo.
 */
export function transacaoValidada(transacao) {
  return (
    transacao.comprovante === 'VALIDO' ||
    transacao.comprovanteStatus === 'VALIDO' ||
    Boolean(transacao.validadoEm)
  )
}

/**
 * Determina se a transação movimenta o saldo da conta.
 * Critério: status operacional — independente do comprovante.
 * A validação do comprovante é auditoria interna, não bloqueio de lançamento.
 */
function transacaoMovimentaSaldo(transacao) {
  if (transacao.tipo === 'RECEITA') {
    return ['RECEBIDA', 'PREVISTA', 'APROVADA'].includes(transacao.status)
  }
  if (transacao.tipo === 'DESPESA') {
    return ['PAGA', 'PREVISTA', 'APROVADA', 'VENCIDA'].includes(transacao.status)
  }
  return false
}

function tipoDaConta(nome) {
  const n = normalizarTexto(nome)
  if (n.includes('pix')) return 'PIX'
  if (n.includes('boleto')) return 'Boleto'
  if (n.includes('cart')) return 'Cartão'
  if (n.includes('corrente') || n.includes('banco')) return 'Conta Corrente'
  if (n.includes('caixa')) return 'Caixa'
  return 'Meio financeiro'
}

function calcularResumoConta(conta, transacoes = []) {
  const contaNome = normalizarTexto(conta.nome)
  const vinculadas = transacoes.filter(
    (t) => normalizarTexto(t.conta || t.forma) === contaNome
  )

  const ativas = vinculadas.filter(transacaoMovimentaSaldo)
  const validadas = ativas.filter(transacaoValidada)

  const entradas = ativas
    .filter((t) => t.tipo === 'RECEITA')
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const saidas = ativas
    .filter((t) => t.tipo === 'DESPESA')
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const entradasValidadas = validadas
    .filter((t) => t.tipo === 'RECEITA')
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const saidasValidadas = validadas
    .filter((t) => t.tipo === 'DESPESA')
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const saldoInicial = Number(conta.saldoInicial || 0)

  return {
    totalReceitas: entradas,
    totalDespesas: saidas,
    totalReceitasValidadas: entradasValidadas,
    totalDespesasValidadas: saidasValidadas,
    saldoMovimentado: entradas - saidas,
    saldoAtual: saldoInicial + entradas - saidas,
    saldoValidado: saldoInicial + entradasValidadas - saidasValidadas,
    quantidadeLancamentos: vinculadas.length,
    quantidadeLancamentosEfetivados: ativas.length,
    quantidadeLancamentosNaoValidados: ativas.filter((t) => !transacaoValidada(t)).length,
  }
}

function montarContasDerivadas(contasCadastradas, transacoes) {
  const porNome = new Map()

  contasCadastradas.forEach((conta) => {
    const nome = tituloConta(conta.nome)
    if (!nome) return
    porNome.set(normalizarTexto(nome), { ...conta, nome })
  })

  const tags = lerArray(CONTA_TAGS_KEY)
  const nomesTags = tags.length ? tags : TAGS_PADRAO

  nomesTags.forEach((tag) => {
    const nome = tituloConta(tag)
    if (!nome) return
    const key = normalizarTexto(nome)
    if (!porNome.has(key)) {
      porNome.set(key, {
        id: `tag-${key.replace(/[^a-z0-9]+/g, '-')}`,
        nome,
        tipo: tipoDaConta(nome),
        banco: nome,
        saldoInicial: 0,
        responsavel: 'Financeiro',
        status: 'Ativa',
        derivada: true,
      })
    }
  })

  transacoes.forEach((t) => {
    const nome = tituloConta(t.conta || t.forma)
    if (!nome) return
    const key = normalizarTexto(nome)
    if (!porNome.has(key)) {
      porNome.set(key, {
        id: `mov-${key.replace(/[^a-z0-9]+/g, '-')}`,
        nome,
        tipo: tipoDaConta(nome),
        banco: nome,
        saldoInicial: 0,
        responsavel: 'Financeiro',
        status: 'Ativa',
        derivada: true,
      })
    }
  })

  return Array.from(porNome.values())
}

function aplicarSaldosCalculados(contas) {
  const transacoes = lerArray(TRANSACOES_KEY)
  const contasComDerivadas = montarContasDerivadas(contas, transacoes)
  return contasComDerivadas.map((conta) => ({
    ...conta,
    ...calcularResumoConta(conta, transacoes),
  }))
}

export function listContasStorage() {
  return aplicarSaldosCalculados(lerArray(CONTAS_KEY))
}

export function saveContasStorage(contas) {
  return salvarArray(CONTAS_KEY, contas)
}

export function addContaStorage(conta) {
  const nextItem = { id: conta.id || gerarId('conta'), ...conta }
  const current = lerArray(CONTAS_KEY)
  const next = [nextItem, ...current.filter((item) => String(item.id) !== String(nextItem.id))]
  saveContasStorage(next)
  return nextItem
}

export function deleteContaStorage(id) {
  const current = lerArray(CONTAS_KEY)
  const next = current.filter((item) => String(item.id) !== String(id))
  saveContasStorage(next)
  return aplicarSaldosCalculados(next)
}

export function listOrcamentosStorage() {
  return lerArray(ORCAMENTOS_KEY)
}

export function saveOrcamentosStorage(orcamentos) {
  return salvarArray(ORCAMENTOS_KEY, orcamentos)
}

export function addOrcamentoStorage(orcamento) {
  const nextItem = { id: orcamento.id || gerarId('orcamento'), ...orcamento }
  const next = [nextItem, ...listOrcamentosStorage().filter((item) => String(item.id) !== String(nextItem.id))]
  saveOrcamentosStorage(next)
  return nextItem
}

export function deleteOrcamentoStorage(id) {
  const next = listOrcamentosStorage().filter((item) => String(item.id) !== String(id))
  saveOrcamentosStorage(next)
  return next
}

/**
 * Recalcula os totais globais para a Visão Geral.
 * Usa a mesma lógica que os saldos das contas — garantindo consistência.
 */
export function calcularTotaisGlobais() {
  const transacoes = lerArray(TRANSACOES_KEY)
  const orcamentos = lerArray(ORCAMENTOS_KEY)

  const receitasEfetivadas = transacoes
    .filter((t) => t.tipo === 'RECEITA' && ['RECEBIDA', 'APROVADA'].includes(t.status))
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const receitasPrevistas = transacoes
    .filter((t) => t.tipo === 'RECEITA' && t.status === 'PREVISTA')
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const despesasEfetivadas = transacoes
    .filter((t) => t.tipo === 'DESPESA' && ['PAGA', 'APROVADA'].includes(t.status))
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const despesasEmAberto = transacoes
    .filter((t) => t.tipo === 'DESPESA' && ['PREVISTA', 'VENCIDA'].includes(t.status))
    .reduce((s, t) => s + Number(t.valor || 0), 0)

  const ativosComPendencia = transacoes.filter(
    (t) => transacaoMovimentaSaldo(t) && !transacaoValidada(t)
  )

  const orcamentoAprovado = orcamentos.reduce((s, o) => s + Number(o.aprovado || 0), 0)
  const orcamentoRealizado = orcamentos.reduce((s, o) => s + Number(o.realizado || 0), 0)

  return {
    receitasEfetivadas,
    receitasPrevistas,
    despesasEfetivadas,
    despesasEmAberto,
    saldoAtual: receitasEfetivadas - despesasEfetivadas,
    pendentesValidacao: ativosComPendencia.length,
    orcamentoAprovado,
    orcamentoRealizado,
    orcamentoDisponivel: orcamentoAprovado - orcamentoRealizado,
  }
}
