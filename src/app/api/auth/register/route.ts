import { NextRequest, NextResponse } from 'next/server';
import { registerTenant, createToken } from '@/lib/auth/auth';
import { z } from 'zod';

const registerSchema = z.object({
  nome: z.string().min(3, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  nomeAdmin: z.string().min(3, 'Nome do administrador é obrigatório'),
  planoId: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Registrar tenant
    const result = registerTenant(validation.data);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Criar token JWT
    const token = await createToken({
      userId: result.userId!,
      tenantId: result.tenantId!,
      email: validation.data.email,
      role: 'ADMIN',
      nome: validation.data.nomeAdmin,
      tenantNome: validation.data.nome
    });

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      token,
      user: {
        id: result.userId,
        nome: validation.data.nomeAdmin,
        email: validation.data.email,
        role: 'ADMIN',
        tenantId: result.tenantId,
        tenantNome: validation.data.nome
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
