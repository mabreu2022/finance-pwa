const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

const options = {
  database: dbPath,
  user: 'SYSDBA',
  password: 'masterkey'
};

async function run() {
  try {
    const db = await new Promise((resolve, reject) => {
      Firebird.attach(options, (err, database) => {
        if (err) reject(err);
        else resolve(database);
      });
    });

    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

    console.log('Inserting admin@master and admin@demo into USUARIOS...');

    // Get max ID
    const maxResult = await query('SELECT MAX(ID) AS MAX_ID FROM USUARIOS');
    let nextId = (maxResult[0].MAX_ID || 0) + 1;

    // check if admin@master exists
    const users1 = await query('SELECT * FROM USUARIOS WHERE EMAIL = ?', ['admin@master']);
    if (users1.length === 0) {
      await query(
        `INSERT INTO USUARIOS (ID, TENANT_ID, NOME, EMAIL, SENHA, ROLE, STATUS)
         VALUES (?, 1, 'Super Admin', 'admin@master', 'YWRtaW4xMjM=', 'ADMIN', 'ATIVO')`,
         [nextId]
      );
      console.log(`✅ admin@master created successfully with ID ${nextId} (password: admin123)`);
      nextId++;
    } else {
      console.log('ℹ️ admin@master already exists');
    }

    // check if admin@demo exists
    const users2 = await query('SELECT * FROM USUARIOS WHERE EMAIL = ?', ['admin@demo']);
    if (users2.length === 0) {
      await query(
        `INSERT INTO USUARIOS (ID, TENANT_ID, NOME, EMAIL, SENHA, ROLE, STATUS)
         VALUES (?, 1, 'Admin Demo', 'admin@demo', 'ZGVtbzEyMw==', 'ADMIN', 'ATIVO')`,
         [nextId]
      );
      console.log(`✅ admin@demo created successfully with ID ${nextId} (password: demo123)`);
    } else {
      console.log('ℹ️ admin@demo already exists');
    }

    db.detach();
  } catch (err) {
    console.error('Error inserting users:', err);
  }
}

run();
