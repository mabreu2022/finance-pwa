const Firebird = require('node-firebird');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

const options = {
  database: dbPath,
  user: 'SYSDBA',
  password: 'masterkey'
};

async function run() {
  console.log('🚀 Iniciando migração para suporte a anexos (boletos/comprovantes)...\n');
  
  // 1. Criar as pastas de uploads no filesystem
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  const boletosDir = path.join(uploadsDir, 'boletos');
  const comprovantesDir = path.join(uploadsDir, 'comprovantes');

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log('  📁 Pasta public/uploads criada.');
    }
    if (!fs.existsSync(boletosDir)) {
      fs.mkdirSync(boletosDir);
      console.log('  📁 Pasta public/uploads/boletos criada.');
    }
    if (!fs.existsSync(comprovantesDir)) {
      fs.mkdirSync(comprovantesDir);
      console.log('  📁 Pasta public/uploads/comprovantes criada.');
    }
  } catch (err) {
    console.error('  ❌ Erro ao criar pastas de upload:', err.message);
  }

  // 2. Rodar alteração no banco de dados Firebird
  let db;
  try {
    db = await new Promise((resolve, reject) => {
      Firebird.attach(options, (err, database) => {
        if (err) reject(err);
        else resolve(database);
      });
    });

    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      });
    };

    const execute = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

    // Verificar se ARQUIVO_BOLETO existe
    const hasBoletoCol = await query(
      "SELECT RDB$FIELD_NAME FROM RDB$RELATION_FIELDS WHERE TRIM(RDB$RELATION_NAME) = 'CONTAS' AND TRIM(RDB$FIELD_NAME) = 'ARQUIVO_BOLETO'"
    );

    if (hasBoletoCol.length === 0) {
      console.log('  📊 Adicionando coluna ARQUIVO_BOLETO à tabela CONTAS...');
      await execute('ALTER TABLE CONTAS ADD ARQUIVO_BOLETO VARCHAR(255)');
      console.log('  ✅ Coluna ARQUIVO_BOLETO adicionada.');
    } else {
      console.log('  ℹ️ Coluna ARQUIVO_BOLETO já existe.');
    }

    // Verificar se ARQUIVO_COMPROVANTE existe
    const hasComprovanteCol = await query(
      "SELECT RDB$FIELD_NAME FROM RDB$RELATION_FIELDS WHERE TRIM(RDB$RELATION_NAME) = 'CONTAS' AND TRIM(RDB$FIELD_NAME) = 'ARQUIVO_COMPROVANTE'"
    );

    if (hasComprovanteCol.length === 0) {
      console.log('  📊 Adicionando coluna ARQUIVO_COMPROVANTE à tabela CONTAS...');
      await execute('ALTER TABLE CONTAS ADD ARQUIVO_COMPROVANTE VARCHAR(255)');
      console.log('  ✅ Coluna ARQUIVO_COMPROVANTE adicionada.');
    } else {
      console.log('  ℹ️ Coluna ARQUIVO_COMPROVANTE já existe.');
    }

    console.log('\n🎉 MIGRAÇÃO DE ANEXOS CONCLUÍDA COM SUCESSO!');
  } catch (error) {
    console.error('\n❌ Erro durante a migração do banco de dados:', error.message);
  } finally {
    if (db) {
      db.detach();
    }
  }
}

run();
