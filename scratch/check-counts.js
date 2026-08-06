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

Firebird.attach(options, (err, db) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  
  db.query('SELECT COUNT(*) AS CNT FROM CLIENTES', [], (err, res) => {
    if (err) console.error('Error querying CLIENTES:', err);
    else console.log('CLIENTES count:', res);
    
    db.query('SELECT COUNT(*) AS CNT FROM SOFTWARES', [], (err, res) => {
      if (err) console.error('Error querying SOFTWARES:', err);
      else console.log('SOFTWARES count:', res);
      
      db.query('SELECT COUNT(*) AS CNT FROM CONTAS_BANCARIAS', [], (err, res) => {
        if (err) console.error('Error querying CONTAS_BANCARIAS:', err);
        else console.log('CONTAS_BANCARIAS count:', res);
        db.detach();
      });
    });
  });
});
