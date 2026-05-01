import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Upload, Download, AlertTriangle, FolderOpen, Search, Plus, Eye, ChevronDown, Trash2 } from 'lucide-react'

const docsIniciais = [
  { id: 1, nome: 'Estatuto Social.pdf', pasta: 'Institucional', tipo: 'PDF', projeto: 'ONG', vencimento: 'Sem vencimento', status: 'ATUALIZADO' },
  { id: 2, nome: 'Lista de presença - Horta Solidária.xlsx', pasta: 'Projetos', tipo: 'Planilha', projeto: 'Horta Solidária', vencimento: 'Sem vencimento', status: 'ATUALIZADO' },
  { id: 3, nome: 'Nota fiscal materiais agrícolas.pdf', pasta: 'Financeiro', tipo: 'PDF', projeto: 'Horta Solidária', vencimento: 'Sem vencimento', status: 'PENDENTE_REVISAO' },
  { id: 4, nome: 'Certidão negativa municipal.pdf', pasta: 'Certidões', tipo: 'PDF', projeto: 'ONG', vencimento: '2026-05-25', status: 'VENCE_EM_BREVE' },
  { id: 5, nome: 'Termos LGPD beneficiários.zip', pasta: 'Beneficiários', tipo: 'Arquivo', projeto: 'Escola Digital', vencimento: 'Sem vencimento', status: 'ATUALIZADO' },
]

const status = {
  ATUALIZADO: { label: 'Atualizado', badge: 'badge-green' },
  PENDENTE_REVISAO: { label: 'Pendente revisão', badge: 'badge-yellow' },
  VENCE_EM_BREVE: { label: 'Vence em breve', badge: 'badge-red' },
}

const tipoPorExtensao = {
  pdf: 'PDF',
  xls: 'Planilha',
  xlsx: 'Planilha',
  csv: 'Planilha',
  doc: 'Documento',
  docx: 'Documento',
  ppt: 'Apresentação',
  pptx: 'Apresentação',
  zip: 'Arquivo',
  rar: 'Arquivo',
}

function criarRegistroArquivo(file, id, pastaPadrao = 'Upload') {
  const extensao = file.name.split('.').pop()?.toLowerCase() || ''
  const pastaOrigem = file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : pastaPadrao

  return {
    id,
    nome: file.name,
    pasta: pastaOrigem,
    tipo: tipoPorExtensao[extensao] || 'Arquivo',
    projeto: 'ONG',
    vencimento: 'Sem vencimento',
    status: 'ATUALIZADO',
    file,
  }
}

