import type { APIRoute } from 'astro';
import { createSupabaseClient } from '@/lib/supabase/astro';
import { getDashboardProfileJson } from '@/lib/dashboard-profile';

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

export const GET: APIRoute = async ({ request, cookies, locals }) => {
  const authResult = await getUserId(request, cookies, locals);

  if (authResult instanceof Response) {
    return authResult;
  }

  const userId = authResult;

  try {
    const body = await getDashboardProfileJson(userId, request.headers.get('x-user-email'));

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[PROFILE_ERROR]', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
