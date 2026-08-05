import Firebird from 'node-firebird';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

const options = {
  database: dbPath,
  user: 'SYSDBA',
  password: 'masterkey',
  role: null,
  pageSize: 4096
};

function getConnection() {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err: any, db: any) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

async function seed() {
  const db: any = await getConnection();
  
  try {
    // Verificar se já existe tenant
    const tenants = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM TENANTS', (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if ((tenants as any[]).length > 0) {
      console.log('Tenant já existe:', tenants);
    } else {
      // Criar tenant padrão
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO TENANTS (ID, NOME, CNPJ, NOME_FANTASIA, EMAIL_ADMIN, STATUS, LIMITE_USUARIOS, DATA_CRIACAO)
           VALUES (1, 'Empresa Padrao', '00000000000000', 'Connect Finance', 'admin@connect.com', 'ATIVO', 10, CURRENT_TIMESTAMP)`,
          (err: any) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });
      console.log('✅ Tenant criado');
    }

    // Criar usuário admin (senha: admin123 -> base64)
    const senhaBase64 = Buffer.from('admin123').toString('base64');
    
    const usuarios = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM USUARIOS WHERE EMAIL = ?', ['admin@connect.com'], (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if ((usuarios as any[]).length === 0) {
      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO USUARIOS (ID, TENANT_ID, NOME, EMAIL, SENHA, ROLE, STATUS, DATA_CADASTRO)
           VALUES (1, 1, 'Administrador', 'admin@connect.com', ?, 'ADMIN', 'ATIVO', CURRENT_TIMESTAMP)`,
          [senhaBase64],
          (err: any) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });
      console.log('✅ Usuário admin criado');
    } else {
      console.log('Usuário já existe');
    }

    console.log('\n📝 Credenciais de acesso:');
    console.log('   Email: admin@connect.com');
    console.log('   Senha: admin123');

  } finally {
    db.detach();
  }
}

seed().catch(console.error);
