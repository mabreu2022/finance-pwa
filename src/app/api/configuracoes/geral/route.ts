import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { query, execute } from '@/lib/db/connection';

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

// GET /api/configuracoes/geral
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  try {
    // Buscar todas as configurações do tenant
    const rows = await query('SELECT CHAVE, VALOR FROM CONFIGURACOES WHERE TENANT_ID = ?', [payload.tenantId]) as any[];
    
    // Mapear para objeto { CHAVE: VALOR }
    const configs: Record<string, string> = {};
    rows.forEach(r => {
      configs[r.CHAVE?.trim()] = r.VALOR ? (r.VALOR.toString ? r.VALOR.toString() : String(r.VALOR)) : '';
    });

    // Se não existir a comissão padrão, retornar o default
    if (!configs['COMISSAO_PADRAO']) {
      configs['COMISSAO_PADRAO'] = '5.00';
    }

    return NextResponse.json({ success: true, configs });
  } catch (error: any) {
    console.error('Erro ao buscar configurações gerais:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// POST /api/configuracoes/geral
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const body = await request.json();
    const { chave, valor } = body;

    if (!chave || valor === undefined) {
      return NextResponse.json({ error: 'Chave e Valor são obrigatórios' }, { status: 400 });
    }

    // Verificar se chave existe
    const rows = await query('SELECT ID FROM CONFIGURACOES WHERE TENANT_ID = ? AND CHAVE = ?', [admin.tenantId, chave]) as any[];

    if (rows.length > 0) {
      // Update
      await execute('UPDATE CONFIGURACOES SET VALOR = ? WHERE TENANT_ID = ? AND CHAVE = ?', [String(valor), admin.tenantId, chave]);
    } else {
      // Insert
      await execute('INSERT INTO CONFIGURACOES (TENANT_ID, CHAVE, VALOR) VALUES (?, ?, ?)', [admin.tenantId, chave, String(valor)]);
    }

    return NextResponse.json({ success: true, message: 'Configuração salva com sucesso' });
  } catch (error: any) {
    console.error('Erro ao salvar configuração geral:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
