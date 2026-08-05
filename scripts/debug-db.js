const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

async function debug() {
  try {
    const db = await new Promise((resolve, reject) => {
      Firebird.attach({
        database: dbPath,
        user: 'SYSDBA',
        password: 'masterkey'
      }, (err, database) => {
        if (err) reject(err);
        else resolve(database);
      });
    });

    console.log('✅ Conectado ao banco\n');

    // Verificar tabelas
    const tables = await new Promise((resolve, reject) => {
      db.query("SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG = 0", [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log('📊 Tabelas encontradas:');
    tables.forEach(t => console.log('  -', t.RDB$RELATION_NAME.trim()));

    // Verificar usuários
    const usuarios = await new Promise((resolve, reject) => {
      db.query('SELECT ID, EMAIL, NOME, ROLE, STATUS FROM USUARIOS', [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log('\n👥 Usuários no banco:');
    usuarios.forEach(u => {
      console.log(`  - ${u.EMAIL} (${u.NOME}) - Role: ${u.ROLE}, Status: ${u.STATUS}`);
    });

    // Verificar tenants
    const tenants = await new Promise((resolve, reject) => {
      db.query('SELECT ID, NOME, STATUS FROM TENANTS', [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log('\n🏢 Tenants no banco:');
    tenants.forEach(t => {
      console.log(`  - ${t.NOME} (ID: ${t.ID}) - Status: ${t.STATUS}`);
    });

    db.detach();
    console.log('\n✅ Debug concluído!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debug();
