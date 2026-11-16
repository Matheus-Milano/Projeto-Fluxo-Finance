import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Wallet, TrendingUp, PiggyBank, Calendar, PlusCircle, Trash2,
  ChevronLeft, ChevronRight, LogOut, Sparkles, ShieldCheck
} from 'lucide-react';
import './App.css';

const BASE_URL = 'https://fluxo-finance-api.onrender.com/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [nomeUsuario, setNomeUsuario] = useState(localStorage.getItem('nomeUsuario') || '');
  const [isRegister, setIsRegister] = useState(false);

  // Estados de Auth
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erroAuth, setErroAuth] = useState('');

  // Estados do Dashboard
  const [abaAtiva, setAbaAtiva] = useState('painel'); // 'painel' | 'investimentos'
  const [mesAtual, setMesAtual] = useState('2026-11');
  const [resumo, setResumo] = useState({
    salario: 0,
    total_fixas: 0,
    total_variaveis: 0,
    sobra_mes: 0,
    total_guardado: 0,
    historico: []
  });
  const [transacoes, setTransacoes] = useState([]);
  const [novoSalario, setNovoSalario] = useState('');
  const [editandoSalario, setEditandoSalario] = useState(false);

  // Formulário Nova Despesa
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('VARIAVEL');

  // Investimentos (API Banco Central)
  const [dadosInvestimentos, setDadosInvestimentos] = useState(null);

  const authHeaders = { headers: { Authorization: `Token ${token}` } };

  // Navegar entre meses (YYYY-MM)
  const mudarMes = (direcao) => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const data = new Date(ano, mes - 1 + direcao, 1);
    const novoAno = data.getFullYear();
    const novoMes = String(data.getMonth() + 1).padStart(2, '0');
    setMesAtual(`${novoAno}-${novoMes}`);
  };

  const carregarDados = async () => {
    if (!token) return;
    try {
      const [resResumo, resTransacoes] = await Promise.all([
        axios.get(`${BASE_URL}/resumo/?mes=${mesAtual}`, authHeaders),
        axios.get(`${BASE_URL}/transacoes/?mes=${mesAtual}`, authHeaders)
      ]);
      setResumo(resResumo.data);
      setNovoSalario(resResumo.data.salario);
      setTransacoes(resTransacoes.data);
    } catch (err) {
      if (err.response?.status === 401) sair();
    }
  };

  const carregarInvestimentos = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/investimentos/`);
      setDadosInvestimentos(res.data);
    } catch (err) {
      console.error('Erro ao buscar investimentos', err);
    }
  };

  useEffect(() => {
    if (token) {
      carregarDados();
      carregarInvestimentos();
    }
  }, [token, mesAtual]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErroAuth('');
    try {
      const rota = isRegister ? 'register' : 'login';
      const payload = isRegister ? { nome, email, password } : { email, password };
      const res = await axios.post(`${BASE_URL}/${rota}/`, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('nomeUsuario', res.data.nome || email.split('@')[0]);
      setToken(res.data.token);
      setNomeUsuario(res.data.nome || email.split('@')[0]);
    } catch (err) {
      setErroAuth(err.response?.data?.error || 'Erro ao conectar com o servidor.');
    }
  };

  const sair = () => {
    localStorage.clear();
    setToken('');
  };

  const salvarSalario = async (e) => {
    e.preventDefault();
    await axios.post(`${BASE_URL}/perfil/salario/`, { salario_mensal: novoSalario }, authHeaders);
    setEditandoSalario(false);
    carregarDados();
  };

  const adicionarDespesa = async (e) => {
    e.preventDefault();
    if (!descricao || !valor) return;
    await axios.post(
      `${BASE_URL}/transacoes/`,
      { descricao, valor: parseFloat(valor), tipo, mes_referencia: mesAtual },
      authHeaders
    );
    setDescricao('');
    setValor('');
    carregarDados();
  };

  const removerDespesa = async (id) => {
    await axios.delete(`${BASE_URL}/transacoes/${id}/`, authHeaders);
    carregarDados();
  };

  const formatarMoeda = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // --- TELA DE LOGIN / CADASTRO ---
  if (!token) {
    return (
      <div className="auth-wrapper">
        <h1 className="brand-title">Fluxo Finance</h1>
        <form className="glass-card auth-box" onSubmit={handleAuth}>
          <h2>{isRegister ? 'Criar Conta Futurista' : 'Acessar Minha Conta'}</h2>
          {isRegister && (
            <input
              className="glass-input"
              placeholder="Seu Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          )}
          <input
            className="glass-input"
            type="email"
            placeholder="Seu E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="glass-input"
            type="password"
            placeholder="Sua Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {erroAuth && <p style={{ color: '#f87171', textAlign: 'center', marginBottom: 12 }}>{erroAuth}</p>}
          <button className="btn-primary" type="submit">
            {isRegister ? 'Cadastrar e Entrar' : 'Entrar'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 18, color: '#94a3b8', fontSize: '0.9rem' }}>
            {isRegister ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
            <span
              style={{ color: '#c084fc', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Fazer Login' : 'Criar Conta'}
            </span>
          </p>
        </form>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="dashboard-container">
      {/* Barra Superior */}
      <header className="topbar">
        <div>
          <h1 className="brand-title" style={{ marginBottom: 4, fontSize: '1.8rem' }}>
            Fluxo Finance
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Olá, <strong>{nomeUsuario}</strong> • Controle Inteligente
          </p>
        </div>

        <div className="nav-tabs">
          <button
            className={`btn-glass ${abaAtiva === 'painel' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('painel')}
          >
            <Wallet size={18} /> Meu Painel
          </button>
          <button
            className={`btn-glass ${abaAtiva === 'investimentos' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('investimentos')}
          >
            <TrendingUp size={18} /> Melhores Investimentos
          </button>
          <button className="btn-glass" onClick={sair} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {abaAtiva === 'painel' ? (
        <>
          {/* Seletor de Mês */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div className="glass-card month-selector">
              <button className="btn-glass" style={{ padding: '6px 10px' }} onClick={() => mudarMes(-1)}>
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} color="#c084fc" /> Mês: {mesAtual}
              </span>
              <button className="btn-glass" style={{ padding: '6px 10px' }} onClick={() => mudarMes(1)}>
                <ChevronRight size={18} />
              </button>
            </div>

            <button className="btn-glass" onClick={() => setEditandoSalario(!editandoSalario)}>
              Definir Salário Mensal: <strong>{formatarMoeda(resumo.salario)}</strong>
            </button>
          </div>

          {editandoSalario && (
            <form className="glass-card" onSubmit={salvarSalario} style={{ padding: 18, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                className="glass-input"
                style={{ marginBottom: 0, maxWidth: 240 }}
                type="number"
                step="0.01"
                placeholder="Salário mensal (R$)"
                value={novoSalario}
                onChange={(e) => setNovoSalario(e.target.value)}
                required
              />
              <button className="btn-primary" style={{ maxWidth: 180 }} type="submit">
                Cravar Salário
              </button>
            </form>
          )}

          {/* Cards de Resumo */}
          <div className="kpi-grid">
            <div className="glass-card kpi-card">
              <div className="kpi-label">Salário Cravado <Wallet size={18} color="#38bdf8" /></div>
              <div className="kpi-value text-cyan">{formatarMoeda(resumo.salario)}</div>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-label">Fixas + Variáveis ({mesAtual}) <Trash2 size={18} color="#f87171" /></div>
              <div className="kpi-value text-red">
                {formatarMoeda(resumo.total_fixas + resumo.total_variaveis)}
              </div>
              <small style={{ color: '#94a3b8' }}>
                Fixas: {formatarMoeda(resumo.total_fixas)} | Mês: {formatarMoeda(resumo.total_variaveis)}
              </small>
            </div>

            <div className="glass-card kpi-card">
              <div className="kpi-label">Sobra deste Mês <Sparkles size={18} color="#34d399" /></div>
              <div className="kpi-value text-green">{formatarMoeda(resumo.sobra_mes)}</div>
            </div>

            <div className="glass-card kpi-card" style={{ borderColor: 'rgba(192, 132, 252, 0.5)' }}>
              <div className="kpi-label">Total Guardado (Cofre) <PiggyBank size={18} color="#c084fc" /></div>
              <div className="kpi-value text-purple">{formatarMoeda(resumo.total_guardado)}</div>
              <small style={{ color: '#94a3b8' }}>Soma acumulada dos meses</small>
            </div>
          </div>

          {/* Gráfico + Lançamentos */}
          <div className="main-grid">
            {/* Gráfico de Evolução */}
            <div className="glass-card section-box">
              <h3 className="section-title">
                <TrendingUp size={20} color="#c084fc" /> Evolução do Dinheiro Guardado
              </h3>
              <div style={{ width: '100%', height: 310 }}>
                <ResponsiveContainer>
                  <AreaChart data={resumo.historico}>
                    <defs>
                      <linearGradient id="corCofre" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.75} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="mes" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: '#14092a', border: '1px solid #a855f7', borderRadius: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="guardado_acumulado"
                      name="Total Guardado (R$)"
                      stroke="#c084fc"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#corCofre)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Adicionar e Listar Despesas */}
            <div className="glass-card section-box">
              <h3 className="section-title">
                <PlusCircle size={20} color="#38bdf8" /> Lançar Despesa
              </h3>
              <form onSubmit={adicionarDespesa}>
                <input
                  className="glass-input"
                  placeholder="Descrição (Ex: Aluguel, Lanche, Uber)"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="glass-input"
                    type="number"
                    step="0.01"
                    placeholder="Valor (R$)"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                  />
                  <select
                    className="glass-select"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="VARIAVEL">Variável (Só {mesAtual})</option>
                    <option value="FIXA">Fixa (Cravada todo mês)</option>
                  </select>
                </div>
                <button className="btn-primary" type="submit">
                  Adicionar Despesa
                </button>
              </form>

              <ul className="expense-list">
                {transacoes.map((t) => (
                  <li key={t.id} className="expense-item">
                    <div>
                      <strong>{t.descricao}</strong>
                      <span className={`badge ${t.tipo === 'FIXA' ? 'badge-fixa' : 'badge-variavel'}`}>
                        {t.tipo === 'FIXA' ? 'Fixa (Todo mês)' : `Variável (${t.mes_referencia})`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="text-red" style={{ fontWeight: 600 }}>
                        - {formatarMoeda(t.valor)}
                      </span>
                      <button
                        onClick={() => removerDespesa(t.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        /* ABA MELHORES INVESTIMENTOS (API BANCO CENTRAL) */
        <div>
          <div className="glass-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <ShieldCheck color="#34d399" /> Onde Fazer Sua Sobra Render Hoje
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                Dados oficiais em tempo real via <strong>{dadosInvestimentos?.fonte || 'Banco Central do Brasil'}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="glass-card" style={{ padding: '10px 18px', textAlign: 'center' }}>
                <small style={{ color: '#94a3b8' }}>Taxa Selic Hoje</small>
                <div className="text-green" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  {dadosInvestimentos?.selic_atual || '11.25'}% a.a.
                </div>
              </div>
              <div className="glass-card" style={{ padding: '10px 18px', textAlign: 'center' }}>
                <small style={{ color: '#94a3b8' }}>CDI Atual</small>
                <div className="text-cyan" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  {dadosInvestimentos?.cdi_atual || '11.15'}% a.a.
                </div>
              </div>
            </div>
          </div>

          <div className="invest-grid">
            {dadosInvestimentos?.investimentos?.map((inv, index) => {
              const rendimentoEstimadoAno =
                resumo.total_guardado > 0
                  ? (resumo.total_guardado * (inv.taxa_anual / 100))
                  : 0;

              return (
                <div key={index} className="glass-card invest-card">
                  <div>
                    <span className="badge badge-fixa" style={{ marginLeft: 0, marginBottom: 10, display: 'inline-block' }}>
                      {inv.categoria}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{inv.nome}</h3>
                    <p className="text-green" style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12 }}>
                      Rendimento: {inv.rentabilidade}
                    </p>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: 6 }}>
                      <strong>Liquidez:</strong> {inv.liquidez}
                    </p>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: 6 }}>
                      <strong>Segurança:</strong> {inv.risco}
                    </p>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 10 }}>
                      <strong>Onde encontrar:</strong> {inv.onde_encontrar}
                    </p>
                  </div>

                  {resumo.total_guardado > 0 && (
                    <div style={{ padding: 12, borderRadius: 10, background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                      <small style={{ color: '#a7f3d0' }}>
                        Seu cofre atual ({formatarMoeda(resumo.total_guardado)}) renderia aprox.{' '}
                        <strong>+{formatarMoeda(rendimentoEstimadoAno)}/ano</strong> aqui.
                      </small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}