const CHAVE_TIPOS = 'ong_beneficiarios_tipos'

export const TIPOS_PADRAO = ['FAMILIA', 'MULHER_RURAL', 'JOVEM', 'GRUPO']

export function listarTipos() {
  const salvo = localStorage.getItem(CHAVE_TIPOS)
  if (!salvo) return TIPOS_PADRAO

  try {
    const dados = JSON.parse(salvo)
    if (!Array.isArray(dados) || !dados.length) return TIPOS_PADRAO
    return dados
  } catch {
    return TIPOS_PADRAO
  }
}

export function salvarTipos(tipos) {
  localStorage.setItem(CHAVE_TIPOS, JSON.stringify(tipos))
}
