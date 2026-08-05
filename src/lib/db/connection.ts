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
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        console.error('Erro na query:', sql, err);
        reject(err);
      } else {
        resolve(result || []);
      }
    });
  });
}

export async function execute(sql: string, params: any[] = []) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err: any, result: any) => {
      if (err) {
        console.error('Erro ao executar:', sql, err);
        reject(err);
      } else {
        resolve(result);
      }
    });
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

export interface Conta {
  id: number;
  tenant_id: number;
  usuario_id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria: string;
  status: 'PENDENTE' | 'PAGO' | 'RECEBIDO' | 'ATRASADO';
  tipo: 'PAGAR' | 'RECEBER';
  observacoes: string | null;
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
