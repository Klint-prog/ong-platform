import { useParams } from 'react-router-dom'
import CadastroEntity from './CadastroEntity'

const PESSOAS_MOCK = {
  1: { nome: 'Maria Silva', email: 'maria@email.com', telefone: '(81) 99123-4567', tags: ['Voluntária', 'Liderança'] },
  2: { nome: 'João Costa', email: 'joao@email.com', telefone: '(81) 98765-4321', tags: ['Beneficiário'] },
  3: { nome: 'Ana Beatriz', email: 'ana@email.com', telefone: '(81) 99234-5678', tags: ['Membro', 'Facilitadora'] },
}

export function NovaPessoaPage() {
  return (
    <CadastroEntity titulo="Nova pessoa" subtitulo="Cadastre membros, voluntários, beneficiários ou doadores" cor="var(--pink-500)"
      campos={[
        { name: 'nome', label: 'Nome completo', placeholder: 'Ex.: Maria da Silva' },
        { name: 'email', label: 'E-mail', type: 'email', placeholder: 'nome@email.com' },
        { name: 'telefone', label: 'Telefone', placeholder: '(81) 99999-9999' },
        { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Ex.: Voluntário, Doador, Membro' },
      ]}
    />
  )
}

export function EditarPessoaPage() {
  const { id } = useParams()
  const pessoa = PESSOAS_MOCK[id] || { nome: '', email: '', telefone: '', tags: [] }

  return (
    <CadastroEntity titulo="Editar pessoa" subtitulo="Atualize dados e tags da pessoa" cor="var(--pink-500)"
      campos={[
        { name: 'nome', label: 'Nome completo', defaultValue: pessoa.nome },
        { name: 'email', label: 'E-mail', type: 'email', defaultValue: pessoa.email },
        { name: 'telefone', label: 'Telefone', defaultValue: pessoa.telefone },
        { name: 'tags', label: 'Tags', type: 'tags', defaultTags: pessoa.tags, placeholder: 'Adicione novas tags' },
      ]}
    />
  )
}

export function NovaTransacaoPage() {
  return (
    <CadastroEntity titulo="Nova transação" subtitulo="Registre receitas e despesas da organização" cor="var(--green-500)"
      campos={[
        { name: 'descricao', label: 'Descrição', placeholder: 'Ex.: Doação - Empresa XYZ' },
        { name: 'categoria', label: 'Categoria', placeholder: 'Ex.: Doações' },
        { name: 'valor', label: 'Valor', type: 'number', placeholder: '0,00' },
        { name: 'tipo', label: 'Tipo', placeholder: 'RECEITA ou DESPESA' },
      ]}
    />
  )
}

export function NovoProjetoPage() {
  return (
    <CadastroEntity titulo="Novo projeto" subtitulo="Crie um projeto com metas, período e orçamento" cor="var(--yellow-500)"
      campos={[
        { name: 'nome', label: 'Nome do projeto', placeholder: 'Ex.: Horta Solidária' },
        { name: 'inicio', label: 'Data de início', type: 'date' },
        { name: 'fim', label: 'Data de fim', type: 'date' },
        { name: 'orcamento', label: 'Orçamento (R$)', type: 'number', placeholder: '10000' },
        { name: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Descreva os objetivos do projeto...' },
      ]}
    />
  )
}

export function NovoEnvioPage() {
  return (
    <CadastroEntity titulo="Novo envio" subtitulo="Envie notificações ou e-mails para públicos da ONG" cor="var(--lilac-500)"
      campos={[
        { name: 'destinatario', label: 'Destinatário', placeholder: 'grupo ou e-mail' },
        { name: 'assunto', label: 'Assunto', placeholder: 'Ex.: Convite para reunião' },
        { name: 'mensagem', label: 'Mensagem', type: 'textarea', placeholder: 'Escreva a mensagem...' },
      ]}
    />
  )
}
