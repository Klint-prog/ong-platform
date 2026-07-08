import { useEffect, useMemo, useRef, useState } from 'react'
import NfpService from '../../services/NfpService'
import { QrCode, Hand, Landmark, Send, Trash2, CheckCircle2, MonitorCheck, Power, Volume2, FileDown, FileText, User, Copy, Undo2, ClipboardCheck, AlertTriangle, Info } from 'lucide-react'
import { getUsuarioSessao } from '../../services/authPermissions'
import { loadInstitucional } from '../institucional/institucionalStorage'

// Chave com prefixo "ong_" para ser sincronizada com o PostgreSQL pela
// camada postgresLocalStorage (chaves fora do prefixo ficam só em memória).
const STORAGE_KEY = 'ong_nfp_scans'
const MODO_MESA_KEY = 'ong_nfp_modo_mesa'
const LOTES_KEY = 'ong_nfp_lotes'

// Tempo (ms) sem novos caracteres para considerar a leitura do scanner concluída.
// Leitoras HID "digitam" muito rápido; 300ms após o último caractere é seguro.
const SCANNER_DEBOUNCE_MS = 300

// No modo mesa, intervalo entre teclas acima disso indica digitação humana
// (scanners emitem caracteres com ~10–30ms de intervalo; pessoas, 150ms+).
const INTERVALO_MAX_SCANNER_MS = 100

// Silêncio após o último caractere que encerra uma leitura no modo mesa.
const FINALIZACAO_MODO_MESA_MS = 250

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/*
  QR Code da NFC-e: URL com parâmetro `p` no formato pipe-separado.
  - Emissão online : chNFe|nVersao|tpAmb|cIdToken|cHashQRCode
  - Emissão offline: chNFe|nVersao|tpAmb|dhEmi|vNF|vICMS|digVal|cIdToken|cHash
  Quando o valor (vNF) vem no QR, usamos o valor real. Caso contrário fica
  null ("aguardando conciliação") — nunca inventamos valor.
*/
function parseNotaQr(raw) {
  const clean = String(raw || '').trim()
  if (!clean) return null

  let chaveAcesso = clean.replace(/\D/g, '').slice(0, 44)

  if (/^https?:\/\//i.test(clean)) {
    try {
      const url = new URL(clean)
      const p = url.searchParams.get('p')
      if (p) {
        const primeira = p.split('|')[0]
        if (primeira) chaveAcesso = primeira.replace(/\D/g, '').slice(0, 44)
      }
    } catch {
      // URL malformada: mantém o fallback por dígitos
    }
  }

  if (chaveAcesso.length !== 44) return null

  return {
    chaveAcesso,
    codigo: chaveAcesso,
    enviado: true,
    dataHora: new Date().toISOString(),
  }
}

/*
  Prazo da NFP: documentos sem CPF podem ser lançados no sistema da
  Nota Fiscal Paulista até o dia 20 do mês SUBSEQUENTE à emissão.
  A chave de acesso traz o ano/mês de emissão nas posições 3-6 (AAMM),
  então o prazo é calculado da própria chave.
*/
function prazoDaNota(chave = '') {
  const ano = Number(String(chave).slice(2, 4))
  const mes = Number(String(chave).slice(4, 6))
  if (!ano || !mes || mes < 1 || mes > 12) return null
  // monthIndex é 0-based: passar "mes" já resulta no mês seguinte
  return new Date(2000 + ano, mes, 20, 23, 59, 59)
}

function diasParaPrazo(prazo) {
  if (!prazo) return null
  return Math.ceil((prazo.getTime() - Date.now()) / 86400000)
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    // Fallback para contextos sem Clipboard API (ex.: HTTP sem TLS)
    const area = document.createElement('textarea')
    area.value = texto
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    document.body.removeChild(area)
    return ok
  }
}

