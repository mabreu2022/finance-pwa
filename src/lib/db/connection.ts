import Firebird from 'node-firebird';
import path from 'path';

// Caminho do banco Firebird
const dbPath = path.join(process.cwd(), 'public', 'database', 'BANCOFINANCAS.FDB');

let dbConnection: any = null;

export async function getDatabase() {
  if (dbConnection) {
    return dbConnection;
  }

  return new Promise((resolve, reject) => {
    const options = {
      database: dbPath,
      user: 'SYSDBA',
      password: 'masterkey',
      role: null,
      pageSize: 4096
    };

    Firebird.attach(options, (err: any, database: any) => {
      if (err) {
        console.error('Erro ao conectar ao banco:', err);
        reject(err);
      } else {
        dbConnection = database;
        console.log('✅ Conectado ao Firebird:', dbPath);
        resolve(database);
      }
    });
  });
}

export async function closeDatabase() {
  if (dbConnection) {
    return new Promise((resolve, reject) => {
      dbConnection.detach((err: any) => {
        if (err) reject(err);
        else {
          dbConnection = null;
          resolve(true);
        }
      });
    });
  }
}

export async function query(sql: string, params: any[] = []) {
  let db: any;
  try {
    db = await getDatabase();
  } catch (err) {
    dbConnection = null;
    throw err;
  }
  return new Promise((resolve, reject) => {
    try {
      db.query(sql, params, (err: any, result: any) => {
        if (err) {
          console.error('Erro na query:', sql, err);
          dbConnection = null;
          reject(err);
        } else {
          resolve(result || []);
        }
      });
    } catch (err) {
      console.error('Erro síncrono na query:', err);
      dbConnection = null;
      reject(err);
    }
  });
}

export async function execute(sql: string, params: any[] = []) {
  let db: any;
  try {
    db = await getDatabase();
  } catch (err) {
    dbConnection = null;
    throw err;
  }
  return new Promise((resolve, reject) => {
    try {
      db.query(sql, params, (err: any, result: any) => {
        if (err) {
          console.error('Erro ao executar:', sql, err);
          dbConnection = null;
          reject(err);
        } else {
          resolve(result);
        }
      });
    } catch (err) {
      console.error('Erro síncrono ao executar:', err);
      dbConnection = null;
      reject(err);
    }
  });
}

// Tipos TypeScript
export interface Plano {
  id: number;
  nome: string;
  descricao: string;
  valor_mensal: number;
  limite_usuarios: number | null;
  limite_contas: number | null;
  features: string;
  ativo: string;
  data_cadastro: string;
}

export interface Tenant {
  id: number;
  nome: string;
  cnpj: string | null;
  nome_fantasia: string | null;
  email_admin: string | null;
  telefone: string | null;
  endereco: string | null;
  dominio: string | null;
  status: string;
  plano_id: number | null;
  limite_usuarios: number;
  data_criacao: string;
  data_expiracao: string | null;
}

export interface Usuario {
  id: number;
  tenant_id: number;
  nome: string;
  email: string;
  senha: string;
  role: 'ADMIN' | 'USER';
  status: string;
  fone: string | null;
  ultimo_acesso: string | null;
  data_cadastro: string;
}

export interface ContaBancaria {
  id: number;
  tenant_id: number;
  nome: string;
  tipo: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'DINHEIRO' | 'OUTRO';
  saldo_inicial: number;
  saldo_atual: number;
  ativo: 'S' | 'N';
  data_cadastro: string;
}

export interface Conta {
  id: number;
  tenant_id: number;
  usuario_id: number;
  conta_bancaria_id: number | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria: string;
  status: 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'ATRASADO';
  tipo: 'PAGAR' | 'RECEBER';
  observacoes: string | null;
  arquivo_boleto: string | null;
  arquivo_comprovante: string | null;
  data_cadastro: string;
}

export interface Agendamento {
  id: number;
  tenant_id: number;
  usuario_id: number;
  descricao: string;
  valor: number;
  dia_fixo: number;
  categoria: string;
  tipo: 'PAGAR' | 'RECEBER';
  recorrente: 'S' | 'N';
  ativo: 'S' | 'N';
  ultima_execucao: string | null;
  proxima_execucao: string | null;
  data_cadastro: string;
}

export interface Cliente {
  id: number;
  tenant_id: number;
  tipo: 'PF' | 'PJ';
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  observacoes: string | null;
  ativo: 'S' | 'N';
  data_cadastro: string;
}

export interface Software {
  id: number;
  tenant_id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  ativo: 'S' | 'N';
  data_cadastro: string;
}

export interface Licenca {
  id: number;
  tenant_id: number;
  cliente_id: number;
  software_id: number;
  conta_bancaria_id: number | null;
  descricao: string;
  valor: number;
  periodicidade: 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string | null;
  status: 'ATIVA' | 'SUSPENSA' | 'CANCELADA';
  gerar_conta_auto: 'S' | 'N';
  ultima_geracao: string | null;
  observacoes: string | null;
  data_cadastro: string;
  // campos de join (opcionais)
  cliente_nome?: string;
  software_nome?: string;
}
