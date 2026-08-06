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
    console.error('Error connecting:', err);
    return;
  }
  
  const sql = `
    INSERT INTO CONTAS (TENANT_ID, USUARIO_ID, CONTA_BANCARIA_ID, DESCRICAO, VALOR, DATA_VENCIMENTO, DATA_PAGAMENTO, CATEGORIA, STATUS, TIPO, OBSERVACOES, ARQUIVO_BOLETO, ARQUIVO_COMPROVANTE)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING ID
  `;
  
  const params = [
    1, 1, 2, 'Teste de inserção', 150.00, '2026-08-05', null, 'Outros', 'PENDENTE', 'RECEBER', 'Teste', null, null
  ];
  
  db.query(sql, params, (err, res) => {
    if (err) {
      console.error('❌ Insert failed:', err.message);
    } else {
      console.log('✅ Insert succeeded!', res);
    }
    db.detach();
  });
});
