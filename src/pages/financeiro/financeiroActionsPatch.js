/* ================================================================
   Financeiro — ações por aba
   ================================================================

   Regra operacional:
   - Visão geral / Últimas movimentações: somente Ver e JSON/Baixar.
   - Contas: somente Ver e JSON/Baixar.

   Mantém as demais abas com suas ações específicas.
*/

function textoNormalizado(el) {
  return String(el?.textContent || '').trim().toLowerCase()
}

function encontrarCardPorTitulo(titulo) {
  const alvo = String(titulo || '').trim().toLowerCase()
  const candidatos = Array.from(document.querySelectorAll('.card'))
  return candidatos.find((card) => textoNormalizado(card).includes(alvo)) || null
}

function ocultarBotaoPorTexto(card, textos) {
  if (!card) return
  const alvos = textos.map((texto) => String(texto).toLowerCase())
  Array.from(card.querySelectorAll('button')).forEach((button) => {
    const texto = textoNormalizado(button)
    if (alvos.some((alvo) => texto.includes(alvo))) {
      button.style.display = 'none'
      button.setAttribute('aria-hidden', 'true')
      button.dataset.financeiroAcaoOculta = 'true'
    }
  })
}

function aplicarRegrasAcoesFinanceiro() {
  if (!window.location.pathname.startsWith('/financeiro')) return

  const ultimas = encontrarCardPorTitulo('últimas movimentações')
  ocultarBotaoPorTexto(ultimas, ['pdf', 'excluir'])

  const contas = encontrarCardPorTitulo('contas financeiras')
  ocultarBotaoPorTexto(contas, ['pdf', 'excluir'])
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(aplicarRegrasAcoesFinanceiro)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('popstate', aplicarRegrasAcoesFinanceiro)
  window.addEventListener('hashchange', aplicarRegrasAcoesFinanceiro)
  setInterval(aplicarRegrasAcoesFinanceiro, 700)
  aplicarRegrasAcoesFinanceiro()
}
