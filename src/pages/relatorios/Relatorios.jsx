import { useMemo, useState } from 'react'
import { BarChart3, Download, Eye, FileText, Pencil, Printer, ShieldCheck, Trash2, X } from 'lucide-react'
import { carregarProjetos } from '../projetos/projetosData'
import { listarBeneficiarios } from '../beneficiarios/beneficiariosStorage'
import { listTransacoesStorage } from '../financeiro/transacoesStorage'
import { listComprovantesStorage } from '../financeiro/comprovantesStorage'
import { loadPessoas } from '../pessoas/pessoasStorage'
import { getOportunidades } from '../captacao/captacaoStorage'
import { listarDocumentos } from '../documentos/documentosStorage'
import { addRelatorioAudit, listRelatoriosAudit, loadRelatoriosConfig, saveRelatorioConfig } from './relatoriosStorage'

const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

const templatesRelatorio = [
  { id: 'geral', nome: 'Relatório geral da ONG', modulo: 'Geral', periodo: 'Atual', formato: 'PDF / JSON', descricao: 'Resumo institucional consolidado com pessoas, projetos, beneficiários, finanças, documentos e captação.' },
  { id: 'prestacao-projetos', nome: 'Prestação de contas por projeto', modulo: 'Projetos + Financeiro', periodo: 'Atual', formato: 'PDF / JSON', descricao: 'Receitas, despesas, comprovantes, documentos e execução vinculada aos projetos cadastrados.' },
  { id: 'impacto-social', nome: 'Impacto social', modulo: 'Pessoas + Beneficiários', periodo: 'Atual', formato: 'PDF / JSON', descricao: 'Pessoas atendidas, comunidades, termos LGPD, horas voluntárias e ações por projeto.' },
  { id: 'financeiro', nome: 'Financeiro consolidado', modulo: 'Financeiro', periodo: 'Atual', formato: 'PDF / JSON', descricao: 'Entradas, saídas, saldo, comprovantes pendentes e documentos financeiros.' },
]

function gerarBaseDados() {
  const pessoas = loadPessoas()
  const projetos = carregarProjetos()
  const beneficiarios = listarBeneficiarios()
  const transacoes = listTransacoesStorage()
  const comprovantes = listComprovantesStorage()
  const oportunidades = getOportunidades()
  const documentos = listarDocumentos()
  const receitas = transacoes.filter((t) => t.tipo === 'RECEITA').reduce((acc, t) => acc + Number(t.valor || 0), 0)
  const despesas = transacoes.filter((t) => t.tipo === 'DESPESA').reduce((acc, t) => acc + Number(t.valor || 0), 0)
  return { pessoas, projetos, beneficiarios, transacoes, comprovantes, oportunidades, documentos, receitas, despesas, saldo: receitas - despesas }
}

function montarIndicadores(base) {
  return [
    { label: 'Projetos ativos', value: String(base.projetos.filter((p) => p.status === 'EM_ANDAMENTO').length), modulo: 'Projetos' },
    { label: 'Beneficiários', value: String(base.beneficiarios.length), modulo: 'Beneficiários' },
    { label: 'Pessoas', value: String(base.pessoas.length), modulo: 'Pessoas' },
    { label: 'Saldo financeiro', value: fmt(base.saldo), modulo: 'Financeiro' },
  ]
}

function montarResumoRelatorio(template, base, config = {}) {
  const linhas = []
  if (template.id === 'geral') {
    linhas.push(['Pessoas cadastradas', base.pessoas.length], ['Beneficiários cadastrados', base.beneficiarios.length], ['Projetos cadastrados', base.projetos.length], ['Documentos cadastrados', base.documentos.length], ['Oportunidades de captação', base.oportunidades.length], ['Receitas', fmt(base.receitas)], ['Despesas', fmt(base.despesas)], ['Saldo', fmt(base.saldo)])
  }
  if (template.id === 'prestacao-projetos') {
    linhas.push(['Projetos', base.projetos.length], ['Transações financeiras', base.transacoes.length], ['Comprovantes', base.comprovantes.length], ['Comprovantes pendentes', base.comprovantes.filter((c) => c.status === 'PENDENTE').length], ['Documentos de projetos', base.documentos.filter((d) => d.modulo === 'PROJETOS').length])
  }
  if (template.id === 'impacto-social') {
    linhas.push(['Beneficiários', base.beneficiarios.length], ['Comunidades', new Set(base.beneficiarios.map((b) => b.comunidade).filter(Boolean)).size], ['Termos LGPD assinados', base.beneficiarios.filter((b) => b.termoLgpd).length], ['Horas voluntárias', base.pessoas.reduce((acc, p) => acc + Number(p.horas || 0), 0)], ['Pessoas ativas', base.pessoas.filter((p) => p.status !== 'INATIVO').length])
  }
  if (template.id === 'financeiro') {
    linhas.push(['Receitas', fmt(base.receitas)], ['Despesas', fmt(base.despesas)], ['Saldo', fmt(base.saldo)], ['Transações', base.transacoes.length], ['Comprovantes pendentes', base.comprovantes.filter((c) => c.status === 'PENDENTE').length], ['Documentos financeiros', base.documentos.filter((d) => d.modulo === 'FINANCEIRO').length])
  }
  return {
    ...template,
    titulo: config.titulo || template.nome,
    descricao: config.descricao || template.descricao,
    observacoes: config.observacoes || '',
    status: config.status || 'Rascunho auditável',
    atualizadoEm: config.atualizadoEm || '',
    linhas,
  }
}

