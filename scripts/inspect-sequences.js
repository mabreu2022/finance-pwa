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

async function inspect() {
  const db = await new Promise((resolve, reject) => {
    Firebird.attach(options, (err, database) => {
      if (err) reject(err);
      else resolve(database);
    });
  });

  try {
    // Listar todos os generators/sequences
    console.log('\n=== GENERATORS/SEQUENCES ===');
    const gens = await runQuery(db, 'SELECT RDB$GENERATOR_NAME, RDB$INITIAL_VALUE FROM RDB$GENERATORS WHERE RDB$SYSTEM_FLAG = 0 OR RDB$SYSTEM_FLAG IS NULL');
    gens.forEach(g => {
      console.log(' -', g.RDB$GENERATOR_NAME?.trim(), '| initial:', g.RDB$INITIAL_VALUE);
    });

    // Listar triggers de USUARIOS
    console.log('\n=== TRIGGERS EM USUARIOS ===');
    const trigs = await runQuery(db, `SELECT RDB$TRIGGER_NAME, RDB$TRIGGER_SOURCE FROM RDB$TRIGGERS WHERE UPPER(TRIM(RDB$RELATION_NAME)) = 'USUARIOS'`);
    trigs.forEach(t => {
      console.log(' Trigger:', t.RDB$TRIGGER_NAME?.trim());
      const src = t.RDB$TRIGGER_SOURCE;
      if (src) {
        const str = src.toString ? src.toString() : String(src);
        console.log(' Source:', str.substring(0, 300));
      }
    });

    // Verificar o valor atual de cada generator para achar o de USUARIOS
    console.log('\n=== VALORES ATUAIS ===');
    for (const g of gens) {
      const name = g.RDB$GENERATOR_NAME?.trim();
      try {
        const val = await runQuery(db, `SELECT GEN_ID(${name}, 0) AS V FROM RDB$DATABASE`);
        console.log(` ${name} = ${val[0]?.V}`);
      } catch (e) {
        console.log(` ${name} = ERRO: ${e.message}`);
      }
    }

    // Max IDs nas tabelas principais
    console.log('\n=== MAX IDs ===');
    for (const table of ['USUARIOS', 'TENANTS', 'CONTAS_BANCARIAS']) {
      try {
        const r = await runQuery(db, `SELECT MAX(ID) AS M FROM ${table}`);
        console.log(` ${table}: max ID = ${r[0]?.M}`);
      } catch (e) {
        console.log(` ${table}: ${e.message}`);
      }
    }
  } finally {
    await new Promise(resolve => db.detach(resolve));
  }
}

inspect().catch(console.error);
