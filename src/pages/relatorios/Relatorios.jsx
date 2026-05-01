import { BarChart3, Download, FileText, Printer, Share2 } from 'lucide-react'
import { useState } from 'react'

const relatorios = [
  { id: 1, nome: 'Relatório geral da ONG', periodo: '2026', formato: 'PDF / Excel', status: 'Pronto', descricao: 'Resumo institucional, projetos ativos, equipe, beneficiários, finanças e indicadores.' },
  { id: 2, nome: 'Prestação de contas por projeto', periodo: 'Mensal', formato: 'PDF', status: 'Em revisão', descricao: 'Receitas, despesas, comprovantes, fotos, atividades e assinatura da diretoria.' },
  { id: 3, nome: 'Impacto social', periodo: 'Trimestral', formato: 'PDF / CSV', status: 'Pronto', descricao: 'Pessoas atendidas, comunidades alcançadas, horas voluntárias e metas executadas.' },
  { id: 4, nome: 'Financeiro consolidado', periodo: 'Mensal', formato: 'Excel / CSV', status: 'Pronto', descricao: 'Entradas, saídas, saldo por centro de custo e fonte de recurso.' },
]

export default function Relatorios() {
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null)

  const visualizarRelatorio = (relatorio) => {
    setRelatorioSelecionado(relatorio)
  }

  const baixarPdf = (nome) => {
    window.print()
    console.info(`Exportando relatório: ${nome}`)
  }

  return (
    <div className="mod-relatorios animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Relatórios gerenciais, prestação de contas, impacto social e exportação em PDF</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Gerar PDF</button>
      </div>

      <section className="report-cover card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: 12 }}>Relatório executivo</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gray-900)' }}>Painel de Gestão Social</h2>
            <p style={{ color: 'var(--gray-500)', maxWidth: 720, marginTop: 8 }}>Resumo consolidado para diretoria, conselho fiscal, patrocinadores, parceiros públicos e prestação de contas.</p>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--gray-400)', fontSize: 13 }}>
            <strong style={{ color: 'var(--gray-700)' }}>ONG Platform</strong><br />Gerado em {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </section>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-dashboard"><div className="stat-icon"><BarChart3 size={20} /></div><div><div className="stat-label">Projetos ativos</div><div className="stat-value">8</div></div></div>
        <div className="stat-card mod-beneficiarios"><div className="stat-icon"><FileText size={20} /></div><div><div className="stat-label">Beneficiários</div><div className="stat-value">247</div></div></div>
        <div className="stat-card mod-financeiro"><div className="stat-icon"><Download size={20} /></div><div><div className="stat-label">Valor captado</div><div className="stat-value" style={{ fontSize: 22 }}>R$ 280 mil</div></div></div>
        <div className="stat-card mod-captacao"><div className="stat-icon"><Share2 size={20} /></div><div><div className="stat-label">Parceiros</div><div className="stat-value">16</div></div></div>
      </div>

      <div className="card">
        {relatorioSelecionado && (
          <div style={{ borderBottom: '1px solid var(--gray-200)', padding: '16px 20px', background: 'var(--gray-50)' }}>
            <h3 style={{ marginBottom: 6, color: 'var(--gray-900)' }}>Visualizando: {relatorioSelecionado.nome}</h3>
            <p style={{ color: 'var(--gray-600)', margin: 0 }}>{relatorioSelecionado.descricao}</p>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Relatório</th><th>Descrição</th><th>Período</th><th>Formato</th><th>Status</th><th className="no-print">Ações</th></tr></thead>
            <tbody>
              {relatorios.map((relatorio) => (
                <tr key={relatorio.id}>
                  <td><strong>{relatorio.nome}</strong></td>
                  <td>{relatorio.descricao}</td>
                  <td>{relatorio.periodo}</td>
                  <td>{relatorio.formato}</td>
                  <td><span className={`badge ${relatorio.status === 'Pronto' ? 'badge-green' : 'badge-yellow'}`}>{relatorio.status}</span></td>
                  <td className="no-print" style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => visualizarRelatorio(relatorio)}>Visualizar</button>
                    <button className="btn btn-sm btn-primary" onClick={() => baixarPdf(relatorio.nome)}><Download size={13} /> PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
