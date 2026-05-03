class NfpService {
  parseChave(chave) {
    const digits = String(chave || '').replace(/\D/g, '')

    if (digits.length !== 44) {
      throw new Error('A chave de acesso deve conter exatamente 44 dígitos.')
    }

    return {
      cnpjEmitente: digits.slice(6, 20),
      modelo: digits.slice(20, 22),
      serie: digits.slice(22, 25),
      numero: digits.slice(25, 34),
    }
  }

  gerarArquivoLote(dadosOng, notas) {
    if (!dadosOng?.cnpj || !dadosOng?.mesReferencia) {
      throw new Error('dadosOng deve conter cnpj e mesReferencia.')
    }

    const cnpjOng = String(dadosOng.cnpj).replace(/\D/g, '').padStart(14, '0').slice(0, 14)
    const mesReferencia = String(dadosOng.mesReferencia).replace(/\D/g, '').padStart(6, '0').slice(0, 6)

    if (mesReferencia.length !== 6) {
      throw new Error('mesReferencia deve estar no formato AAAAMM.')
    }

    const linhas = []
    const header = `10${cnpjOng}${mesReferencia}010`
    linhas.push(header)

    for (const nota of notas) {
      const { cnpjEmitente, modelo, serie, numero } = this.parseChave(nota.chave)
      const data = new Date(nota.dataEmissao)

      if (Number.isNaN(data.getTime())) {
        throw new Error(`dataEmissao inválida para a chave ${nota.chave}.`) 
      }

      const yyyy = data.getUTCFullYear().toString().padStart(4, '0')
      const mm = String(data.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(data.getUTCDate()).padStart(2, '0')
      const dataAaaammdd = `${yyyy}${mm}${dd}`

      const valorCents = Math.round(Number(nota.valor) * 100)
      if (!Number.isFinite(valorCents) || valorCents < 0) {
        throw new Error(`valor inválido para a chave ${nota.chave}.`)
      }

      const valorPosicional = String(valorCents).padStart(12, '0')

      const linha20 = `20${cnpjEmitente}${dataAaaammdd}${modelo}${serie}${numero}${valorPosicional}`
      linhas.push(linha20)
    }

    const totalLinhas = linhas.length + 1
    const trailer = `90${String(totalLinhas).padStart(8, '0')}`
    linhas.push(trailer)

    return `${linhas.join('\r\n')}\r\n`
  }
}

export default NfpService
