import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { usuariosRepository, tenantsRepository, planosRepository } from '@/lib/db/repositories';

const JWT_SECRET = new TextEncoder().encode('connect-finance-secret-key-2024');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email (apenas tenant 1 = Master)
    const usuario = usuariosRepository.getByEmail(email, 1);

    console.log('Super Admin - Usuario:', JSON.stringify(usuario));

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    // Verificar role (pode vir como objeto ou string)
    const userRole = typeof usuario.role === 'string' ? usuario.role : String(usuario.role);
    console.log('Super Admin - Role:', userRole);

    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores. Role: ' + userRole },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaBase64 = Buffer.from(senha).toString('base64');
    if (usuario.senha !== senhaBase64) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Criar token JWT
    const token = await new SignJWT({
      userId: usuario.id,
      tenantId: usuario.tenant_id,
      email: usuario.email,
      role: usuario.role,
      nome: usuario.nome,
      tipo: 'super-admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      }
    });

  } catch (error) {
    console.error('Erro no login super admin:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
