/**
 * migration-comercial.js
 * Cria a tabela PROPOSTAS no Firebird com Generator, Trigger e Dados Fictícios
 */
const Firebird = require('node-firebird');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'database', 'BANCOFINANCAS.FDB');

const options = {
  database: dbPath,
  user: 'SYSDBA',
  password: 'masterkey',
  role: null,
  pageSize: 4096
};

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result || []);
    });
  });
}

async function migrate() {
  console.log('🔧 Iniciando migração: Módulo Comercial (PROPOSTAS)...');

  const db = await new Promise((resolve, reject) => {
    Firebird.attach(options, (err, database) => {
      if (err) reject(err);
      else resolve(database);
    });
  });

  try {
    // 1. Verificar se a tabela PROPOSTAS já existe
    let tableExists = false;
    try {
      const checkTable = `SELECT RDB$RELATION_NAME FROM RDB$RELATIONS 
                          WHERE UPPER(TRIM(RDB$RELATION_NAME)) = 'PROPOSTAS'`;
      const rows = await runQuery(db, checkTable);
      tableExists = rows && rows.length > 0;
    } catch (e) {
      console.log('Aviso ao verificar tabela PROPOSTAS:', e.message);
    }

    if (!tableExists) {
      console.log('📌 Criando tabela PROPOSTAS...');
      await runQuery(db, `
        CREATE TABLE PROPOSTAS (
          ID INTEGER NOT NULL PRIMARY KEY,
          TENANT_ID INTEGER NOT NULL,
          CLIENTE_ID INTEGER NOT NULL,
          USUARIO_ID INTEGER NOT NULL,
          TITULO VARCHAR(150) NOT NULL,
          VALOR NUMERIC(15,2) NOT NULL,
          ESTAGIO VARCHAR(30) NOT NULL,
          DESCRICAO VARCHAR(1000),
          DATA_VALIDADE DATE,
          DATA_FECHAMENTO DATE,
          DATA_CADASTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela PROPOSTAS criada!');

      // Criar sequence
      try {
        await runQuery(db, 'CREATE SEQUENCE GEN_PROPOSTAS_ID');
        console.log('✅ Sequence GEN_PROPOSTAS_ID criada!');
      } catch (e) {
        console.log('Aviso ao criar sequence:', e.message);
      }

      // Criar trigger
      try {
        await runQuery(db, `
          CREATE TRIGGER TRG_PROPOSTAS_ID FOR PROPOSTAS
          ACTIVE BEFORE INSERT POSITION 0
          AS BEGIN
            IF (NEW.ID IS NULL) THEN
              NEW.ID = NEXT VALUE FOR GEN_PROPOSTAS_ID;
          END
        `);
        console.log('✅ Trigger TRG_PROPOSTAS_ID criada!');
      } catch (e) {
        console.log('Aviso ao criar trigger:', e.message);
      }

      // Inserir dados fictícios de propostas para popular a primeira exibição
      console.log('📌 Populando dados fictícios em PROPOSTAS...');
      
      // Buscar clientes existentes no tenant 1 para associar
      const clientes = await runQuery(db, 'SELECT ID FROM CLIENTES WHERE TENANT_ID = 1');
      const usuarios = await runQuery(db, 'SELECT ID FROM USUARIOS WHERE TENANT_ID = 1');
      
      if (clientes.length > 0 && usuarios.length > 0) {
        const cId1 = clientes[0].ID;
        const cId2 = clientes[1]?.ID || cId1;
        
        const uIdAdmin = usuarios.find(u => u.ID === 1)?.ID || usuarios[0].ID;
        // Tentar achar outro usuário vendedor ou usar o primeiro
        const uIdVendedor = usuarios.find(u => u.ID !== uIdAdmin)?.ID || uIdAdmin;

        const propostasFicticias = [
          { tenant_id: 1, cliente_id: cId1, usuario_id: uIdAdmin, titulo: 'Licenciamento ERP Connect', valor: 15000.00, estagio: 'NEGOCIACAO', descricao: 'Negociação de 15 licenças anuais do ERP ERP Connect.' },
          { tenant_id: 1, cliente_id: cId2, usuario_id: uIdVendedor, titulo: 'Consultoria Financeira Integrada', valor: 8500.00, estagio: 'PROPOSTA', descricao: 'Proposta de mapeamento de processos e implantação do módulo financeiro.' },
          { tenant_id: 1, cliente_id: cId1, usuario_id: uIdVendedor, titulo: 'App Customizado iOS/Android', valor: 45000.00, estagio: 'PROSPECCAO', descricao: 'Desenvolvimento de aplicativo móvel para integração de vendas.' },
          { tenant_id: 1, cliente_id: cId2, usuario_id: uIdAdmin, titulo: 'Treinamento de Equipe Connect', valor: 3200.00, estagio: 'GANHA', descricao: 'Treinamento ministrado para equipe administrativa.', fechamento: 'CURRENT_DATE' },
          { tenant_id: 1, cliente_id: cId1, usuario_id: uIdVendedor, titulo: 'Servidor de Banco de Dados', valor: 12000.00, estagio: 'PERDIDA', descricao: 'Migração para infraestrutura em nuvem (recusado pelo valor).', fechamento: 'CURRENT_DATE' }
        ];

        for (const prop of propostasFicticias) {
          const fechamentoVal = prop.fechamento ? 'CURRENT_DATE' : 'NULL';
          await runQuery(db, `
            INSERT INTO PROPOSTAS (TENANT_ID, CLIENTE_ID, USUARIO_ID, TITULO, VALOR, ESTAGIO, DESCRICAO, DATA_VALIDADE, DATA_FECHAMENTO)
            VALUES (?, ?, ?, ?, ?, ?, ?, DATEADD(30 DAY TO CURRENT_DATE), ${fechamentoVal})
          `, [prop.tenant_id, prop.cliente_id, prop.usuario_id, prop.titulo, prop.valor, prop.estagio, prop.descricao]);
        }
        console.log('✅ Propostas fictícias inseridas com sucesso!');
      } else {
        console.log('⚠️ Nenhum cliente ou usuário encontrado para associar dados fictícios.');
      }
    } else {
      console.log('✅ Tabela PROPOSTAS já existe.');
    }

    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    throw err;
  } finally {
    await new Promise((resolve) => db.detach(resolve));
    console.log('🔌 Conexão encerrada.');
  }
}

migrate().catch((err) => {
  console.error('Falha na migração:', err);
  process.exit(1);
});
