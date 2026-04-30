import CadastroEntity from './CadastroEntity'

export function NovaPessoaPage() {
  return (
    <CadastroEntity titulo="Nova pessoa" subtitulo="Cadastre membros, voluntários, beneficiários ou doadores" cor="var(--pink-500)"
      campos={[
        { name: 'nome', label: 'Nome completo', placeholder: 'Ex.: Maria da Silva' },
        { name: 'email', label: 'E-mail', type: 'email', placeholder: 'nome@email.com' },
        { name: 'telefone', label: 'Telefone', placeholder: '(81) 99999-9999' },
        { name: 'tipo', label: 'Tipo', placeholder: 'VOLUNTARIO / BENEFICIARIO / MEMBRO / DOADOR' },
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
