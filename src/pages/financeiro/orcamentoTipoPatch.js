/* ================================================================
   Financeiro — opção Orçamento no cadastro de nova transação
   ================================================================

   Este patch preserva a página atual de Nova Transação e adiciona o tipo
   Orçamento ao formulário. Quando o usuário escolhe Orçamento, o registro é
   salvo na storage de orçamentos e aparece na aba Orçamentos do Financeiro.
*/

const ORCAMENTOS_KEY = 'ong_financeiro_orcamentos'

function gerarId(prefixo = 'orcamento') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function estaNaNovaTransacao() {
  return window.location.pathname === '/financeiro/nova'
}

function localizarFormulario() {
  const titulo = Array.from(document.querySelectorAll('h1')).find((item) => item.textContent?.trim() === 'Nova transação')
  return titulo?.closest('form') || null
}

function garantirOpcaoOrcamento() {
  if (!estaNaNovaTransacao()) return

  const form = localizarFormulario()
  if (!form) return

  const selects = Array.from(form.querySelectorAll('select'))
  const tipoSelect = selects.find((select) => Array.from(select.options).some((option) => option.value === 'RECEITA'))
  if (!tipoSelect || Array.from(tipoSelect.options).some((option) => option.value === 'ORCAMENTO')) return

  const option = document.createElement('option')
  option.value = 'ORCAMENTO'
  option.textContent = 'Orçamento'
  tipoSelect.appendChild(option)
}

function lerOrcamentos() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORCAMENTOS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function salvarOrcamento(form) {
  const inputs = Array.from(form.querySelectorAll('input'))
  const selects = Array.from(form.querySelectorAll('select'))
  const descricao = inputs[0]?.value || 'Orçamento sem descrição'
  const valor = Number(inputs[1]?.value || 0)
  const categoria = inputs[2]?.value || descricao || 'Orçamento'
  const forma = inputs[3]?.value || 'Manual'
  const projeto = inputs[4]?.value || 'Fundo Geral'
  const conta = inputs[5]?.value || 'Conta principal ONG'
  const status = selects[1]?.value || 'PREVISTA'
  const dataHoje = new Date().toISOString().slice(0, 10)

  const aprovado = status === 'APROVADA' ? valor : 0
  const nextItem = {
    id: gerarId(),
    projeto,
    categoria,
    previsto: valor,
    aprovado,
    realizado: 0,
    descricao,
    status,
    conta,
    forma,
    data: dataHoje,
    anexos: [],
  }

  localStorage.setItem(ORCAMENTOS_KEY, JSON.stringify([nextItem, ...lerOrcamentos()]))
}

function interceptarSubmit(event) {
  if (!estaNaNovaTransacao()) return

  const form = localizarFormulario()
  if (!form || event.target !== form) return

  const selects = Array.from(form.querySelectorAll('select'))
  const tipoSelect = selects.find((select) => Array.from(select.options).some((option) => option.value === 'ORCAMENTO'))
  if (tipoSelect?.value !== 'ORCAMENTO') return

  event.preventDefault()
  event.stopPropagation()
  if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation()

  salvarOrcamento(form)
  window.location.href = '/financeiro'
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(garantirOpcaoOrcamento)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('popstate', garantirOpcaoOrcamento)
  document.addEventListener('submit', interceptarSubmit, true)
  setInterval(garantirOpcaoOrcamento, 800)
  garantirOpcaoOrcamento()
}
