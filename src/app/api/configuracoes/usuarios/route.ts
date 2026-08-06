import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { usuariosRepository } from '@/lib/db/repositories';

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

// GET — Listar usuários do tenant
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const usuarios = await usuariosRepository.getAll(admin.tenantId);

    // Remover senhas da resposta
    const sanitized = usuarios.map(({ senha: _, ...u }) => u);
    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// POST — Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email, senha, perfil, fone } = body;

    if (!nome || !email || !senha || !perfil) {
      return NextResponse.json({ error: 'Nome, email, senha e perfil são obrigatórios' }, { status: 400 });
    }

    // Verificar se email já existe no tenant
    const existente = await usuariosRepository.getByEmail(email, admin.tenantId);
    if (existente) {
      return NextResponse.json({ error: 'E-mail já cadastrado neste tenant' }, { status: 400 });
    }

    // Perfil determina role
    const role = perfil === 'ADMIN' ? 'ADMIN' : 'USER';
    const senhaBase64 = Buffer.from(senha).toString('base64');

    const id = await usuariosRepository.create({
      tenant_id: admin.tenantId,
      nome,
      email,
      senha: senhaBase64,
      role,
      perfil,
      status: 'ATIVO',
      fone: fone || null
    });

    return NextResponse.json({ id, message: 'Usuário criado com sucesso' }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
