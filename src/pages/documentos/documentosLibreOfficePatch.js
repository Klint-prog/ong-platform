/* ================================================================
   Central de Documentos — preview LibreOffice/OpenDocument
   ================================================================

   Suporte visual para arquivos: odt, ott, ods, ots, odp, otp, odg e odf.
   O navegador não renderiza esses formatos nativamente; por isso a tela
   envia o arquivo salvo no storage da aplicação para o backend, que converte
   com LibreOffice headless e devolve um PDF temporário para leitura.
*/

const LIBREOFFICE_EXTENSIONS = ['.odt', '.ott', '.ods', '.ots', '.odp', '.otp', '.odg', '.odf']
const convertedUrls = new Map()
const converting = new Set()

function isLibreOfficeName(name = '') {
  const lower = String(name || '').toLowerCase()
  return LIBREOFFICE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function readDocs() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem('ong.documentos') || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function findOpenedDoc(card) {
  const title = card.querySelector('aside h3')?.textContent?.trim()
    || Array.from(card.querySelectorAll('h3')).map((item) => item.textContent?.trim()).find(Boolean)
  if (!title) return null
  return readDocs().find((doc) => doc.nome === title || doc.nomeOriginal === title || doc.nome?.endsWith(title) || title.endsWith(doc.nome)) || null
}

function findPreviewBox(card) {
  const unavailable = Array.from(card.querySelectorAll('div')).find((div) => String(div.textContent || '').includes('Preview indisponível para este formato'))
  return unavailable?.parentElement || null
}

function ensureUploadAccept() {
  if (!window.location.pathname.startsWith('/documentos')) return
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    const accept = input.getAttribute('accept') || ''
    if (!accept.includes('.odt')) {
      input.setAttribute('accept', `${accept ? `${accept},` : ''}.odt,.ott,.ods,.ots,.odp,.otp,.odg,.odf`)
    }
  })
}

function locateModalCard() {
  const heading = Array.from(document.querySelectorAll('h2')).find((item) => String(item.textContent || '').trim() === 'Pré-visualização do documento')
  return heading?.closest('.card') || null
}

async function convertDoc(doc) {
  const key = doc.id || doc.nome
  if (convertedUrls.has(key)) return convertedUrls.get(key)
  if (converting.has(key)) return null
  converting.add(key)

  const response = await fetch('/api/libreoffice/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: doc.nomeOriginal || doc.nome,
      mimeType: doc.mimeType || 'application/vnd.oasis.opendocument.text',
      conteudo: doc.conteudo,
    }),
  })

  converting.delete(key)
  if (!response.ok) {
    let message = 'Falha ao converter documento LibreOffice.'
    try {
      const body = await response.json()
      message = body.error || message
    } catch {}
    throw new Error(message)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  convertedUrls.set(key, url)
  return url
}

function renderLoading(box) {
  box.innerHTML = '<div style="text-align:center;color:var(--gray-500);padding:24px"><strong>Convertendo documento LibreOffice...</strong><br><span style="font-size:12px">A primeira visualização pode demorar alguns segundos.</span></div>'
}

function renderError(box, error) {
  box.innerHTML = `<div style="text-align:center;color:var(--gray-500);padding:24px"><strong>Não foi possível converter o documento.</strong><br><span style="font-size:12px">${String(error?.message || error || '').replace(/[<>]/g, '')}</span></div>`
}

function renderPdf(box, url, doc) {
  box.innerHTML = ''
  const iframe = document.createElement('iframe')
  iframe.title = doc.nome || 'Documento LibreOffice'
  iframe.src = url
  iframe.style.width = '100%'
  iframe.style.height = 'min(72vh, 760px)'
  iframe.style.border = '0'
  iframe.style.background = '#fff'
  box.appendChild(iframe)

  const aside = locateModalCard()?.querySelector('aside')
  if (aside && !aside.querySelector('[data-libreoffice-preview-badge]')) {
    const badge = document.createElement('span')
    badge.dataset.libreofficePreviewBadge = 'true'
    badge.className = 'badge badge-blue'
    badge.style.width = 'fit-content'
    badge.textContent = 'LibreOffice convertido para PDF'
    aside.insertBefore(badge, aside.children[1] || null)
  }
}

async function applyLibreOfficePreview() {
  if (!window.location.pathname.startsWith('/documentos')) return
  ensureUploadAccept()

  const card = locateModalCard()
  if (!card) return

  const doc = findOpenedDoc(card)
  if (!doc || !isLibreOfficeName(doc.nomeOriginal || doc.nome) || !doc.conteudo) return

  const box = findPreviewBox(card)
  if (!box || box.dataset.libreofficePreviewApplied === 'true') return
  box.dataset.libreofficePreviewApplied = 'true'

  try {
    renderLoading(box)
    const url = await convertDoc(doc)
    if (url) renderPdf(box, url, doc)
  } catch (error) {
    renderError(box, error)
  }
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(applyLibreOfficePreview)
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })
  window.addEventListener('resize', applyLibreOfficePreview)
  setInterval(applyLibreOfficePreview, 800)
  applyLibreOfficePreview()
}
