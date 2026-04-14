import type { APIRoute } from 'astro';
import { createSupabaseClient } from '@/lib/supabase/astro';

export const prerender = false;

async function getUserId(request: Request, cookies: any, locals: any): Promise<string | Response> {
  let userId = locals.userId;
  
  if (!userId) {
    userId = request.headers.get('x-user-id');
  }
  
  if (!userId || userId === 'undefined' || userId === 'null') {
    const supabase = createSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 });
    }
    userId = user.id;
  }
  
  return userId;
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const authResult = await getUserId(request, cookies, locals);
  
  if (authResult instanceof Response) {
    return authResult; // 401/500
  }

  const userId = authResult;

  try {
    const body = await request.json();
    const { razaoSocial, cnpj, funcionalidade, corPrimaria, logoUrl } = body;

    const supabase = createSupabaseClient(cookies);

    // 1. Buscar o perfil para confirmar a empresaId
    const { data: perfil, error: perfilError } = await supabase
      .from('Perfil')
      .select('empresaId, role')
      .eq('userId', userId)
      .single();

    if (perfilError || !perfil || !perfil.empresaId) {
      return new Response(JSON.stringify({ error: 'Perfil ou empresa não encontrados' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Apenas ADMIN pode atualizar dados da empresa
    if (perfil.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Atualizar dados da Empresa
    const updateData: any = {};
    if (razaoSocial !== undefined) updateData.nome = razaoSocial;
    if (cnpj !== undefined) updateData.cnpj = cnpj;
    if (funcionalidade !== undefined) updateData.funcionalidade = funcionalidade;
    if (corPrimaria !== undefined) updateData.corPrimaria = corPrimaria;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const { error: updateError } = await supabase
      .from('Empresa')
      .update(updateData)
      .eq('id', perfil.empresaId);

    if (updateError) {
      console.error('[UPDATE_COMPANY_ERROR]', updateError);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar dados da empresa' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[UPDATE_PROFILE_ERROR]', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
