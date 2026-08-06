/**
 * fix-usuarios-generator.js  
 * Cria generator e trigger para USUARIOS e reseta para o valor correto
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

async function fix() {
  const db = await new Promise((resolve, reject) => {
    Firebird.attach(options, (err, database) => {
      if (err) reject(err);
      else resolve(database);
    });
  });

  try {
    // 1. Descobrir o maior ID atual
    const rows = await runQuery(db, 'SELECT MAX(ID) AS MAX_ID FROM USUARIOS');
    const maxId = rows[0]?.MAX_ID || 0;
    console.log(`📊 Maior ID em USUARIOS: ${maxId}`);

    // 2. Criar o generator se não existir
    try {
      await runQuery(db, 'CREATE SEQUENCE GEN_USUARIOS_ID');
      console.log('✅ Sequence GEN_USUARIOS_ID criada!');
    } catch (e) {
      if (e.message?.toLowerCase().includes('already') || e.message?.toLowerCase().includes('unsuccessful')) {
        console.log('✅ Sequence GEN_USUARIOS_ID já existia.');
      } else throw e;
    }

    // 3. Setar o generator para o valor do maior ID atual
    if (maxId > 0) {
      // Primeiro, verificar valor atual
      const curRows = await runQuery(db, 'SELECT GEN_ID(GEN_USUARIOS_ID, 0) AS V FROM RDB$DATABASE');
      const curVal = curRows[0]?.V || 0;
      console.log(`📍 Valor atual do generator: ${curVal}`);

      if (curVal < maxId) {
        const diff = maxId - curVal;
        await runQuery(db, `SELECT GEN_ID(GEN_USUARIOS_ID, ${diff}) FROM RDB$DATABASE`);
        console.log(`✅ Generator avançado para ${maxId}. Próximo ID será ${maxId + 1}.`);
      } else {
        console.log(`✅ Generator já está em ${curVal} >= ${maxId}. OK.`);
      }
    }

    // 4. Criar a trigger BEFORE INSERT
    try {
      await runQuery(db, `
        CREATE TRIGGER TRG_USUARIOS_ID FOR USUARIOS
        ACTIVE BEFORE INSERT POSITION 0
        AS BEGIN
          IF (NEW.ID IS NULL) THEN
            NEW.ID = NEXT VALUE FOR GEN_USUARIOS_ID;
        END
      `);
      console.log('✅ Trigger TRG_USUARIOS_ID criada!');
    } catch (e) {
      if (e.message?.toLowerCase().includes('already') || e.message?.toLowerCase().includes('unsuccessful')) {
        console.log('✅ Trigger TRG_USUARIOS_ID já existia.');
      } else {
        console.log('⚠️ Aviso ao criar trigger:', e.message);
      }
    }

    // 5. Verificar valor final
    const finalRows = await runQuery(db, 'SELECT GEN_ID(GEN_USUARIOS_ID, 0) AS V FROM RDB$DATABASE');
    console.log(`\n🎉 Generator final: ${finalRows[0]?.V}. Próximo INSERT usará ID = ${(finalRows[0]?.V || 0) + 1}`);
    console.log('✅ Correção concluída! Pode criar novos usuários agora.');

  } catch (err) {
    console.error('❌ Erro:', err.message || err);
  } finally {
    await new Promise(resolve => db.detach(resolve));
    console.log('🔌 Conexão encerrada.');
  }
}

fix().catch(err => { console.error(err); process.exit(1); });
