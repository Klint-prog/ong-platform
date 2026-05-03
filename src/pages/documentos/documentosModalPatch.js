/* ================================================================
   Central de Documentos — correção do modal maximizado
   ================================================================

   Corrige o comportamento do modal de pré-visualização quando maximizado,
   impedindo que a janela estoure para a direita e esconda o botão de fechar.
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

function aplicarCorrecaoModalDocumentos() {
  if (!window.location.pathname.startsWith('/documentos')) return

  const modal = localizarModalPreviewDocumentos()
  if (!modal) return

  const { overlay, card } = modal
  const botaoMax = Array.from(card.querySelectorAll('button')).find((button) => ['Maximizar', 'Restaurar'].includes(String(button.textContent || '').trim()))
  const maximizado = String(botaoMax?.textContent || '').trim() === 'Restaurar'

  overlay.style.boxSizing = 'border-box'
  overlay.style.width = '100vw'
  overlay.style.maxWidth = '100vw'
  overlay.style.overflow = 'hidden'
  overlay.style.padding = maximizado ? '16px' : '24px'
  overlay.style.placeItems = 'center'

  card.style.boxSizing = 'border-box'
  card.style.margin = '0 auto'
  card.style.left = 'auto'
  card.style.right = 'auto'
  card.style.transform = 'none'
  card.style.minWidth = '0'
  card.style.maxWidth = maximizado ? 'calc(100vw - 32px)' : 'calc(100vw - 48px)'
  card.style.width = maximizado ? 'calc(100vw - 32px)' : 'min(1380px, calc(100vw - 48px))'
  card.style.height = maximizado ? 'calc(100vh - 32px)' : 'min(86vh, 920px)'
  card.style.maxHeight = maximizado ? 'calc(100vh - 32px)' : 'calc(100vh - 48px)'
  card.style.overflow = 'hidden'

  const header = card.firstElementChild
  if (header) {
    header.style.position = 'sticky'
    header.style.top = '0'
    header.style.zIndex = '2'
    header.style.background = '#fff'
    header.style.paddingBottom = '8px'
  }

  const closeButton = Array.from(card.querySelectorAll('button')).find((button) => button.querySelector('svg') && !String(button.textContent || '').trim())
  if (closeButton) {
    closeButton.style.flex = '0 0 auto'
    closeButton.style.position = 'relative'
    closeButton.style.zIndex = '5'
  }

  const contentGrid = Array.from(card.querySelectorAll('div')).find((div) => String(div.style.gridTemplateColumns || '').includes('minmax'))
  if (contentGrid) {
    contentGrid.style.minWidth = '0'
    contentGrid.style.overflow = 'hidden'
    contentGrid.style.gridTemplateColumns = maximizado
      ? 'minmax(0, 1fr) minmax(280px, 320px)'
      : 'minmax(0, 1fr) minmax(300px, 360px)'
  }
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(aplicarCorrecaoModalDocumentos)
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })
  window.addEventListener('resize', aplicarCorrecaoModalDocumentos)
  window.addEventListener('popstate', aplicarCorrecaoModalDocumentos)
  setInterval(aplicarCorrecaoModalDocumentos, 500)
  aplicarCorrecaoModalDocumentos()
}
