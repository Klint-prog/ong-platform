import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [form, setForm] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    tipo: 'RECEITA',
    projeto: 'Fundo Geral',
    conta: 'Conta principal ONG',
    forma: 'PIX',
    status: 'PREVISTA',
    data: new Date().toISOString().slice(0, 10),
    vencimento: new Date().toISOString().slice(0, 10),
  })

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = () => {
    if (!form.descricao || !form.categoria || !form.valor) return

    const novaTransacao = {
      id: Date.now(),
      descricao: form.descricao,
      tipo: form.tipo,
      valor: Number(form.valor),
      categoria: form.categoria,
      data: form.data,
      vencimento: form.vencimento,
      pagamento: form.tipo === 'RECEITA' ? form.data : null,
      status: form.status,
      projeto: form.projeto,
      conta: form.conta,
      forma: form.forma,
      comprovante: 'PENDENTE',
      origem: form.tipo === 'RECEITA' ? 'Cadastro manual' : undefined,
      fornecedor: form.tipo === 'DESPESA' ? 'Cadastro manual' : undefined,
    }

    const chave = 'financeiro_transacoes'
    const atuais = JSON.parse(localStorage.getItem(chave) || '[]')
    localStorage.setItem(chave, JSON.stringify([novaTransacao, ...atuais]))
    navigate('/financeiro')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Nova transação</h1>
          <p className="page-subtitle">Registre receitas e despesas da organização</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <Field label="Descrição"><input value={form.descricao} onChange={(e) => onChange('descricao', e.target.value)} /></Field>
          <Field label="Categoria / tag"><input value={form.categoria} onChange={(e) => onChange('categoria', e.target.value)} placeholder="Ex.: Doações, Transporte" /></Field>
          <Field label="Valor (R$)"><input type="number" value={form.valor} onChange={(e) => onChange('valor', e.target.value)} /></Field>
          <Field label="Tipo">
            <select value={form.tipo} onChange={(e) => onChange('tipo', e.target.value)}>
              <option value="RECEITA">RECEITA</option>
              <option value="DESPESA">DESPESA</option>
            </select>
          </Field>
          <Field label="Projeto / tag"><input value={form.projeto} onChange={(e) => onChange('projeto', e.target.value)} /></Field>
          <Field label="Conta"><input value={form.conta} onChange={(e) => onChange('conta', e.target.value)} /></Field>
          <Field label="Forma"><input value={form.forma} onChange={(e) => onChange('forma', e.target.value)} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => onChange('status', e.target.value)}>
              <option value="PREVISTA">PREVISTA</option>
              <option value="RECEBIDA">RECEBIDA</option>
              <option value="PAGA">PAGA</option>
              <option value="APROVADA">APROVADA</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-primary" style={{ '--mod-color': 'var(--green-500)' }} onClick={handleSave}>
            <Save size={15} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{label}</span>
      {children}
    </label>
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
