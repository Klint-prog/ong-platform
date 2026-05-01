import { useMemo, useState } from 'react'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CadastroEntity from './CadastroEntity'
import { findPessoaById, upsertPessoa } from '../pessoas/pessoasStorage'

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

export function NovaTransacaoPage() {
  return (
    <CadastroEntity titulo="Nova transação" subtitulo="Registre receitas e despesas da organização" cor="var(--green-500)"
      campos={[
        { name: 'descricao', label: 'Descrição', placeholder: 'Ex.: Doação - Empresa XYZ' },
        {
          name: 'categoria',
          label: 'Categoria (tags)',
          type: 'tag-selector',
          options: [
            { name: 'Doações', color: '#22c55e' },
            { name: 'Patrocínios', color: '#a855f7' },
            { name: 'Editais', color: '#3b82f6' },
            { name: 'Aluguel', color: '#f97316' },
          ],
        },
        { name: 'valor', label: 'Valor', type: 'number', placeholder: '0,00' },
        { name: 'tipo', label: 'Tipo', placeholder: 'RECEITA ou DESPESA' },
      ]}
    />
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
  return (
    <CadastroEntity titulo="Editar cadastro institucional" subtitulo="Atualize os dados oficiais da ONG" cor="var(--purple-500)"
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
