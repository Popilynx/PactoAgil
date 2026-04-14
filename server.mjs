/**
 * Arquivo de entrada para a plataforma Hostinger (Node.js SSR)
 * Este arquivo é rastreado pelo Git para permitir a validação do formulário no hPanel.
 * Ele importa o entrypoint real gerado pelo Astro após o comando de build.
 *
 * Nos logs de execução deve aparecer a linha abaixo — se vir "Next.js", o domínio
 * está ligado a OUTRA aplicação Node ou o comando de arranque não é este ficheiro.
 */
console.log("[PactoAgil] Arranque Astro SSR (@astrojs/node) — não é Next.js");

// Importa dinamicamente para evitar erro se o arquivo ainda não existir durante pré-validações
import('./dist/server/entry.mjs').catch((err) => {
  console.error('Erro ao iniciar o servidor: Certifique-se de que "npm run build" foi executado com sucesso.');
  console.error(err);
  process.exit(1);
});
