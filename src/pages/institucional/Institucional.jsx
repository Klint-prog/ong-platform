import { Building2, FileCheck2, ShieldCheck, Users, MapPin, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadInstitucional, saveInstitucional } from './institucionalStorage'
import { AV_VADAI_LOGO_DATA_URL } from '../financeiro/financeiroLogo'

const documentos = [
  { nome: 'Estatuto social', status: 'Atualizado', vencimento: 'Sem vencimento', badge: 'badge-green', possuiArquivo: true },
  { nome: 'Ata de eleição da diretoria', status: 'Válida', vencimento: '31/12/2027', badge: 'badge-green', possuiArquivo: true },
  { nome: 'Certidão negativa federal', status: 'Vence em breve', vencimento: '20/06/2026', badge: 'badge-yellow', possuiArquivo: false },
  { nome: 'Comprovante de endereço', status: 'Atualizado', vencimento: '12/2026', badge: 'badge-green', possuiArquivo: true },
]

function arquivoParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Institucional() {
  const navigate = useNavigate()
  const [dados, setDados] = useState(() => loadInstitucional())
  const logoSrc = dados.logoUrl || AV_VADAI_LOGO_DATA_URL

  const diretoria = useMemo(() => [
    { cargo: 'Presidente', nome: dados.presidente },
    { cargo: 'Vice-presidente', nome: dados.vicePresidente },
    { cargo: 'Diretor de Operações', nome: dados.diretorOperacoes },
    { cargo: 'Vice-diretor de Operações', nome: dados.viceDiretorOperacoes },
    { cargo: 'Secretária', nome: dados.secretaria },
    { cargo: 'Diretor Financeiro', nome: dados.diretorFinanceiro },
    { cargo: 'Vice-diretor Financeiro', nome: dados.viceDiretorFinanceiro },
    { cargo: 'Conselheiros', nome: [dados.conselheiro1, dados.conselheiro2, dados.conselheiro3].filter((nome) => nome && nome !== 'A definir').length ? `${[dados.conselheiro1, dados.conselheiro2, dados.conselheiro3].filter((nome) => nome && nome !== 'A definir').length} membros cadastrados` : 'A definir' },
  ], [dados])

  const atualizarLogo = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const logoUrl = await arquivoParaDataUrl(file)
    const next = { ...dados, logoUrl }
    saveInstitucional(next)
    setDados(next)
    event.target.value = ''
  }

  const removerLogo = () => {
    const next = { ...dados, logoUrl: '' }
    saveInstitucional(next)
    setDados(next)
  }

  return (
    <div className="mod-institucional animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Institucional</h1>
          <p className="page-subtitle">Dados oficiais da ONG, diretoria, certidões e identidade institucional</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/institucional/editar')}><Building2 size={16} /> Editar cadastro</button>
      </div>

      <section className="card" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 22, alignItems: 'center' }}>
        <div style={{ border: '1px solid var(--gray-100)', borderRadius: 16, padding: 14, background: '#fff', display: 'grid', placeItems: 'center', minHeight: 145 }}>
          <img src={logoSrc} alt="Logo institucional" style={{ maxWidth: '100%', maxHeight: 130, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: 8 }}>Identidade visual</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>{dados.nomeFantasia || dados.nome}</h2>
            <p style={{ color: 'var(--gray-500)' }}>{dados.slogan || dados.atuacao}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label className="btn btn-outline" style={{ width: 'fit-content', cursor: 'pointer' }}>
              <Upload size={15} /> Inserir/alterar logo
              <input type="file" accept="image/*" onChange={atualizarLogo} style={{ display: 'none' }} />
            </label>
            {dados.logoUrl && <button className="btn btn-outline" onClick={removerLogo}>Restaurar logo padrão</button>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Este logo passa a ser usado nos documentos financeiros, relatórios e identidade da plataforma.</p>
        </div>
      </section>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-institucional"><div className="stat-icon"><Building2 size={20} /></div><div><div className="stat-label">CNPJ</div><div className="stat-value" style={{ fontSize: 20 }}>{dados.cnpj || 'Não informado'}</div></div></div>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileCheck2 size={20} /></div><div><div className="stat-label">Documentos</div><div className="stat-value">18</div></div></div>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><Users size={20} /></div><div><div className="stat-label">Diretoria</div><div className="stat-value">10</div></div></div>
        <div className="stat-card mod-captacao"><div className="stat-icon"><ShieldCheck size={20} /></div><div><div className="stat-label">Conformidade</div><div className="stat-value">92%</div></div></div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Dados da organização</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <Info label="Nome" value={dados.nome || 'Não informado'} />
            <Info label="Nome fantasia" value={dados.nomeFantasia || 'Não informado'} />
            <Info label="Área de atuação" value={dados.atuacao || 'Não informado'} />
            <Info label="Endereço" value={dados.endereco || 'Não informado'} icon={<MapPin size={14} />} />
            <Info label="E-mail" value={dados.email || 'Não informado'} />
            <Info label="Telefone" value={dados.telefone || 'Não informado'} />
            <Info label="Missão" value={dados.missao || 'Não informado'} />
            <Info label="Visão" value={dados.visao || 'Não informado'} />
          </div>
        </section>

        <section className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Diretoria e conselho</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {diretoria.map((item) => (
              <div key={item.cargo} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>{item.cargo}</span>
                <strong style={{ textAlign: 'right', color: 'var(--gray-800)' }}>{item.nome}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Documentos institucionais críticos</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Documento</th><th>Status</th><th>Vencimento</th><th>Ação</th></tr></thead>
            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.nome}>
                  <td>{doc.nome}</td>
                  <td><span className={`badge ${doc.badge}`}>{doc.status}</span></td>
                  <td>{doc.vencimento}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-outline">Ver arquivo</button>
                      <button className="btn btn-sm btn-primary" style={{ '--mod-color': 'var(--slate-500)' }}>
                        {doc.possuiArquivo ? 'Alterar documento' : 'Inserir documento'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Info({ label, value, icon }) {
  return (
    <div>
      <div style={{ color: 'var(--gray-400)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', gap: 6, alignItems: 'center' }}>{icon}{label}</div>
      <div style={{ color: 'var(--gray-800)', fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  )
}
