/**
 * fix-sequence-usuarios.js
 * Corrige o generator GEN_USUARIOS_ID para ser maior que o maior ID existente
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
    // 1. Descobrir o maior ID atual em USUARIOS
    const rows = await runQuery(db, 'SELECT MAX(ID) AS MAX_ID FROM USUARIOS');
    const maxId = rows[0]?.MAX_ID || 0;
    console.log(`📊 Maior ID atual em USUARIOS: ${maxId}`);

    // 2. Descobrir o nome do generator usado para USUARIOS
    // Vamos procurar na trigger de before insert
    let genName = null;
    try {
      const trigRows = await runQuery(db, `
        SELECT RDB$TRIGGER_SOURCE FROM RDB$TRIGGERS 
        WHERE UPPER(TRIM(RDB$RELATION_NAME)) = 'USUARIOS' 
        AND RDB$TRIGGER_TYPE = 1
      `);
      if (trigRows.length > 0) {
        const src = trigRows[0].RDB$TRIGGER_SOURCE?.toString() || '';
        console.log('Trigger source:', src.substring(0, 200));
        // Extrair nome do generator da trigger
        const match = src.match(/GEN_VAL\s*=\s*GEN_ID\s*\(\s*([A-Z0-9_]+)\s*,\s*1\s*\)/i) ||
                      src.match(/NEXT VALUE FOR\s+([A-Z0-9_]+)/i) ||
                      src.match(/GEN_ID\s*\(\s*([A-Z0-9_]+)/i);
        if (match) genName = match[1].trim();
      }
    } catch (e) {
      console.log('Aviso ao ler trigger:', e.message);
    }

    if (!genName) {
      // Tentar nomes comuns
      const candidates = ['GEN_USUARIOS_ID', 'SEQ_USUARIOS', 'GEN_USUARIO_ID'];
      for (const name of candidates) {
        try {
          await runQuery(db, `SELECT GEN_ID(${name}, 0) FROM RDB$DATABASE`);
          genName = name;
          console.log(`✅ Generator encontrado: ${genName}`);
          break;
        } catch { /* não existe */ }
      }
    }

    if (!genName) {
      console.error('❌ Generator não encontrado! Tente verificar manualmente.');
      return;
    }

    console.log(`🔧 Generator identificado: ${genName}`);

    // 3. Verificar o valor atual do generator
    const genRows = await runQuery(db, `SELECT GEN_ID(${genName}, 0) AS CUR_VAL FROM RDB$DATABASE`);
    const currentVal = genRows[0]?.CUR_VAL || 0;
    console.log(`📍 Valor atual do generator: ${currentVal}`);

    // 4. Calcular o incremento necessário
    if (currentVal < maxId) {
      const increment = maxId - currentVal;
      console.log(`⬆️ Incrementando generator em ${increment} para chegar a ${maxId}...`);
      await runQuery(db, `SELECT GEN_ID(${genName}, ${increment}) FROM RDB$DATABASE`);
      
      // Confirmar novo valor
      const newRows = await runQuery(db, `SELECT GEN_ID(${genName}, 0) AS NEW_VAL FROM RDB$DATABASE`);
      console.log(`✅ Novo valor do generator: ${newRows[0]?.NEW_VAL}`);
      console.log(`✅ Próximo INSERT usará ID = ${(newRows[0]?.NEW_VAL || 0) + 1}`);
    } else {
      console.log(`✅ Generator já está correto (${currentVal} >= ${maxId}). Nenhuma correção necessária.`);
    }

    console.log('\n🎉 Correção concluída! Pode criar novos usuários agora.');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await new Promise(resolve => db.detach(resolve));
    console.log('🔌 Conexão encerrada.');
  }
}

fix().catch(err => { console.error(err); process.exit(1); });
