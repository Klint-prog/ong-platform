import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { listarTipos, salvarTipos } from './tiposBeneficiario'

export default function BeneficiarioCadastroPage() {
  const { id } = useParams()
  const emEdicao = Boolean(id)
  const navigate = useNavigate()
  const [tipos, setTipos] = useState([])
  const [novoTipo, setNovoTipo] = useState('')

  useEffect(() => {
    setTipos(listarTipos())
  }, [])

  const adicionarTipo = () => {
    const normalizado = novoTipo.trim().toUpperCase().replaceAll(' ', '_')
    if (!normalizado || tipos.includes(normalizado)) return
    const atualizados = [...tipos, normalizado]
    setTipos(atualizados)
    salvarTipos(atualizados)
    setNovoTipo('')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{emEdicao ? 'Editar beneficiário' : 'Novo beneficiário'}</h1>
          <p className="page-subtitle">{emEdicao ? 'Atualize as informações do beneficiário selecionado' : 'Cadastre famílias, grupos e pessoas atendidas'}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Voltar</button>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <input placeholder="Nome do beneficiário" />
          <div style={{ display: 'grid', gap: 8 }}>
            <select>
              {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={novoTipo} onChange={(e) => setNovoTipo(e.target.value)} placeholder="Adicionar novo tipo" />
              <button className="btn btn-outline" type="button" onClick={adicionarTipo}><Plus size={14} /> Incluir tipo</button>
            </div>
          </div>
          <input placeholder="Comunidade" />
          <input placeholder="Projeto" />
          <input placeholder="Telefone" />
          <input placeholder="Status" />
          <input type="number" placeholder="Atendimentos" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-primary" style={{ '--mod-color': 'var(--blue-500)' }}><Save size={15} /> Salvar</button>
        </div>
      </div>
    </div>
  )
}
