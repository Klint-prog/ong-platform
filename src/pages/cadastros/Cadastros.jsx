import { useMemo, useState } from 'react'
import { ArrowLeft, Save, Send, Upload, X } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CadastroEntity from './CadastroEntity'
import { findPessoaById, upsertPessoa } from '../pessoas/pessoasStorage'
import { loadInstitucional, saveInstitucional } from '../institucional/institucionalStorage'
import { addTransacaoStorage } from '../financeiro/transacoesStorage'

const CAMPOS_PESSOA = [
  { name: 'nome', label: 'Nome completo', placeholder: 'Ex.: Maria da Silva' },
  { name: 'email', label: 'E-mail', type: 'email', placeholder: 'nome@email.com' },
  { name: 'telefone', label: 'Telefone', placeholder: '(81) 99999-9999' },
  { name: 'tipo', label: 'Tipo', placeholder: 'VOLUNTARIO / BENEFICIARIO / MEMBRO / DOADOR' },
]

export function NovaPessoaPage() {
  const navigate = useNavigate()

  return (
    <CadastroEntity titulo="Nova pessoa" subtitulo="Cadastre membros, voluntários, beneficiários ou doadores" cor="var(--pink-500)"
      campos={CAMPOS_PESSOA}
      onSave={(form) => {
        upsertPessoa(form)
        navigate('/pessoas')
      }}
    />
  )
}

export function EditarPessoaPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const pessoa = useMemo(() => findPessoaById(id), [id])

  return (
    <CadastroEntity titulo="Editar pessoa" subtitulo="Atualize os dados da pessoa cadastrada" cor="var(--pink-500)"
      campos={CAMPOS_PESSOA}
      initialValues={pessoa}
      onSave={(form) => {
        upsertPessoa(form, id)
        navigate('/pessoas')
      }}
    />
  )
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

export function NovaTransacaoPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    descricao: '',
    categoria: 'Doações',
    valor: '',
    tipo: 'RECEITA',
    projeto: 'Fundo Geral',
    conta: 'Conta principal ONG',
    forma: 'Manual',
    status: '',
  })
  const [anexos, setAnexos] = useState([])
  const [processandoAnexo, setProcessandoAnexo] = useState(false)

  const atualizarCampo = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }))

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
    const tipo = form.tipo || 'RECEITA'
    const dataHoje = new Date().toISOString().slice(0, 10)
    const status = form.status || (tipo === 'RECEITA' ? 'RECEBIDA' : 'PAGA')

    addTransacaoStorage({
      ...form,
      tipo,
      categoria: form.categoria || (tipo === 'RECEITA' ? 'Doações' : 'Serviços'),
      descricao: form.descricao || 'Transação sem descrição',
      valor: Number(form.valor || 0),
      status,
      data: dataHoje,
      vencimento: dataHoje,
      pagamento: ['RECEBIDA', 'PAGA'].includes(status) ? dataHoje : null,
      projeto: form.projeto || 'Fundo Geral',
      conta: form.conta || 'Conta principal ONG',
      forma: form.forma || 'Manual',
      comprovante: anexos.length ? 'PENDENTE' : 'PENDENTE',
      anexos,
    })
    navigate('/financeiro')
  }

  return (
    <form className="card animate-fade-in" onSubmit={salvar} style={{ display: 'grid', gap: 14, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Nova transação</h1>
          <p className="page-subtitle">Registre receitas e despesas com documentos de comprovação.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/financeiro')}><ArrowLeft size={16} /> Voltar</button>
      </div>

      <div className="grid-2">
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Descrição</span>
          <input value={form.descricao} onChange={(e) => atualizarCampo('descricao', e.target.value)} placeholder="Ex.: Doação - Empresa XYZ" required />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Valor</span>
          <input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => atualizarCampo('valor', e.target.value)} placeholder="0,00" required />
        </label>
      </div>

      <div className="grid-4">
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Tipo</span>
          <select value={form.tipo} onChange={(e) => atualizarCampo('tipo', e.target.value)}>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Categoria</span>
          <input value={form.categoria} onChange={(e) => atualizarCampo('categoria', e.target.value)} placeholder="Doações, Serviços, Aluguel..." />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Status</span>
          <select value={form.status} onChange={(e) => atualizarCampo('status', e.target.value)}>
            <option value="">Automático</option>
            <option value="RECEBIDA">Recebida</option>
            <option value="PREVISTA">Prevista</option>
            <option value="PAGA">Paga</option>
            <option value="APROVADA">Aprovada</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Forma</span>
          <input value={form.forma} onChange={(e) => atualizarCampo('forma', e.target.value)} placeholder="PIX, dinheiro, boleto..." />
        </label>
      </div>

      <div className="grid-2">
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Projeto</span>
          <input value={form.projeto} onChange={(e) => atualizarCampo('projeto', e.target.value)} placeholder="Fundo Geral" />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Conta</span>
          <input value={form.conta} onChange={(e) => atualizarCampo('conta', e.target.value)} placeholder="Conta principal ONG" />
        </label>
      </div>

      <div className="card-sm" style={{ display: 'grid', gap: 10, background: 'var(--gray-50)' }}>
        <div>
          <strong>Documentos de comprovação</strong>
          <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>Anexe fotos, PDFs, recibos, notas fiscais ou comprovantes bancários.</p>
        </div>
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
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/financeiro')}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Salvar transação</button>
      </div>
    </form>
  )
}

