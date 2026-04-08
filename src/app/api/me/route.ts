import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

interface UserProfile {
  name: string | null;
  role: string | null;
  company: string | null;
  plan: string;
  access_token: string | null;
}

/**
 * Extrai e valida o token Bearer do header de autorização.
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Obtém o ID do usuário via token Bearer (admin client).
 */
async function getUserIdFromToken(token: string): Promise<string | null> {
  const adminClient = createAdminClient();
  const { data: { user }, error } = await adminClient.auth.getUser(token);
  return error || !user ? null : user.id;
}

/**
 * Obtém o ID do usuário da sessão atual (cookies).
 */
async function getUserIdFromSession(): Promise<{ userId: string | null; accessToken: string | null }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return { userId: null, accessToken: null };

  const { data: sessionData } = await supabase.auth.getSession();
  return { userId: user.id, accessToken: sessionData?.session?.access_token ?? null };
}

/**
 * Busca o perfil do usuário no banco de dados.
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const perfil = await prisma.perfil.findUnique({
    where: { userId },
    include: {
      empresa: {
        select: {
          nome: true,
          assinatura: {
            select: { tipoPlano: true }
          }
        }
      }
    }
  });

  if (!perfil) return null;

  return {
    name: perfil.nomeCompleto,
    role: perfil.role,
    company: perfil.empresa?.nome ?? null,
    plan: perfil.empresa?.assinatura?.tipoPlano ?? 'FREE',
    access_token: null
  };
}

/**
 * GET /api/me
 * Retorna as informações completas do usuário ativo.
 */
export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    let userId: string | null = null;
    let finalToken: string | null = token;

    if (token) {
      userId = await getUserIdFromToken(token);
    }

    if (!userId) {
      const sessionData = await getUserIdFromSession();
      userId = sessionData.userId;
      finalToken = sessionData.accessToken;
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido ou sessão inexistente.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const profile = await fetchUserProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado na base de dados.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    console.log(`[API /api/me] Perfil encontrado para user ${userId}. Retornando dados.`);

    return NextResponse.json(
      { ...profile, access_token: finalToken },
      { headers: CORS_HEADERS }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API /api/me] Erro crítico:', message);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao processar o perfil.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * Handle OPTIONS for CORS requests preflight.
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
