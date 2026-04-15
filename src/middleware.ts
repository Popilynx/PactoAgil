import { defineMiddleware } from 'astro:middleware';
import { createSupabaseClient } from './lib/supabase/astro';
import { ROUTES } from './constants/routes';

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, redirect, request } = context;
  const { pathname } = url;

  // ─── EMERGÊNCIA: EXPURGO NEXT.JS ───────────────────────────────────
  const legacyCookies = ['__session', 'next-auth.session-token', 'next-auth.callback-url', 'next-auth.state'];
  legacyCookies.forEach(cookieName => {
    if (cookies.has(cookieName)) {
      cookies.delete(cookieName, { path: '/' });
    }
  });

  if (pathname.includes('_next/')) {
    return new Response(
      `console.warn('Next.js legacy detected, purging cache...'); window.location.replace('/force-refresh.html?ts=' + Date.now());`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }

  // Ignorar assets e manifestos
  if (
    pathname.includes('favicon.ico') ||
    pathname.includes('manifest.json') ||
    pathname.includes('robots.txt') ||
    pathname.includes('sw.js') ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/api/') ||
    /\.(png|svg|jpg|jpeg|webp|gif|ico|css|js|woff|woff2|ttf|otf|map|json)$/.test(pathname)
  ) {
    return next();
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

  if (!hasSupabaseEnv) {
    locals.user = null;
    locals.userId = null;
    return next();
  }

  const supabase = createSupabaseClient(cookies);

  // Obter usuário
  const { data: { user } } = await supabase.auth.getUser();

  // Armazenar no locals para acesso nas páginas e APIs Astro
  locals.user = user;
  locals.userId = user?.id || null;

  // Injetar header x-user-id para APIs que precisam ler do request
  const headers = new Headers(request.headers);
  if (user?.id) {
    headers.set('x-user-id', user.id);
  }
  
  // Atualizar request com headers modificados (disponível no Astro 5+)
  context.request = new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
  });

  const isAuthRoute = pathname.startsWith(ROUTES.PAGES.AUTH.LOGIN) || pathname.startsWith(ROUTES.PAGES.AUTH.REGISTER);
  const isProtectedRoute = pathname.startsWith(ROUTES.PAGES.DASHBOARD.ROOT) || pathname.startsWith('/admin');

  if (user && isAuthRoute) {
    return redirect(ROUTES.PAGES.DASHBOARD.ROOT);
  }

  if (!user && isProtectedRoute) {
    return redirect(ROUTES.PAGES.AUTH.LOGIN);
  }

  const response = await next();
  
  return response;
});
