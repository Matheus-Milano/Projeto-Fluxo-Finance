import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api/transacoes/'

function App() {
  const [abaAtiva, setAbaAtiva] = useState('grafico') // 'grafico' | 'salario' | 'fixa' | 'alheia'
  const [transacoes, setTransacoes] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [dataTransacao, setDataTransacao] = useState(
    new Date().toISOString().slice(0, 16)
  )

  const carregarTransacoes = async () => {
    try {
      const resposta = await axios.get(API_URL)
      setTransacoes(resposta.data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  useEffect(() => {
    carregarTransacoes()
  }, [])

  function trocarAba(novaAba) {
    setAbaAtiva(novaAba)
    setDescricao('')
    setValor('')
    setCategoria('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const novaTransacao = {
      descricao,
      valor: parseFloat(valor),
      categoria: abaAtiva === 'salario' ? 'Renda' : categoria,
      tipo: abaAtiva,
      data_transacao: new Date(dataTransacao).toISOString(),
    }

    axios
      .post(API_URL, novaTransacao)
      .then(() => {
        setDescricao('')
        setValor('')
        setCategoria('')
        carregarTransacoes()
      })
      .catch((error) => {
        console.error('Erro ao salvar transação:', error)
      })
  }

  // Cálculos para o Gráfico de Setor
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

  // Porcentagens em graus (0 a 360) para o gráfico
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
      <h1>Fluxo Finance</h1>

      {/* Barra Superior (traços vermelhos do seu wireframe) */}
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

      {/* Área Principal (parte cinza do seu wireframe) */}
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
              {abaAtiva !== 'salario' && (
                <input
                  type="text"
                  placeholder="Categoria (ex: Moradia, Lazer...)"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              )}
              <input
                type="datetime-local"
                value={dataTransacao}
                onChange={(e) => setDataTransacao(e.target.value)}
              />
              <button type="submit">Salvar</button>
            </form>

            <table className="tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transacoesFiltradas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.descricao}</td>
                    <td>{t.categoria}</td>
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