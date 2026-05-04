/* ================================================================
   Central de Documentos — correção visual segura do modal
   ================================================================

   Importante: este patch NÃO move o modal para fora da árvore React.
   Mover o elemento para document.body quebra os eventos do React e faz botões
   como Maximizar, Validar, Excluir e Editar pararem de responder.
*/

function localizarModalPreviewDocumentos() {
  const titulos = Array.from(document.querySelectorAll('h2'))
  const titulo = titulos.find((item) => String(item.textContent || '').trim() === 'Pré-visualização do documento')
  if (!titulo) return null

  const card = titulo.closest('.card')
  const overlay = card?.parentElement
  if (!card || !overlay) return null

  return { overlay, card }
}

function abrirPreviewEmNovaAba() {
  const modal = localizarModalPreviewDocumentos()
  if (!modal) return

  const iframe = modal.card.querySelector('iframe')
  const src = iframe?.getAttribute('src')
  if (!src) return

  const link = document.createElement('a')
  link.href = src
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function interceptarSomenteNovaAba(event) {
  if (!window.location.pathname.startsWith('/documentos')) return

  const modal = localizarModalPreviewDocumentos()
  if (!modal) return

  const button = event.target?.closest?.('button')
  if (!button || !modal.card.contains(button)) return

  const texto = String(button.textContent || '').trim().toLowerCase()
  const ehNovaAba = texto === 'nova aba' || texto === 'abrir em nova aba'
  if (!ehNovaAba) return

  event.preventDefault()
  event.stopPropagation()
  abrirPreviewEmNovaAba()
}

function aplicarCorrecaoModalDocumentos() {
  if (!window.location.pathname.startsWith('/documentos')) return

  const modal = localizarModalPreviewDocumentos()
  if (!modal) return

  const { overlay, card } = modal
  const botaoMax = Array.from(card.querySelectorAll('button')).find((button) => ['Maximizar', 'Restaurar'].includes(String(button.textContent || '').trim()))
  const maximizado = String(botaoMax?.textContent || '').trim() === 'Restaurar'

  // Mantém o modal dentro do React, mas força limites seguros de viewport.
  overlay.style.position = 'fixed'
  overlay.style.inset = '0'
  overlay.style.boxSizing = 'border-box'
  overlay.style.width = '100vw'
  overlay.style.height = '100vh'
  overlay.style.maxWidth = '100vw'
  overlay.style.maxHeight = '100vh'
  overlay.style.overflow = 'hidden'
  overlay.style.padding = maximizado ? '12px' : '24px'
  overlay.style.display = 'flex'
  overlay.style.alignItems = 'center'
  overlay.style.justifyContent = 'center'
  overlay.style.zIndex = '9999'

  card.style.boxSizing = 'border-box'
  card.style.position = 'relative'
  card.style.margin = '0'
  card.style.left = 'auto'
  card.style.right = 'auto'
  card.style.top = 'auto'
  card.style.bottom = 'auto'
  card.style.transform = 'none'
  card.style.minWidth = '0'
  card.style.minHeight = '0'
  card.style.maxWidth = maximizado ? 'calc(100vw - 24px)' : 'calc(100vw - 48px)'
  card.style.width = maximizado ? 'calc(100vw - 24px)' : 'min(1380px, calc(100vw - 48px))'
  card.style.height = maximizado ? 'calc(100vh - 24px)' : 'min(86vh, calc(100vh - 48px))'
  card.style.maxHeight = maximizado ? 'calc(100vh - 24px)' : 'calc(100vh - 48px)'
  card.style.overflow = 'hidden'
  card.style.resize = maximizado ? 'none' : 'both'

  const header = card.firstElementChild
  if (header) {
    header.style.position = 'sticky'
    header.style.top = '0'
    header.style.zIndex = '10'
    header.style.background = '#fff'
    header.style.paddingBottom = '8px'
    header.style.flexShrink = '0'
    header.style.minWidth = '0'
  }

  const headerActions = header?.lastElementChild
  if (headerActions) {
    headerActions.style.flex = '0 0 auto'
    headerActions.style.minWidth = 'fit-content'
    headerActions.style.position = 'relative'
    headerActions.style.zIndex = '20'
  }

  const contentGrid = Array.from(card.querySelectorAll('div')).find((div) => String(div.style.gridTemplateColumns || '').includes('minmax'))
  if (contentGrid) {
    contentGrid.style.minWidth = '0'
    contentGrid.style.minHeight = '0'
    contentGrid.style.overflow = 'hidden'
    contentGrid.style.gridTemplateColumns = maximizado
      ? 'minmax(0, 1fr) minmax(280px, 320px)'
      : 'minmax(0, 1fr) minmax(300px, 360px)'
  }

  const iframe = card.querySelector('iframe')
  if (iframe) {
    iframe.style.maxWidth = '100%'
    iframe.style.height = maximizado ? 'calc(100vh - 132px)' : 'min(72vh, 760px)'
  }
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(aplicarCorrecaoModalDocumentos)
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })
  document.addEventListener('click', interceptarSomenteNovaAba, true)
  window.addEventListener('resize', aplicarCorrecaoModalDocumentos)
  window.addEventListener('popstate', aplicarCorrecaoModalDocumentos)
  setInterval(aplicarCorrecaoModalDocumentos, 400)
  aplicarCorrecaoModalDocumentos()
}
