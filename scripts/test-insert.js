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

    console.log('Testing insert with RETURNING ID...');

    const sql = `
      INSERT INTO CONTAS (TENANT_ID, USUARIO_ID, DESCRICAO, VALOR, DATA_VENCIMENTO, DATA_PAGAMENTO, CATEGORIA, STATUS, TIPO, OBSERVACOES)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    
    // Insert a test account
    const params = [
      1, // tenant_id
      1, // usuario_id
      'Test Account ' + new Date().toISOString(),
      100.50,
      '2026-08-31',
      null,
      'Alimentação',
      'PENDENTE',
      'PAGAR',
      'Test observation'
    ];

    const result = await query(sql, params);
    console.log('Result type:', typeof result);
    console.log('Is array:', Array.isArray(result));
    console.log('Raw result:', JSON.stringify(result));
    if (result && result.length > 0) {
      console.log('Result keys:', Object.keys(result[0]));
      console.log('Result ID:', result[0].ID);
    }

    db.detach();
  } catch (err) {
    console.error('Error inserting:', err);
  }
}

run();
