import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Grid2X2,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { criarPasta, excluirPasta, listarPastas } from './documentosStorage'

const statusConfig = {
  ATUALIZADO: { label: 'Atualizado', badge: 'badge-green', icon: CheckCircle2 },
  PENDENTE_REVISAO: { label: 'Pendente revisão', badge: 'badge-yellow', icon: AlertTriangle },
  VALIDADO: { label: 'Validado', badge: 'badge-green', icon: ShieldCheck },
  VENCE_EM_BREVE: { label: 'Vence em breve', badge: 'badge-red', icon: AlertTriangle },
}

const statusEditaveis = Object.entries(statusConfig).filter(([key]) => key !== 'VENCE_EM_BREVE')

const moduloLabels = {
  GERAL: 'Geral',
  INSTITUCIONAL: 'Institucional',
  FINANCEIRO: 'Financeiro',
  PROJETOS: 'Projetos',
  BENEFICIARIOS: 'Beneficiários',
  CAPTACAO: 'Captação',
}

const categorias = ['Documento', 'Comprovante', 'Contrato', 'Ata', 'Certidão', 'Recibo', 'Ofício', 'Prestação de contas', 'Termo LGPD', 'Dossiê']
const formatosAceitos = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.zip,.rar,.odt,.ott,.ods,.ots,.odp,.otp,.odg,.odf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf'

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function getFileIcon(doc) {
  if (doc.mimeType?.startsWith('image/')) return FileImage
  if (doc.mimeType?.includes('zip') || doc.mimeType?.includes('rar')) return FileArchive
  return FileText
}

function getBreadcrumbs(pastas, folderId) {
  const mapa = new Map(pastas.map((pasta) => [String(pasta.id), pasta]))
  const caminho = []
  let atual = mapa.get(String(folderId))
  while (atual) {
    caminho.unshift(atual)
    atual = atual.parentId ? mapa.get(String(atual.parentId)) : null
  }
  return caminho
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) {
    let message = 'Falha na comunicação com o servidor.'
    try {
      const body = await response.json()
      message = body.error || message
    } catch {
      message = await response.text().catch(() => message)
    }
    throw new Error(message)
  }
  return response.json()
}

async function listarDocumentosApi() {
  return requestJson('/api/documentos')
}

async function uploadDocumentoApi(file, metadados) {
  const formData = new FormData()
  formData.append('arquivo', file)
  formData.append('nome', file.name)
  formData.append('mimeType', file.type || 'application/octet-stream')
  formData.append('tamanho', String(file.size))
  formData.append('folderId', metadados.folderId || 'root')
  formData.append('modulo', metadados.modulo || 'GERAL')
  formData.append('categoria', metadados.categoria || 'Documento')
  formData.append('projeto', metadados.projeto || '')
  formData.append('validade', metadados.validade || '')
  formData.append('status', metadados.status || 'PENDENTE_REVISAO')
  formData.append('tags', JSON.stringify(metadados.tags || []))

  return requestJson('/api/documentos/upload', { method: 'POST', body: formData })
}

