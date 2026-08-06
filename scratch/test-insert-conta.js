const repositories = require('../src/lib/db/repositories');

async function test() {
  try {
    const id = await repositories.contasRepository.create({
      tenant_id: 1,
      usuario_id: 1,
      conta_bancaria_id: 2, // 'conect c6' exists with ID 2
      descricao: 'Teste de inserção',
      valor: 150.00,
      data_vencimento: '2026-08-05',
      data_pagamento: null,
      categoria: 'Outros',
      status: 'PENDENTE',
      tipo: 'RECEBER',
      observacoes: 'Teste',
      arquivo_boleto: null,
      arquivo_comprovante: null
    });
    console.log('Inserção bem-sucedida! ID gerado:', id);
  } catch (err) {
    console.error('Falha ao inserir conta:', err);
  }
}

test();
