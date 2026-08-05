import { SignJWT, jwtVerify } from 'jose';
import { usuariosRepository, tenantsRepository } from '@/lib/db/repositories';

// Usar uma secret fixa para garantir compatibilidade
const JWT_SECRET = new TextEncoder().encode('connect-finance-secret-key-2024');

export interface TokenPayload {
  userId: number;
  tenantId: number;
  email: string;
  role: 'ADMIN' | 'USER';
  nome: string;
  tenantNome: string;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function login(email: string, senha: string, tenantId?: number) {
  try {
    // Buscar usuário
    const usuario = await (tenantId 
      ? usuariosRepository.getByEmail(email, tenantId)
      : usuariosRepository.getByEmail(email));

    console.log('DEBUG: usuario encontrado:', JSON.stringify(usuario));

    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Verificar senha (base64)
    const senhaBase64 = Buffer.from(senha).toString('base64');
    if (usuario.senha !== senhaBase64) {
      return { success: false, error: 'Senha incorreta' };
    }

    // Buscar tenant
    const tenant = await tenantsRepository.getById(usuario.tenant_id);
    if (!tenant) {
      return { success: false, error: 'Tenant não encontrado' };
    }

    if (tenant.status !== 'ATIVO') {
      return { success: false, error: 'Tenant inativo ou expirado' };
    }

    // Atualizar último acesso
    await usuariosRepository.updateUltimoAcesso(usuario.id);

    return {
      success: true,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tenantId: usuario.tenant_id,
        tenantNome: tenant.nome
      }
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { success: false, error: 'Erro ao processar login' };
  }
}

