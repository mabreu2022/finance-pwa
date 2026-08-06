import { query, execute, Plano, Tenant, Usuario, Conta, Agendamento, ContaBancaria, Cliente, Software, Licenca, Proposta, GrupoChat, MensagemChat } from './connection';

export const planosRepository = {
  async getAll(): Promise<Plano[]> {
    const rows = (await query('SELECT * FROM PLANOS WHERE ATIVO = ?', ['S'])) as any[];
    return rows.map((row) => ({
      id: row.ID,
      nome: row.NOME,
      descricao: row.DESCRICAO,
      valor_mensal: row.VALOR_MENSAL,
      limite_usuarios: row.LIMITE_USUARIOS,
      limite_contas: row.LIMITE_CONTAS,
      features: row.FEATURES,
      ativo: row.ATIVO,
      data_cadastro: row.DATA_CADASTRO
    }));
  },

  async getById(id: number): Promise<Plano | undefined> {
    const rows = (await query('SELECT * FROM PLANOS WHERE ID = ?', [id])) as any[];
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.ID,
      nome: row.NOME,
      descricao: row.DESCRICAO,
      valor_mensal: row.VALOR_MENSAL,
      limite_usuarios: row.LIMITE_USUARIOS,
      limite_contas: row.LIMITE_CONTAS,
      features: row.FEATURES,
      ativo: row.ATIVO,
      data_cadastro: row.DATA_CADASTRO
    };
  }
};

