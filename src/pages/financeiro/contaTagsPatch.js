/* ================================================================
   Financeiro — tags customizáveis para o campo Conta
   ================================================================

   Troca o campo de texto "Conta" da página Nova transação por uma seleção
   visual em tags. As opções podem ser adicionadas, editadas e removidas pelo
   usuário e ficam salvas no localStorage.
*/

const STORAGE_KEY = 'ong_financeiro_conta_tags'
const DEFAULT_TAGS = ['PIX', 'Conta Corrente', 'Boleto', 'Cartão']

function carregarTags() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const tags = Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_TAGS
    return tags.filter(Boolean)
  } catch {
    return DEFAULT_TAGS
  }
}

function salvarTags(tags) {
  const normalizadas = Array.from(new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean)))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizadas))
  return normalizadas
}

function dispararInput(input, value) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

function criarBotao(texto, classe = 'btn btn-sm btn-outline') {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = classe
  button.textContent = texto
  return button
}

function localizarCampoConta() {
  const form = Array.from(document.querySelectorAll('form')).find((item) => item.querySelector('h1')?.textContent?.trim() === 'Nova transação')
  if (!form) return null

  const labels = Array.from(form.querySelectorAll('label'))
  const label = labels.find((item) => item.querySelector('span')?.textContent?.trim() === 'Conta')
  const input = label?.querySelector('input')
  if (!label || !input) return null

  return { form, label, input }
}

function renderizarTags(container, input) {
  let tags = carregarTags()
  const selecionada = input.value || tags[0] || 'PIX'

  if (!input.value && tags[0]) {
    dispararInput(input, tags[0])
  }

  container.innerHTML = ''

  const help = document.createElement('p')
  help.textContent = 'Selecione como o lançamento será recebido ou pago. Você pode editar as opções abaixo ou criar novas tags.'
  help.style.cssText = 'font-size:12px;color:var(--gray-500);margin:0 0 8px;'
  container.appendChild(help)

  const tagsWrap = document.createElement('div')
  tagsWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;'

  tags.forEach((tag, index) => {
    const item = document.createElement('span')
    item.className = `badge ${selecionada === tag ? 'badge-blue' : 'badge-gray'}`
    item.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:7px 10px;'

    const selectButton = document.createElement('button')
    selectButton.type = 'button'
    selectButton.textContent = tag
    selectButton.style.cssText = 'border:0;background:transparent;cursor:pointer;font:inherit;color:inherit;font-weight:700;'
    selectButton.onclick = () => {
      dispararInput(input, tag)
      renderizarTags(container, input)
    }

    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.textContent = 'Editar'
    editButton.title = `Editar ${tag}`
    editButton.style.cssText = 'border:0;background:transparent;cursor:pointer;font-size:11px;color:inherit;text-decoration:underline;'
    editButton.onclick = () => {
      const novoNome = window.prompt('Editar tag financeira:', tag)
      if (!novoNome) return
      const normalizado = novoNome.trim()
      if (!normalizado) return
      tags = tags.map((itemTag, itemIndex) => itemIndex === index ? normalizado : itemTag)
      salvarTags(tags)
      if (selecionada === tag) dispararInput(input, normalizado)
      renderizarTags(container, input)
    }

    const deleteButton = document.createElement('button')
    deleteButton.type = 'button'
    deleteButton.textContent = '×'
    deleteButton.title = `Remover ${tag}`
    deleteButton.style.cssText = 'border:0;background:transparent;cursor:pointer;font-size:14px;line-height:1;color:inherit;'
    deleteButton.onclick = () => {
      if (!window.confirm(`Remover a tag "${tag}"?`)) return
      tags = tags.filter((_, itemIndex) => itemIndex !== index)
      if (!tags.length) tags = [...DEFAULT_TAGS]
      salvarTags(tags)
      if (input.value === tag) dispararInput(input, tags[0])
      renderizarTags(container, input)
    }

    item.appendChild(selectButton)
    item.appendChild(editButton)
    item.appendChild(deleteButton)
    tagsWrap.appendChild(item)
  })

  container.appendChild(tagsWrap)

  const addWrap = document.createElement('div')
  addWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;'

  const novoInput = document.createElement('input')
  novoInput.placeholder = 'Nova tag: transferência, cheque, carteira digital...'
  novoInput.style.cssText = 'max-width:330px;'

  const addButton = criarBotao('Adicionar tag')
  addButton.onclick = () => {
    const nova = novoInput.value.trim()
    if (!nova) return
    tags = salvarTags([...tags, nova])
    dispararInput(input, nova)
    renderizarTags(container, input)
  }

  addWrap.appendChild(novoInput)
  addWrap.appendChild(addButton)
  container.appendChild(addWrap)
}

function aplicarCampoTagsConta() {
  const alvo = localizarCampoConta()
  if (!alvo || alvo.label.dataset.contaTagsAplicado === 'true') return

  const { label, input } = alvo
  label.dataset.contaTagsAplicado = 'true'

  const titulo = label.querySelector('span')
  if (titulo) titulo.textContent = 'Conta / forma financeira'

  input.type = 'hidden'
  input.setAttribute('aria-hidden', 'true')

  const container = document.createElement('div')
  container.className = 'financeiro-conta-tags-editor'
  container.style.cssText = 'display:grid;gap:8px;border:1px solid var(--gray-100);border-radius:14px;padding:12px;background:var(--gray-50);'

  label.appendChild(container)
  renderizarTags(container, input)
}

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(aplicarCampoTagsConta)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('popstate', aplicarCampoTagsConta)
  setInterval(aplicarCampoTagsConta, 800)
  aplicarCampoTagsConta()
}