export function NovoProjetoPage() { return null }

export function NovoEnvioPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const templateInicial = state?.template
  const criandoTemplate = Boolean(state?.criarTemplate)

  const [form, setForm] = useState({
    nomeTemplate: '',
    destinatario: '',
    assunto: templateInicial?.assunto || '',
    mensagem: templateInicial ? `Olá,\n\nUtilize este template: ${templateInicial.nome}.\n\nAtenciosamente,\n{{nomeOng}}` : '',
  })

  const templatesDisponiveis = [
    { id: 1, nome: 'Boas-vindas', assunto: 'Bem-vindo(a) à {{nomeOng}}!' },
    { id: 2, nome: 'Recibo de doação', assunto: 'Recibo — doação de R$ {{valor}}' },
    { id: 3, nome: 'Convite para projeto', assunto: 'Você foi convidado(a): {{projeto}}' },
    { id: 4, nome: 'Lembrete de tarefa', assunto: 'Tarefa pendente: {{tarefa}}' },
  ]

  const usarTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      assunto: template.assunto,
      mensagem: `Olá,\n\nUtilize este template: ${template.nome}.\n\nAtenciosamente,\n{{nomeOng}}`,
    }))
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{criandoTemplate ? 'Novo template' : 'Novo envio'}</h1>
          <p className="page-subtitle">{criandoTemplate ? 'Crie templates para reaproveitar assuntos e mensagens.' : 'Envie notificações ou e-mails para públicos da ONG.'}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          {criandoTemplate && (
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Nome do template</span>
              <input placeholder="Ex.: Convite para voluntariado" value={form.nomeTemplate} onChange={(e) => setForm(prev => ({ ...prev, nomeTemplate: e.target.value }))} />
            </label>
          )}
          {!criandoTemplate && (
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Destinatário</span>
              <input placeholder="grupo ou e-mail" value={form.destinatario} onChange={(e) => setForm(prev => ({ ...prev, destinatario: e.target.value }))} />
            </label>
          )}
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Assunto</span>
            <input placeholder="Ex.: Convite para reunião" value={form.assunto} onChange={(e) => setForm(prev => ({ ...prev, assunto: e.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Mensagem</span>
            <textarea rows={8} placeholder="Escreva a mensagem..." value={form.mensagem} onChange={(e) => setForm(prev => ({ ...prev, mensagem: e.target.value }))} />
          </label>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            Variáveis disponíveis: {'{{nomeOng}}'}, {'{{nome}}'}, {'{{projeto}}'}, {'{{valor}}'}, {'{{tarefa}}'}.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" style={{ '--mod-color': 'var(--lilac-500)' }} onClick={() => navigate('/comunicacao')}>
              <Save size={15} /> {criandoTemplate ? 'Salvar template' : 'Salvar envio'}
            </button>
          </div>
        </div>

        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Usar templates durante a edição</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Clique em um template para preencher o assunto e a mensagem automaticamente.</div>
          {templatesDisponiveis.map((template) => (
            <div key={template.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 10, display: 'grid', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{template.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{template.assunto}</div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => usarTemplate(template)}>
                <Send size={13} /> Usar template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EditarInstitucionalPage() {
  const navigate = useNavigate()
  const dados = useMemo(() => loadInstitucional(), [])

  return (
    <CadastroEntity titulo="Editar cadastro institucional" subtitulo="Atualize os dados oficiais da ONG" cor="var(--purple-500)"
      initialValues={dados}
      onSave={(form) => {
        saveInstitucional(form)
        navigate('/institucional')
      }}
      campos={[
        { name: 'nome', label: 'Nome da organização', placeholder: 'Associação...' },
        { name: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
        { name: 'atuacao', label: 'Área de atuação', placeholder: 'Desenvolvimento rural...' },
        { name: 'endereco', label: 'Endereço', placeholder: 'Cidade - UF' },
        { name: 'missao', label: 'Missão', type: 'textarea', placeholder: 'Descreva a missão da ONG...' },
        { name: 'visao', label: 'Visão', type: 'textarea', placeholder: 'Descreva a visão da ONG...' },
        { name: 'presidente', label: 'Presidente', placeholder: 'Nome do(a) presidente' },
        { name: 'vicePresidente', label: 'Vice-presidente', placeholder: 'Nome do(a) vice-presidente' },
        { name: 'diretorOperacoes', label: 'Diretor de Operações', placeholder: 'Nome do(a) diretor(a) de operações' },
        { name: 'viceDiretorOperacoes', label: 'Vice-diretor de Operações', placeholder: 'Nome do(a) vice-diretor(a) de operações' },
        { name: 'secretaria', label: 'Secretária', placeholder: 'Nome da secretária' },
        { name: 'diretorFinanceiro', label: 'Diretor financeiro', placeholder: 'Nome do(a) diretor(a) financeiro(a)' },
        { name: 'viceDiretorFinanceiro', label: 'Vice-diretor financeiro', placeholder: 'Nome do(a) vice-diretor(a) financeiro(a)' },
        { name: 'conselheiro1', label: 'Conselheiro 1', placeholder: 'Nome do conselheiro 1' },
        { name: 'conselheiro2', label: 'Conselheiro 2', placeholder: 'Nome do conselheiro 2' },
        { name: 'conselheiro3', label: 'Conselheiro 3', placeholder: 'Nome do conselheiro 3' },
      ]}
    />
  )
}