async function atualizarDocumentoApi(doc) {
  return requestJson(`/api/documentos/${encodeURIComponent(doc.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  })
}

async function excluirDocumentoApi(id) {
  return requestJson(`/api/documentos/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

function abrirUrlNovaAba(url) {
  if (!url) return
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) window.alert('O navegador bloqueou a nova aba. Libere pop-ups para esta página.')
}

export default function Documentos() {
  const [pastas, setPastas] = useState(() => listarPastas())
  const [docs, setDocs] = useState([])
  const [folderAtual, setFolderAtual] = useState('root')
  const [busca, setBusca] = useState('')
  const [modoVisual, setModoVisual] = useState('lista')
  const [uploadAberto, setUploadAberto] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewMaximizado, setPreviewMaximizado] = useState(false)
  const [editandoDoc, setEditandoDoc] = useState(null)
  const [novoNomePasta, setNovoNomePasta] = useState('')
  const [menuPasta, setMenuPasta] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [formUpload, setFormUpload] = useState({ modulo: 'GERAL', categoria: 'Documento', projeto: '', validade: '', tags: '', status: 'PENDENTE_REVISAO' })
  const fileInputRef = useRef(null)

  const pastaAtual = pastas.find((pasta) => String(pasta.id) === String(folderAtual)) || pastas[0]
  const breadcrumbs = getBreadcrumbs(pastas, folderAtual)
  const subpastas = useMemo(() => pastas.filter((pasta) => String(pasta.parentId) === String(folderAtual)), [pastas, folderAtual])
  const documentosDaPasta = useMemo(() => docs.filter((doc) => String(doc.folderId || 'root') === String(folderAtual)), [docs, folderAtual])

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const baseDocs = termo ? docs : documentosDaPasta
    return baseDocs.filter((doc) => [doc.nome, doc.nomeOriginal, doc.categoria, doc.modulo, doc.projeto, ...(doc.tags || [])].join(' ').toLowerCase().includes(termo))
  }, [busca, docs, documentosDaPasta])

  const totalPendencias = docs.filter((doc) => ['PENDENTE_REVISAO', 'VENCE_EM_BREVE'].includes(doc.status)).length
  const totalValidados = docs.filter((doc) => doc.status === 'VALIDADO').length

  const recarregar = async () => {
    setPastas(listarPastas())
    setErro('')
    try {
      const data = await listarDocumentosApi()
      setDocs(Array.isArray(data) ? data : [])
    } catch (error) {
      setErro(error.message || 'Não foi possível carregar os documentos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    recarregar()
  }, [])

  const abrirPreview = (doc) => {
    setPreviewDoc(doc)
    setPreviewMaximizado(false)
  }

  const criarNovaPasta = () => {
    const nome = novoNomePasta.trim()
    if (!nome) return
    criarPasta({ nome, parentId: folderAtual, modulo: pastaAtual?.modulo || 'GERAL' })
    setNovoNomePasta('')
    setMenuPasta(false)
    setPastas(listarPastas())
  }

  const excluirPastaAtual = async (pasta) => {
    if (pasta.sistema) return window.alert('Pastas padrão do sistema não podem ser excluídas.')
    if (!window.confirm(`Excluir a pasta "${pasta.nome}"? Os documentos não serão apagados; eles serão mantidos no banco até serem movidos ou excluídos.`)) return
    excluirPasta(pasta.id)
    if (String(folderAtual) === String(pasta.id)) setFolderAtual(pasta.parentId || 'root')
    setPreviewDoc((atual) => atual && String(atual.folderId) === String(pasta.id) ? null : atual)
    setPastas(listarPastas())
  }

  const uploadArquivos = async (files) => {
    const lista = Array.from(files || [])
    if (!lista.length) return
    setErro('')

    const tags = formUpload.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    try {
      for (const file of lista) {
        await uploadDocumentoApi(file, {
          folderId: folderAtual,
          modulo: formUpload.modulo,
          categoria: formUpload.categoria,
          projeto: formUpload.projeto,
          validade: formUpload.validade,
          tags,
          status: formUpload.status,
        })
      }
      setUploadAberto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await recarregar()
    } catch (error) {
      setErro(error.message || 'Falha ao enviar documento.')
    }
  }

  const baixarDocumento = (doc) => {
    if (!doc?.url) return
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.nomeOriginal || doc.nome || 'documento'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const excluirDocumento = async (doc) => {
    if (!window.confirm(`Excluir o documento "${doc.nome}"?`)) return
    setErro('')
    try {
      await excluirDocumentoApi(doc.id)
      setPreviewDoc(null)
      await recarregar()
    } catch (error) {
      setErro(error.message || 'Falha ao excluir documento.')
    }
  }

  const salvarEdicaoDoc = async () => {
    if (!editandoDoc?.nome?.trim()) return
    setErro('')
    try {
      const atualizado = await atualizarDocumentoApi({ ...editandoDoc, tags: Array.isArray(editandoDoc.tags) ? editandoDoc.tags : [] })
      setPreviewDoc((atual) => atual?.id === atualizado.id ? atualizado : atual)
      setEditandoDoc(null)
      await recarregar()
    } catch (error) {
      setErro(error.message || 'Falha ao salvar metadados.')
    }
  }

  const validarDocumento = async (doc) => {
    setErro('')
    try {
      const atualizado = await atualizarDocumentoApi({ id: doc.id, status: 'VALIDADO' })
      setPreviewDoc((atual) => atual?.id === doc.id ? atualizado : atual)
      await recarregar()
    } catch (error) {
      setErro(error.message || 'Falha ao validar documento.')
    }
  }

  const moverDocumento = async (doc, targetFolder) => {
    setErro('')
    try {
      const atualizado = await atualizarDocumentoApi({ id: doc.id, folderId: targetFolder })
      setPreviewDoc((atual) => atual?.id === doc.id ? atualizado : atual)
      await recarregar()
    } catch (error) {
      setErro(error.message || 'Falha ao mover documento.')
    }
  }

  const renderDocCard = (doc) => {
    const Icon = getFileIcon(doc)
    const cfg = statusConfig[doc.status] || statusConfig.PENDENTE_REVISAO
    const StatusIcon = cfg.icon
    return (
      <div key={doc.id} className="card" style={{ display: 'grid', gap: 10, cursor: 'pointer' }} onClick={() => abrirPreview(doc)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
            <div className="stat-icon" style={{ width: 38, height: 38 }}><Icon size={18} /></div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nome}</strong>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatBytes(doc.tamanho)} • {doc.categoria}</span>
            </div>
          </div>
          <MoreVertical size={16} color="var(--gray-400)" />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className={`badge ${cfg.badge}`}><StatusIcon size={11} /> {cfg.label}</span>
          {doc.modulo && <span className="badge badge-gray">{moduloLabels[doc.modulo] || doc.modulo}</span>}
          {doc.libreOfficePreview && <span className="badge badge-blue">Preview PDF</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="mod-documentos animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Central de Documentos</h1>
          <p className="page-subtitle">Gestão de arquivos em volume persistente, sem Base64, com pastas, metadados, vínculos e validação.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button className="btn btn-outline" onClick={() => setMenuPasta((v) => !v)}><FolderOpen size={16} /> Nova pasta</button>
          <button className="btn btn-primary" onClick={() => setUploadAberto(true)}><Upload size={16} /> Upload</button>
          {menuPasta && (
            <div className="card" style={{ position: 'absolute', right: 100, top: 'calc(100% + 8px)', width: 300, zIndex: 20, display: 'grid', gap: 8 }}>
              <strong>Nova pasta em {pastaAtual?.nome}</strong>
              <input placeholder="Nome da pasta" value={novoNomePasta} onChange={(e) => setNovoNomePasta(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={criarNovaPasta}><Plus size={14} /> Criar pasta</button>
            </div>
          )}
        </div>
      </div>

      {erro && <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red-200)', color: 'var(--red-600)' }}>{erro}</div>}

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileText size={20} /></div><div><div className="stat-label">Documentos</div><div className="stat-value">{docs.length}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><FolderOpen size={20} /></div><div><div className="stat-label">Pastas</div><div className="stat-value">{pastas.length}</div></div></div>
        <div className="stat-card mod-financeiro"><div className="stat-icon"><ShieldCheck size={20} /></div><div><div className="stat-label">Validados</div><div className="stat-value">{totalValidados}</div></div></div>
        <div className="stat-card mod-alertas"><div className="stat-icon"><AlertTriangle size={20} /></div><div><div className="stat-label">Pendências</div><div className="stat-value">{totalPendencias}</div></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'flex-start' }}>
        <aside className="card" style={{ display: 'grid', gap: 10 }}>
          <strong>Pastas</strong>
          {pastas.filter((pasta) => pasta.parentId === 'root' || pasta.id === 'root').map((pasta) => {
            const ativa = String(folderAtual) === String(pasta.id)
            return (
              <button key={pasta.id} className={`btn btn-sm ${ativa ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setFolderAtual(pasta.id)}>
                {pasta.id === 'root' ? <FolderOpen size={15} /> : <Folder size={15} />} {pasta.nome}
              </button>
            )
          })}
          <div style={{ height: 1, background: 'var(--gray-100)', margin: '6px 0' }} />
          <strong style={{ fontSize: 13 }}>Subpastas atuais</strong>
          {subpastas.length === 0 && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Nenhuma subpasta.</span>}
          {subpastas.map((pasta) => (
            <div key={pasta.id} style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-outline" style={{ justifyContent: 'flex-start', flex: 1 }} onClick={() => setFolderAtual(pasta.id)}><Folder size={15} /> {pasta.nome}</button>
              {!pasta.sistema && <button className="btn btn-sm btn-outline" onClick={() => excluirPastaAtual(pasta)}><Trash2 size={13} /></button>}
            </div>
          ))}
        </aside>

        <main style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {breadcrumbs.map((pasta, index) => (
                  <button key={pasta.id} className="btn btn-sm btn-ghost" onClick={() => setFolderAtual(pasta.id)}>
                    {index > 0 && '/'} {pasta.nome}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={`btn btn-sm ${modoVisual === 'lista' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setModoVisual('lista')}><List size={14} /></button>
                <button className={`btn btn-sm ${modoVisual === 'grade' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setModoVisual('grade')}><Grid2X2 size={14} /></button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input placeholder="Buscar por nome, categoria, tag, módulo ou projeto…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ paddingLeft: 38 }} />
            </div>
          </div>

          {carregando ? (
            <EmptyState texto="Carregando documentos…" />
          ) : modoVisual === 'grade' ? (
            <div className="grid-3">{resultados.map(renderDocCard)}{resultados.length === 0 && <EmptyState texto="Nenhum documento encontrado." />}</div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Nome</th><th>Categoria</th><th>Módulo</th><th>Projeto/Vínculo</th><th>Status</th><th>Tamanho</th><th>Ações</th></tr></thead>
                  <tbody>
                    {resultados.map((doc) => {
                      const Icon = getFileIcon(doc)
                      const cfg = statusConfig[doc.status] || statusConfig.PENDENTE_REVISAO
                      return (
                        <tr key={doc.id}>
                          <td><strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon size={15} /> {doc.nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{(doc.tags || []).join(', ')}</div></td>
                          <td><span className="badge badge-gray">{doc.categoria}</span></td>
                          <td>{moduloLabels[doc.modulo] || doc.modulo}</td>
                          <td>{doc.projeto || doc.relacionadoTipo || '-'}</td>
                          <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                          <td>{formatBytes(doc.tamanho)}</td>
                          <td><DocActions doc={doc} onPreview={abrirPreview} onEdit={setEditandoDoc} onDownload={baixarDocumento} onDelete={excluirDocumento} onValidate={validarDocumento} /></td>
                        </tr>
                      )
                    })}
                    {resultados.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhum documento encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {uploadAberto && (
        <Modal onClose={() => setUploadAberto(false)} title="Upload de documentos">
          <div className="grid-2">
            <label style={{ display: 'grid', gap: 6 }}><span>Módulo</span><select value={formUpload.modulo} onChange={(e) => setFormUpload((f) => ({ ...f, modulo: e.target.value }))}>{Object.entries(moduloLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label style={{ display: 'grid', gap: 6 }}><span>Categoria</span><select value={formUpload.categoria} onChange={(e) => setFormUpload((f) => ({ ...f, categoria: e.target.value }))}>{categorias.map((cat) => <option key={cat}>{cat}</option>)}</select></label>
          </div>
          <div className="grid-2">
            <input placeholder="Projeto ou vínculo" value={formUpload.projeto} onChange={(e) => setFormUpload((f) => ({ ...f, projeto: e.target.value }))} />
            <input type="date" value={formUpload.validade} onChange={(e) => setFormUpload((f) => ({ ...f, validade: e.target.value }))} />
          </div>
          <input placeholder="Tags separadas por vírgula" value={formUpload.tags} onChange={(e) => setFormUpload((f) => ({ ...f, tags: e.target.value }))} />
          <select value={formUpload.status} onChange={(e) => setFormUpload((f) => ({ ...f, status: e.target.value }))}>{statusEditaveis.map(([value, cfg]) => <option key={value} value={value}>{cfg.label}</option>)}</select>
          <label className="btn btn-primary" style={{ width: 'fit-content', cursor: 'pointer' }}><Upload size={15} /> Selecionar arquivos<input ref={fileInputRef} type="file" multiple accept={formatosAceitos} style={{ display: 'none' }} onChange={(e) => uploadArquivos(e.target.files)} /></label>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Os arquivos agora são enviados por multipart/form-data e ficam no volume persistente do backend, não em Base64.</span>
        </Modal>
      )}

      {previewDoc && <PreviewModal doc={previewDoc} pastas={pastas} maximizado={previewMaximizado} onToggleMaximizado={() => setPreviewMaximizado((v) => !v)} onClose={() => setPreviewDoc(null)} onDownload={baixarDocumento} onDelete={excluirDocumento} onEdit={setEditandoDoc} onValidate={validarDocumento} onMove={moverDocumento} />}

      {editandoDoc && (
        <Modal onClose={() => setEditandoDoc(null)} title="Editar metadados do documento">
          <input value={editandoDoc.nome} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, nome: e.target.value }))} placeholder="Nome" />
          <div className="grid-2">
            <select value={editandoDoc.modulo || 'GERAL'} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, modulo: e.target.value }))}>{Object.entries(moduloLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={editandoDoc.categoria || 'Documento'} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, categoria: e.target.value }))}>{categorias.map((cat) => <option key={cat}>{cat}</option>)}</select>
          </div>
          <div className="grid-2"><input value={editandoDoc.projeto || ''} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, projeto: e.target.value }))} placeholder="Projeto ou vínculo" /><input type="date" value={editandoDoc.validade || ''} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, validade: e.target.value }))} /></div>
          <input value={(editandoDoc.tags || []).join(', ')} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} placeholder="Tags" />
          <select value={editandoDoc.status || 'PENDENTE_REVISAO'} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, status: e.target.value }))}>{statusEditaveis.map(([value, cfg]) => <option key={value} value={value}>{cfg.label}</option>)}</select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="btn btn-outline" onClick={() => setEditandoDoc(null)}>Cancelar</button><button className="btn btn-primary" onClick={salvarEdicaoDoc}>Salvar</button></div>
        </Modal>
      )}
    </div>
  )
}

function DocActions({ doc, onPreview, onEdit, onDownload, onDelete, onValidate }) {
  const stop = (event, callback) => {
    event.stopPropagation()
    callback()
  }

  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button className="btn btn-sm btn-outline" onClick={(event) => stop(event, () => onPreview(doc))}><Eye size={13} /> Ver</button><button className="btn btn-sm btn-outline" onClick={(event) => stop(event, () => onEdit(doc))}><Pencil size={13} /> Editar</button>{doc.status !== 'VALIDADO' && <button className="btn btn-sm btn-outline" onClick={(event) => stop(event, () => onValidate(doc))}><ShieldCheck size={13} /> Validar</button>}<button className="btn btn-sm btn-outline" onClick={(event) => stop(event, () => onDownload(doc))}><Download size={13} /> Baixar</button><button className="btn btn-sm btn-outline" onClick={(event) => stop(event, () => onDelete(doc))}><Trash2 size={13} /> Excluir</button></div>
}

function Modal({ title, children, onClose }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 24 }}><div className="card" style={{ width: 'min(860px, 100%)', maxHeight: '90vh', overflowY: 'auto', display: 'grid', gap: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{title}</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button></div>{children}</div></div>
}

function PreviewModal({ doc, pastas, maximizado, onToggleMaximizado, onClose, onDownload, onDelete, onEdit, onValidate, onMove }) {
  const Icon = getFileIcon(doc)
  const cfg = statusConfig[doc.status] || statusConfig.PENDENTE_REVISAO
  const previewSrc = doc.previewUrl || ''
  const podePreview = Boolean(previewSrc)
  const largura = maximizado ? 'calc(100vw - 40px)' : 'min(1380px, calc(100vw - 56px))'
  const altura = maximizado ? 'calc(100vh - 40px)' : 'min(86vh, 920px)'
  const alturaPreview = maximizado ? 'calc(100vh - 140px)' : 'min(72vh, 760px)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.62)', zIndex: 50, display: 'grid', placeItems: 'center', padding: maximizado ? 20 : 28 }}>
      <div className="card" style={{ width: largura, height: altura, maxHeight: 'calc(100vh - 40px)', resize: maximizado ? 'none' : 'both', overflow: 'auto', display: 'grid', gridTemplateRows: 'auto 1fr', gap: 14, minWidth: 980, minHeight: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Pré-visualização do documento</h2>
            <p style={{ marginTop: 4, color: 'var(--gray-400)', fontSize: 12 }}>Arquivos LibreOffice/OpenDocument são convertidos para PDF pelo backend.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {podePreview && <button className="btn btn-sm btn-outline" onClick={() => abrirUrlNovaAba(previewSrc)}><ExternalLink size={13} /> Abrir em nova aba</button>}
            <button className="btn btn-sm btn-outline" onClick={onToggleMaximizado}>{maximizado ? 'Restaurar' : 'Maximizar'}</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: maximizado ? 'minmax(0, 1fr) 320px' : 'minmax(0, 1fr) 360px', gap: 18, minHeight: 0 }}>
          <div style={{ border: '1px solid var(--gray-100)', borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'var(--gray-50)', minHeight: 480 }}>
            {podePreview ? (
              <iframe title={doc.nome} src={previewSrc} style={{ width: '100%', height: alturaPreview, border: 0, background: '#fff' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}><Icon size={64} /><div style={{ marginTop: 10 }}>Preview indisponível para este formato.</div><button className="btn btn-outline" style={{ marginTop: 14 }} onClick={() => onDownload(doc)}><Download size={14} /> Baixar arquivo</button></div>
            )}
          </div>

          <aside style={{ display: 'grid', gap: 10, alignContent: 'start', overflowY: 'auto', paddingRight: 4 }}>
            <h3 style={{ lineHeight: 1.35 }}>{doc.nome}</h3>
            <span className={`badge ${cfg.badge}`} style={{ width: 'fit-content' }}>{cfg.label}</span>
            {doc.libreOfficePreview && <span className="badge badge-blue" style={{ width: 'fit-content' }}>LibreOffice convertido para PDF</span>}
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Categoria: <strong>{doc.categoria}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Módulo: <strong>{moduloLabels[doc.modulo] || doc.modulo}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Tamanho: <strong>{formatBytes(doc.tamanho)}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Validade: <strong>{doc.validade || 'Sem validade'}</strong></div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(doc.tags || []).map((tag) => <span key={tag} className="badge badge-gray"><Tags size={11} /> {tag}</span>)}</div>
            <select value={doc.folderId || 'root'} onChange={(e) => onMove(doc, e.target.value)}>{pastas.map((pasta) => <option key={pasta.id} value={pasta.id}>{pasta.nome}</option>)}</select>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => onEdit(doc)}><Pencil size={14} /> Editar</button>
              {doc.status !== 'VALIDADO' && <button className="btn btn-outline" onClick={() => onValidate(doc)}><ShieldCheck size={14} /> Validar</button>}
              {podePreview && <button className="btn btn-outline" onClick={() => abrirUrlNovaAba(previewSrc)}><ExternalLink size={14} /> Nova aba</button>}
              <button className="btn btn-outline" onClick={() => onDownload(doc)}><Download size={14} /> Baixar</button>
              <button className="btn btn-outline" onClick={() => onDelete(doc)}><Trash2 size={14} /> Excluir</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ texto }) {
  return <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--gray-400)' }}>{texto}</div>
}
