import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Grid2X2,
  List,
  MoreVertical,
  MoveRight,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  adicionarDocumento,
  atualizarDocumento,
  criarPasta,
  excluirDocumentoStorage,
  excluirPasta,
  listarDocumentos,
  listarPastas,
  moverDocumentoStorage,
} from './documentosStorage'

const statusConfig = {
  ATUALIZADO: { label: 'Atualizado', badge: 'badge-green', icon: CheckCircle2 },
  PENDENTE_REVISAO: { label: 'Pendente revisão', badge: 'badge-yellow', icon: AlertTriangle },
  VALIDADO: { label: 'Validado', badge: 'badge-green', icon: ShieldCheck },
  VENCE_EM_BREVE: { label: 'Vence em breve', badge: 'badge-red', icon: AlertTriangle },
}

const moduloLabels = {
  GERAL: 'Geral',
  INSTITUCIONAL: 'Institucional',
  FINANCEIRO: 'Financeiro',
  PROJETOS: 'Projetos',
  BENEFICIARIOS: 'Beneficiários',
  CAPTACAO: 'Captação',
}

const categorias = ['Documento', 'Comprovante', 'Contrato', 'Ata', 'Certidão', 'Recibo', 'Ofício', 'Prestação de contas', 'Termo LGPD', 'Dossiê']

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function arquivoParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getFileIcon(doc) {
  if (doc.mimeType?.startsWith('image/')) return FileImage
  if (doc.mimeType?.includes('zip') || doc.mimeType?.includes('rar')) return FileArchive
  return FileText
}

