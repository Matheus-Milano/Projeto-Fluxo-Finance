import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const BASE_URL = 'https://fluxo-finance-api.onrender.com/api'
const API_TRANSACOES = `${BASE_URL}/transacoes/`

function App() {
  // Estados de Autenticação
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '')
  const [modoCadastro, setModoCadastro] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroAuth, setErroAuth] = useState('')

  // Estados do Fluxo Finance
  const [abaAtiva, setAbaAtiva] = useState('grafico') // 'grafico' | 'salario' | 'fixa' | 'alheia'
  const [transacoes, setTransacoes] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataTransacao, setDataTransacao] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [idEditando, setIdEditando] = useState(null)

  // Configura o cabeçalho Authorization sempre que o token mudar
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`
      carregarTransacoes()
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  const carregarTransacoes = async () => {
    try {
      const resposta = await axios.get(API_TRANSACOES)
      setTransacoes(resposta.data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      if (error.response && error.response.status === 401) {
        sairDaConta()
      }
    }
  }

  async function handleAuth(e) {
    e.preventDefault()
    setErroAuth('')

    const endpoint = modoCadastro ? `${BASE_URL}/register/` : `${BASE_URL}/login/`
    const payload = modoCadastro ? { nome, email, senha } : { email, senha }

    try {
      const res = await axios.post(endpoint, payload)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('nomeUsuario', res.data.nome || '')
      setToken(res.data.token)
      setNomeUsuario(res.data.nome || '')
      setNome('')
      setEmail('')
      setSenha('')
    } catch (error) {
      setErroAuth(error.response?.data?.erro || 'Erro ao conectar com o servidor.')
    }
  }

  function sairDaConta() {
    localStorage.removeItem('token')
    localStorage.removeItem('nomeUsuario')
    setToken('')
    setNomeUsuario('')
    setTransacoes([])
    setAbaAtiva('grafico')
  }

  function trocarAba(novaAba) {
    setAbaAtiva(novaAba)
    setDescricao('')
    setValor('')
    setIdEditando(null)
  }

  function iniciarEdicao(transacao) {
    setIdEditando(transacao.id)
    setDescricao(transacao.descricao)
    setValor(transacao.valor)
    setDataTransacao(transacao.data_transacao.slice(0, 10))
  }

  function salvarTransacao(novaTransacao) {
    axios
      .post(API_TRANSACOES, novaTransacao)
      .then(() => {
        setDescricao('')
        setValor('')
        carregarTransacoes()
      })
      .catch((error) => {
        console.error('Erro ao salvar transação:', error)
      })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const novaTransacao = {
      descricao,
      valor: parseFloat(valor),
      tipo: abaAtiva,
      data_transacao: new Date(`${dataTransacao}T12:00:00`).toISOString(),
    }

    if (idEditando) {
      axios
        .put(`${API_TRANSACOES}${idEditando}/`, novaTransacao)
        .then(() => {
          setDescricao('')
          setValor('')
          setIdEditando(null)
          carregarTransacoes()
        })
        .catch((error) => {
          console.error('Erro ao atualizar transação:', error)
        })
    } else {
      salvarTransacao(novaTransacao)
    }
  }

  // SE NÃO ESTIVER LOGADO: Mostra a tela de Login / Cadastro
  if (!token) {
    return (
      <div className="container">
        <h1>Fluxo Finance</h1>

        <main className="painel-principal" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2 className="titulo-aba">
            {modoCadastro ? 'Criar Nova Conta' : 'Acessar Minha Conta'}
          </h2>

          <form className="formulario" onSubmit={handleAuth}>
            {modoCadastro && (
              <input
                type="text"
                placeholder="Seu Nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            )}
            <input
              type="email"
              placeholder="Seu E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Sua Senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            {erroAuth && (
              <p style={{ color: '#f87171', fontSize: '0.9rem', margin: '4px 0' }}>
                {erroAuth}
              </p>
            )}

            <button type="submit">
              {modoCadastro ? 'Cadastrar e Entrar' : 'Entrar'}
            </button>
          </form>

          <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#94a3b8' }}>
            {modoCadastro ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
            <span
              onClick={() => {
                setModoCadastro(!modoCadastro)
                setErroAuth('')
              }}
              style={{ color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {modoCadastro ? 'Fazer Login' : 'Criar Conta'}
            </span>
          </p>
        </main>
      </div>
    )
  }

  // SE ESTIVER LOGADO: Mostra o painel normal do usuário
  const totalSalario = transacoes
    .filter((t) => t.tipo === 'salario')
    .reduce((acc, t) => acc + parseFloat(t.valor), 0)

  const totalFixas = transacoes
    .filter((t) => t.tipo === 'fixa')
    .reduce((acc, t) => acc + parseFloat(t.valor), 0)

  const totalAlheias = transacoes
    .filter((t) => t.tipo === 'alheia')
    .reduce((acc, t) => acc + parseFloat(t.valor), 0)

  const saldoLivre = Math.max(totalSalario - totalFixas - totalAlheias, 0)

  const base = totalSalario > 0 ? totalSalario : 1
  const grausFixas = Math.min((totalFixas / base) * 360, 360)
  const grausAlheias = Math.min((totalAlheias / base) * 360, 360 - grausFixas)

  const estiloPizza = {
    background:
      totalSalario === 0
        ? '#1e293b'
        : `conic-gradient(
            #f87171 0deg ${grausFixas}deg,
            #facc15 ${grausFixas}deg ${grausFixas + grausAlheias}deg,
            #4ade80 ${grausFixas + grausAlheias}deg 360deg
          )`,
  }

  const titulosAba = {
    salario: 'Adicionar Salário / Renda',
    fixa: 'Adicionar Despesa Fixa (Água, Luz, Aluguel...)',
    alheia: 'Adicionar Despesa Alheia / Supérflua',
  }

  const transacoesFiltradas = transacoes.filter((t) => t.tipo === abaAtiva)

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Olá, <strong>{nomeUsuario || 'Usuário'}</strong>
        </span>
        <button
          onClick={sairDaConta}
          style={{
            background: 'transparent',
            border: '1px solid #475569',
            color: '#cbd5e1',
            padding: '6px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>

      <h1>Fluxo Finance</h1>

      <nav className="menu-topo">
        <button
          className={abaAtiva === 'grafico' ? 'ativo' : ''}
          onClick={() => trocarAba('grafico')}
        >
          Gráfico Geral
        </button>
        <button
          className={abaAtiva === 'salario' ? 'ativo' : ''}
          onClick={() => trocarAba('salario')}
        >
          + Salário
        </button>
        <button
          className={abaAtiva === 'fixa' ? 'ativo' : ''}
          onClick={() => trocarAba('fixa')}
        >
          + Despesa Fixa
        </button>
        <button
          className={abaAtiva === 'alheia' ? 'ativo' : ''}
          onClick={() => trocarAba('alheia')}
        >
          + Despesa Alheia
        </button>
      </nav>

      <main className="painel-principal">
        {abaAtiva === 'grafico' ? (
          <div className="secao-grafico">
            <h2>Distribuição do Salário</h2>
            <div className="grafico-pizza" style={estiloPizza}></div>

            <div className="legenda">
              <div className="item-legenda">
                <span className="bolinha verde"></span>
                <span>Livre: R$ {saldoLivre.toFixed(2)}</span>
              </div>
              <div className="item-legenda">
                <span className="bolinha vermelha"></span>
                <span>Fixas: R$ {totalFixas.toFixed(2)}</span>
              </div>
              <div className="item-legenda">
                <span className="bolinha amarela"></span>
                <span>Alheias: R$ {totalAlheias.toFixed(2)}</span>
              </div>
            </div>
            <p className="total-salario">
              Salário Total Cadastrado: <strong>R$ {totalSalario.toFixed(2)}</strong>
            </p>
          </div>
        ) : (
          <div>
            <h2 className="titulo-aba">{titulosAba[abaAtiva]}</h2>
            <form className="formulario" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Descrição (ex: Salário Mensal, Conta de Luz...)"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor (R$)"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
              <input
                type="date"
                value={dataTransacao}
                onChange={(e) => setDataTransacao(e.target.value)}
              />
              <button type="submit">
                {idEditando ? 'Atualizar' : 'Salvar'}
              </button>
            </form>

            <table className="tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => iniciarEdicao(t)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{t.descricao}</td>
                    <td>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
                    <td className={t.tipo === 'salario' ? 'entrada' : 'saida'}>
                      R$ {parseFloat(t.valor).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default App