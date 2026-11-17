const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Função auxiliar para gerar o hash SHA-256
function gerarHashSenha(senha, salt) {
  return crypto.createHash('sha256').update(senha + salt).digest('hex');
}

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // O formato esperado no header é: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const dadosUsuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = dadosUsuario; // Guarda { id, nome, login } para usar nas rotas seguintes
    next();
  } catch (erro) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
}

app.get('/', (req, res) => {
  res.json({ mensagem: 'API Fluxo Finance ativa!' });
});

// ==========================================
// 1. ROTAS DE AUTENTICAÇÃO (USUÁRIO)
// ==========================================

app.post('/cadastro', async (req, res) => {
  const { nome, login, senha } = req.body;

  if (!nome || !login || !senha) {
    return res.status(400).json({ erro: 'Preencha nome, login e senha.' });
  }

  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const senha_hash = gerarHashSenha(senha, salt);

    const [resultado] = await db.query(
      'INSERT INTO usuario (nome, login, senha_hash, salt) VALUES (?, ?, ?, ?)',
      [nome, login, senha_hash, salt]
    );

    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Este login já está em uso.' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno ao cadastrar usuário.' });
  }
});

app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  if (!login || !senha) {
    return res.status(400).json({ erro: 'Informe login e senha.' });
  }

  try {
    const [usuarios] = await db.query('SELECT * FROM usuario WHERE login = ?', [login]);

    if (usuarios.length === 0) {
      return res.status(401).json({ erro: 'Login ou senha inválidos.' });
    }

    const usuario = usuarios[0];
    const hashTentativa = gerarHashSenha(senha, usuario.salt);

    if (hashTentativa !== usuario.senha_hash) {
      return res.status(401).json({ erro: 'Login ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, login: usuario.login },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        login: usuario.login
      }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno ao realizar login.' });
  }
});

// ==========================================
// 2. ROTAS DE CATEGORIAS
// ==========================================

// Listar todas as categorias
app.get('/categorias', verificarToken, async (req, res) => {
  try {
    const [categorias] = await db.query('SELECT * FROM categoria ORDER BY nome ASC');
    res.json(categorias);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar categorias.' });
  }
});

// Criar nova categoria ('R' = Receita, 'D' = Despesa)
app.post('/categorias', verificarToken, async (req, res) => {
  const { nome, tipo } = req.body;

  if (!nome || !['R', 'D'].includes(tipo)) {
    return res.status(400).json({ erro: 'Informe o nome e o tipo válido ("R" ou "D").' });
  }

  try {
    const [resultado] = await db.query(
      'INSERT INTO categoria (nome, tipo) VALUES (?, ?)',
      [nome, tipo]
    );
    res.status(201).json({ id: resultado.insertId, nome, tipo });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Esta categoria já existe.' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar categoria.' });
  }
});

// ==========================================
// 3. ROTAS DE LANÇAMENTOS
// ==========================================

// Listar lançamentos apenas do usuário logado
app.get('/lancamentos', verificarToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.id, 
        l.data, 
        l.descricao, 
        l.valor, 
        l.categoria_id,
        c.nome AS categoria_nome, 
        c.tipo AS categoria_tipo
      FROM lancamento l
      INNER JOIN categoria c ON l.categoria_id = c.id
      WHERE l.usuario_id = ?
      ORDER BY l.data DESC, l.id DESC
    `;
    const [lancamentos] = await db.query(sql, [req.usuario.id]);
    res.json(lancamentos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar lançamentos.' });
  }
});

// Criar novo lançamento para o usuário logado
app.post('/lancamentos', verificarToken, async (req, res) => {
  const { data, descricao, valor, categoria_id } = req.body;

  if (!data || !descricao || !valor || !categoria_id) {
    return res.status(400).json({ erro: 'Preencha data, descricao, valor e categoria_id.' });
  }

  try {
    const [resultado] = await db.query(
      'INSERT INTO lancamento (data, descricao, valor, usuario_id, categoria_id) VALUES (?, ?, ?, ?, ?)',
      [data, descricao, valor, req.usuario.id, categoria_id]
    );

    res.status(201).json({
      mensagem: 'Lançamento registado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao registar lançamento.' });
  }
});

// Apagar lançamento (garantindo que pertence ao usuário logado)
app.delete('/lancamentos/:id', verificarToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [resultado] = await db.query(
      'DELETE FROM lancamento WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Lançamento não encontrado.' });
    }

    res.json({ mensagem: 'Lançamento removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao remover lançamento.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});