function formatarCnpj(chave = '') {
  const cnpj = String(chave).slice(6, 20)
  if (cnpj.length !== 14) return '—'
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function ehDeHoje(iso) {
  const d = new Date(iso)
  const hoje = new Date()
  return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && d.getDate() === hoje.getDate()
}

export default function NotasPaulista() {
  const [entradaScanner, setEntradaScanner] = useState('')
  const [scans, setScans] = useState(() => safeParse(localStorage.getItem(STORAGE_KEY)))
  const [erro, setErro] = useState('')
  const [ultimaRegistrada, setUltimaRegistrada] = useState('')
  const [modoMesa, setModoMesa] = useState(() => localStorage.getItem(MODO_MESA_KEY) === 'true')
  const [registrosSessao, setRegistrosSessao] = useState(0)
  const [lotes, setLotes] = useState(() => safeParse(localStorage.getItem(LOTES_KEY)))

  const usuarioAtual = useMemo(() => getUsuarioSessao(), [])

  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const scansRef = useRef(scans)
  const audioCtxRef = useRef(null)
  const registrarRef = useRef(null)

  const nfpService = useMemo(() => new NfpService(), [])

  useEffect(() => { scansRef.current = scans }, [scans])

  /* ── Feedback sonoro (como um caixa de mercado) ─────────────── */
  const garantirAudio = () => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (Ctor) audioCtxRef.current = new Ctor()
    }
    audioCtxRef.current?.resume?.()
    return audioCtxRef.current
  }

  const tocarBeep = (tipo) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const tons = tipo === 'ok' ? [[880, 0, 0.09], [1318, 0.09, 0.12]] : [[220, 0, 0.28]]
    tons.forEach(([freq, inicio, duracao]) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0.08
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + inicio)
      osc.stop(ctx.currentTime + inicio + duracao)
    })
  }

  /* ── Registro ────────────────────────────────────────────────
     Retorna 'ok' | 'duplicada' | 'invalida'. Usa scansRef para a
     checagem de duplicidade ser confiável mesmo quando chamado de
     listeners globais (modo mesa), fora do ciclo de render. */
  const registrarScan = (valorEntrada) => {
    const bruto = valorEntrada !== undefined ? valorEntrada : entradaScanner
    const parsed = parseNotaQr(bruto)
    if (!parsed) {
      if (String(bruto || '').trim()) {
        setErro('QR Code inválido. Use a URL/QR da NFC-e com chave de 44 dígitos.')
      }
      return 'invalida'
    }

    if (scansRef.current.some((s) => s.chaveAcesso === parsed.chaveAcesso)) {
      setErro('Esta nota já foi registrada no painel.')
      setUltimaRegistrada('')
      setEntradaScanner('')
      return 'duplicada'
    }

    const novaNota = {
      ...parsed,
      id: `${Date.now()}-${parsed.chaveAcesso.slice(-6)}`,
      registradoPor: usuarioAtual?.nome || 'Usuário',
      registradoPorId: usuarioAtual?.id || '',
      lancamento: 'PENDENTE',
      lancadaPor: '',
      lancadaEm: '',
    }
    const next = [novaNota, ...scansRef.current]
    scansRef.current = next
    setScans(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

    setErro('')
    setUltimaRegistrada(parsed.chaveAcesso)
    setEntradaScanner('')
    setRegistrosSessao((n) => n + 1)
    return 'ok'
  }
  registrarRef.current = registrarScan

  /* ── Scanner de mão: registro automático no campo ────────────
     Assim que a leitora terminar de "digitar" o QR no campo
     (nenhum caractere novo por SCANNER_DEBOUNCE_MS), registra sem
     precisar de Enter. Enter, se enviado pela leitora, registra
     na hora. */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!entradaScanner.trim()) return undefined

    debounceRef.current = setTimeout(() => {
      if (parseNotaQr(entradaScanner)) {
        const resultado = registrarRef.current(entradaScanner)
        if (resultado === 'ok') tocarBeep('ok')
        inputRef.current?.focus()
      }
    }, SCANNER_DEBOUNCE_MS)

    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradaScanner])

  const aoTeclar = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const resultado = registrarRef.current()
      if (resultado === 'ok') tocarBeep('ok')
      else if (resultado === 'duplicada') tocarBeep('erro')
      inputRef.current?.focus()
    }
  }

  /* ── Scanner de mesa (mãos livres) ───────────────────────────
     Captura o teclado da página inteira: não é preciso clicar em
     campo nenhum. Caracteres que chegam em rajada (< 100ms entre
     eles) são tratados como leitura do scanner; digitação humana
     é descartada pelo intervalo. A leitura finaliza no Enter da
     leitora ou após 250ms de silêncio. */
  useEffect(() => {
    if (!modoMesa) return undefined

    const buffer = { texto: '', ultimoTs: 0 }
    let timerFinalizacao = null

    const finalizarLeitura = () => {
      const texto = buffer.texto
      buffer.texto = ''
      buffer.ultimoTs = 0
      if (!texto) return

      const resultado = registrarRef.current(texto)
      if (resultado === 'ok') {
        tocarBeep('ok')
      } else if (texto.length >= 20) {
        // Só sinaliza erro quando parece uma tentativa real de leitura;
        // teclas soltas de digitação humana são ignoradas em silêncio.
        tocarBeep('erro')
      }
    }

    const aoTeclarGlobal = (event) => {
      const alvo = event.target
      const emCampoEditavel = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
      if (emCampoEditavel) return // o fluxo do campo manual cuida dessa leitura

      if (event.key === 'Enter') {
        if (!buffer.texto) return
        event.preventDefault()
        if (timerFinalizacao) clearTimeout(timerFinalizacao)
        finalizarLeitura()
        return
      }

      if (event.key.length !== 1) return // ignora Shift, F5, setas etc.
      event.preventDefault() // evita atalhos do navegador durante a rajada

      const agora = performance.now()
      const intervalo = agora - buffer.ultimoTs

      // Intervalo longo = novo evento (leitura nova ou tecla humana solta):
      // descarta o buffer anterior e recomeça.
      if (buffer.texto && intervalo > INTERVALO_MAX_SCANNER_MS) buffer.texto = ''

      buffer.texto += event.key
      buffer.ultimoTs = agora

      if (timerFinalizacao) clearTimeout(timerFinalizacao)
      timerFinalizacao = setTimeout(finalizarLeitura, FINALIZACAO_MODO_MESA_MS)
    }

    document.addEventListener('keydown', aoTeclarGlobal, true)
    return () => {
      document.removeEventListener('keydown', aoTeclarGlobal, true)
      if (timerFinalizacao) clearTimeout(timerFinalizacao)
    }
  }, [modoMesa])

  const alternarModoMesa = () => {
    garantirAudio() // AudioContext precisa nascer num gesto do usuário
    setModoMesa((atual) => {
      const proximo = !atual
      localStorage.setItem(MODO_MESA_KEY, String(proximo))
      if (proximo) {
        setRegistrosSessao(0)
        // Tira o foco de qualquer campo para a captura global assumir
        document.activeElement?.blur?.()
      }
      return proximo
    })
  }

  const persistScans = (next) => {
    scansRef.current = next
    setScans(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const [avisoAcao, setAvisoAcao] = useState('')

  const marcarLancada = (nota) => {
    persistScans(scansRef.current.map((s) => (s.id === nota.id
      ? { ...s, lancamento: 'LANCADA', lancadaPor: usuarioAtual?.nome || 'Usuário', lancadaEm: new Date().toISOString() }
      : s)))
  }

  const desfazerLancamento = (nota) => {
    persistScans(scansRef.current.map((s) => (s.id === nota.id
      ? { ...s, lancamento: 'PENDENTE', lancadaPor: '', lancadaEm: '' }
      : s)))
  }

  const marcarPendentesComoLancadas = () => {
    const pendentes = scansRef.current.filter((s) => s.lancamento !== 'LANCADA')
    if (!pendentes.length) return
    const confirmado = window.confirm(`Marcar ${pendentes.length} nota(s) pendente(s) como lançadas no sistema da NFP? Use após concluir o lançamento no portal.`)
    if (!confirmado) return
    const agora = new Date().toISOString()
    persistScans(scansRef.current.map((s) => (s.lancamento !== 'LANCADA'
      ? { ...s, lancamento: 'LANCADA', lancadaPor: usuarioAtual?.nome || 'Usuário', lancadaEm: agora }
      : s)))
  }

  const copiarChave = async (nota) => {
    const ok = await copiarTexto(nota.chaveAcesso)
    setAvisoAcao(ok ? `Chave …${nota.chaveAcesso.slice(-8)} copiada. Cole no portal da NFP.` : 'Não foi possível copiar. Copie manualmente da tabela.')
  }

  const copiarChavesPendentes = async () => {
    const pendentes = scansRef.current.filter((s) => s.lancamento !== 'LANCADA')
    if (!pendentes.length) {
      setAvisoAcao('Nenhuma nota pendente de lançamento.')
      return
    }
    const ok = await copiarTexto(pendentes.map((s) => s.chaveAcesso).join('\n'))
    setAvisoAcao(ok ? `${pendentes.length} chave(s) pendente(s) copiada(s), uma por linha.` : 'Não foi possível copiar. Copie manualmente da tabela.')
  }

  const removerTudo = () => {
    const confirmado = window.confirm(`Remover todas as ${scans.length} notas registradas? Esta ação não pode ser desfeita.`)
    if (!confirmado) return
    scansRef.current = []
    setScans([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    setUltimaRegistrada('')
    setErro('')
  }

  const baixarConteudo = (conteudo, nomeArquivo) => {
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = nomeArquivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  const persistirLotes = (next) => {
    setLotes(next)
    localStorage.setItem(LOTES_KEY, JSON.stringify(next))
  }

  const gerarLoteTxt = () => {
    if (!scans.length) {
      setErro('Nenhuma nota registrada para gerar o lote.')
      return
    }

    const cnpjOng = String(loadInstitucional().cnpj || '').replace(/\D/g, '')
    if (cnpjOng.length !== 14) {
      setErro('Cadastre o CNPJ completo da organização no módulo Institucional antes de gerar o lote.')
      return
    }

    try {
      // O crédito é apurado pela SEFAZ a partir da chave de acesso;
      // o campo posicional de valor segue no arquivo preenchido com zeros.
      const notas = scans.map((s) => ({
        chave: s.chaveAcesso,
        dataEmissao: s.dataHora,
      }))

      const txt = nfpService.gerarArquivoLote(
        {
          cnpj: cnpjOng,
          mesReferencia: new Date().toISOString().slice(0, 7).replace('-', ''),
        },
        notas,
      )

      const agora = new Date()
      const carimbo = agora.toISOString().slice(0, 16).replace('T', '-').replace(':', 'h')
      const nomeArquivo = `nfp-lote-${carimbo}.txt`

      // Guarda o relatório no sistema (sincronizado com o PostgreSQL)
      // para permitir baixar novamente ou excluir depois.
      const registroLote = {
        id: `lote-${Date.now()}`,
        nomeArquivo,
        geradoEm: agora.toISOString(),
        geradoPor: usuarioAtual?.nome || 'Usuário',
        geradoPorId: usuarioAtual?.id || '',
        totalNotas: scans.length,
        conteudo: txt,
      }
      persistirLotes([registroLote, ...lotes])

      baixarConteudo(txt, nomeArquivo)
      setErro('')
    } catch (e) {
      setErro(e.message || 'Não foi possível gerar o arquivo posicional.')
    }
  }

  const excluirLote = (lote) => {
    const confirmado = window.confirm(`Excluir o relatório "${lote.nomeArquivo}" (${lote.totalNotas} notas, gerado por ${lote.geradoPor})? Esta ação não pode ser desfeita.`)
    if (!confirmado) return
    persistirLotes(lotes.filter((item) => item.id !== lote.id))
  }

  const resumo = useMemo(() => {
    const total = scans.length
    const lancadas = scans.filter((s) => s.lancamento === 'LANCADA').length
    const pendentes = total - lancadas
    const hoje = scans.filter((s) => ehDeHoje(s.dataHora)).length
    const vencendo = scans.filter((s) => {
      if (s.lancamento === 'LANCADA') return false
      const dias = diasParaPrazo(prazoDaNota(s.chaveAcesso))
      return dias !== null && dias <= 5
    }).length
    return { total, lancadas, pendentes, hoje, vencendo }
  }, [scans])

  return (
    <div className="mod-financeiro animate-fade-in">
      <style>{'@keyframes nfpPulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .45; transform: scale(.8) } }'}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Módulo Nota Fiscal Paulista</h1>
          <p className="page-subtitle">Integração com scanner de mão ou de mesa para envio e acompanhamento das notas fiscais</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card mod-financeiro">
          <div className="stat-icon"><QrCode size={20} /></div>
          <div><div className="stat-label">Notas escaneadas</div><div className="stat-value">{resumo.total}</div></div>
        </div>
        <div className="stat-card mod-projetos">
          <div className="stat-icon"><Send size={20} /></div>
          <div><div className="stat-label">Registradas hoje</div><div className="stat-value">{resumo.hoje}</div></div>
        </div>
        <div className="stat-card mod-captacao">
          <div className="stat-icon"><AlertTriangle size={20} /></div>
          <div><div className="stat-label">Pendentes de lançamento</div><div className="stat-value">{resumo.pendentes}{resumo.vencendo > 0 && <span style={{ fontSize: 12, color: 'var(--red-600)', marginLeft: 8 }}>{resumo.vencendo} perto do prazo</span>}</div></div>
        </div>
        <div className="stat-card mod-dashboard">
          <div className="stat-icon"><Landmark size={20} /></div>
          <div><div className="stat-label">Lançadas na NFP</div><div className="stat-value">{resumo.lancadas}</div></div>
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>O lançamento oficial é feito no <strong>portal da Nota Fiscal Paulista</strong> (nfp.fazenda.sp.gov.br) pelos <strong>usuários cadastradores</strong> da entidade, com CPF e senha próprios, colando a chave de acesso de cada nota. <strong>Prazo: dia 20 do mês seguinte à emissão.</strong> Use “Copiar chaves pendentes”, lance no portal e depois marque as notas como lançadas aqui.</span>
      </div>

      {/* ── Scanner de mesa (mãos livres) ─────────────────────── */}
      <div className="card" style={{ marginBottom: 16, borderColor: modoMesa ? 'var(--green-500, #22c55e)' : undefined, borderWidth: modoMesa ? 1.5 : undefined, borderStyle: modoMesa ? 'solid' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MonitorCheck size={16} />
            <strong>Scanner de mesa — modo mãos livres</strong>
          </div>

          {modoMesa && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--green-600, #16a34a)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green-500, #22c55e)', animation: 'nfpPulse 1.2s ease-in-out infinite' }} />
              Escutando leituras — aproxime a nota do scanner
            </span>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {modoMesa && registrosSessao > 0 && (
              <span className="badge badge-green">{registrosSessao} nota{registrosSessao > 1 ? 's' : ''} nesta sessão</span>
            )}
            <button className={modoMesa ? 'btn btn-outline' : 'btn btn-primary'} onClick={alternarModoMesa}>
              <Power size={15} /> {modoMesa ? 'Desativar' : 'Ativar modo mesa'}
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          Para scanners de mesa/balcão em modo apresentação (leitura contínua): com o modo ativo, <strong>não é preciso clicar em campo nenhum</strong> — basta passar o QR Code da nota na frente do leitor que o registro acontece sozinho, com aviso sonoro <Volume2 size={12} style={{ verticalAlign: -2 }} /> de confirmação (2 toques agudos) ou de nota repetida/inválida (1 tom grave). Deixe esta tela aberta e vá passando as notas.
        </p>
      </div>

      {/* ── Scanner de mão ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Hand size={16} />
          <strong>Leitura com scanner de mão ou entrada manual</strong>
        </div>
        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 12 }}>
          Conecte o scanner no modo teclado (HID), clique no campo abaixo e faça a leitura do QR Code.
          O registro é <strong>automático</strong> ao concluir a leitura — não é preciso apertar Enter.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            autoFocus={!modoMesa}
            value={entradaScanner}
            onChange={(e) => setEntradaScanner(e.target.value)}
            onKeyDown={aoTeclar}
            onFocus={garantirAudio}
            placeholder="Leia o QR da NFC-e aqui (ou cole a URL/chave de acesso)"
          />
          <button className="btn btn-primary" onClick={() => { garantirAudio(); const r = registrarRef.current(); if (r === 'ok') tocarBeep('ok') }}>Registrar</button>
          <button className="btn btn-outline" onClick={removerTudo}><Trash2 size={15} /> Limpar</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button className="btn btn-outline" onClick={copiarChavesPendentes}><Copy size={14} /> Copiar chaves pendentes ({resumo.pendentes})</button>
          <button className="btn btn-outline" onClick={marcarPendentesComoLancadas} disabled={!resumo.pendentes}><ClipboardCheck size={14} /> Marcar pendentes como lançadas</button>
          <button className="btn btn-outline" onClick={gerarLoteTxt}><FileText size={14} /> Relatório .txt (controle interno)</button>
        </div>
        {avisoAcao && <div style={{ marginTop: 10, color: 'var(--gray-500)', fontSize: 13 }}>{avisoAcao}</div>}
        {erro && <div style={{ marginTop: 10, color: 'var(--red-600)', fontSize: 13 }}>{erro}</div>}
        {!erro && ultimaRegistrada && (
          <div style={{ marginTop: 10, color: 'var(--green-600, #16a34a)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} /> Nota <span style={{ fontFamily: 'monospace' }}>…{ultimaRegistrada.slice(-8)}</span> registrada automaticamente. Pode ler a próxima.
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Painel de notas escaneadas</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Chave de acesso</th>
                <th>CNPJ do emitente</th>
                <th>Registrada por</th>
                <th>Prazo NFP</th>
                <th>Lançamento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {scans.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>Nenhuma nota registrada ainda. Faça a leitura de um QR Code acima.</td></tr>
              )}
              {scans.map((nota) => {
                const lancada = nota.lancamento === 'LANCADA'
                const prazo = prazoDaNota(nota.chaveAcesso)
                const dias = diasParaPrazo(prazo)
                let prazoBadge = null
                if (lancada) {
                  prazoBadge = <span style={{ color: 'var(--gray-300)' }}>—</span>
                } else if (!prazo) {
                  prazoBadge = <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>Não identificado</span>
                } else if (dias < 0) {
                  prazoBadge = <span className="badge badge-red"><AlertTriangle size={11} /> Vencido em {prazo.toLocaleDateString('pt-BR')}</span>
                } else if (dias <= 5) {
                  prazoBadge = <span className="badge badge-yellow"><AlertTriangle size={11} /> Vence em {dias === 0 ? 'hoje' : `${dias} dia${dias > 1 ? 's' : ''}`}</span>
                } else {
                  prazoBadge = <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Até {prazo.toLocaleDateString('pt-BR')}</span>
                }
                return (
                  <tr key={nota.id}>
                    <td>{new Date(nota.dataHora).toLocaleString('pt-BR')}</td>
                    <td style={{ fontFamily: 'monospace' }}>{nota.chaveAcesso}</td>
                    <td style={{ fontFamily: 'monospace' }}>{formatarCnpj(nota.chaveAcesso)}</td>
                    <td>{nota.registradoPor ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><User size={13} color="var(--gray-400)" /> {nota.registradoPor}</span> : '—'}</td>
                    <td>{prazoBadge}</td>
                    <td>
                      {lancada
                        ? <span className="badge badge-green" title={nota.lancadaEm ? `Por ${nota.lancadaPor} em ${new Date(nota.lancadaEm).toLocaleString('pt-BR')}` : undefined}><CheckCircle2 size={11} /> Lançada{nota.lancadaPor ? ` · ${nota.lancadaPor}` : ''}</span>
                        : <span className="badge badge-yellow">Pendente</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => copiarChave(nota)}><Copy size={13} /> Copiar</button>
                        {lancada
                          ? <button className="btn btn-sm btn-outline" onClick={() => desfazerLancamento(nota)}><Undo2 size={13} /> Desfazer</button>
                          : <button className="btn btn-sm btn-primary" onClick={() => marcarLancada(nota)}><ClipboardCheck size={13} /> Lançada</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Relatórios .txt gerados ───────────────────────────── */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <FileText size={16} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Relatórios gerados</div>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Relatórios .txt de controle interno/auditoria — o lançamento oficial é feito no portal da NFP</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Gerado em</th>
                <th>Arquivo</th>
                <th>Notas no lote</th>
                <th>Gerado por</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lotes.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>Nenhum relatório gerado ainda. Use o botão “Gerar .txt” acima.</td></tr>
              )}
              {lotes.map((lote) => (
                <tr key={lote.id}>
                  <td>{new Date(lote.geradoEm).toLocaleString('pt-BR')}</td>
                  <td style={{ fontFamily: 'monospace' }}>{lote.nomeArquivo}</td>
                  <td>{lote.totalNotas}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><User size={13} color="var(--gray-400)" /> {lote.geradoPor}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-outline" onClick={() => baixarConteudo(lote.conteudo, lote.nomeArquivo)}><FileDown size={14} /> Baixar</button>
                      <button className="btn btn-outline" style={{ color: 'var(--red-600)' }} onClick={() => excluirLote(lote)}><Trash2 size={14} /> Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
