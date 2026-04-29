import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

const MODULOS = {
  pessoas: { titulo: 'Nova pessoa', campos: ['Nome completo', 'E-mail', 'Telefone'] },
  financeiro: { titulo: 'Nova transação', campos: ['Descrição', 'Categoria', 'Valor (R$)'] },
  projetos: { titulo: 'Novo projeto', campos: ['Nome do projeto', 'Orçamento (R$)', 'Data de início'] },
  comunicacao: { titulo: 'Novo envio', campos: ['Destinatário', 'Assunto', 'Mensagem'] },
  usuarios: { titulo: 'Novo usuário', campos: ['Nome', 'E-mail', 'Papel de acesso'] },
}

export default function NovoCadastro() {
  const { modulo } = useParams()
  const navigate = useNavigate()
  const config = useMemo(() => MODULOS[modulo] ?? MODULOS.pessoas, [modulo])
  const [salvando, setSalvando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    await new Promise((r) => setTimeout(r, 500))
    setSalvando(false)
    navigate(`/${modulo}`, { replace: true })
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{config.titulo}</h1>
          <p className="page-subtitle">Formulário rápido para cadastro inicial.</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          {config.campos.map((campo) => (
            <div className="input-group" key={campo}>
              <label>{campo}</label>
              <input required placeholder={`Digite ${campo.toLowerCase()}`} />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
