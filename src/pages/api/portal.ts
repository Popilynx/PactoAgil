import type { APIRoute } from "astro";
import prisma from "@/lib/prisma";
import { createSupabaseClient } from "@/lib/supabase/astro";
import { stripe } from "@/lib/billing/stripe";

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
  if (authResult instanceof Response) return authResult;

  try {
    const perfil = await prisma.perfil.findUnique({
      where: { userId: authResult },
      include: { empresa: { include: { assinatura: true } } },
    });

    const customerId = perfil?.empresa?.assinatura?.stripeCustomerId;
    if (!customerId) {
      return new Response(JSON.stringify({ error: "Nenhuma assinatura ativa encontrada." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${new URL(request.url).origin}/dashboard/configuracoes`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PORTAL_ERROR]", error);
    return new Response(JSON.stringify({ error: "Erro ao abrir portal de assinatura." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
