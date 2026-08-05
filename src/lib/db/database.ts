// Importar tudo direto do Firebird
export { query, execute, getDatabase, closeDatabase } from './connection';
export type { Plano, Tenant, Usuario, Conta, Agendamento } from './connection';

// Tudo usa Firebird 5.0 agora
// Não use mais IndexedDB ou SQLite

    return await db.contas
      .where({ userId, tipo: 'receber', status: 'pendente' })
      .toArray();
  },

  async getAtrasadas(userId: number): Promise<Conta[]> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const pendentes = await this.getPendentes(userId);
    return pendentes.filter(conta => {
      const vencimento = new Date(conta.dataVencimento);
      return vencimento < hoje;
    });
  },

  async create(conta: Omit<Conta, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return await db.contas.add({
      ...conta,
      createdAt: now,
      updatedAt: now,
    });
  },

  async update(id: number, userId: number, conta: Partial<Conta>): Promise<void> {
    const existing = await this.getById(id, userId);
    if (!existing) throw new Error('Conta não encontrada');
    
    await db.contas.update(id, {
      ...conta,
      updatedAt: new Date(),
    });
  },

  async delete(id: number, userId: number): Promise<void> {
    const existing = await this.getById(id, userId);
    if (!existing) throw new Error('Conta não encontrada');
    
    await db.contas.delete(id);
  },

  async getTotalPendente(userId: number): Promise<number> {
    const pendentes = await this.getPendentes(userId);
    return pendentes.reduce((total, conta) => total + conta.valor, 0);
  },

  async getTotalRecebido(userId: number, mes?: number, ano?: number): Promise<number> {
    const recebidos = await this.getByStatus('recebido', userId);
    
    if (mes !== undefined && ano !== undefined) {
      const filtrados = recebidos.filter(conta => {
        if (!conta.dataPagamento) return false;
        const data = new Date(conta.dataPagamento);
        return data.getMonth() === mes && data.getFullYear() === ano;
      });
      return filtrados.reduce((total, conta) => total + conta.valor, 0);
    }
    
    return recebidos.reduce((total, conta) => total + conta.valor, 0);
  }
};

export const dashboard = {
  async getResumo(userId: number): Promise<{
    totalPagar: number;
    totalReceber: number;
    saldo: number;
    contasAtrasadas: number;
    contasHoje: number;
  }> {
    const [totalPagar, totalReceber, atrasadasPagar, atrasadasReceber] = await Promise.all([
      contasPagar.getTotalPendente(userId),
      contasReceber.getTotalPendente(userId),
      contasPagar.getAtrasadas(userId),
      contasReceber.getAtrasadas(userId),
    ]);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const todasContasHoje = await db.contas
      .where({ userId })
      .filter(conta => {
        const vencimento = new Date(conta.dataVencimento);
        vencimento.setHours(0, 0, 0, 0);
        return vencimento.getTime() === hoje.getTime() && conta.status === 'pendente';
      })
      .toArray();

    return {
      totalPagar,
      totalReceber,
      saldo: totalReceber - totalPagar,
      contasAtrasadas: atrasadasPagar.length + atrasadasReceber.length,
      contasHoje: todasContasHoje.length,
    };
  },

  async getDadosMensais(userId: number, ano: number): Promise<{
    mes: string;
    receitas: number;
    despesas: number;
  }[]> {
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const dados = await Promise.all(
      meses.map(async (mes, index) => {
        const [receitas, despesas] = await Promise.all([
          contasReceber.getTotalRecebido(userId, index, ano),
          contasPagar.getTotalPago(userId, index, ano),
        ]);

        return {
          mes,
          receitas,
          despesas,
        };
      })
    );

    return dados;
  }
};
