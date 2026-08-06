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
  
  db.query('SELECT * FROM CLIENTES', [], (err, res) => {
    console.log('CLIENTES:', res);
    
    db.query('SELECT * FROM SOFTWARES', [], (err, res) => {
      console.log('SOFTWARES:', res);
      
      db.query('SELECT * FROM CONTAS_BANCARIAS', [], (err, res) => {
        console.log('CONTAS_BANCARIAS:', res);
        db.detach();
      });
    });
  });
});
