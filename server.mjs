/**
 * Arquivo de entrada para a plataforma Hostinger (Node.js SSR)
 * Importa o entry gerado pelo Astro após `npm run build`.
 *
 * Usa caminho absoluto a partir deste ficheiro — alguns hosts mudam o CWD ao arrancar.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const entryPath = join(__dirname, 'dist', 'server', 'entry.mjs');
const entryUrl = pathToFileURL(entryPath).href;

// Hostinger/PaaS normalmente exige bind em 0.0.0.0 e usa PORT dinâmico.
// O entry SSR do Astro respeita essas variáveis.
process.env.HOST ??= '0.0.0.0';
process.env.PORT ??= '4321';

process.on('unhandledRejection', (err) => {
  console.error('[PactoAgil] Unhandled promise rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[PactoAgil] Uncaught exception:', err);
});

try {
  console.log('[PactoAgil] Boot SSR (Astro Node adapter)');
  console.log('[PactoAgil] Node Version:', process.version);
  console.log('[PactoAgil] CWD:', process.cwd());
  console.log('[PactoAgil] Entry Path:', entryPath);
  console.log('[PactoAgil] HOST:', process.env.HOST);
  console.log('[PactoAgil] PORT:', process.env.PORT);
  await import(entryUrl);
} catch (err) {
  console.error(
    '[PactoAgil] ERRO CRÍTICO: Falha ao carregar dist/server/entry.mjs.',
  );
  console.error('[PactoAgil] Verifique se "npm run build" foi executado corretamente.');
  console.error('[PactoAgil] Entry Path:', entryPath);
  console.error(err);
  process.exit(1);
}