function baixarBlob(nome, conteudo, mime = 'application/json') {
  const blob = conteudo?.startsWith?.('data:') ? dataURLtoBlob(conteudo) : new Blob([conteudo], { type: mime })
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

export default function Documentos() {
  const [pastas, setPastas] = useState(() => listarPastas())
  const [docs, setDocs] = useState(() => listarDocumentos())
  const [folderAtual, setFolderAtual] = useState('root')
  const [busca, setBusca] = useState('')
  const [modoVisual, setModoVisual] = useState('lista')
  const [uploadAberto, setUploadAberto] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [editandoDoc, setEditandoDoc] = useState(null)
  const [novoNomePasta, setNovoNomePasta] = useState('')
  const [menuPasta, setMenuPasta] = useState(false)
  const [formUpload, setFormUpload] = useState({ modulo: 'GERAL', categoria: 'Documento', projeto: '', validade: '', tags: '', status: 'PENDENTE_REVISAO' })
  const fileInputRef = useRef(null)

  const pastaAtual = pastas.find((pasta) => String(pasta.id) === String(folderAtual)) || pastas[0]
  const breadcrumbs = getBreadcrumbs(pastas, folderAtual)

  const subpastas = useMemo(() => pastas.filter((pasta) => String(pasta.parentId) === String(folderAtual)), [pastas, folderAtual])
  const documentosDaPasta = useMemo(() => docs.filter((doc) => String(doc.folderId || 'root') === String(folderAtual)), [docs, folderAtual])

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const baseDocs = termo ? docs : documentosDaPasta
    return baseDocs.filter((doc) => [doc.nome, doc.categoria, doc.modulo, doc.projeto, ...(doc.tags || [])].join(' ').toLowerCase().includes(termo))
  }, [busca, docs, documentosDaPasta])

  const totalPendencias = docs.filter((doc) => ['PENDENTE_REVISAO', 'VENCE_EM_BREVE'].includes(doc.status)).length
  const totalValidados = docs.filter((doc) => doc.status === 'VALIDADO').length
  const totalComprovantes = docs.filter((doc) => doc.categoria === 'Comprovante').length

  const recarregar = () => {
    setPastas(listarPastas())
    setDocs(listarDocumentos())
  }

  const criarNovaPasta = () => {
    const nome = novoNomePasta.trim()
    if (!nome) return
    criarPasta({ nome, parentId: folderAtual, modulo: pastaAtual?.modulo || 'GERAL' })
    setNovoNomePasta('')
    setMenuPasta(false)
    recarregar()
  }

  const excluirPastaAtual = (pasta) => {
    if (pasta.sistema) return window.alert('Pastas padrão do sistema não podem ser excluídas.')
    if (!window.confirm(`Excluir a pasta "${pasta.nome}" e todos os documentos dentro dela?`)) return
    excluirPasta(pasta.id)
    if (String(folderAtual) === String(pasta.id)) setFolderAtual(pasta.parentId || 'root')
    recarregar()
  }

  const uploadArquivos = async (files) => {
    const lista = Array.from(files || [])
    if (!lista.length) return
    const tags = formUpload.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    for (const file of lista) {
      const conteudo = await arquivoParaBase64(file)
      adicionarDocumento({
        nome: file.name,
        nomeOriginal: file.name,
        mimeType: file.type,
        tamanho: file.size,
        conteudo,
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
    recarregar()
  }

  const baixarDocumento = (doc) => {
    if (doc.conteudo) return baixarBlob(doc.nome, doc.conteudo, doc.mimeType)
    baixarBlob(`${doc.nome || 'documento'}.json`, JSON.stringify(doc, null, 2), 'application/json')
  }

  const excluirDocumento = (doc) => {
    if (!window.confirm(`Excluir o documento "${doc.nome}"?`)) return
    excluirDocumentoStorage(doc.id)
    setPreviewDoc(null)
    recarregar()
  }

  const salvarEdicaoDoc = () => {
    if (!editandoDoc?.nome?.trim()) return
    atualizarDocumento({ ...editandoDoc, tags: Array.isArray(editandoDoc.tags) ? editandoDoc.tags : [] })
    setEditandoDoc(null)
    recarregar()
  }

  const validarDocumento = (doc) => {
    atualizarDocumento({ ...doc, status: 'VALIDADO', validadoPor: 'Admin', validadoEm: new Date().toISOString() })
    recarregar()
  }

  const moverDocumento = (doc, targetFolder) => {
    moverDocumentoStorage(doc.id, targetFolder)
    setPreviewDoc((atual) => atual?.id === doc.id ? { ...atual, folderId: targetFolder } : atual)
    recarregar()
  }

  const renderDocCard = (doc) => {
    const Icon = getFileIcon(doc)
    const cfg = statusConfig[doc.status] || statusConfig.PENDENTE_REVISAO
    const StatusIcon = cfg.icon
    return (
      <div key={doc.id} className="card" style={{ display: 'grid', gap: 10, cursor: 'pointer' }} onClick={() => setPreviewDoc(doc)}>
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
        </div>
      </div>
    )
  }

  return (
    <div className="mod-documentos animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Central de Documentos</h1>
          <p className="page-subtitle">Gestão de arquivos estilo File Browser, com pastas, metadados, vínculos e validação.</p>
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

          {modoVisual === 'grade' ? (
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
                          <td><DocActions doc={doc} onPreview={setPreviewDoc} onEdit={setEditandoDoc} onDownload={baixarDocumento} onDelete={excluirDocumento} onValidate={validarDocumento} /></td>
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
          <select value={formUpload.status} onChange={(e) => setFormUpload((f) => ({ ...f, status: e.target.value }))}>{Object.entries(statusConfig).map(([value, cfg]) => <option key={value} value={value}>{cfg.label}</option>)}</select>
          <label className="btn btn-primary" style={{ width: 'fit-content', cursor: 'pointer' }}><Upload size={15} /> Selecionar arquivos<input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => uploadArquivos(e.target.files)} /></label>
        </Modal>
      )}

      {previewDoc && <PreviewModal doc={previewDoc} pastas={pastas} onClose={() => setPreviewDoc(null)} onDownload={baixarDocumento} onDelete={excluirDocumento} onEdit={setEditandoDoc} onValidate={validarDocumento} onMove={moverDocumento} />}

      {editandoDoc && (
        <Modal onClose={() => setEditandoDoc(null)} title="Editar metadados do documento">
          <input value={editandoDoc.nome} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, nome: e.target.value }))} placeholder="Nome" />
          <div className="grid-2">
            <select value={editandoDoc.modulo || 'GERAL'} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, modulo: e.target.value }))}>{Object.entries(moduloLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={editandoDoc.categoria || 'Documento'} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, categoria: e.target.value }))}>{categorias.map((cat) => <option key={cat}>{cat}</option>)}</select>
          </div>
          <div className="grid-2"><input value={editandoDoc.projeto || ''} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, projeto: e.target.value }))} placeholder="Projeto ou vínculo" /><input type="date" value={editandoDoc.validade || ''} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, validade: e.target.value }))} /></div>
          <input value={(editandoDoc.tags || []).join(', ')} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) }))} placeholder="Tags" />
          <select value={editandoDoc.status || 'PENDENTE_REVISAO'} onChange={(e) => setEditandoDoc((doc) => ({ ...doc, status: e.target.value }))}>{Object.entries(statusConfig).map(([value, cfg]) => <option key={value} value={value}>{cfg.label}</option>)}</select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="btn btn-outline" onClick={() => setEditandoDoc(null)}>Cancelar</button><button className="btn btn-primary" onClick={salvarEdicaoDoc}>Salvar</button></div>
        </Modal>
      )}
    </div>
  )
}

