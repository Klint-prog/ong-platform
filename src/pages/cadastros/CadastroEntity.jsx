import { ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CadastroEntity({ titulo, subtitulo, campos, cor = 'var(--blue-500)', initialValues = {}, onSave }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialValues)

  const handleSave = () => {
    if (onSave) {
      onSave(form)
      return
    }
    navigate(-1)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{titulo}</h1>
          <p className="page-subtitle">{subtitulo}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          {campos.map((campo) => (
            <label key={campo.name} style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{campo.label}</span>
              {campo.type === 'textarea' ? (
                <textarea rows={4} placeholder={campo.placeholder} value={form[campo.name] || ''} onChange={e => setForm(prev => ({ ...prev, [campo.name]: e.target.value }))} />
              ) : campo.type === 'tag-selector' ? (
                <TagSelectorField
                  fieldName={campo.name}
                  value={form[campo.name]}
                  options={campo.options || []}
                  onChange={(next) => setForm(prev => ({ ...prev, [campo.name]: next }))}
                />
              ) : (
                <input type={campo.type || 'text'} placeholder={campo.placeholder} value={form[campo.name] || ''} onChange={e => setForm(prev => ({ ...prev, [campo.name]: e.target.value }))} />
              )}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-primary" style={{ '--mod-color': cor }} onClick={handleSave}>
            <Save size={15} /> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function TagSelectorField({ fieldName, value, options, onChange }) {
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#22c55e')
  const [customTags, setCustomTags] = useState([])

  const currentValue = value || ''
  const allTags = [...options, ...customTags]

  const handleCreateTag = () => {
    const trimmedName = tagName.trim()
    if (!trimmedName) return

    const exists = allTags.some((tag) => tag.name.toLowerCase() === trimmedName.toLowerCase())
    if (exists) {
      setTagName('')
      return
    }

    const newTag = { name: trimmedName, color: tagColor }
    setCustomTags((prev) => [...prev, newTag])
    setTagName('')
    onChange(trimmedName)
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {allTags.map((tag) => {
          const isActive = currentValue === tag.name
          return (
            <button
              key={`${fieldName}-${tag.name}`}
              type="button"
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={!isActive ? { borderColor: tag.color, color: tag.color } : {}}
              onClick={() => onChange(tag.name)}
            >
              {tag.name}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Criar nova tag"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <input
          type="color"
          value={tagColor}
          onChange={(e) => setTagColor(e.target.value)}
          title="Escolher cor da tag"
          style={{ width: 42, height: 38, padding: 4, borderRadius: 8 }}
        />
        <button type="button" className="btn btn-sm btn-outline" onClick={handleCreateTag}>Adicionar tag</button>
      </div>
    </div>
  )
}
