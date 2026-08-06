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

// GET — Detalhe do usuário
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const id = parseInt(params.id);
    const usuario = await usuariosRepository.getById(id);

    if (!usuario || usuario.tenant_id !== admin.tenantId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { senha: _, ...sanitized } = usuario;
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// PUT — Atualizar usuário
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const id = parseInt(params.id);
    const usuario = await usuariosRepository.getById(id);

    if (!usuario || usuario.tenant_id !== admin.tenantId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { nome, email, senha, perfil, status, fone } = body;

    const updateData: any = {};
    if (nome)   updateData.nome   = nome;
    if (email)  updateData.email  = email;
    if (senha)  updateData.senha  = Buffer.from(senha).toString('base64');
    if (perfil) {
      updateData.perfil = perfil;
      updateData.role   = perfil === 'ADMIN' ? 'ADMIN' : 'USER';
    }
    if (status) updateData.status = status;
    if (fone !== undefined) updateData.fone = fone;

    await usuariosRepository.update(id, updateData);
    return NextResponse.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// DELETE — Inativar usuário
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const id = parseInt(params.id);
    const usuario = await usuariosRepository.getById(id);

    if (!usuario || usuario.tenant_id !== admin.tenantId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não deixar inativar o próprio usuário admin
    if (id === admin.userId) {
      return NextResponse.json({ error: 'Não é possível inativar o próprio usuário' }, { status: 400 });
    }

    await usuariosRepository.delete(id);
    return NextResponse.json({ message: 'Usuário inativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao inativar usuário:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