function DocActions({ doc, onPreview, onEdit, onDownload, onDelete, onValidate }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button className="btn btn-sm btn-outline" onClick={() => onPreview(doc)}><Eye size={13} /> Ver</button><button className="btn btn-sm btn-outline" onClick={() => onEdit(doc)}><Pencil size={13} /> Editar</button>{doc.status !== 'VALIDADO' && <button className="btn btn-sm btn-outline" onClick={() => onValidate(doc)}><ShieldCheck size={13} /> Validar</button>}<button className="btn btn-sm btn-outline" onClick={() => onDownload(doc)}><Download size={13} /> Baixar</button><button className="btn btn-sm btn-outline" onClick={() => onDelete(doc)}><Trash2 size={13} /> Excluir</button></div>
}

function Modal({ title, children, onClose }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 24 }}><div className="card" style={{ width: 'min(860px, 100%)', maxHeight: '90vh', overflowY: 'auto', display: 'grid', gap: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{title}</h2><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button></div>{children}</div></div>
}

function PreviewModal({ doc, pastas, onClose, onDownload, onDelete, onEdit, onValidate, onMove }) {
  const Icon = getFileIcon(doc)
  const cfg = statusConfig[doc.status] || statusConfig.PENDENTE_REVISAO
  return <Modal title="Pré-visualização do documento" onClose={onClose}><div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}><div style={{ minHeight: 360, border: '1px solid var(--gray-100)', borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center', background: 'var(--gray-50)' }}>{doc.conteudo && (doc.mimeType?.startsWith('image/') || doc.mimeType === 'application/pdf') ? <iframe title={doc.nome} src={doc.conteudo} style={{ width: '100%', height: 420, border: 0 }} /> : <div style={{ textAlign: 'center', color: 'var(--gray-500)' }}><Icon size={54} /><div style={{ marginTop: 10 }}>Preview indisponível para este formato.</div></div>}</div><div style={{ display: 'grid', gap: 10, alignContent: 'start' }}><h3>{doc.nome}</h3><span className={`badge ${cfg.badge}`} style={{ width: 'fit-content' }}>{cfg.label}</span><div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Categoria: <strong>{doc.categoria}</strong></div><div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Módulo: <strong>{moduloLabels[doc.modulo] || doc.modulo}</strong></div><div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Tamanho: <strong>{formatBytes(doc.tamanho)}</strong></div><div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Validade: <strong>{doc.validade || 'Sem validade'}</strong></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{(doc.tags || []).map((tag) => <span key={tag} className="badge badge-gray"><Tags size={11} /> {tag}</span>)}</div><select value={doc.folderId || 'root'} onChange={(e) => onMove(doc, e.target.value)}>{pastas.map((pasta) => <option key={pasta.id} value={pasta.id}>{pasta.nome}</option>)}</select><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn btn-outline" onClick={() => onEdit(doc)}><Pencil size={14} /> Editar</button>{doc.status !== 'VALIDADO' && <button className="btn btn-outline" onClick={() => onValidate(doc)}><ShieldCheck size={14} /> Validar</button>}<button className="btn btn-outline" onClick={() => onDownload(doc)}><Download size={14} /> Baixar</button><button className="btn btn-outline" onClick={() => onDelete(doc)}><Trash2 size={14} /> Excluir</button></div></div></div></Modal>
}

function EmptyState({ texto }) {
  return <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--gray-400)' }}>{texto}</div>
}
