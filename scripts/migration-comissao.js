/**
 * migration-comissao.js
 * Adiciona a coluna COMISSAO_PERCENTUAL na tabela USUARIOS e a chave COMISSAO_PADRAO em CONFIGURACOES
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
  console.log('🔧 Iniciando migração: Módulo de Comissões de Vendas...');

  const db = await new Promise((resolve, reject) => {
    Firebird.attach(options, (err, database) => {
      if (err) reject(err);
      else resolve(database);
    });
  });

  try {
    // 1. Verificar se a coluna COMISSAO_PERCENTUAL já existe na tabela USUARIOS
    let columnExists = false;
    try {
      const checkSql = `SELECT RDB$FIELD_NAME FROM RDB$RELATION_FIELDS 
                        WHERE UPPER(TRIM(RDB$RELATION_NAME)) = 'USUARIOS' 
                        AND UPPER(TRIM(RDB$FIELD_NAME)) = 'COMISSAO_PERCENTUAL'`;
      const rows = await runQuery(db, checkSql);
      columnExists = rows && rows.length > 0;
    } catch (e) {
      console.log('Aviso ao verificar coluna COMISSAO_PERCENTUAL:', e.message);
    }

    if (columnExists) {
      console.log('✅ Coluna COMISSAO_PERCENTUAL já existe em USUARIOS.');
    } else {
      console.log('📌 Adicionando coluna COMISSAO_PERCENTUAL em USUARIOS...');
      try {
        await runQuery(db, 'ALTER TABLE USUARIOS ADD COMISSAO_PERCENTUAL NUMERIC(5,2)');
        console.log('✅ Coluna COMISSAO_PERCENTUAL adicionada!');
      } catch (e) {
        if (e.message && e.message.toLowerCase().includes('already')) {
          console.log('✅ Coluna COMISSAO_PERCENTUAL já existe.');
        } else {
          throw e;
        }
      }
    }

    // 2. Verificar se a chave COMISSAO_PADRAO já existe na tabela CONFIGURACOES
    let configExists = false;
    try {
      const checkConfig = `SELECT ID FROM CONFIGURACOES WHERE CHAVE = 'COMISSAO_PADRAO'`;
      const rows = await runQuery(db, checkConfig);
      configExists = rows && rows.length > 0;
    } catch (e) {
      console.log('Aviso ao verificar chave COMISSAO_PADRAO:', e.message);
    }

    if (configExists) {
      console.log('✅ Configuração COMISSAO_PADRAO já existe.');
    } else {
      console.log('📌 Inserindo comissão padrão de 5.00% em CONFIGURACOES...');
      try {
        await runQuery(db, `
          INSERT INTO CONFIGURACOES (TENANT_ID, CHAVE, VALOR) 
          VALUES (1, 'COMISSAO_PADRAO', '5.00')
        `);
        console.log('✅ Configuração COMISSAO_PADRAO inserida!');
      } catch (e) {
        console.log('Aviso ao inserir comissão padrão:', e.message);
      }
    }

    console.log('\n🎉 Migração de comissões concluída com sucesso!');
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
