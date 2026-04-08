import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook que obtém o access_token válido da sessão atual diretamente do 
 * Supabase Browser Client. O Supabase Browser Client cuida de refresh
 * automáticos e mantém o token atualizado.
 */
export function useAuthToken() {
  const tokenRef = useRef<{ value: string; expiresAt: number } | null>(null);
  const supabase = createClient();

  const getToken = useCallback(async (): Promise<string | null> => {
    const now = Date.now();

    // Retorna o token em cache se ainda houver 1 minuto de margem validade
    if (tokenRef.current && tokenRef.current.expiresAt > (now + 60000)) {
      return tokenRef.current.value;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('[useAuthToken] Erro do Supabase auth:', error.message);
        return null;
      }

      if (!session?.access_token) {
        return null; // Usuário não autenticado
      }

      tokenRef.current = {
        value: session.access_token,
        // session.expires_at é em segundos do epoch, converter para ms
        expiresAt: session.expires_at ? session.expires_at * 1000 : now + 3600 * 1000,
      };

      return session.access_token;
    } catch (err) {
      console.error('[useAuthToken] Erro inesperado capturando token:', err);
      return null;
    }
  }, [supabase]);

  /**
   * Retorna os headers de autenticação prontos para uso em fetch()
   */
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  return { getToken, getAuthHeaders };
}
