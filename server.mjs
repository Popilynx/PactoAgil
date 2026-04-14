/**
 * Arquivo de entrada para a plataforma Hostinger (Node.js SSR)
 * Este arquivo é rastreado pelo Git para permitir a validação do formulário no hPanel.
 * Ele importa o entrypoint real gerado pelo Astro após o comando de build.
 */

// Importa dinamicamente para evitar erro se o arquivo ainda não existir durante pré-validações
import('./dist/server/entry.mjs').catch((err) => {
  console.error('Erro ao iniciar o servidor: Certifique-se de que "npm run build" foi executado com sucesso.');
  console.error(err);
  process.exit(1);
});
