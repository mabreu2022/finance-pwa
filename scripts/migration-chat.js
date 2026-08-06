/**
 * migration-chat.js
 * Cria as tabelas do sistema de chat interno
 */
const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');
const options = { database: dbPath, user: 'SYSDBA', password: 'masterkey', role: null, pageSize: 4096 };

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result || []);
    });
  });
}

function tableExists(db, tableName) {
  return new Promise((resolve) => {
    db.query(`SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE UPPER(TRIM(RDB$RELATION_NAME)) = '${tableName.toUpperCase()}'`, [], (err, rows) => {
      resolve(!err && rows && rows.length > 0);
    });
  });
}

async function migrate() {
  console.log('🔧 Iniciando migração: Sistema de Chat Interno...');
  const db = await new Promise((resolve, reject) => {
    Firebird.attach(options, (err, database) => { if (err) reject(err); else resolve(database); });
  });

  try {
    // ── GRUPOS_CHAT ─────────────────────────────────────────────
    if (await tableExists(db, 'GRUPOS_CHAT')) {
      console.log('✅ Tabela GRUPOS_CHAT já existe.');
    } else {
      console.log('📌 Criando tabela GRUPOS_CHAT...');
      await runQuery(db, `CREATE TABLE GRUPOS_CHAT (
        ID INTEGER NOT NULL,
        TENANT_ID INTEGER NOT NULL,
        NOME VARCHAR(100) NOT NULL,
        TIPO VARCHAR(20) NOT NULL,
        CRIADO_POR INTEGER,
        DATA_CRIACAO TIMESTAMP,
        CONSTRAINT PK_GRUPOS_CHAT PRIMARY KEY (ID)
      )`);
      await runQuery(db, `CREATE GENERATOR GEN_GRUPOS_CHAT_ID`);
      await runQuery(db, `SET GENERATOR GEN_GRUPOS_CHAT_ID TO 0`);
      await runQuery(db, `CREATE TRIGGER TRG_GRUPOS_CHAT_ID FOR GRUPOS_CHAT
        ACTIVE BEFORE INSERT POSITION 0 AS BEGIN
          IF (NEW.ID IS NULL) THEN NEW.ID = GEN_ID(GEN_GRUPOS_CHAT_ID, 1);
          IF (NEW.DATA_CRIACAO IS NULL) THEN NEW.DATA_CRIACAO = CURRENT_TIMESTAMP;
          IF (NEW.TIPO IS NULL) THEN NEW.TIPO = 'GERAL';
        END`);
      console.log('✅ GRUPOS_CHAT criada!');
    }

    // ── MEMBROS_GRUPO ───────────────────────────────────────────
    if (await tableExists(db, 'MEMBROS_GRUPO')) {
      console.log('✅ Tabela MEMBROS_GRUPO já existe.');
    } else {
      console.log('📌 Criando tabela MEMBROS_GRUPO...');
      await runQuery(db, `CREATE TABLE MEMBROS_GRUPO (
        ID INTEGER NOT NULL,
        GRUPO_ID INTEGER NOT NULL,
        USUARIO_ID INTEGER NOT NULL,
        DATA_ENTRADA TIMESTAMP,
        CONSTRAINT PK_MEMBROS_GRUPO PRIMARY KEY (ID)
      )`);
      await runQuery(db, `CREATE GENERATOR GEN_MEMBROS_GRUPO_ID`);
      await runQuery(db, `SET GENERATOR GEN_MEMBROS_GRUPO_ID TO 0`);
      await runQuery(db, `CREATE TRIGGER TRG_MEMBROS_GRUPO_ID FOR MEMBROS_GRUPO
        ACTIVE BEFORE INSERT POSITION 0 AS BEGIN
          IF (NEW.ID IS NULL) THEN NEW.ID = GEN_ID(GEN_MEMBROS_GRUPO_ID, 1);
          IF (NEW.DATA_ENTRADA IS NULL) THEN NEW.DATA_ENTRADA = CURRENT_TIMESTAMP;
        END`);
      console.log('✅ MEMBROS_GRUPO criada!');
    }

    // ── MENSAGENS_CHAT ──────────────────────────────────────────
    if (await tableExists(db, 'MENSAGENS_CHAT')) {
      console.log('✅ Tabela MENSAGENS_CHAT já existe.');
    } else {
      console.log('📌 Criando tabela MENSAGENS_CHAT...');
      await runQuery(db, `CREATE TABLE MENSAGENS_CHAT (
        ID INTEGER NOT NULL,
        TENANT_ID INTEGER NOT NULL,
        GRUPO_ID INTEGER NOT NULL,
        USUARIO_ID INTEGER NOT NULL,
        CONTEUDO VARCHAR(2000) NOT NULL,
        MENCOES VARCHAR(500),
        DELETADO CHAR(1),
        DATA_ENVIO TIMESTAMP,
        CONSTRAINT PK_MENSAGENS_CHAT PRIMARY KEY (ID)
      )`);
      await runQuery(db, `CREATE GENERATOR GEN_MENSAGENS_CHAT_ID`);
      await runQuery(db, `SET GENERATOR GEN_MENSAGENS_CHAT_ID TO 0`);
      await runQuery(db, `CREATE TRIGGER TRG_MENSAGENS_CHAT_ID FOR MENSAGENS_CHAT
        ACTIVE BEFORE INSERT POSITION 0 AS BEGIN
          IF (NEW.ID IS NULL) THEN NEW.ID = GEN_ID(GEN_MENSAGENS_CHAT_ID, 1);
          IF (NEW.DATA_ENVIO IS NULL) THEN NEW.DATA_ENVIO = CURRENT_TIMESTAMP;
          IF (NEW.DELETADO IS NULL) THEN NEW.DELETADO = 'N';
        END`);
      console.log('✅ MENSAGENS_CHAT criada!');
    }

    // ── LEITURAS_CHAT ───────────────────────────────────────────
    if (await tableExists(db, 'LEITURAS_CHAT')) {
      console.log('✅ Tabela LEITURAS_CHAT já existe.');
    } else {
      console.log('📌 Criando tabela LEITURAS_CHAT...');
      await runQuery(db, `CREATE TABLE LEITURAS_CHAT (
        ID INTEGER NOT NULL,
        USUARIO_ID INTEGER NOT NULL,
        GRUPO_ID INTEGER NOT NULL,
        ULTIMA_LEITURA TIMESTAMP,
        CONSTRAINT PK_LEITURAS_CHAT PRIMARY KEY (ID)
      )`);
      await runQuery(db, `CREATE GENERATOR GEN_LEITURAS_CHAT_ID`);
      await runQuery(db, `SET GENERATOR GEN_LEITURAS_CHAT_ID TO 0`);
      await runQuery(db, `CREATE TRIGGER TRG_LEITURAS_CHAT_ID FOR LEITURAS_CHAT
        ACTIVE BEFORE INSERT POSITION 0 AS BEGIN
          IF (NEW.ID IS NULL) THEN NEW.ID = GEN_ID(GEN_LEITURAS_CHAT_ID, 1);
          IF (NEW.ULTIMA_LEITURA IS NULL) THEN NEW.ULTIMA_LEITURA = CURRENT_TIMESTAMP;
        END`);
      console.log('✅ LEITURAS_CHAT criada!');
    }

    // ── Grupos padrão ───────────────────────────────────────────
    const existing = await runQuery(db, `SELECT ID FROM GRUPOS_CHAT WHERE TENANT_ID = 1`) ;
    if (!existing || existing.length === 0) {
      console.log('📌 Inserindo grupos padrão...');
      await runQuery(db, `INSERT INTO GRUPOS_CHAT (TENANT_ID, NOME, TIPO) VALUES (1, 'Geral', 'GERAL')`);
      await runQuery(db, `INSERT INTO GRUPOS_CHAT (TENANT_ID, NOME, TIPO) VALUES (1, 'Financeiro', 'DEPARTAMENTO')`);
      await runQuery(db, `INSERT INTO GRUPOS_CHAT (TENANT_ID, NOME, TIPO) VALUES (1, 'Comercial', 'DEPARTAMENTO')`);
      console.log('✅ Grupos padrão inseridos!');
    }

    console.log('\n🎉 Migração do Chat concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    throw err;
  } finally {
    await new Promise((resolve) => db.detach(resolve));
    console.log('🔌 Conexão encerrada.');
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