export const tenantsRepository = {
  async getAll(): Promise<Tenant[]> {
    const rows = (await query('SELECT * FROM TENANTS')) as any[];
    return rows.map((row) => ({
      id: row.ID,
      nome: row.NOME,
      cnpj: row.CNPJ,
      nome_fantasia: row.NOME_FANTASIA,
      email_admin: row.EMAIL_ADMIN,
      telefone: row.TELEFONE,
      endereco: row.ENDERECO,
      dominio: row.DOMINIO,
      status: row.STATUS,
      plano_id: row.PLANO_ID,
      limite_usuarios: row.LIMITE_USUARIOS,
      data_criacao: row.DATA_CRIACAO,
      data_expiracao: row.DATA_EXPIRACAO
    }));
  },

  async getById(id: number): Promise<Tenant | undefined> {
    const rows = (await query('SELECT * FROM TENANTS WHERE ID = ?', [id])) as any[];
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.ID,
      nome: row.NOME,
      cnpj: row.CNPJ,
      nome_fantasia: row.NOME_FANTASIA,
      email_admin: row.EMAIL_ADMIN,
      telefone: row.TELEFONE,
      endereco: row.ENDERECO,
      dominio: row.DOMINIO,
      status: row.STATUS,
      plano_id: row.PLANO_ID,
      limite_usuarios: row.LIMITE_USUARIOS,
      data_criacao: row.DATA_CRIACAO,
      data_expiracao: row.DATA_EXPIRACAO
    };
  },

  async getByDominio(dominio: string): Promise<Tenant | undefined> {
    const rows = (await query('SELECT * FROM TENANTS WHERE DOMINIO = ?', [dominio])) as any[];
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.ID,
      nome: row.NOME,
      cnpj: row.CNPJ,
      nome_fantasia: row.NOME_FANTASIA,
      email_admin: row.EMAIL_ADMIN,
      telefone: row.TELEFONE,
      endereco: row.ENDERECO,
      dominio: row.DOMINIO,
      status: row.STATUS,
      plano_id: row.PLANO_ID,
      limite_usuarios: row.LIMITE_USUARIOS,
      data_criacao: row.DATA_CRIACAO,
      data_expiracao: row.DATA_EXPIRACAO
    };
  },

  async create(tenant: Omit<Tenant, 'id' | 'data_criacao'>): Promise<number> {
    const sql = `
      INSERT INTO TENANTS (NOME, CNPJ, NOME_FANTASIA, EMAIL_ADMIN, TELEFONE, ENDERECO, DOMINIO, STATUS, PLANO_ID, LIMITE_USUARIOS, DATA_EXPIRACAO)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    const params = [
      tenant.nome,
      tenant.cnpj,
      tenant.nome_fantasia,
      tenant.email_admin,
      tenant.telefone,
      tenant.endereco,
      tenant.dominio,
      tenant.status,
      tenant.plano_id,
      tenant.limite_usuarios,
      tenant.data_expiracao
    ];
    const result = (await query(sql, params)) as any;
    return result.ID || result[0]?.ID;
  }
};

export const usuariosRepository = {
  async getByEmail(email: string, tenantId?: number): Promise<Usuario | undefined> {
    let rows;
    if (tenantId) {
      rows = (await query('SELECT * FROM USUARIOS WHERE EMAIL = ? AND TENANT_ID = ?', [email, tenantId])) as any[];
    } else {
      rows = (await query('SELECT * FROM USUARIOS WHERE EMAIL = ?', [email])) as any[];
    }

    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.ID,
      tenant_id: row.TENANT_ID,
      nome: row.NOME,
      email: row.EMAIL,
      senha: row.SENHA,
      role: row.ROLE,
      perfil: row.PERFIL || (row.ROLE === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO'),
      status: row.STATUS,
      fone: row.FONE,
      ultimo_acesso: row.ULTIMO_ACESSO,
      data_cadastro: row.DATA_CADASTRO,
      comissao_percentual: row.COMISSAO_PERCENTUAL ? Number(row.COMISSAO_PERCENTUAL) : null
    };
  },

  async getById(id: number): Promise<Usuario | undefined> {
    const rows = (await query('SELECT * FROM USUARIOS WHERE ID = ?', [id])) as any[];
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.ID,
      tenant_id: row.TENANT_ID,
      nome: row.NOME,
      email: row.EMAIL,
      senha: row.SENHA,
      role: row.ROLE,
      perfil: row.PERFIL || (row.ROLE === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO'),
      status: row.STATUS,
      fone: row.FONE,
      ultimo_acesso: row.ULTIMO_ACESSO,
      data_cadastro: row.DATA_CADASTRO,
      comissao_percentual: row.COMISSAO_PERCENTUAL ? Number(row.COMISSAO_PERCENTUAL) : null
    };
  },

  async getAll(tenantId?: number): Promise<Usuario[]> {
    let rows;
    if (tenantId) {
      rows = (await query('SELECT * FROM USUARIOS WHERE TENANT_ID = ?', [tenantId])) as any[];
    } else {
      rows = (await query('SELECT * FROM USUARIOS')) as any[];
    }
    return rows.map((row: any) => ({
      id: row.ID,
      tenant_id: row.TENANT_ID,
      nome: row.NOME,
      email: row.EMAIL,
      senha: row.SENHA,
      role: row.ROLE,
      perfil: row.PERFIL || (row.ROLE === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO'),
      status: row.STATUS,
      fone: row.FONE,
      ultimo_acesso: row.ULTIMO_ACESSO,
      data_cadastro: row.DATA_CADASTRO,
      comissao_percentual: row.COMISSAO_PERCENTUAL ? Number(row.COMISSAO_PERCENTUAL) : null
    }));
  },

  async updateUltimoAcesso(id: number): Promise<void> {
    await execute('UPDATE USUARIOS SET ULTIMO_ACESSO = CURRENT_TIMESTAMP WHERE ID = ?', [id]);
  },

  async create(usuario: { tenant_id: number; nome: string; email: string; senha: string; role: 'ADMIN' | 'USER'; perfil?: string; status: string; fone: string | null; comissao_percentual?: number | null }): Promise<number> {
    const perfil = usuario.perfil || (usuario.role === 'ADMIN' ? 'ADMIN' : 'FINANCEIRO');
    const comissao = usuario.comissao_percentual !== undefined ? usuario.comissao_percentual : null;
    const sql = `INSERT INTO USUARIOS (TENANT_ID, NOME, EMAIL, SENHA, ROLE, PERFIL, STATUS, FONE, COMISSAO_PERCENTUAL)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID`;
    const result = (await query(sql, [
      usuario.tenant_id, usuario.nome, usuario.email,
      usuario.senha, usuario.role, perfil, usuario.status, usuario.fone, comissao
    ])) as any;
    return result.ID || result[0]?.ID;
  },

  async update(id: number, data: { nome?: string; email?: string; senha?: string; role?: 'ADMIN' | 'USER'; perfil?: string; status?: string; fone?: string | null; comissao_percentual?: number | null }): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.nome !== undefined)   { fields.push('NOME = ?');   params.push(data.nome); }
    if (data.email !== undefined)  { fields.push('EMAIL = ?');  params.push(data.email); }
    if (data.senha !== undefined)  { fields.push('SENHA = ?');  params.push(data.senha); }
    if (data.role !== undefined)   { fields.push('ROLE = ?');   params.push(data.role); }
    if (data.perfil !== undefined) { fields.push('PERFIL = ?'); params.push(data.perfil); }
    if (data.status !== undefined) { fields.push('STATUS = ?'); params.push(data.status); }
    if (data.fone !== undefined)   { fields.push('FONE = ?');   params.push(data.fone); }
    if (data.comissao_percentual !== undefined) { fields.push('COMISSAO_PERCENTUAL = ?'); params.push(data.comissao_percentual); }

    if (fields.length === 0) return;
    params.push(id);
    await execute(`UPDATE USUARIOS SET ${fields.join(', ')} WHERE ID = ?`, params);
  },

  async delete(id: number): Promise<void> {
    await execute(`UPDATE USUARIOS SET STATUS = 'INATIVO' WHERE ID = ?`, [id]);
  }
};

function mapRowToConta(row: any): Conta {
  return {
    id: row.ID,
    tenant_id: row.TENANT_ID,
    usuario_id: row.USUARIO_ID,
    conta_bancaria_id: row.CONTA_BANCARIA_ID || null,
    descricao: row.DESCRICAO,
    valor: row.VALOR,
    data_vencimento: row.DATA_VENCIMENTO,
    data_pagamento: row.DATA_PAGAMENTO,
    categoria: row.CATEGORIA,
    status: row.STATUS,
    tipo: row.TIPO,
    observacoes: row.OBSERVACOES ? (row.OBSERVACOES.toString ? row.OBSERVACOES.toString() : String(row.OBSERVACOES)) : null,
    arquivo_boleto: row.ARQUIVO_BOLETO || null,
    arquivo_comprovante: row.ARQUIVO_COMPROVANTE || null,
    data_cadastro: row.DATA_CADASTRO
  };
}

export const contasBancariasRepository = {
  async getAll(tenantId: number): Promise<ContaBancaria[]> {
    const rows = (await query("SELECT * FROM CONTAS_BANCARIAS WHERE TENANT_ID = ? AND ATIVO = 'S' ORDER BY NOME ASC", [tenantId])) as any[];
    return rows.map((row) => ({
      id: row.ID,
      tenant_id: row.TENANT_ID,
      nome: row.NOME,
      tipo: row.TIPO,
      saldo_inicial: Number(row.SALDO_INICIAL || 0),
      saldo_atual: Number(row.SALDO_ATUAL || 0),
      ativo: row.ATIVO,
      data_cadastro: row.DATA_CADASTRO
    }));
  },

  async getById(id: number, tenantId: number): Promise<ContaBancaria | undefined> {
    const rows = (await query('SELECT * FROM CONTAS_BANCARIAS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId])) as any[];
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.ID,
      tenant_id: row.TENANT_ID,
      nome: row.NOME,
      tipo: row.TIPO,
      saldo_inicial: Number(row.SALDO_INICIAL || 0),
      saldo_atual: Number(row.SALDO_ATUAL || 0),
      ativo: row.ATIVO,
      data_cadastro: row.DATA_CADASTRO
    };
  },

  async create(conta: Omit<ContaBancaria, 'id' | 'data_cadastro'>): Promise<number> {
    const sql = `
      INSERT INTO CONTAS_BANCARIAS (TENANT_ID, NOME, TIPO, SALDO_INICIAL, SALDO_ATUAL, ATIVO)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    const params = [
      conta.tenant_id,
      conta.nome,
      conta.tipo,
      conta.saldo_inicial,
      conta.saldo_inicial, // O saldo atual inicializa igual ao saldo inicial antes das transações
      conta.ativo || 'S'
    ];
    const result = (await query(sql, params)) as any;
    const insertedId = result.ID || result[0]?.ID;
    
    // Forçar recálculo para caso já existam transações vinculadas
    await this.atualizarSaldoAtual(insertedId, conta.tenant_id);
    
    return insertedId;
  },

  async update(id: number, tenantId: number, data: Partial<ContaBancaria>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields: (keyof ContaBancaria)[] = ['nome', 'tipo', 'saldo_inicial', 'ativo'];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return;

    params.push(id, tenantId);
    const sql = `UPDATE CONTAS_BANCARIAS SET ${fields.join(', ')} WHERE ID = ? AND TENANT_ID = ?`;
    await execute(sql, params);

    // Se o saldo inicial mudou, atualiza o saldo atual
    if (data.saldo_inicial !== undefined) {
      await this.atualizarSaldoAtual(id, tenantId);
    }
  },

  async delete(id: number, tenantId: number): Promise<void> {
    // Soft delete para não quebrar o histórico de transações vinculadas
    await execute("UPDATE CONTAS_BANCARIAS SET ATIVO = 'N' WHERE ID = ? AND TENANT_ID = ?", [id, tenantId]);
  },

  async atualizarSaldoAtual(id: number, tenantId: number): Promise<void> {
    const resReceber = (await query(
      "SELECT SUM(VALOR) AS TOTAL FROM CONTAS WHERE CONTA_BANCARIA_ID = ? AND STATUS = 'RECEBIDO'",
      [id]
    )) as any[];
    const resPagar = (await query(
      "SELECT SUM(VALOR) AS TOTAL FROM CONTAS WHERE CONTA_BANCARIA_ID = ? AND STATUS = 'PAGO'",
      [id]
    )) as any[];
    
    const totalReceber = Number(resReceber[0]?.TOTAL || 0);
    const totalPagar = Number(resPagar[0]?.TOTAL || 0);
    
    await execute(
      "UPDATE CONTAS_BANCARIAS SET SALDO_ATUAL = SALDO_INICIAL + ? - ? WHERE ID = ? AND TENANT_ID = ?",
      [totalReceber, totalPagar, id, tenantId]
    );
  }
};

