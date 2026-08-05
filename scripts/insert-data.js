const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

async function initData() {
  console.log('🚀 Inserindo dados iniciais...\n');
  
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

    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

    // Verificar se já tem dados
    const planosResult = await query('SELECT COUNT(*) AS CNT FROM PLANOS');
    const planosCount = planosResult[0].CNT || 0;
    
    if (planosCount === 0) {
      console.log('📝 Nenhum dado encontrado, inserindo...');

      // Inserir Planos
      await query(`
        INSERT INTO PLANOS (NOME, DESCRICAO, VALOR_MENSAL, LIMITE_USUARIOS, LIMITE_CONTAS, FEATURES, ATIVO)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['FREE', 'Plano gratuito para testes', 0, 1, 100, 'DASHBOARD,CONTAS_PAGAR,CONTAS_RECEBER,RELATORIOS_BASICOS', 'S']);
      
      await query(`
        INSERT INTO PLANOS (NOME, DESCRICAO, VALOR_MENSAL, LIMITE_USUARIOS, LIMITE_CONTAS, FEATURES, ATIVO)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['PROFISSIONAL', 'Plano para profissionais liberais', 49.90, 5, null, 'DASHBOARD,CONTAS_PAGAR,CONTAS_RECEBER,RELATORIOS_AVANCADOS,AGENDAMENTOS,EXPORT_PDF,USUARIOS', 'S']);
      
      await query(`
        INSERT INTO PLANOS (NOME, DESCRICAO, VALOR_MENSAL, LIMITE_USUARIOS, LIMITE_CONTAS, FEATURES, ATIVO)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['EMPRESARIAL', 'Plano para pequenas empresas', 149.90, null, null, 'DASHBOARD,CONTAS_PAGAR,CONTAS_RECEBER,RELATORIOS_AVANCADOS,AGENDAMENTOS,EXPORT_PDF,USUARIOS,API_ACCESS,PRIORIDADE_SUPORTE', 'S']);
      
      console.log('  ✅ 3 Planos inseridos');

      // Inserir Tenant Master
      await query(`
        INSERT INTO TENANTS (NOME, CNPJ, NOME_FANTASIA, EMAIL_ADMIN, TELEFONE, STATUS, PLANO_ID, LIMITE_USUARIOS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['Master Admin', '00.000.000/0001-00', 'Connect Finance', 'admin@master', '11999999999', 'ATIVO', 3, 1]);
      console.log('  ✅ Tenant Master criado');

      // Inserir Super Admin (senha: admin123 -> base64: YWRtaW4xMjM=)
      await query(`
        INSERT INTO USUARIOS (TENANT_ID, NOME, EMAIL, SENHA, ROLE, STATUS)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [1, 'Super Admin', 'admin@master', 'YWRtaW4xMjM=', 'ADMIN', 'ATIVO']);
      console.log('  ✅ Super Admin criado');

      // Inserir Admin Demo (senha: demo123 -> base64: ZGVtbzEyMw==)
      await query(`
        INSERT INTO USUARIOS (TENANT_ID, NOME, EMAIL, SENHA, ROLE, STATUS)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [1, 'Admin Demo', 'admin@demo', 'ZGVtbzEyMw==', 'ADMIN', 'ATIVO']);
      console.log('  ✅ Admin Demo criado');

      // Inserir Assinatura Master
      await query(`
        INSERT INTO ASSINATURAS (TENANT_ID, PLANO_ID, STATUS, DATA_INICIO, VALOR_PAGO, FORMA_PAGAMENTO)
        VALUES (?, ?, ?, CURRENT_DATE, ?, ?)
      `, [1, 3, 'ATIVA', 0, 'BOLETO']);
      console.log('  ✅ Assinatura Master criada');

      console.log('\n🎉 Dados inseridos com sucesso!');
      console.log('\n📌 Credenciais de acesso:');
      console.log('   Super Admin: admin@master / admin123');
      console.log('   Admin Demo:  admin@demo / demo123');
    } else {
      console.log('ℹ️  Dados já existem no banco');
    }

    db.detach();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

initData();
