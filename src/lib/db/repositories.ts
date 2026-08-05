import { query, execute, Plano, Tenant, Usuario, Conta, Agendamento } from './connection';

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
    const result = (await query(sql, params)) as any[];
    return result[0].ID;
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
      status: row.STATUS,
      fone: row.FONE,
      ultimo_acesso: row.ULTIMO_ACESSO,
      data_cadastro: row.DATA_CADASTRO
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
      status: row.STATUS,
      fone: row.FONE,
      ultimo_acesso: row.ULTIMO_ACESSO,
      data_cadastro: row.DATA_CADASTRO
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
      status: row.STATUS,
      fone: row.FONE,
      ultimo_acesso: row.ULTIMO_ACESSO,
      data_cadastro: row.DATA_CADASTRO
    }));
  },

  async updateUltimoAcesso(id: number): Promise<void> {
    await execute('UPDATE USUARIOS SET ULTIMO_ACESSO = CURRENT_TIMESTAMP WHERE ID = ?', [id]);
  }
};

function mapRowToConta(row: any): Conta {
  return {
    id: row.ID,
    tenant_id: row.TENANT_ID,
    usuario_id: row.USUARIO_ID,
    descricao: row.DESCRICAO,
    valor: row.VALOR,
    data_vencimento: row.DATA_VENCIMENTO,
    data_pagamento: row.DATA_PAGAMENTO,
    categoria: row.CATEGORIA,
    status: row.STATUS,
    tipo: row.TIPO,
    observacoes: row.OBSERVACOES ? (row.OBSERVACOES.toString ? row.OBSERVACOES.toString() : String(row.OBSERVACOES)) : null,
    data_cadastro: row.DATA_CADASTRO
  };
}

export const contasRepository = {
  async getAll(tenantId: number): Promise<Conta[]> {
    const rows = (await query('SELECT * FROM CONTAS WHERE TENANT_ID = ? ORDER BY DATA_CADASTRO DESC', [tenantId])) as any[];
    return rows.map(mapRowToConta);
  },

  async getByTipo(tenantId: number, tipo: string): Promise<Conta[]> {
    const rows = (await query('SELECT * FROM CONTAS WHERE TENANT_ID = ? AND TIPO = ? ORDER BY DATA_CADASTRO DESC', [tenantId, tipo])) as any[];
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
      INSERT INTO CONTAS (TENANT_ID, USUARIO_ID, DESCRICAO, VALOR, DATA_VENCIMENTO, DATA_PAGAMENTO, CATEGORIA, STATUS, TIPO, OBSERVACOES)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING ID
    `;
    const params = [
      conta.tenant_id,
      conta.usuario_id,
      conta.descricao,
      conta.valor,
      conta.data_vencimento,
      conta.data_pagamento,
      conta.categoria,
      conta.status,
      conta.tipo,
      conta.observacoes
    ];
    const result = (await query(sql, params)) as any[];
    return result[0].ID;
  },

  async update(id: number, tenantId: number, conta: Partial<Conta>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    const allowedFields: (keyof Conta)[] = [
      'descricao', 'valor', 'data_vencimento', 'data_pagamento',
      'categoria', 'status', 'tipo', 'observacoes'
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
  },

  async delete(id: number, tenantId: number): Promise<void> {
    await execute('DELETE FROM CONTAS WHERE ID = ? AND TENANT_ID = ?', [id, tenantId]);
  },

  async getTotalPendente(tenantId: number, tipo: string): Promise<number> {
    const rows = (await query(
      'SELECT SUM(VALOR) AS TOTAL FROM CONTAS WHERE TENANT_ID = ? AND TIPO = ? AND STATUS = ?',
      [tenantId, tipo, 'PENDENTE']
    )) as any[];
    return Number(rows[0]?.TOTAL || 0);
  },

  async getPendentes(tenantId: number): Promise<Conta[]> {
    const rows = (await query(
      "SELECT * FROM CONTAS WHERE TENANT_ID = ? AND STATUS = 'PENDENTE' ORDER BY DATA_VENCIMENTO ASC",
      [tenantId]
    )) as any[];
    return rows.map(mapRowToConta);
  },

  async getAtrasadas(tenantId: number): Promise<Conta[]> {
    const rows = (await query(
      "SELECT * FROM CONTAS WHERE TENANT_ID = ? AND STATUS = 'PENDENTE' AND DATA_VENCIMENTO < CURRENT_DATE ORDER BY DATA_VENCIMENTO ASC",
      [tenantId]
    )) as any[];
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
    const result = (await query(sql, params)) as any[];
    return result[0].ID;
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

