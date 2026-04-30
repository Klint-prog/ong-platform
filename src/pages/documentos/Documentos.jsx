import { useState } from 'react'
import { FileText, Upload, Download, AlertTriangle, FolderOpen, Search } from 'lucide-react'

const docs = [
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

export default function Documentos() {
  const [busca, setBusca] = useState('')
  const filtrados = docs.filter((d) => [d.nome, d.pasta, d.projeto, d.tipo].join(' ').toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="mod-documentos animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documentos</h1>
          <p className="page-subtitle">Central de arquivos, evidências, certidões, recibos e documentos de prestação de contas</p>
        </div>
        <button className="btn btn-primary"><Upload size={16} /> Enviar arquivo</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileText size={20} /></div><div><div className="stat-label">Arquivos</div><div className="stat-value">{docs.length}</div></div></div>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><FolderOpen size={20} /></div><div><div className="stat-label">Pastas</div><div className="stat-value">5</div></div></div>
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
                  <td style={{ display: 'flex', gap: 8 }}><button className="btn btn-sm btn-outline">Ver</button><button className="btn btn-sm btn-outline"><Download size={13} /> Baixar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
