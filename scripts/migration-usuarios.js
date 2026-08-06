/**
 * migration-usuarios.js
 * Adiciona a coluna PERFIL à tabela USUARIOS no Firebird
 * Perfis: ADMIN, VENDEDOR, FINANCEIRO
 */

const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

const options = {
  database: dbPath,
  user: 'SYSDBA',
  password: 'masterkey',
  role: null,
  pageSize: 4096
};

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result || []);
    });
  });
}

async function migrate() {
  console.log('🔧 Iniciando migração: coluna PERFIL em USUARIOS...');

  const db = await new Promise((resolve, reject) => {
    Firebird.attach(options, (err, database) => {
      if (err) reject(err);
      else resolve(database);
    });
  });

  try {
    // 1. Verificar se a coluna PERFIL já existe
    let columnExists = false;
    try {
      const checkSql = `SELECT RDB$FIELD_NAME FROM RDB$RELATION_FIELDS 
                        WHERE UPPER(TRIM(RDB$RELATION_NAME)) = 'USUARIOS' 
                        AND UPPER(TRIM(RDB$FIELD_NAME)) = 'PERFIL'`;
      const rows = await runQuery(db, checkSql);
      columnExists = rows && rows.length > 0;
    } catch (e) {
      console.log('Aviso ao verificar coluna:', e.message);
    }

    if (columnExists) {
      console.log('✅ Coluna PERFIL já existe. Nada a fazer.');
    } else {
      // 2. Adicionar a coluna PERFIL
      console.log('📌 Adicionando coluna PERFIL...');
      try {
        await runQuery(db, `ALTER TABLE USUARIOS ADD PERFIL VARCHAR(20) DEFAULT 'ADMIN'`);
        console.log('✅ Coluna PERFIL adicionada com sucesso!');
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('already')) {
          console.log('✅ Coluna PERFIL já existe (confirmado pelo ALTER).');
        } else {
          throw e;
        }
      }

      // 3. Atualizar registros existentes: ADMIN mantém ADMIN, USER vira FINANCEIRO
      console.log('📌 Atualizando perfis dos usuários existentes...');
      try {
        await runQuery(db, `UPDATE USUARIOS SET PERFIL = 'ADMIN' WHERE UPPER(TRIM(ROLE)) = 'ADMIN' AND (PERFIL IS NULL OR PERFIL = '')`);
        await runQuery(db, `UPDATE USUARIOS SET PERFIL = 'FINANCEIRO' WHERE UPPER(TRIM(ROLE)) = 'USER' AND (PERFIL IS NULL OR PERFIL = '')`);
        console.log('✅ Perfis atualizados nos registros existentes!');
      } catch (e) {
        console.log('Aviso ao atualizar perfis existentes:', e.message);
      }
    }

    // 4. Verificar/criar tabela CONFIGURACOES (para logo e outras config do tenant)
    let configTableExists = false;
    try {
      const checkTable = `SELECT RDB$RELATION_NAME FROM RDB$RELATIONS 
                          WHERE UPPER(TRIM(RDB$RELATION_NAME)) = 'CONFIGURACOES'`;
      const rows = await runQuery(db, checkTable);
      configTableExists = rows && rows.length > 0;
    } catch (e) {
      console.log('Aviso ao verificar tabela CONFIGURACOES:', e.message);
    }

    if (!configTableExists) {
      console.log('📌 Criando tabela CONFIGURACOES...');
      try {
        await runQuery(db, `
          CREATE TABLE CONFIGURACOES (
            ID INTEGER NOT NULL PRIMARY KEY,
            TENANT_ID INTEGER NOT NULL,
            CHAVE VARCHAR(100) NOT NULL,
            VALOR VARCHAR(500),
            DATA_ATUALIZACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Tabela CONFIGURACOES criada!');
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('already')) {
          console.log('✅ Tabela CONFIGURACOES já existe.');
        } else {
          console.log('Aviso ao criar CONFIGURACOES:', e.message);
        }
      }

      // Generator para CONFIGURACOES
      try {
        await runQuery(db, `CREATE SEQUENCE GEN_CONFIGURACOES_ID`);
        console.log('✅ Sequence GEN_CONFIGURACOES_ID criada!');
      } catch (e) {
        if (e.message && (e.message.toLowerCase().includes('already') || e.message.toLowerCase().includes('unsuccessful metadata'))) {
          console.log('✅ Sequence GEN_CONFIGURACOES_ID já existe.');
        } else {
          console.log('Aviso ao criar sequence:', e.message);
        }
      }

      // Trigger para ID automático
      try {
        await runQuery(db, `
          CREATE TRIGGER TRG_CONFIGURACOES_ID FOR CONFIGURACOES
          ACTIVE BEFORE INSERT POSITION 0
          AS BEGIN
            IF (NEW.ID IS NULL) THEN
              NEW.ID = NEXT VALUE FOR GEN_CONFIGURACOES_ID;
          END
        `);
        console.log('✅ Trigger TRG_CONFIGURACOES_ID criado!');
      } catch (e) {
        if (e.message && (e.message.toLowerCase().includes('already') || e.message.toLowerCase().includes('unsuccessful metadata'))) {
          console.log('✅ Trigger TRG_CONFIGURACOES_ID já existe.');
        } else {
          console.log('Aviso ao criar trigger:', e.message);
        }
      }
    } else {
      console.log('✅ Tabela CONFIGURACOES já existe. Nada a fazer.');
    }

    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    throw err;
  } finally {
    await new Promise((resolve) => db.detach(resolve));
    console.log('🔌 Conexão encerrada.');
  }
}

migrate().catch((err) => {
  console.error('Falha na migração:', err);
  process.exit(1);
});