export default function Documentos() {
  const [busca, setBusca] = useState('')
  const [docs, setDocs] = useState(docsIniciais)
  const [menuAberto, setMenuAberto] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const uploadArquivoRef = useRef(null)
  const uploadPastaRef = useRef(null)

  const filtrados = useMemo(
    () => docs.filter((d) => [d.nome, d.pasta, d.projeto, d.tipo].join(' ').toLowerCase().includes(busca.toLowerCase())),
    [busca, docs],
  )

  const totalPastas = useMemo(() => new Set(docs.map((d) => d.pasta)).size, [docs])

  const uploadArquivos = (files) => {
    if (!files || files.length === 0) return
    const base = Date.now()
    const novos = Array.from(files).map((file, index) => criarRegistroArquivo(file, base + index))
    setDocs((prev) => [...novos, ...prev])
    setMenuAberto(false)
  }

  const criarPasta = () => {
    const nome = window.prompt('Nome da nova pasta:')?.trim()
    if (!nome) return

    setDocs((prev) => [
      {
        id: Date.now(),
        nome: `${nome} (pasta)`,
        pasta: nome,
        tipo: 'Pasta',
        projeto: 'ONG',
        vencimento: 'Sem vencimento',
        status: 'ATUALIZADO',
      },
      ...prev,
    ])
    setMenuAberto(false)
  }

  const visualizarDocumento = (doc) => {
    if (!doc.file) {
      window.alert('Visualização disponível apenas para arquivos enviados nesta sessão.')
      return
    }

    const url = URL.createObjectURL(doc.file)
    setPreviewDoc({
      nome: doc.nome,
      type: doc.file.type || 'application/octet-stream',
      url,
    })
  }

  const baixarDocumento = (doc) => {
    if (!doc.file) {
      window.alert('Download local disponível apenas para arquivos enviados nesta sessão.')
      return
    }

    const url = URL.createObjectURL(doc.file)
    const link = document.createElement('a')
    link.href = url
    link.download = doc.nome
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }


  useEffect(() => {
    return () => {
      if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url)
    }
  }, [previewDoc])

  const fecharPreview = () => {
    if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url)
    setPreviewDoc(null)
  }

  const excluirDocumento = (doc) => {
    const confirmar = window.confirm(`Deseja excluir \"${doc.nome}\"?`)
    if (!confirmar) return

    setDocs((prev) => prev.filter((item) => item.id !== doc.id))
  }

  return (
    <div className="mod-documentos animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos</h1>
          <p className="page-subtitle">Central de arquivos, evidências, certidões, recibos e documentos de prestação de contas</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-primary" onClick={() => setMenuAberto((prev) => !prev)}><Plus size={16} /> Novo <ChevronDown size={16} /></button>
          {menuAberto && (
            <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', padding: 8, minWidth: 220, zIndex: 20 }}>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={criarPasta}><FolderOpen size={15} /> Nova pasta</button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => uploadArquivoRef.current?.click()}><Upload size={15} /> Upload de arquivo</button>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => uploadPastaRef.current?.click()}><Upload size={15} /> Upload de pasta</button>
            </div>
          )}
          <input ref={uploadArquivoRef} type="file" style={{ display: 'none' }} onChange={(e) => uploadArquivos(e.target.files)} />
          <input ref={uploadPastaRef} type="file" webkitdirectory="true" directory="true" multiple style={{ display: 'none' }} onChange={(e) => uploadArquivos(e.target.files)} />
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileText size={20} /></div><div><div className="stat-label">Arquivos</div><div className="stat-value">{docs.length}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><FolderOpen size={20} /></div><div><div className="stat-label">Pastas</div><div className="stat-value">{totalPastas}</div></div></div>
        <div className="stat-card mod-captacao"><div className="stat-icon"><Download size={20} /></div><div><div className="stat-label">Downloads</div><div className="stat-value">43</div></div></div>
        <div className="stat-card mod-alertas"><div className="stat-icon"><AlertTriangle size={20} /></div><div><div className="stat-label">Pendências</div><div className="stat-value">2</div></div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input placeholder="Buscar documento, pasta, projeto ou tipo…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Documento</th><th>Pasta</th><th>Projeto</th><th>Tipo</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtrados.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{doc.nome}</strong></td>
                  <td>{doc.pasta}</td>
                  <td>{doc.projeto}</td>
                  <td><span className="badge badge-gray">{doc.tipo}</span></td>
                  <td>{doc.vencimento}</td>
                  <td><span className={`badge ${status[doc.status].badge}`}>{status[doc.status].label}</span></td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => visualizarDocumento(doc)}><Eye size={13} /> Ver</button>
                    <button className="btn btn-sm btn-outline" onClick={() => baixarDocumento(doc)}><Download size={13} /> Baixar</button>
                    <button className="btn btn-sm btn-outline" onClick={() => excluirDocumento(doc)}><Trash2 size={13} /> Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="card" style={{ width: 'min(1100px, 100%)', height: 'min(85vh, 760px)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewDoc.nome}</strong>
              <button className="btn btn-sm btn-outline" onClick={fecharPreview}>Fechar</button>
            </div>
            <iframe title={previewDoc.nome} src={previewDoc.url} style={{ width: '100%', flex: 1, border: '1px solid var(--gray-100)', borderRadius: 8 }} />
          </div>
        </div>
      )}

    </div>
  )
}