function baixarJson(nome, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${nome.toLowerCase().replace(/\s+/g, '-')}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function Relatorios() {
  const [modal, setModal] = useState({ aberto: false, modo: 'visualizar', relatorio: null })
  const [audit, setAudit] = useState(() => listRelatoriosAudit())
  const [configs, setConfigs] = useState(() => loadRelatoriosConfig())
  const base = useMemo(() => gerarBaseDados(), [modal, configs])
  const indicadores = montarIndicadores(base)
  const relatorios = templatesRelatorio.map((template) => montarResumoRelatorio(template, base, configs[template.id] || {}))

  const registrarAuditoria = (relatorio, acao, detalhes = '') => {
    addRelatorioAudit({ relatorioId: relatorio.id, relatorioNome: relatorio.titulo || relatorio.nome, acao, detalhes })
    setAudit(listRelatoriosAudit())
  }

  const abrirModal = (relatorio, modo = 'visualizar') => {
    registrarAuditoria(relatorio, modo === 'editar' ? 'abriu edição' : 'visualizou relatório')
    setModal({ aberto: true, modo, relatorio: { ...relatorio } })
  }

  const fecharModal = () => setModal({ aberto: false, modo: 'visualizar', relatorio: null })

  const salvarRelatorio = () => {
    if (!modal.relatorio) return
    const config = saveRelatorioConfig(modal.relatorio.id, {
      titulo: modal.relatorio.titulo,
      descricao: modal.relatorio.descricao,
      observacoes: modal.relatorio.observacoes,
      status: 'Editado',
    })
    setConfigs(loadRelatoriosConfig())
    registrarAuditoria({ ...modal.relatorio, ...config }, 'editou relatório', 'Metadados do relatório foram atualizados')
    fecharModal()
  }

  const exportarPdf = (relatorio) => {
    registrarAuditoria(relatorio, 'exportou PDF', 'Exportação via impressão do navegador')
    setModal({ aberto: true, modo: 'pdf', relatorio })
    setTimeout(() => window.print(), 100)
  }

  const exportarJson = (relatorio) => {
    registrarAuditoria(relatorio, 'baixou JSON', 'Exportação estruturada dos dados do relatório')
    baixarJson(relatorio.titulo || relatorio.nome, { relatorio, base })
  }

  const limparEdicao = (relatorio) => {
    const current = loadRelatoriosConfig()
    delete current[relatorio.id]
    localStorage.setItem('ong.relatorios.config', JSON.stringify(current))
    setConfigs(loadRelatoriosConfig())
    registrarAuditoria(relatorio, 'restaurou relatório', 'Configuração editada foi removida')
  }

  return (
    <div className="mod-relatorios animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Relatórios reais, editáveis e auditáveis conectados aos módulos da plataforma</p>
        </div>
        <button className="btn btn-primary" onClick={() => exportarPdf(relatorios[0])}><Printer size={16} /> Gerar PDF geral</button>
      </div>

      <section className="report-cover card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: 12 }}>Relatórios auditáveis</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gray-900)' }}>Painel de Gestão Social</h2>
            <p style={{ color: 'var(--gray-500)', maxWidth: 720, marginTop: 8 }}>Os relatórios abaixo são calculados com os dados reais cadastrados nos módulos de pessoas, beneficiários, projetos, financeiro, documentos e captação.</p>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--gray-400)', fontSize: 13 }}>
            <strong style={{ color: 'var(--gray-700)' }}>Gerado em</strong><br />{new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </section>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {indicadores.map((item, index) => (
          <div className={`stat-card ${index === 0 ? 'mod-dashboard' : index === 1 ? 'mod-beneficiarios' : index === 2 ? 'mod-pessoas' : 'mod-financeiro'}`} key={item.label}>
            <div className="stat-icon">{index === 3 ? <Download size={20} /> : <BarChart3 size={20} />}</div>
            <div><div className="stat-label">{item.label}</div><div className="stat-value" style={{ fontSize: item.value.includes('R$') ? 22 : undefined }}>{item.value}</div></div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Relatório</th><th>Módulos conectados</th><th>Descrição</th><th>Período</th><th>Status</th><th className="no-print">Ações</th></tr></thead>
            <tbody>
              {relatorios.map((relatorio) => (
                <tr key={relatorio.id}>
                  <td><strong>{relatorio.titulo}</strong></td>
                  <td>{relatorio.modulo}</td>
                  <td>{relatorio.descricao}</td>
                  <td>{relatorio.periodo}</td>
                  <td><span className={`badge ${relatorio.status === 'Editado' ? 'badge-blue' : 'badge-yellow'}`}>{relatorio.status}</span></td>
                  <td className="no-print">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => abrirModal(relatorio, 'visualizar')}><Eye size={13} /> Visualizar</button>
                      <button className="btn btn-sm btn-outline" onClick={() => abrirModal(relatorio, 'editar')}><Pencil size={13} /> Editar</button>
                      <button className="btn btn-sm btn-outline" onClick={() => exportarJson(relatorio)}><Download size={13} /> JSON</button>
                      <button className="btn btn-sm btn-primary" onClick={() => exportarPdf(relatorio)}><Printer size={13} /> PDF</button>
                      {configs[relatorio.id] && <button className="btn btn-sm btn-outline" onClick={() => limparEdicao(relatorio)}><Trash2 size={13} /> Restaurar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><ShieldCheck size={18} /><strong>Auditoria dos relatórios</strong></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Relatório</th><th>Ação</th><th>Usuário</th><th>Data</th><th>Detalhes</th></tr></thead>
            <tbody>
              {audit.slice(0, 10).map((item) => <tr key={item.id}><td>{item.relatorioNome}</td><td>{item.acao}</td><td>{item.usuario}</td><td>{new Date(item.criadoEm).toLocaleString('pt-BR')}</td><td>{item.detalhes || '-'}</td></tr>)}
              {audit.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Nenhuma ação auditada ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal.aberto && <RelatorioModal modal={modal} setModal={setModal} base={base} onClose={fecharModal} onSave={salvarRelatorio} />}
    </div>
  )
}

function RelatorioModal({ modal, setModal, base, onClose, onSave }) {
  const relatorio = modal.relatorio
  const editavel = modal.modo === 'editar'
  if (!relatorio) return null

  const atualizar = (campo, valor) => setModal((atual) => ({ ...atual, relatorio: { ...atual.relatorio, [campo]: valor } }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card report-print-area" style={{ width: 'min(980px, 100%)', maxHeight: '92vh', overflowY: 'auto', display: 'grid', gap: 16 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 23 }}>{editavel ? 'Editar relatório' : 'Visualizar relatório'}</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 4 }}>Visualização em modal, sem bloco inline duplicado na página principal.</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {editavel ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <input value={relatorio.titulo} onChange={(e) => atualizar('titulo', e.target.value)} placeholder="Título do relatório" />
            <textarea rows={3} value={relatorio.descricao} onChange={(e) => atualizar('descricao', e.target.value)} placeholder="Descrição" />
            <textarea rows={4} value={relatorio.observacoes || ''} onChange={(e) => atualizar('observacoes', e.target.value)} placeholder="Observações de análise, ressalvas ou parecer técnico" />
          </div>
        ) : null}

        <div className="report-cover" style={{ border: '1px solid var(--gray-100)', borderRadius: 12, padding: 18 }}>
          <div className="badge badge-blue" style={{ marginBottom: 10 }}>{relatorio.modulo}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)', marginBottom: 8 }}>{relatorio.titulo}</h1>
          <p style={{ color: 'var(--gray-500)' }}>{relatorio.descricao}</p>
          {relatorio.observacoes && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--gray-50)', color: 'var(--gray-700)' }}><strong>Observações:</strong><br />{relatorio.observacoes}</div>}
        </div>

        <div className="grid-4">
          <MiniStat label="Pessoas" value={base.pessoas.length} />
          <MiniStat label="Beneficiários" value={base.beneficiarios.length} />
          <MiniStat label="Projetos" value={base.projetos.length} />
          <MiniStat label="Saldo" value={fmt(base.saldo)} />
        </div>

        <div>
          <h3 style={{ marginBottom: 10 }}>Indicadores do relatório</h3>
          <div className="table-wrap"><table><thead><tr><th>Indicador</th><th>Valor</th></tr></thead><tbody>{relatorio.linhas.map(([label, value]) => <tr key={label}><td>{label}</td><td><strong>{value}</strong></td></tr>)}</tbody></table></div>
        </div>

        <div>
          <h3 style={{ marginBottom: 10 }}>Comunicação com módulos</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <ModuleLine nome="Pessoas" total={base.pessoas.length} />
            <ModuleLine nome="Beneficiários" total={base.beneficiarios.length} />
            <ModuleLine nome="Projetos" total={base.projetos.length} />
            <ModuleLine nome="Financeiro" total={base.transacoes.length} detalhe={`${fmt(base.receitas)} em receitas / ${fmt(base.despesas)} em despesas`} />
            <ModuleLine nome="Documentos" total={base.documentos.length} />
            <ModuleLine nome="Captação" total={base.oportunidades.length} />
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-outline" onClick={onClose}>Fechar</button>
          {editavel && <button className="btn btn-primary" onClick={onSave}>Salvar edição</button>}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return <div className="stat-card mod-dashboard"><div><div className="stat-label">{label}</div><div className="stat-value" style={{ fontSize: String(value).includes('R$') ? 18 : 22 }}>{value}</div></div></div>
}

function ModuleLine({ nome, total, detalhe }) {
  return <div style={{ border: '1px solid var(--gray-100)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><strong>{nome}</strong><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{detalhe || 'Dados lidos diretamente do módulo'}</div></div><span className="badge badge-gray">{total} registro(s)</span></div>
}
