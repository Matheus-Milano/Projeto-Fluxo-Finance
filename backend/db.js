const mysql = require('mysql2/promise');
require('dotenv').config();

// Cria um "pool" de conexões (gerencia várias requisições ao mesmo tempo sem travar)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true // Obrigatório para o TiDB Cloud aceitar a conexão segura
  }
});

module.exports = pool;