import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

// GET — Retornar URL da logo atual
export async function GET(request: NextRequest) {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo', 'logo.png');
    const logoExists = existsSync(logoPath);
    return NextResponse.json({
      logoUrl: logoExists ? '/logo/logo.png' : null,
      hasCustomLogo: logoExists
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Upload de nova logo
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo do arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato inválido. Use PNG, JPG, WebP ou SVG.' }, { status: 400 });
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB.' }, { status: 400 });
    }

    const logoDir = path.join(process.cwd(), 'public', 'logo');
    if (!existsSync(logoDir)) {
      await mkdir(logoDir, { recursive: true });
    }

    // Determinar extensão
    const ext = file.type.includes('svg') ? '.svg' : 
                file.type.includes('webp') ? '.webp' :
                file.type.includes('png') ? '.png' : '.jpg';

    const logoPath = path.join(logoDir, `logo${ext}`);
    const bytes = await file.arrayBuffer();
    await writeFile(logoPath, Buffer.from(bytes));

    // Se não for png, salvar com nome original para referência
    const logoUrl = `/logo/logo${ext}`;

    return NextResponse.json({ 
      logoUrl, 
      message: 'Logo atualizada com sucesso' 
    });
  } catch (error: any) {
    console.error('Erro ao salvar logo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// DELETE — Remover logo (volta para o padrão)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const logoDir = path.join(process.cwd(), 'public', 'logo');
    const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    
    for (const ext of extensions) {
      const logoPath = path.join(logoDir, `logo${ext}`);
      if (existsSync(logoPath)) {
        const { unlink } = await import('fs/promises');
        await unlink(logoPath);
      }
    }

    return NextResponse.json({ message: 'Logo removida. Usando logomarca padrão.' });
  } catch (error: any) {
    console.error('Erro ao remover logo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
