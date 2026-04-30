import { Building2, FileCheck2, ShieldCheck, Users, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const documentos = [
  { nome: 'Estatuto social', status: 'Atualizado', vencimento: 'Sem vencimento', badge: 'badge-green' },
  { nome: 'Ata de eleição da diretoria', status: 'Válida', vencimento: '31/12/2027', badge: 'badge-green' },
  { nome: 'Certidão negativa federal', status: 'Vence em breve', vencimento: '20/06/2026', badge: 'badge-yellow' },
  { nome: 'Comprovante de endereço', status: 'Atualizado', vencimento: '12/2026', badge: 'badge-green' },
]

const diretoria = [
  { cargo: 'Presidente', nome: 'Eliel Gomes da Silva' },
  { cargo: 'Vice-presidente', nome: 'A definir' },
  { cargo: 'Diretor de Operações', nome: 'Jhonatas Mendes' },
  { cargo: 'Vice-diretor de Operações', nome: 'A definir' },
  { cargo: 'Secretária', nome: 'A definir' },
  { cargo: 'Diretor Financeiro', nome: 'A definir' },
  { cargo: 'Vice-diretor Financeiro', nome: 'A definir' },
  { cargo: 'Conselheiros', nome: '3 membros cadastrados' },
]

export default function Institucional() {
  const navigate = useNavigate()

  return (
    <div className="mod-institucional animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Institucional</h1>
          <p className="page-subtitle">Dados oficiais da ONG, diretoria, certidões e identidade institucional</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/institucional/editar')}><Building2 size={16} /> Editar cadastro</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-institucional"><div className="stat-icon"><Building2 size={20} /></div><div><div className="stat-label">CNPJ</div><div className="stat-value" style={{ fontSize: 20 }}>07.779.623</div></div></div>
        <div className="stat-card mod-documentos"><div className="stat-icon"><FileCheck2 size={20} /></div><div><div className="stat-label">Documentos</div><div className="stat-value">18</div></div></div>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><Users size={20} /></div><div><div className="stat-label">Diretoria</div><div className="stat-value">10</div></div></div>
        <div className="stat-card mod-captacao"><div className="stat-icon"><ShieldCheck size={20} /></div><div><div className="stat-label">Conformidade</div><div className="stat-value">92%</div></div></div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 14 }}>Dados da organização</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <Info label="Nome" value="Associação de Produtores e Produtoras Rurais do Assentamento Mariano Sales" />
            <Info label="Área de atuação" value="Desenvolvimento rural, assistência social, capacitação e projetos agropecuários" />
            <Info label="Endereço" value="Engenho Sirigi, Aliança - PE" icon={<MapPin size={14} />} />
            <Info label="Missão" value="Promover autonomia, acesso a direitos e desenvolvimento sustentável para famílias do campo." />
            <Info label="Visão" value="Ser referência regional em projetos sociais rurais, transparência e impacto comunitário." />
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
                  <td><button className="btn btn-sm btn-outline">Ver arquivo</button></td>
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
