import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
const API_URL = 'http://127.0.0.1:8000/api/transacoes/';

function App() {
  const [transacoes, setTransacoes] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState('entrada');
  const [dataTransacao, setDataTransacao] = useState(
    new Date().toISOString().slice(0, 16));
    
  const carregarTransacoes = async () => {
    try {
      const resposta = await axios.get(API_URL);
      setTransacoes(resposta.data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  useEffect(() => {
    carregarTransacoes();
  }, []); 

  function handleSubmit(e) {
    e.preventDefault();
    const novaTransacao = {
      descricao,
      valor: parseFloat(valor),
      categoria,
      tipo,
      data_transacao: new Date(dataTransacao).toISOString(),
    };
    axios.post(API_URL, novaTransacao)
      .then(() => {
        setDescricao('');
        setValor('');
        setCategoria('');
        carregarTransacoes();
      })
      .catch((error) => {
        console.error('Erro ao salvar transação:', error);
      });
  }


  return (
    <div className="container">
      <h1>Fluxo Finance</h1>
      <form onSubmit={handleSubmit} className="formulario" >
        <input
          type="text"
          placeholder="Descrição" required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          type="number"
          placeholder="Valor" required
          value={valor}
          step="0.01"
          onChange={(e) => setValor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Categoria" required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <input
          type="datetime-local"
          value={dataTransacao}
          onChange={(e) => setDataTransacao(e.target.value)}
        />
        <button type="submit">Adicionar Transação</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transacoes.map((t) => (
            <tr key={t.id}>
              <td>{t.descricao}</td>
              <td>{t.categoria}</td>
              <td>{t.tipo}</td>
              <td>{new Date(t.data_transacao).toLocaleDateString('pt-BR')}</td>
              <td>R$ {parseFloat(t.valor).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App