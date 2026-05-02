import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, FileSpreadsheet, Plus, ReceiptText, Save, Trash2, TrendingDown, TrendingUp, Upload, X } from 'lucide-react'
import { addTransacaoStorage } from './transacoesStorage'
import { addOrcamentoStorage } from './financeiroStorage'

const TAGS_KEY = 'ong_financeiro_conta_tags'
const TAGS_PADRAO = ['PIX', 'Conta Corrente', 'Boleto', 'Cartão']

function carregarTagsFinanceiras() {
  if (typeof window === 'undefined') return TAGS_PADRAO
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TAGS_KEY) || '[]')
    return Array.isArray(parsed) && parsed.length ? parsed : TAGS_PADRAO
  } catch {
    return TAGS_PADRAO
  }
}

function salvarTagsFinanceiras(tags) {
  const normalizadas = Array.from(new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean)))
  window.localStorage.setItem(TAGS_KEY, JSON.stringify(normalizadas))
  return normalizadas
}

function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      nome: file.name,
      tipo: file.type || 'application/octet-stream',
      tamanho: file.size,
      conteudo: reader.result,
    })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const tipos = [
  {
    id: 'RECEITA',
    titulo: 'Receita',
    descricao: 'Entrada de dinheiro, doações, repasses e contribuições.',
    icon: TrendingUp,
    color: 'var(--green-500)',
  },
  {
    id: 'DESPESA',
    titulo: 'Despesa',
    descricao: 'Saída de dinheiro, pagamentos, compras e serviços.',
    icon: TrendingDown,
    color: 'var(--red-500)',
  },
  {
    id: 'ORCAMENTO',
    titulo: 'Orçamento',
    descricao: 'Previsão ou aprovação de valores para projeto/categoria.',
    icon: FileSpreadsheet,
    color: 'var(--blue-500)',
  },
]

function statusPorTipo(tipo) {
  if (tipo === 'RECEITA') {
    return [
      { value: '', label: 'Automático: recebida' },
      { value: 'RECEBIDA', label: 'Recebida' },
      { value: 'PREVISTA', label: 'Prevista' },
    ]
  }

  if (tipo === 'DESPESA') {
    return [
      { value: '', label: 'Automático: paga' },
      { value: 'PAGA', label: 'Paga' },
      { value: 'PREVISTA', label: 'Prevista' },
      { value: 'VENCIDA', label: 'Vencida' },
    ]
  }

  return [
    { value: '', label: 'Automático: prevista' },
    { value: 'PREVISTA', label: 'Prevista' },
    { value: 'APROVADA', label: 'Aprovada' },
  ]
}

function categoriaPadrao(tipo) {
  if (tipo === 'RECEITA') return 'Doações'
  if (tipo === 'DESPESA') return 'Serviços'
  return 'Orçamento geral'
}

function statusPadrao(tipo, status) {
  if (status) return status
  if (tipo === 'RECEITA') return 'RECEBIDA'
  if (tipo === 'DESPESA') return 'PAGA'
  return 'PREVISTA'
}