export const contasRepository = {
  async getAll(tenantId: number, startDate?: string, endDate?: string): Promise<Conta[]> {
    let sql = 'SELECT * FROM CONTAS WHERE TENANT_ID = ?';
    const params: any[] = [tenantId];
    if (startDate) {
      sql += ' AND DATA_VENCIMENTO >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATA_VENCIMENTO <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY DATA_CADASTRO DESC';
    const rows = (await query(sql, params)) as any[];
    return rows.map(mapRowToConta);
  },

  async getByTipo(tenantId: number, tipo: string, startDate?: string, endDate?: string): Promise<Conta[]> {
    let sql = 'SELECT * FROM CONTAS WHERE TENANT_ID = ? AND TIPO = ?';
    const params: any[] = [tenantId, tipo];
    if (startDate) {
      sql += ' AND DATA_VENCIMENTO >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATA_VENCIMENTO <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY DATA_CADASTRO DESC';
    const rows = (await query(sql, params)) as any[];
    return rows.map(mapRowToConta);
  },

  async getByStatus(tenantId: number, status: string): Promise<Conta[]> {
    const rows = (await query('SELECT * FROM CONTAS WHERE TENANT_ID = ? AND STATUS = ?', [tenantId, status])) as any[];
    return rows.map(mapRowToConta);
  },

  async getById(id: number, tenantId: number): Promise<Conta | undefined> {
    const rows = (await query('SELECT * FROM CONTAS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId])) as any[];
    if (rows.length === 0) return undefined;
    return mapRowToConta(rows[0]);
  },

  async create(conta: Omit<Conta, 'id' | 'data_cadastro'>): Promise<number> {
    const sql = `
      INSERT INTO CONTAS (TENANT_ID, USUARIO_ID, CONTA_BANCARIA_ID, DESCRICAO, VALOR, DATA_VENCIMENTO, DATA_PAGAMENTO, CATEGORIA, STATUS, TIPO, OBSERVACOES, ARQUIVO_BOLETO, ARQUIVO_COMPROVANTE)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    const params = [
      conta.tenant_id,
      conta.usuario_id,
      conta.conta_bancaria_id,
      conta.descricao,
      conta.valor,
      conta.data_vencimento,
      conta.data_pagamento,
      conta.categoria,
      conta.status,
      conta.tipo,
      conta.observacoes,
      conta.arquivo_boleto || null,
      conta.arquivo_comprovante || null
    ];
    const result = (await query(sql, params)) as any;
    const insertedId = result.ID || result[0]?.ID;
    
    // Recalcular saldo do banco associado
    if (conta.conta_bancaria_id) {
      await contasBancariasRepository.atualizarSaldoAtual(conta.conta_bancaria_id, conta.tenant_id);
    }
    
    return insertedId;
  },

  async update(id: number, tenantId: number, conta: Partial<Conta>): Promise<void> {
    const antiga = await this.getById(id, tenantId);
    
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields: (keyof Conta)[] = [
      'descricao', 'valor', 'data_vencimento', 'data_pagamento',
      'categoria', 'status', 'tipo', 'observacoes', 'conta_bancaria_id',
      'arquivo_boleto', 'arquivo_comprovante'
    ];

    for (const key of allowedFields) {
      if (conta[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(conta[key]);
      }
    }

    if (fields.length === 0) return;

    params.push(id, tenantId);
    const sql = `UPDATE CONTAS SET ${fields.join(', ')}, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = ? AND TENANT_ID = ?`;
    await execute(sql, params);

    // Recalcular saldos
    if (antiga) {
      if (antiga.conta_bancaria_id) {
        await contasBancariasRepository.atualizarSaldoAtual(antiga.conta_bancaria_id, tenantId);
      }
      const novaContaBancariaId = conta.conta_bancaria_id !== undefined ? conta.conta_bancaria_id : antiga.conta_bancaria_id;
      if (novaContaBancariaId && novaContaBancariaId !== antiga.conta_bancaria_id) {
        await contasBancariasRepository.atualizarSaldoAtual(novaContaBancariaId, tenantId);
      }
    }
  },

  async delete(id: number, tenantId: number): Promise<void> {
    const antiga = await this.getById(id, tenantId);
    await execute('DELETE FROM CONTAS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId]);
    
    if (antiga && antiga.conta_bancaria_id) {
      await contasBancariasRepository.atualizarSaldoAtual(antiga.conta_bancaria_id, tenantId);
    }
  },

  async getTotalPendente(tenantId: number, tipo: string, startDate?: string, endDate?: string): Promise<number> {
    let sql = 'SELECT SUM(VALOR) AS TOTAL FROM CONTAS WHERE TENANT_ID = ? AND TIPO = ? AND STATUS = ?';
    const params: any[] = [tenantId, tipo, 'PENDENTE'];
    if (startDate) {
      sql += ' AND DATA_VENCIMENTO >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATA_VENCIMENTO <= ?';
      params.push(endDate);
    }
    const rows = (await query(sql, params)) as any[];
    return Number(rows[0]?.TOTAL || 0);
  },

  async getPendentes(tenantId: number, startDate?: string, endDate?: string): Promise<Conta[]> {
    let sql = "SELECT * FROM CONTAS WHERE TENANT_ID = ? AND STATUS = 'PENDENTE'";
    const params: any[] = [tenantId];
    if (startDate) {
      sql += ' AND DATA_VENCIMENTO >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATA_VENCIMENTO <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY DATA_VENCIMENTO ASC';
    const rows = (await query(sql, params)) as any[];
    return rows.map(mapRowToConta);
  },

  async getAtrasadas(tenantId: number, startDate?: string, endDate?: string): Promise<Conta[]> {
    let sql = "SELECT * FROM CONTAS WHERE TENANT_ID = ? AND STATUS = 'PENDENTE' AND DATA_VENCIMENTO < CURRENT_DATE";
    const params: any[] = [tenantId];
    if (startDate) {
      sql += ' AND DATA_VENCIMENTO >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATA_VENCIMENTO <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY DATA_VENCIMENTO ASC';
    const rows = (await query(sql, params)) as any[];
    return rows.map(mapRowToConta);
  },

  async getPeriodo(tenantId: number, startDate?: string, endDate?: string): Promise<Conta[]> {
    let sql = 'SELECT * FROM CONTAS WHERE TENANT_ID = ?';
    const params: any[] = [tenantId];
    if (startDate) {
      sql += ' AND DATA_VENCIMENTO >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND DATA_VENCIMENTO <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY DATA_VENCIMENTO DESC, ID DESC';
    const rows = (await query(sql, params)) as any[];
    return rows.map(mapRowToConta);
  }
};

function mapRowToAgendamento(row: any): Agendamento {
  return {
    id: row.ID,
    tenant_id: row.TENANT_ID,
    usuario_id: row.USUARIO_ID,
    descricao: row.DESCRICAO,
    valor: row.VALOR,
    dia_fixo: row.DIA_FIXO,
    categoria: row.CATEGORIA,
    tipo: row.TIPO,
    recorrente: row.RECORRENTE,
    ativo: row.ATIVO,
    data_cadastro: row.DATA_CADASTRO,
    ultima_execucao: row.ULTIMA_EXECUCAO,
    proxima_execucao: row.PROXIMA_EXECUCAO
  };
}

export const agendamentosRepository = {
  async getAll(tenantId: number): Promise<Agendamento[]> {
    const rows = (await query('SELECT * FROM AGENDAMENTOS WHERE TENANT_ID = ? ORDER BY DATA_CADASTRO DESC', [tenantId])) as any[];
    return rows.map(mapRowToAgendamento);
  },

  async getAtivos(tenantId: number): Promise<Agendamento[]> {
    const rows = (await query("SELECT * FROM AGENDAMENTOS WHERE TENANT_ID = ? AND ATIVO = 'S' ORDER BY DIA_FIXO ASC", [tenantId])) as any[];
    return rows.map(mapRowToAgendamento);
  },

  async getById(id: number, tenantId: number): Promise<Agendamento | undefined> {
    const rows = (await query('SELECT * FROM AGENDAMENTOS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId])) as any[];
    if (rows.length === 0) return undefined;
    return mapRowToAgendamento(rows[0]);
  },

  async create(agendamento: Omit<Agendamento, 'id' | 'data_cadastro'>): Promise<number> {
    const sql = `
      INSERT INTO AGENDAMENTOS (TENANT_ID, USUARIO_ID, DESCRICAO, VALOR, DIA_FIXO, CATEGORIA, TIPO, RECORRENTE, ATIVO, ULTIMA_EXECUCAO, PROXIMA_EXECUCAO)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    const params = [
      agendamento.tenant_id,
      agendamento.usuario_id,
      agendamento.descricao,
      agendamento.valor,
      agendamento.dia_fixo,
      agendamento.categoria,
      agendamento.tipo,
      agendamento.recorrente,
      agendamento.ativo,
      agendamento.ultima_execucao,
      agendamento.proxima_execucao
    ];
    const result = (await query(sql, params)) as any;
    return result.ID || result[0]?.ID;
  },

  async update(id: number, tenantId: number, agendamento: Partial<Agendamento>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields: (keyof Agendamento)[] = [
      'descricao', 'valor', 'dia_fixo', 'categoria', 'tipo', 'recorrente', 'ativo', 'ultima_execucao', 'proxima_execucao'
    ];

    for (const key of allowedFields) {
      if (agendamento[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(agendamento[key]);
      }
    }

    if (fields.length === 0) return;

    params.push(id, tenantId);
    const sql = `UPDATE AGENDAMENTOS SET ${fields.join(', ')} WHERE ID = ? AND TENANT_ID = ?`;
    await execute(sql, params);
  },

  async delete(id: number, tenantId: number): Promise<void> {
    await execute('DELETE FROM AGENDAMENTOS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId]);
  },

  async updateUltimaExecucao(id: number, tenantId: number): Promise<void> {
    await execute(
      "UPDATE AGENDAMENTOS SET ULTIMA_EXECUCAO = CURRENT_DATE, PROXIMA_EXECUCAO = DATEADD(1 MONTH TO CURRENT_DATE) WHERE ID = ? AND TENANT_ID = ?",
      [id, tenantId]
    );
  }
};

// =========== CLIENTES ===========
export const clientesRepository = {
  async getAll(tenantId: number): Promise<Cliente[]> {
    const rows = (await query(
      "SELECT * FROM CLIENTES WHERE TENANT_ID = ? ORDER BY NOME ASC",
      [tenantId]
    )) as any[];
    return rows.map((row) => ({
      id: row.ID,
      tenant_id: row.TENANT_ID,
      tipo: row.TIPO?.trim() || 'PF',
      nome: row.NOME,
      nome_fantasia: row.NOME_FANTASIA || null,
      cpf_cnpj: row.CPF_CNPJ || null,
      email: row.EMAIL || null,
      telefone: row.TELEFONE || null,
      endereco: row.ENDERECO || null,
      observacoes: row.OBSERVACOES ? (row.OBSERVACOES.toString ? row.OBSERVACOES.toString() : String(row.OBSERVACOES)) : null,
      ativo: row.ATIVO?.trim() || 'S',
      data_cadastro: row.DATA_CADASTRO,
    }));
  },

  async getById(id: number, tenantId: number): Promise<Cliente | null> {
    const rows = (await query(
      "SELECT * FROM CLIENTES WHERE ID = ? AND TENANT_ID = ?",
      [id, tenantId]
    )) as any[];
    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.ID,
      tenant_id: row.TENANT_ID,
      tipo: row.TIPO?.trim() || 'PF',
      nome: row.NOME,
      nome_fantasia: row.NOME_FANTASIA || null,
      cpf_cnpj: row.CPF_CNPJ || null,
      email: row.EMAIL || null,
      telefone: row.TELEFONE || null,
      endereco: row.ENDERECO || null,
      observacoes: row.OBSERVACOES ? (row.OBSERVACOES.toString ? row.OBSERVACOES.toString() : String(row.OBSERVACOES)) : null,
      ativo: row.ATIVO?.trim() || 'S',
      data_cadastro: row.DATA_CADASTRO,
    };
  },

  async create(cliente: Omit<Cliente, 'id' | 'data_cadastro'>): Promise<number> {
    const sql = `INSERT INTO CLIENTES (TENANT_ID, TIPO, NOME, NOME_FANTASIA, CPF_CNPJ, EMAIL, TELEFONE, ENDERECO, OBSERVACOES, ATIVO)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID`;
    const result = (await query(sql, [
      cliente.tenant_id, cliente.tipo, cliente.nome,
      cliente.nome_fantasia, cliente.cpf_cnpj, cliente.email,
      cliente.telefone, cliente.endereco, cliente.observacoes, cliente.ativo || 'S'
    ])) as any;
    return result.ID || result[0]?.ID;
  },

  async update(id: number, tenantId: number, data: Partial<Cliente>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];
    const allowed: (keyof Cliente)[] = ['tipo','nome','nome_fantasia','cpf_cnpj','email','telefone','endereco','observacoes','ativo'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return;
    params.push(id, tenantId);
    await execute(`UPDATE CLIENTES SET ${fields.join(', ')} WHERE ID = ? AND TENANT_ID = ?`, params);
  },

  async delete(id: number, tenantId: number): Promise<void> {
    await execute("UPDATE CLIENTES SET ATIVO = 'N' WHERE ID = ? AND TENANT_ID = ?", [id, tenantId]);
  },
};

// =========== SOFTWARES ===========
export const softwaresRepository = {
  async getAll(tenantId: number): Promise<Software[]> {
    const rows = (await query(
      "SELECT * FROM SOFTWARES WHERE TENANT_ID = ? ORDER BY NOME ASC",
      [tenantId]
    )) as any[];
    return rows.map((row) => ({
      id: row.ID,
      tenant_id: row.TENANT_ID,
      nome: row.NOME,
      descricao: row.DESCRICAO || null,
      categoria: row.CATEGORIA || null,
      ativo: row.ATIVO?.trim() || 'S',
      data_cadastro: row.DATA_CADASTRO,
    }));
  },

  async create(sw: Omit<Software, 'id' | 'data_cadastro'>): Promise<number> {
    const sql = `INSERT INTO SOFTWARES (TENANT_ID, NOME, DESCRICAO, CATEGORIA, ATIVO)
      VALUES (?, ?, ?, ?, ?) RETURNING ID`;
    const result = (await query(sql, [
      sw.tenant_id, sw.nome, sw.descricao, sw.categoria, sw.ativo || 'S'
    ])) as any;
    return result.ID || result[0]?.ID;
  },

  async update(id: number, tenantId: number, data: Partial<Software>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];
    const allowed: (keyof Software)[] = ['nome','descricao','categoria','ativo'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return;
    params.push(id, tenantId);
    await execute(`UPDATE SOFTWARES SET ${fields.join(', ')} WHERE ID = ? AND TENANT_ID = ?`, params);
  },

  async delete(id: number, tenantId: number): Promise<void> {
    await execute("UPDATE SOFTWARES SET ATIVO = 'N' WHERE ID = ? AND TENANT_ID = ?", [id, tenantId]);
  },
};

// =========== LICENCAS ===========
export const licencasRepository = {
  async getAll(tenantId: number): Promise<Licenca[]> {
    const sql = `
      SELECT L.*, C.NOME AS CLIENTE_NOME, S.NOME AS SOFTWARE_NOME
      FROM LICENCAS L
      JOIN CLIENTES C ON C.ID = L.CLIENTE_ID
      JOIN SOFTWARES S ON S.ID = L.SOFTWARE_ID
      WHERE L.TENANT_ID = ?
      ORDER BY L.STATUS ASC, L.DATA_INICIO DESC
    `;
    const rows = (await query(sql, [tenantId])) as any[];
    return rows.map((row) => ({
      id: row.ID,
      tenant_id: row.TENANT_ID,
      cliente_id: row.CLIENTE_ID,
      software_id: row.SOFTWARE_ID,
      conta_bancaria_id: row.CONTA_BANCARIA_ID || null,
      descricao: row.DESCRICAO,
      valor: Number(row.VALOR),
      periodicidade: row.PERIODICIDADE,
      dia_vencimento: row.DIA_VENCIMENTO,
      data_inicio: row.DATA_INICIO,
      data_fim: row.DATA_FIM || null,
      status: row.STATUS,
      gerar_conta_auto: row.GERAR_CONTA_AUTO?.trim() || 'N',
      ultima_geracao: row.ULTIMA_GERACAO || null,
      observacoes: row.OBSERVACOES ? (row.OBSERVACOES.toString ? row.OBSERVACOES.toString() : String(row.OBSERVACOES)) : null,
      data_cadastro: row.DATA_CADASTRO,
      cliente_nome: row.CLIENTE_NOME,
      software_nome: row.SOFTWARE_NOME,
    }));
  },

  async getById(id: number, tenantId: number): Promise<Licenca | null> {
    const sql = `
      SELECT L.*, C.NOME AS CLIENTE_NOME, S.NOME AS SOFTWARE_NOME
      FROM LICENCAS L
      JOIN CLIENTES C ON C.ID = L.CLIENTE_ID
      JOIN SOFTWARES S ON S.ID = L.SOFTWARE_ID
      WHERE L.ID = ? AND L.TENANT_ID = ?
    `;
    const rows = (await query(sql, [id, tenantId])) as any[];
    if (!rows.length) return null;
    const row = rows[0];
    return {
      id: row.ID,
      tenant_id: row.TENANT_ID,
      cliente_id: row.CLIENTE_ID,
      software_id: row.SOFTWARE_ID,
      conta_bancaria_id: row.CONTA_BANCARIA_ID || null,
      descricao: row.DESCRICAO,
      valor: Number(row.VALOR),
      periodicidade: row.PERIODICIDADE,
      dia_vencimento: row.DIA_VENCIMENTO,
      data_inicio: row.DATA_INICIO,
      data_fim: row.DATA_FIM || null,
      status: row.STATUS,
      gerar_conta_auto: row.GERAR_CONTA_AUTO?.trim() || 'N',
      ultima_geracao: row.ULTIMA_GERACAO || null,
      observacoes: row.OBSERVACOES ? (row.OBSERVACOES.toString ? row.OBSERVACOES.toString() : String(row.OBSERVACOES)) : null,
      data_cadastro: row.DATA_CADASTRO,
      cliente_nome: row.CLIENTE_NOME,
      software_nome: row.SOFTWARE_NOME,
    };
  },

  async create(licenca: Omit<Licenca, 'id' | 'data_cadastro' | 'cliente_nome' | 'software_nome'>): Promise<number> {
    const sql = `INSERT INTO LICENCAS
      (TENANT_ID, CLIENTE_ID, SOFTWARE_ID, CONTA_BANCARIA_ID, DESCRICAO, VALOR, PERIODICIDADE, DIA_VENCIMENTO, DATA_INICIO, DATA_FIM, STATUS, GERAR_CONTA_AUTO, OBSERVACOES)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING ID`;
    const result = (await query(sql, [
      licenca.tenant_id, licenca.cliente_id, licenca.software_id,
      licenca.conta_bancaria_id || null, licenca.descricao, licenca.valor,
      licenca.periodicidade, licenca.dia_vencimento, licenca.data_inicio,
      licenca.data_fim || null, licenca.status || 'ATIVA',
      licenca.gerar_conta_auto || 'N', licenca.observacoes || null
    ])) as any;
    return result.ID || result[0]?.ID;
  },

  async update(id: number, tenantId: number, data: Partial<Licenca>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];
    const allowed: (keyof Licenca)[] = [
      'cliente_id','software_id','conta_bancaria_id','descricao','valor',
      'periodicidade','dia_vencimento','data_inicio','data_fim','status',
      'gerar_conta_auto','ultima_geracao','observacoes'
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return;
    params.push(id, tenantId);
    await execute(`UPDATE LICENCAS SET ${fields.join(', ')} WHERE ID = ? AND TENANT_ID = ?`, params);
  },

  async gerarProximoVencimento(licenca: Licenca): Promise<string> {
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const mesesMap: Record<string, number> = {
      MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12
    };
    const mesesAdd = mesesMap[licenca.periodicidade] || 1;
    let proxMes = mes + mesesAdd;
    let proxAno = ano;
    if (proxMes > 11) { proxAno += Math.floor(proxMes / 12); proxMes = proxMes % 12; }
    const dia = Math.min(licenca.dia_vencimento, new Date(proxAno, proxMes + 1, 0).getDate());
    return `${proxAno}-${String(proxMes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  },

  async processarAutomacoes(tenantId: number, userId: number): Promise<void> {
    try {
      const licencas = await this.getAll(tenantId);
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split('T')[0];

      for (const lic of licencas) {
        if (lic.status !== 'ATIVA') continue;

        // --- 1. RENOVAÇÃO AUTOMÁTICA DE LICENÇAS EXPIRADAS ---
        if (lic.data_fim) {
          const dataFim = new Date(lic.data_fim);
          if (hoje > dataFim) {
            // Licença expirou. Renovar automaticamente estendendo as datas pelo período correspondente
            const mesesMap: Record<string, number> = {
              MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12
            };
            const mesesAdd = mesesMap[lic.periodicidade] || 1;
            
            const novaDataInicio = new Date(dataFim.getTime() + 24 * 60 * 60 * 1000); // Dia seguinte ao fim anterior
            const novaDataFim = new Date(novaDataInicio.getFullYear(), novaDataInicio.getMonth() + mesesAdd, novaDataInicio.getDate() - 1);
            
            const inicioStr = novaDataInicio.toISOString().split('T')[0];
            const fimStr = novaDataFim.toISOString().split('T')[0];

            await this.update(lic.id, tenantId, {
              data_inicio: inicioStr,
              data_fim: fimStr
            });
            lic.data_inicio = inicioStr;
            lic.data_fim = fimStr;
          }
        }

        // --- 2. GERAÇÃO AUTOMÁTICA DE COBRANÇAS ---
        // Calcular quando deve ser gerada a próxima cobrança
        let dataProximaGeracao: Date;
        const mesesMap: Record<string, number> = {
          MENSAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12
        };
        const mesesAdd = mesesMap[lic.periodicidade] || 1;

        if (lic.ultima_geracao) {
          const ult = new Date(lic.ultima_geracao);
          dataProximaGeracao = new Date(ult.getFullYear(), ult.getMonth() + mesesAdd, lic.dia_vencimento);
        } else {
          // Se nunca gerou, o primeiro vencimento deve ser o primeiro devido após a data de início
          const ini = new Date(lic.data_inicio);
          dataProximaGeracao = new Date(ini.getFullYear(), ini.getMonth(), lic.dia_vencimento);
          if (dataProximaGeracao < ini) {
            dataProximaGeracao.setMonth(dataProximaGeracao.getMonth() + 1);
          }
        }

        // Garantir que a data não estoure o final do mês
        const ultimoDia = new Date(dataProximaGeracao.getFullYear(), dataProximaGeracao.getMonth() + 1, 0).getDate();
        dataProximaGeracao.setDate(Math.min(lic.dia_vencimento, ultimoDia));

        // Se a data de vencimento pretendida já chegou ou passou
        if (hoje >= dataProximaGeracao) {
          const vencimentoStr = dataProximaGeracao.toISOString().split('T')[0];
          const descMap: Record<string, string> = {
            MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual'
          };

          // Criar conta a receber
          await contasRepository.create({
            tenant_id: tenantId,
            usuario_id: userId,
            conta_bancaria_id: lic.conta_bancaria_id,
            descricao: `${lic.software_nome} – ${lic.cliente_nome} (${descMap[lic.periodicidade] || lic.periodicidade})`,
            valor: lic.valor,
            data_vencimento: vencimentoStr,
            data_pagamento: null,
            categoria: 'Licença de Software',
            status: 'PENDENTE',
            tipo: 'RECEBER',
            observacoes: `Gerado automaticamente pelo sistema de licenças.`,
            arquivo_boleto: null,
            arquivo_comprovante: null
          });

          // Atualizar ultima_geracao
          await this.update(lic.id, tenantId, {
            ultima_geracao: vencimentoStr
          });
        }
      }
    } catch (err) {
      console.error('Erro ao processar automações de licenças:', err);
    }
  }
};

function mapRowToProposta(row: any): Proposta {
  return {
    id: row.ID,
    tenant_id: row.TENANT_ID,
    cliente_id: row.CLIENTE_ID,
    usuario_id: row.USUARIO_ID,
    titulo: row.TITULO,
    valor: Number(row.VALOR || 0),
    estagio: row.ESTAGIO,
    descricao: row.DESCRICAO ? (row.DESCRICAO.toString ? row.DESCRICAO.toString() : String(row.DESCRICAO)) : null,
    data_validade: row.DATA_VALIDADE || null,
    data_fechamento: row.DATA_FECHAMENTO || null,
    data_cadastro: row.DATA_CADASTRO,
    cliente_nome: row.CLIENTE_NOME || undefined,
    usuario_nome: row.USUARIO_NOME || undefined,
  };
}

export const propostasRepository = {
  async getAll(tenantId: number, filters?: { startDate?: string; endDate?: string; estagio?: string; usuarioId?: number }): Promise<Proposta[]> {
    let sql = `
      SELECT p.*, c.nome AS CLIENTE_NOME, u.nome AS USUARIO_NOME 
      FROM PROPOSTAS p
      JOIN CLIENTES c ON p.cliente_id = c.id
      JOIN USUARIOS u ON p.usuario_id = u.id
      WHERE p.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (filters?.startDate) {
      sql += ' AND p.data_cadastro >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ' AND p.data_cadastro <= ?';
      params.push(filters.endDate);
    }
    if (filters?.estagio) {
      sql += ' AND p.estagio = ?';
      params.push(filters.estagio);
    }
    if (filters?.usuarioId) {
      sql += ' AND p.usuario_id = ?';
      params.push(filters.usuarioId);
    }

    sql += ' ORDER BY p.data_cadastro DESC';
    const rows = (await query(sql, params)) as any[];
    return rows.map(mapRowToProposta);
  },

  async getById(id: number, tenantId: number): Promise<Proposta | undefined> {
    const sql = `
      SELECT p.*, c.nome AS CLIENTE_NOME, u.nome AS USUARIO_NOME 
      FROM PROPOSTAS p
      JOIN CLIENTES c ON p.cliente_id = c.id
      JOIN USUARIOS u ON p.usuario_id = u.id
      WHERE p.id = ? AND p.tenant_id = ?
    `;
    const rows = (await query(sql, [id, tenantId])) as any[];
    if (rows.length === 0) return undefined;
    return mapRowToProposta(rows[0]);
  },

  async create(proposta: Omit<Proposta, 'id' | 'data_cadastro'>): Promise<number> {
    const sql = `
      INSERT INTO PROPOSTAS (TENANT_ID, CLIENTE_ID, USUARIO_ID, TITULO, VALOR, ESTAGIO, DESCRICAO, DATA_VALIDADE, DATA_FECHAMENTO)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    const params = [
      proposta.tenant_id,
      proposta.cliente_id,
      proposta.usuario_id,
      proposta.titulo,
      proposta.valor,
      proposta.estagio,
      proposta.descricao || null,
      proposta.data_validade || null,
      proposta.data_fechamento || null,
    ];
    const result = (await query(sql, params)) as any;
    return result.ID || result[0]?.ID;
  },

  async update(id: number, tenantId: number, proposta: Partial<Proposta>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields: (keyof Proposta)[] = [
      'cliente_id', 'usuario_id', 'titulo', 'valor', 'estagio', 'descricao', 'data_validade', 'data_fechamento'
    ];

    for (const key of allowedFields) {
      if (proposta[key] !== undefined) {
        fields.push(`${key.toUpperCase()} = ?`);
        params.push(proposta[key]);
      }
    }

    if (fields.length === 0) return;

    params.push(id, tenantId);
    const sql = `UPDATE PROPOSTAS SET ${fields.join(', ')} WHERE ID = ? AND TENANT_ID = ?`;
    await execute(sql, params);
  },

  async delete(id: number, tenantId: number): Promise<void> {
    await execute('DELETE FROM PROPOSTAS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId]);
  },

  async getStats(tenantId: number, filters?: { startDate?: string; endDate?: string; usuarioId?: number }) {
    let sqlBase = 'FROM PROPOSTAS WHERE tenant_id = ?';
    const params: any[] = [tenantId];

    if (filters?.startDate) {
      sqlBase += ' AND data_cadastro >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sqlBase += ' AND data_cadastro <= ?';
      params.push(filters.endDate);
    }
    if (filters?.usuarioId) {
      sqlBase += ' AND usuario_id = ?';
      params.push(filters.usuarioId);
    }

    // 0. Buscar comissão padrão do tenant
    let comissaoPadrao = 5.0;
    try {
      const configRows = await query("SELECT VALOR FROM CONFIGURACOES WHERE TENANT_ID = ? AND CHAVE = 'COMISSAO_PADRAO'", [tenantId]) as any[];
      if (configRows.length > 0 && configRows[0].VALOR) {
        comissaoPadrao = Number(configRows[0].VALOR);
      }
    } catch (e) {
      // usa padrão 5%
    }

    // 1. Totais por estágio
    const stagesSql = `SELECT ESTAGIO, SUM(VALOR) AS TOTAL_VALOR, COUNT(ID) AS TOTAL_COUNT ${sqlBase} GROUP BY ESTAGIO`;
    const stagesRows = (await query(stagesSql, params)) as any[];
    
    // 2. Total geral de vendas ganhas
    const wonSql = `SELECT SUM(VALOR) AS TOTAL_GANHO, COUNT(ID) AS COUNT_GANHO ${sqlBase} AND ESTAGIO = 'GANHA'`;
    const wonRows = (await query(wonSql, params)) as any[];

    // 3. Taxa de conversão
    const totalFinishedSql = `SELECT COUNT(ID) AS TOTAL_FIN ${sqlBase} AND ESTAGIO IN ('GANHA', 'PERDIDA')`;
    const totalFinishedRows = (await query(totalFinishedSql, params)) as any[];

    // 4. Propostas ganhas com comissão individual do vendedor — simples sem COALESCE parametrizado
    let propsSql = `
      SELECT p.valor, u.comissao_percentual 
      FROM PROPOSTAS p
      JOIN USUARIOS u ON p.usuario_id = u.id
      WHERE p.tenant_id = ? AND p.estagio = 'GANHA'
    `;
    const propsParams: any[] = [tenantId];
    if (filters?.startDate) {
      propsSql += ' AND p.data_cadastro >= ?';
      propsParams.push(filters.startDate);
    }
    if (filters?.endDate) {
      propsSql += ' AND p.data_cadastro <= ?';
      propsParams.push(filters.endDate);
    }
    if (filters?.usuarioId) {
      propsSql += ' AND p.usuario_id = ?';
      propsParams.push(filters.usuarioId);
    }
    const propsRows = await query(propsSql, propsParams) as any[];
    
    // Calcular comissão total em JS (seguro — sem query complexa no Firebird)
    let comissaoTotal = 0;
    for (const pRow of propsRows) {
      const rate = (pRow.COMISSAO_PERCENTUAL !== null && pRow.COMISSAO_PERCENTUAL !== undefined)
        ? Number(pRow.COMISSAO_PERCENTUAL) 
        : comissaoPadrao;
      comissaoTotal += Number(pRow.VALOR || 0) * (rate / 100);
    }
    
    // 5. Ranking de vendedores — query simples sem COALESCE parametrizado
    let sellerSql = `
      SELECT u.nome AS VENDEDOR_NOME, u.comissao_percentual AS COMISSAO_IND,
             p.usuario_id AS VENDEDOR_ID,
             SUM(CASE WHEN p.estagio = 'GANHA' THEN p.valor ELSE 0 END) AS TOTAL_VALOR, 
             SUM(CASE WHEN p.estagio = 'GANHA' THEN 1 ELSE 0 END) AS TOTAL_COUNT
      FROM PROPOSTAS p
      JOIN USUARIOS u ON p.usuario_id = u.id
      WHERE p.tenant_id = ?
    `;
    const sellerParams: any[] = [tenantId];
    if (filters?.startDate) {
      sellerSql += ' AND p.data_cadastro >= ?';
      sellerParams.push(filters.startDate);
    }
    if (filters?.endDate) {
      sellerSql += ' AND p.data_cadastro <= ?';
      sellerParams.push(filters.endDate);
    }
    if (filters?.usuarioId) {
      sellerSql += ' AND p.usuario_id = ?';
      sellerParams.push(filters.usuarioId);
    }
    sellerSql += ' GROUP BY u.nome, u.comissao_percentual, p.usuario_id ORDER BY TOTAL_VALOR DESC';
    const sellerRows = (await query(sellerSql, sellerParams)) as any[];

    return {
      stages: stagesRows.map(r => ({
        estagio: r.ESTAGIO,
        valor: Number(r.TOTAL_VALOR || 0),
        quantidade: Number(r.TOTAL_COUNT || 0)
      })),
      wonTotal: Number(wonRows[0]?.TOTAL_GANHO || 0),
      wonCount: Number(wonRows[0]?.COUNT_GANHO || 0),
      totalFinished: Number(totalFinishedRows[0]?.TOTAL_FIN || 0),
      comissaoTotal: Math.round(comissaoTotal * 100) / 100,
      comissaoPadrao,
      sellers: sellerRows.map(r => {
        const rate = (r.COMISSAO_IND !== null && r.COMISSAO_IND !== undefined) 
          ? Number(r.COMISSAO_IND) 
          : comissaoPadrao;
        const totalValor = Number(r.TOTAL_VALOR || 0);
        return {
          vendedorNome: r.VENDEDOR_NOME,
          vendedorId: r.VENDEDOR_ID,
          valor: totalValor,
          quantidade: Number(r.TOTAL_COUNT || 0),
          comissao: Math.round(totalValor * (rate / 100) * 100) / 100
        };
      })
    };
  }
};

export const chatRepository = {
  // ── GRUPOS ───────────────────────────────────────────────────────
  async getGrupos(tenantId: number, usuarioId: number): Promise<GrupoChat[]> {
    // Retorna grupos que o usuário é membro OU grupos globais (GERAL/DEPARTAMENTO)
    const rows = await query(`
      SELECT DISTINCT g.ID, g.NOME, g.TIPO, g.CRIADO_POR, g.DATA_CRIACAO,
        (SELECT FIRST 1 m.CONTEUDO FROM MENSAGENS_CHAT m WHERE m.GRUPO_ID = g.ID AND m.DELETADO = 'N' ORDER BY m.DATA_ENVIO DESC) AS ULTIMA_MSG,
        (SELECT FIRST 1 m.DATA_ENVIO FROM MENSAGENS_CHAT m WHERE m.GRUPO_ID = g.ID AND m.DELETADO = 'N' ORDER BY m.DATA_ENVIO DESC) AS ULTIMA_HORA
      FROM GRUPOS_CHAT g
      LEFT JOIN MEMBROS_GRUPO mg ON mg.GRUPO_ID = g.ID AND mg.USUARIO_ID = ?
      WHERE g.TENANT_ID = ? AND (g.TIPO IN ('GERAL', 'DEPARTAMENTO') OR mg.USUARIO_ID IS NOT NULL)
      ORDER BY ULTIMA_HORA DESC NULLS LAST, g.NOME
    `, [usuarioId, tenantId]) as any[];

    // Para cada grupo, contar mensagens não lidas
    const result: GrupoChat[] = [];
    for (const r of rows) {
      const leituraRows = await query(
        `SELECT ULTIMA_LEITURA FROM LEITURAS_CHAT WHERE USUARIO_ID = ? AND GRUPO_ID = ?`,
        [usuarioId, r.ID]
      ) as any[];
      const ultimaLeitura = leituraRows.length > 0 ? leituraRows[0].ULTIMA_LEITURA : null;

      let naoLidas = 0;
      if (ultimaLeitura) {
        const nlRows = await query(
          `SELECT COUNT(ID) AS CNT FROM MENSAGENS_CHAT WHERE GRUPO_ID = ? AND DELETADO = 'N' AND USUARIO_ID <> ? AND DATA_ENVIO > ?`,
          [r.ID, usuarioId, ultimaLeitura]
        ) as any[];
        naoLidas = Number(nlRows[0]?.CNT || 0);
      } else {
        const nlRows = await query(
          `SELECT COUNT(ID) AS CNT FROM MENSAGENS_CHAT WHERE GRUPO_ID = ? AND DELETADO = 'N' AND USUARIO_ID <> ?`,
          [r.ID, usuarioId]
        ) as any[];
        naoLidas = Number(nlRows[0]?.CNT || 0);
      }

      result.push({
        id: r.ID,
        tenant_id: tenantId,
        nome: r.NOME,
        tipo: r.TIPO,
        criado_por: r.CRIADO_POR,
        data_criacao: r.DATA_CRIACAO,
        nao_lidas: naoLidas,
        ultima_mensagem: r.ULTIMA_MSG || null,
        ultima_mensagem_hora: r.ULTIMA_HORA || null,
      });
    }
    return result;
  },

  async criarGrupo(tenantId: number, usuarioId: number, nome: string, tipo: string, membroIds: number[]): Promise<GrupoChat> {
    await execute(
      `INSERT INTO GRUPOS_CHAT (TENANT_ID, NOME, TIPO, CRIADO_POR) VALUES (?, ?, ?, ?)`,
      [tenantId, nome, tipo, usuarioId]
    );
    const rows = await query(
      `SELECT FIRST 1 ID FROM GRUPOS_CHAT WHERE TENANT_ID = ? ORDER BY ID DESC`,
      [tenantId]
    ) as any[];
    const grupoId = rows[0].ID;

    // Adicionar membros (sempre incluir criador)
    const todos = Array.from(new Set([usuarioId, ...membroIds]));
    for (const mid of todos) {
      await execute(`INSERT INTO MEMBROS_GRUPO (GRUPO_ID, USUARIO_ID) VALUES (?, ?)`, [grupoId, mid]);
    }
    return { id: grupoId, tenant_id: tenantId, nome, tipo: tipo as any, criado_por: usuarioId, data_criacao: new Date().toISOString() };
  },

  // ── MENSAGENS ─────────────────────────────────────────────────────
  async getMensagens(grupoId: number, tenantId: number, limit = 50): Promise<MensagemChat[]> {
    const rows = await query(`
      SELECT FIRST ${limit} m.ID, m.TENANT_ID, m.GRUPO_ID, m.USUARIO_ID,
        u.NOME AS USUARIO_NOME, m.CONTEUDO, m.MENCOES, m.DELETADO, m.DATA_ENVIO
      FROM MENSAGENS_CHAT m
      JOIN USUARIOS u ON u.ID = m.USUARIO_ID
      WHERE m.GRUPO_ID = ? AND m.TENANT_ID = ? AND m.DELETADO = 'N'
      ORDER BY m.DATA_ENVIO DESC
    `, [grupoId, tenantId]) as any[];

    return rows.reverse().map((r: any) => ({
      id: r.ID,
      tenant_id: r.TENANT_ID,
      grupo_id: r.GRUPO_ID,
      usuario_id: r.USUARIO_ID,
      usuario_nome: r.USUARIO_NOME,
      conteudo: r.CONTEUDO,
      mencoes: r.MENCOES,
      deletado: r.DELETADO,
      data_envio: r.DATA_ENVIO,
    }));
  },

  async enviarMensagem(tenantId: number, grupoId: number, usuarioId: number, conteudo: string, mencoes: string): Promise<MensagemChat> {
    await execute(
      `INSERT INTO MENSAGENS_CHAT (TENANT_ID, GRUPO_ID, USUARIO_ID, CONTEUDO, MENCOES) VALUES (?, ?, ?, ?, ?)`,
      [tenantId, grupoId, usuarioId, conteudo, mencoes || null]
    );
    const rows = await query(
      `SELECT FIRST 1 m.ID, m.DATA_ENVIO, u.NOME AS USUARIO_NOME FROM MENSAGENS_CHAT m JOIN USUARIOS u ON u.ID = m.USUARIO_ID WHERE m.GRUPO_ID = ? AND m.USUARIO_ID = ? ORDER BY m.ID DESC`,
      [grupoId, usuarioId]
    ) as any[];
    return {
      id: rows[0].ID,
      tenant_id: tenantId,
      grupo_id: grupoId,
      usuario_id: usuarioId,
      usuario_nome: rows[0].USUARIO_NOME,
      conteudo,
      mencoes: mencoes || null,
      deletado: 'N',
      data_envio: rows[0].DATA_ENVIO,
    };
  },

  async deletarMensagem(msgId: number, usuarioId: number): Promise<void> {
    await execute(`UPDATE MENSAGENS_CHAT SET DELETADO = 'S' WHERE ID = ? AND USUARIO_ID = ?`, [msgId, usuarioId]);
  },

  // ── LEITURAS / NÃO LIDAS ─────────────────────────────────────────
  async marcarComoLido(usuarioId: number, grupoId: number): Promise<void> {
    const existing = await query(`SELECT ID FROM LEITURAS_CHAT WHERE USUARIO_ID = ? AND GRUPO_ID = ?`, [usuarioId, grupoId]) as any[];
    if (existing.length > 0) {
      await execute(`UPDATE LEITURAS_CHAT SET ULTIMA_LEITURA = CURRENT_TIMESTAMP WHERE USUARIO_ID = ? AND GRUPO_ID = ?`, [usuarioId, grupoId]);
    } else {
      await execute(`INSERT INTO LEITURAS_CHAT (USUARIO_ID, GRUPO_ID) VALUES (?, ?)`, [usuarioId, grupoId]);
    }
  },

  async totalNaoLidas(tenantId: number, usuarioId: number): Promise<number> {
    // Pega IDs de todos os grupos visíveis pelo usuário
    const grupos = await query(`
      SELECT DISTINCT g.ID FROM GRUPOS_CHAT g
      LEFT JOIN MEMBROS_GRUPO mg ON mg.GRUPO_ID = g.ID AND mg.USUARIO_ID = ?
      WHERE g.TENANT_ID = ? AND (g.TIPO IN ('GERAL', 'DEPARTAMENTO') OR mg.USUARIO_ID IS NOT NULL)
    `, [usuarioId, tenantId]) as any[];

    let total = 0;
    for (const g of grupos) {
      const leituraRows = await query(`SELECT ULTIMA_LEITURA FROM LEITURAS_CHAT WHERE USUARIO_ID = ? AND GRUPO_ID = ?`, [usuarioId, g.ID]) as any[];
      const ultimaLeitura = leituraRows.length > 0 ? leituraRows[0].ULTIMA_LEITURA : null;
      if (ultimaLeitura) {
        const rows = await query(`SELECT COUNT(ID) AS CNT FROM MENSAGENS_CHAT WHERE GRUPO_ID = ? AND DELETADO = 'N' AND USUARIO_ID <> ? AND DATA_ENVIO > ?`, [g.ID, usuarioId, ultimaLeitura]) as any[];
        total += Number(rows[0]?.CNT || 0);
      } else {
        const rows = await query(`SELECT COUNT(ID) AS CNT FROM MENSAGENS_CHAT WHERE GRUPO_ID = ? AND DELETADO = 'N' AND USUARIO_ID <> ?`, [g.ID, usuarioId]) as any[];
        total += Number(rows[0]?.CNT || 0);
      }
    }
    return total;
  },
};
