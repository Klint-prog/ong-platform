import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Check,
  CircleDollarSign,
  Download,
  Eye,
  FilePlus2,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Trash2,
  Trophy,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { getOportunidades, getStatusList, saveOportunidades, saveStatusList } from './captacaoStorage'

const statusPadrao = [
  { id: 'PROSPECCAO', label: 'Prospecção', color: '#6B7280', icon: FilePlus2 },
  { id: 'EM_ELABORACAO', label: 'Em elaboração', color: '#D97706', icon: CalendarClock },
  { id: 'ENVIADO', label: 'Enviado', color: '#2563EB', icon: Send },
  { id: 'APROVADO', label: 'Aprovado', color: '#16A34A', icon: Trophy },
  { id: 'REPROVADO', label: 'Reprovado', color: '#DC2626', icon: XCircle },
]

const statusIconMap = {
  PROSPECCAO: FilePlus2,
  EM_ELABORACAO: CalendarClock,
  ENVIADO: Send,
  APROVADO: Trophy,
  REPROVADO: XCircle,
}

const emptyForm = (status = 'PROSPECCAO') => ({
  nome: '',
  fonte: '',
  valor: '',
  prazo: '',
  responsavel: '',
  status,
  observacoes: '',
  documentos: [],
})

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function normalizarStatus(statusList = []) {
  const base = statusList.length ? statusList : statusPadrao
  return base.map((status) => ({
    ...status,
    icon: status.icon || statusIconMap[status.id] || FilePlus2,
  }))
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
      criadoEm: new Date().toISOString(),
    })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function baixarArquivo(nome, conteudo, tipo = 'application/json') {
  const blob = conteudo?.startsWith?.('data:') ? dataURLtoBlob(conteudo) : new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function dataURLtoBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const binary = atob(base64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export default function Captacao() {
  const [oportunidades, setOportunidades] = useState(() => getOportunidades())
  const [statusList, setStatusList] = useState(() => normalizarStatus(getStatusList()))
  const [modal, setModal] = useState({ aberto: false, modo: 'novo', id: null })
  const [novoStatusNome, setNovoStatusNome] = useState('')
  const [novoStatusCor, setNovoStatusCor] = useState('#7C3AED')
  const [form, setForm] = useState(() => emptyForm(statusList[0]?.id || 'PROSPECCAO'))
  const [processandoArquivo, setProcessandoArquivo] = useState(false)

  const statusMap = useMemo(() => Object.fromEntries(statusList.map((s) => [s.id, s])), [statusList])
  const totalProspectado = oportunidades.reduce((acc, item) => acc + Number(item.valor || 0), 0)
  const aprovado = oportunidades.filter((item) => item.status === 'APROVADO').reduce((acc, item) => acc + Number(item.valor || 0), 0)
  const prazosCriticos = oportunidades.filter((item) => {
    if (!item.prazo) return false
    const diff = new Date(`${item.prazo}T12:00:00`).getTime() - Date.now()
    const dias = diff / (1000 * 60 * 60 * 24)
    return dias >= 0 && dias <= 15
  }).length

  const persistirOportunidades = (next) => {
    setOportunidades(next)
    saveOportunidades(next)
  }

  const persistirStatus = (next) => {
    const normalizados = normalizarStatus(next)
    setStatusList(normalizados)
    saveStatusList(normalizados.map(({ icon, ...status }) => status))
  }

  const atualizarCampo = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }))

  const abrirModalNovo = () => {
    setForm(emptyForm(statusList[0]?.id || 'PROSPECCAO'))
    setModal({ aberto: true, modo: 'novo', id: null })
  }

  const abrirModalDossie = (oportunidade, modo = 'editar') => {
    setForm({
      ...emptyForm(statusList[0]?.id || 'PROSPECCAO'),
      ...oportunidade,
      valor: oportunidade.valor || '',
      documentos: Array.isArray(oportunidade.documentos) ? oportunidade.documentos : [],
      observacoes: oportunidade.observacoes || '',
    })
    setModal({ aberto: true, modo, id: oportunidade.id })
  }

  const fecharModal = () => {
    setModal({ aberto: false, modo: 'novo', id: null })
    setForm(emptyForm(statusList[0]?.id || 'PROSPECCAO'))
    setNovoStatusNome('')
  }

  const criarStatusPersonalizado = () => {
    const nome = novoStatusNome.trim()
    if (!nome) return
    const id = `CUSTOM_${Date.now()}`
    const novoStatus = { id, label: nome, color: novoStatusCor, icon: FilePlus2 }
    persistirStatus([...statusList, novoStatus])
    setForm((prev) => ({ ...prev, status: id }))
    setNovoStatusNome('')
  }

  const adicionarDocumentos = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setProcessandoArquivo(true)
    try {
      const convertidos = await Promise.all(files.map(arquivoParaBase64))
      setForm((prev) => ({ ...prev, documentos: [...convertidos, ...(prev.documentos || [])] }))
    } finally {
      setProcessandoArquivo(false)
      event.target.value = ''
    }
  }

  const removerDocumento = (id) => {
    setForm((prev) => ({ ...prev, documentos: (prev.documentos || []).filter((doc) => String(doc.id) !== String(id)) }))
  }

  const baixarDocumento = (doc) => {
    if (doc.conteudo) return baixarArquivo(doc.nome, doc.conteudo, doc.tipo)
    baixarArquivo(`${doc.nome || 'documento'}.json`, JSON.stringify(doc, null, 2), 'application/json')
  }

  const salvarOportunidade = (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      id: modal.id || Date.now(),
      nome: form.nome.trim(),
      fonte: form.fonte.trim(),
      valor: Number(form.valor) || 0,
      prazo: form.prazo,
      responsavel: form.responsavel.trim(),
      status: form.status,
      observacoes: form.observacoes || '',
      documentos: Array.isArray(form.documentos) ? form.documentos : [],
      atualizadoEm: new Date().toISOString(),
      criadoEm: form.criadoEm || new Date().toISOString(),
    }

    if (!payload.nome || !payload.fonte || !payload.prazo || !payload.responsavel) return

    if (modal.modo === 'novo') {
      persistirOportunidades([payload, ...oportunidades])
    } else {
      persistirOportunidades(oportunidades.map((item) => String(item.id) === String(payload.id) ? payload : item))
    }
    fecharModal()
  }

  const baixarDossie = (oportunidade = form) => {
    const nome = oportunidade.nome?.toLowerCase().replace(/\s+/g, '-') || 'oportunidade'
    baixarArquivo(`dossie-${nome}.json`, JSON.stringify(oportunidade, null, 2), 'application/json')
  }

  const excluirOportunidade = (id) => {
    if (!window.confirm('Deseja excluir esta oportunidade e todo o dossiê vinculado?')) return
    persistirOportunidades(oportunidades.filter((item) => String(item.id) !== String(id)))
    if (String(modal.id) === String(id)) fecharModal()
  }

  return (
    <div className="mod-captacao animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Captação de Recursos</h1>
          <p className="page-subtitle">Gerencie oportunidades, dossiês, documentos e status de captação em um único fluxo.</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModalNovo}>
          <FilePlus2 size={16} /> Nova oportunidade
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-captacao"><div className="stat-icon"><CircleDollarSign size={20} /></div><div><div className="stat-label">Prospectado</div><div className="stat-value" style={{ fontSize: 22 }}>{fmt(totalProspectado)}</div></div></div>
        <div className="stat-card mod-financeiro"><div className="stat-icon"><Trophy size={20} /></div><div><div className="stat-label">Aprovado</div><div className="stat-value" style={{ fontSize: 22 }}>{fmt(aprovado)}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><Send size={20} /></div><div><div className="stat-label">Propostas</div><div className="stat-value">{oportunidades.length}</div></div></div>
        <div className="stat-card mod-alertas"><div className="stat-icon"><CalendarClock size={20} /></div><div><div className="stat-label">Prazos críticos</div><div className="stat-value">{prazosCriticos}</div></div></div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Oportunidade</th><th>Fonte</th><th>Valor</th><th>Prazo</th><th>Responsável</th><th>Documentos</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {oportunidades.map((item) => {
                const cfg = statusMap[item.status]
                const Icon = cfg?.icon || FilePlus2
                return (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{item.observacoes ? 'Com observações no dossiê' : 'Sem observações'}</div></td>
                    <td>{item.fonte}</td>
                    <td>{fmt(Number(item.valor || 0))}</td>
                    <td>{item.prazo ? new Date(`${item.prazo}T12:00:00`).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>{item.responsavel}</td>
                    <td><span className="badge badge-gray"><Paperclip size={11} /> {(item.documentos || []).length}</span></td>
                    <td>
                      <span className="badge" style={{ background: `${cfg?.color || '#6B7280'}22`, color: cfg?.color || '#6B7280' }}>
                        <Icon size={11} /> {cfg?.label || item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => abrirModalDossie(item, 'visualizar')}><Eye size={13} /> Dossiê</button>
                        <button className="btn btn-sm btn-outline" onClick={() => abrirModalDossie(item, 'editar')}><Pencil size={13} /> Editar</button>
                        <button className="btn btn-sm btn-outline" onClick={() => baixarDossie(item)}><Download size={13} /> Baixar</button>
                        <button className="btn btn-sm btn-outline" onClick={() => excluirOportunidade(item.id)}><Trash2 size={13} /> Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {oportunidades.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma oportunidade cadastrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal.aberto && (
        <OportunidadeModal
          modo={modal.modo}
          form={form}
          statusList={statusList}
          statusMap={statusMap}
          novoStatusNome={novoStatusNome}
          novoStatusCor={novoStatusCor}
          processandoArquivo={processandoArquivo}
          onClose={fecharModal}
          onChange={atualizarCampo}
          onSubmit={salvarOportunidade}
          onAddStatus={criarStatusPersonalizado}
          onStatusName={setNovoStatusNome}
          onStatusColor={setNovoStatusCor}
          onAddDocs={adicionarDocumentos}
          onRemoveDoc={removerDocumento}
          onDownloadDoc={baixarDocumento}
          onDownloadDossie={() => baixarDossie(form)}
        />
      )}
    </div>
  )
}

function OportunidadeModal({
  modo,
  form,
  statusList,
  statusMap,
  novoStatusNome,
  novoStatusCor,
  processandoArquivo,
  onClose,
  onChange,
  onSubmit,
  onAddStatus,
  onStatusName,
  onStatusColor,
  onAddDocs,
  onRemoveDoc,
  onDownloadDoc,
  onDownloadDossie,
}) {
  const somenteLeitura = modo === 'visualizar'
  const titulo = modo === 'novo' ? 'Nova oportunidade' : modo === 'visualizar' ? 'Visualizar dossiê' : 'Editar dossiê da oportunidade'
  const cfg = statusMap[form.status]
  const StatusIcon = cfg?.icon || FilePlus2

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 24 }}>
      <form className="card" onSubmit={onSubmit} style={{ width: 'min(1060px, 100%)', maxHeight: '92vh', overflowY: 'auto', display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 23 }}>{titulo}</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 4 }}>Cadastro, edição, documentos e dossiê ficam concentrados neste modal.</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {modo !== 'novo' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${cfg?.color || '#6B7280'}22`, color: cfg?.color || '#6B7280' }}><StatusIcon size={11} /> {cfg?.label || form.status}</span>
            <span className="badge badge-gray"><Paperclip size={11} /> {(form.documentos || []).length} documento(s)</span>
            <button type="button" className="btn btn-sm btn-outline" onClick={onDownloadDossie}><Download size={13} /> Baixar dossiê</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <input placeholder="Nome" value={form.nome} disabled={somenteLeitura} onChange={(e) => onChange('nome', e.target.value)} required />
          <input placeholder="Fonte" value={form.fonte} disabled={somenteLeitura} onChange={(e) => onChange('fonte', e.target.value)} required />
          <input type="number" min="0" placeholder="Valor" value={form.valor} disabled={somenteLeitura} onChange={(e) => onChange('valor', e.target.value)} />
          <input type="date" value={form.prazo} disabled={somenteLeitura} onChange={(e) => onChange('prazo', e.target.value)} required />
          <input placeholder="Responsável" value={form.responsavel} disabled={somenteLeitura} onChange={(e) => onChange('responsavel', e.target.value)} required />
          <select value={form.status} disabled={somenteLeitura} onChange={(e) => onChange('status', e.target.value)}>
            {statusList.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
        </div>

        {!somenteLeitura && (
          <div className="card-sm" style={{ display: 'grid', gap: 10, background: 'var(--gray-50)' }}>
            <strong style={{ fontSize: 13 }}>Status personalizados</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input placeholder="Novo status/tag" value={novoStatusNome} onChange={(e) => onStatusName(e.target.value)} style={{ maxWidth: 240 }} />
              <input type="color" value={novoStatusCor} onChange={(e) => onStatusColor(e.target.value)} style={{ width: 54 }} />
              <button type="button" className="btn btn-outline btn-sm" onClick={onAddStatus}><Plus size={13} /> Adicionar status</button>
            </div>
          </div>
        )}

        <textarea placeholder="Observações do dossiê" value={form.observacoes || ''} disabled={somenteLeitura} onChange={(e) => onChange('observacoes', e.target.value)} rows={4} />

        <div className="card-sm" style={{ display: 'grid', gap: 10, background: 'var(--gray-50)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong>Documentos do dossiê</strong>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>Anexe edital, proposta, orçamento, certidões, comprovantes e demais arquivos.</p>
            </div>
            {!somenteLeitura && (
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={13} /> {processandoArquivo ? 'Processando...' : 'Inserir documentos'}
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar" onChange={onAddDocs} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {(form.documentos || []).map((doc) => (
              <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '8px 10px', background: '#fff' }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nome}</strong>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{doc.tipo || 'Arquivo'} • {formatBytes(doc.tamanho)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => onDownloadDoc(doc)}><Download size={13} /> Baixar</button>
                  {!somenteLeitura && <button type="button" className="btn btn-sm btn-outline" onClick={() => onRemoveDoc(doc.id)}><Trash2 size={13} /> Excluir</button>}
                </div>
              </div>
            ))}
            {(form.documentos || []).length === 0 && <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 14 }}>Nenhum documento anexado ao dossiê.</div>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Fechar</button>
          {!somenteLeitura && <button type="submit" className="btn btn-primary"><Check size={15} /> {modo === 'novo' ? 'Salvar oportunidade' : 'Salvar dossiê'}</button>}
        </div>
      </form>
    </div>
  )
}
