import { NextRequest, NextResponse } from 'next/server';
import { login, registerTenant, createToken } from '@/lib/auth/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1),
  senha: z.string().min(1),
  tenantId: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, senha, tenantId } = validation.data;

    // Realizar login
    const result = await login(email, senha, tenantId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Criar token JWT
    const token = await createToken({
      userId: result.user!.id,
      tenantId: result.user!.tenantId,
      email: result.user!.email,
      role: result.user!.role,
      nome: result.user!.nome,
      tenantNome: result.user!.tenantNome
    });

    // Retornar resposta com token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: result.user!.id,
        nome: result.user!.nome,
        email: result.user!.email,
        role: result.user!.role,
        tenantId: result.user!.tenantId,
        tenantNome: result.user!.tenantNome
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
