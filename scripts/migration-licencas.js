// Migration: Criar tabelas CLIENTES, SOFTWARES e LICENCAS
const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(process.cwd(), 'public', 'database', 'BANCOFINANCAS.FDB');

const options = {
  database: dbPath,
  user: 'SYSDBA',
  password: 'masterkey',
  role: null,
  pageSize: 4096
};

function runQuery(db, sql, description) {
  return new Promise((resolve, reject) => {
    db.query(sql, [], (err, result) => {
      if (err) {
        const msg = (err.message || '').toLowerCase();
        if (
          msg.includes('already exists') ||
          msg.includes('table') ||
          msg.includes('column') ||
          msg.includes('sequence') ||
          msg.includes('generator') ||
          msg.includes('unsuccessful metadata update')
        ) {
          console.log(`⚠️  Já existe ou conflito aceitável: ${description}`);
          resolve(result);
        } else {
          console.error(`❌ Erro em: ${description}`, err.message);
          reject(err);
        }
      } else {
        console.log(`✅ OK: ${description}`);
        resolve(result);
      }
    });
  });
}

async function migrate() {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, async (err, db) => {
      if (err) {
        console.error('❌ Erro ao conectar:', err);
        return reject(err);
      }
      console.log('✅ Conectado ao banco Firebird');

      try {
        // ========== CLIENTES ==========
        await runQuery(db, `
          CREATE TABLE CLIENTES (
            ID INTEGER NOT NULL,
            TENANT_ID INTEGER NOT NULL,
            TIPO CHAR(2) NOT NULL,
            NOME VARCHAR(150) NOT NULL,
            NOME_FANTASIA VARCHAR(150),
            CPF_CNPJ VARCHAR(20),
            EMAIL VARCHAR(150),
            TELEFONE VARCHAR(20),
            ENDERECO VARCHAR(255),
            OBSERVACOES BLOB SUB_TYPE 1,
            ATIVO CHAR(1) NOT NULL,
            DATA_CADASTRO TIMESTAMP,
            CONSTRAINT PK_CLIENTES PRIMARY KEY (ID)
          )
        `, 'CREATE TABLE CLIENTES');

        await runQuery(db, `
          CREATE GENERATOR GEN_CLIENTES_ID
        `, 'CREATE GENERATOR GEN_CLIENTES_ID');

        await runQuery(db, `
          CREATE TRIGGER TRG_CLIENTES_BI FOR CLIENTES
          ACTIVE BEFORE INSERT POSITION 0
          AS BEGIN
            IF (NEW.ID IS NULL) THEN
              NEW.ID = GEN_ID(GEN_CLIENTES_ID, 1);
            IF (NEW.TIPO IS NULL) THEN
              NEW.TIPO = 'PF';
            IF (NEW.ATIVO IS NULL) THEN
              NEW.ATIVO = 'S';
            IF (NEW.DATA_CADASTRO IS NULL) THEN
              NEW.DATA_CADASTRO = CURRENT_TIMESTAMP;
          END
        `, 'CREATE TRIGGER CLIENTES');

        // ========== SOFTWARES ==========
        await runQuery(db, `
          CREATE TABLE SOFTWARES (
            ID INTEGER NOT NULL,
            TENANT_ID INTEGER NOT NULL,
            NOME VARCHAR(100) NOT NULL,
            DESCRICAO VARCHAR(500),
            CATEGORIA VARCHAR(50),
            ATIVO CHAR(1) NOT NULL,
            DATA_CADASTRO TIMESTAMP,
            CONSTRAINT PK_SOFTWARES PRIMARY KEY (ID)
          )
        `, 'CREATE TABLE SOFTWARES');

        await runQuery(db, `
          CREATE GENERATOR GEN_SOFTWARES_ID
        `, 'CREATE GENERATOR GEN_SOFTWARES_ID');

        await runQuery(db, `
          CREATE TRIGGER TRG_SOFTWARES_BI FOR SOFTWARES
          ACTIVE BEFORE INSERT POSITION 0
          AS BEGIN
            IF (NEW.ID IS NULL) THEN
              NEW.ID = GEN_ID(GEN_SOFTWARES_ID, 1);
            IF (NEW.ATIVO IS NULL) THEN
              NEW.ATIVO = 'S';
            IF (NEW.DATA_CADASTRO IS NULL) THEN
              NEW.DATA_CADASTRO = CURRENT_TIMESTAMP;
          END
        `, 'CREATE TRIGGER SOFTWARES');

        // ========== LICENCAS ==========
        await runQuery(db, `
          CREATE TABLE LICENCAS (
            ID INTEGER NOT NULL,
            TENANT_ID INTEGER NOT NULL,
            CLIENTE_ID INTEGER NOT NULL,
            SOFTWARE_ID INTEGER NOT NULL,
            CONTA_BANCARIA_ID INTEGER,
            DESCRICAO VARCHAR(255) NOT NULL,
            VALOR NUMERIC(15,2) NOT NULL,
            PERIODICIDADE VARCHAR(20) NOT NULL,
            DIA_VENCIMENTO INTEGER NOT NULL,
            DATA_INICIO DATE NOT NULL,
            DATA_FIM DATE,
            STATUS VARCHAR(20) NOT NULL,
            GERAR_CONTA_AUTO CHAR(1) NOT NULL,
            ULTIMA_GERACAO DATE,
            OBSERVACOES BLOB SUB_TYPE 1,
            DATA_CADASTRO TIMESTAMP,
            CONSTRAINT PK_LICENCAS PRIMARY KEY (ID)
          )
        `, 'CREATE TABLE LICENCAS');

        await runQuery(db, `
          ALTER TABLE LICENCAS ADD CONSTRAINT FK_LICENCAS_CLIENTE
          FOREIGN KEY (CLIENTE_ID) REFERENCES CLIENTES(ID)
        `, 'FK LICENCAS -> CLIENTES');

        await runQuery(db, `
          ALTER TABLE LICENCAS ADD CONSTRAINT FK_LICENCAS_SOFTWARE
          FOREIGN KEY (SOFTWARE_ID) REFERENCES SOFTWARES(ID)
        `, 'FK LICENCAS -> SOFTWARES');

        await runQuery(db, `
          CREATE GENERATOR GEN_LICENCAS_ID
        `, 'CREATE GENERATOR GEN_LICENCAS_ID');

        await runQuery(db, `
          CREATE TRIGGER TRG_LICENCAS_BI FOR LICENCAS
          ACTIVE BEFORE INSERT POSITION 0
          AS BEGIN
            IF (NEW.ID IS NULL) THEN
              NEW.ID = GEN_ID(GEN_LICENCAS_ID, 1);
            IF (NEW.PERIODICIDADE IS NULL) THEN
              NEW.PERIODICIDADE = 'MENSAL';
            IF (NEW.DIA_VENCIMENTO IS NULL) THEN
              NEW.DIA_VENCIMENTO = 1;
            IF (NEW.STATUS IS NULL) THEN
              NEW.STATUS = 'ATIVA';
            IF (NEW.GERAR_CONTA_AUTO IS NULL) THEN
              NEW.GERAR_CONTA_AUTO = 'N';
            IF (NEW.DATA_CADASTRO IS NULL) THEN
              NEW.DATA_CADASTRO = CURRENT_TIMESTAMP;
          END
        `, 'CREATE TRIGGER LICENCAS');

        console.log('\n🎉 Migração concluída com sucesso!');
        db.detach();
        resolve();
      } catch (error) {
        console.error('\n💥 Erro durante a migração:', error);
        db.detach();
        reject(error);
      }
    });
  });
}

migrate().catch(console.error);