export default function NovaTransacaoPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    tipo: 'RECEITA',
    descricao: '',
    valor: '',
    categoria: 'Doações',
    projeto: 'Fundo Geral',
    conta: 'PIX',
    status: '',
    observacoes: '',
  })
  const [tags, setTags] = useState(() => carregarTagsFinanceiras())
  const [novaTag, setNovaTag] = useState('')
  const [editandoTag, setEditandoTag] = useState(null)
  const [valorTagEdicao, setValorTagEdicao] = useState('')
  const [anexos, setAnexos] = useState([])
  const [processandoAnexo, setProcessandoAnexo] = useState(false)

  const statusOptions = useMemo(() => statusPorTipo(form.tipo), [form.tipo])
  const tipoAtual = tipos.find((tipo) => tipo.id === form.tipo) || tipos[0]

  const atualizarCampo = (campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  const selecionarTipo = (tipo) => {
    setForm((atual) => ({
      ...atual,
      tipo,
      status: '',
      categoria: atual.categoria && atual.categoria !== categoriaPadrao(atual.tipo) ? atual.categoria : categoriaPadrao(tipo),
    }))
  }

  const adicionarTag = () => {
    const valor = novaTag.trim()
    if (!valor) return
    const atualizadas = salvarTagsFinanceiras([...tags, valor])
    setTags(atualizadas)
    atualizarCampo('conta', valor)
    setNovaTag('')
  }

  const salvarEdicaoTag = () => {
    const valor = valorTagEdicao.trim()
    if (!editandoTag || !valor) return
    const atualizadas = salvarTagsFinanceiras(tags.map((tag) => tag === editandoTag ? valor : tag))
    setTags(atualizadas)
    setForm((atual) => ({ ...atual, conta: atual.conta === editandoTag ? valor : atual.conta }))
    setEditandoTag(null)
    setValorTagEdicao('')
  }

  const removerTag = (tag) => {
    if (!window.confirm(`Remover a tag "${tag}"?`)) return
    const atualizadas = salvarTagsFinanceiras(tags.filter((item) => item !== tag))
    const fallback = atualizadas[0] || TAGS_PADRAO[0]
    setTags(atualizadas.length ? atualizadas : salvarTagsFinanceiras(TAGS_PADRAO))
    setForm((atual) => ({ ...atual, conta: atual.conta === tag ? fallback : atual.conta }))
  }

  const adicionarAnexos = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setProcessandoAnexo(true)
    try {
      const convertidos = await Promise.all(files.map(arquivoParaBase64))
      setAnexos((atuais) => [...convertidos, ...atuais])
    } finally {
      setProcessandoAnexo(false)
      event.target.value = ''
    }
  }

  const removerAnexo = (id) => setAnexos((atuais) => atuais.filter((anexo) => anexo.id !== id))

  const salvar = (event) => {
    event.preventDefault()
    const tipo = form.tipo
    const status = statusPadrao(tipo, form.status)
    const dataHoje = new Date().toISOString().slice(0, 10)
    const valor = Number(form.valor || 0)
    const descricao = form.descricao || (tipo === 'ORCAMENTO' ? 'Orçamento sem descrição' : 'Transação sem descrição')
    const categoria = form.categoria || categoriaPadrao(tipo)
    const projeto = form.projeto || 'Fundo Geral'
    const conta = form.conta || tags[0] || 'PIX'

    if (tipo === 'ORCAMENTO') {
      addOrcamentoStorage({
        projeto,
        categoria,
        descricao,
        previsto: valor,
        aprovado: status === 'APROVADA' ? valor : 0,
        realizado: 0,
        status,
        conta,
        data: dataHoje,
        observacoes: form.observacoes,
        anexos,
      })
      navigate('/financeiro')
      return
    }

    addTransacaoStorage({
      tipo,
      descricao,
      categoria,
      valor,
      status,
      data: dataHoje,
      vencimento: dataHoje,
      pagamento: ['RECEBIDA', 'PAGA'].includes(status) ? dataHoje : null,
      projeto,
      conta,
      forma: conta,
      observacoes: form.observacoes,
      comprovante: 'PENDENTE',
      anexos,
    })

    navigate('/financeiro')
  }

  return (
    <form className="card animate-fade-in" onSubmit={salvar} style={{ display: 'grid', gap: 20, maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Novo lançamento financeiro</h1>
          <p className="page-subtitle">Escolha se é receita, despesa ou orçamento e preencha somente as informações essenciais.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/financeiro')}><ArrowLeft size={16} /> Voltar</button>
      </div>

      <section style={{ display: 'grid', gap: 10 }}>
        <strong>1. Tipo de lançamento</strong>
        <div className="grid-3">
          {tipos.map(({ id, titulo, descricao, icon: Icon, color }) => {
            const ativo = form.tipo === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => selecionarTipo(id)}
                style={{
                  textAlign: 'left',
                  border: ativo ? `2px solid ${color}` : '1px solid var(--gray-100)',
                  borderRadius: 18,
                  padding: 16,
                  background: ativo ? 'var(--gray-50)' : '#fff',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <span style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: color, color: '#fff' }}><Icon size={18} /></span>
                <strong style={{ color: 'var(--gray-800)' }}>{titulo}</strong>
                <span style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.4 }}>{descricao}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="card-sm" style={{ display: 'grid', gap: 14, background: 'var(--gray-50)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ReceiptText size={17} color={tipoAtual.color} />
          <strong>2. Dados principais</strong>
        </div>

        <div className="grid-2">
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Descrição</span>
            <input value={form.descricao} onChange={(e) => atualizarCampo('descricao', e.target.value)} placeholder="Ex.: Doação de associado, compra de alimentos, orçamento do projeto..." required />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Valor</span>
            <input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => atualizarCampo('valor', e.target.value)} placeholder="0,00" required />
          </label>
        </div>

        <div className="grid-3">
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Categoria</span>
            <input value={form.categoria} onChange={(e) => atualizarCampo('categoria', e.target.value)} placeholder="Doações, alimentação, serviços..." />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Projeto</span>
            <input value={form.projeto} onChange={(e) => atualizarCampo('projeto', e.target.value)} placeholder="Fundo Geral" />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Status</span>
            <select value={form.status} onChange={(e) => atualizarCampo('status', e.target.value)}>
              {statusOptions.map((option) => <option key={option.value || 'AUTO'} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="card-sm" style={{ display: 'grid', gap: 12, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CreditCard size={17} color="var(--blue-500)" />
          <strong>3. Forma / conta financeira</strong>
        </div>
        <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>Use tags para indicar por onde o dinheiro entrou, saiu ou foi previsto.</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <span key={tag} className={`badge ${form.conta === tag ? 'badge-blue' : 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 10px' }}>
              {editandoTag === tag ? (
                <>
                  <input value={valorTagEdicao} onChange={(e) => setValorTagEdicao(e.target.value)} style={{ width: 150, padding: '4px 8px' }} />
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={salvarEdicaoTag}><Check size={13} /></button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditandoTag(null)}><X size={13} /></button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => atualizarCampo('conta', tag)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', font: 'inherit', fontWeight: 700 }}>{tag}</button>
                  <button type="button" title="Editar tag" onClick={() => { setEditandoTag(tag); setValorTagEdicao(tag) }} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', fontSize: 11, textDecoration: 'underline' }}>Editar</button>
                  <button type="button" title="Remover tag" onClick={() => removerTag(tag)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', fontSize: 14 }}>×</button>
                </>
              )}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={novaTag} onChange={(e) => setNovaTag(e.target.value)} placeholder="Nova tag: cheque, transferência, carteira digital..." style={{ maxWidth: 360 }} />
          <button type="button" className="btn btn-outline" onClick={adicionarTag}><Plus size={15} /> Adicionar tag</button>
        </div>
      </section>

      <section className="card-sm" style={{ display: 'grid', gap: 10, background: 'var(--gray-50)' }}>
        <div>
          <strong>4. Observações e documentos</strong>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>Anexe recibos, notas fiscais, comprovantes PIX, fotos ou PDFs. Eles irão para a aba Comprovantes.</p>
        </div>
        <textarea rows={3} value={form.observacoes} onChange={(e) => atualizarCampo('observacoes', e.target.value)} placeholder="Observações internas opcionais..." />
        <label className="btn btn-outline" style={{ width: 'fit-content', cursor: 'pointer' }}>
          <Upload size={15} /> {processandoAnexo ? 'Processando...' : 'Adicionar documentos'}
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={adicionarAnexos} style={{ display: 'none' }} />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {anexos.map((anexo) => (
            <span key={anexo.id} className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {anexo.nome}
              <button type="button" onClick={() => removerAnexo(anexo.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'inline-flex' }}><X size={12} /></button>
            </span>
          ))}
          {!anexos.length && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Nenhum documento anexado.</span>}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/financeiro')}>Cancelar</button>
        <button type="submit" className="btn btn-primary"><Save size={15} /> Salvar lançamento</button>
      </div>
    </form>
  )
}
