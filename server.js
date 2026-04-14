// Arquivo de inicialização compatível com a Hostinger (Passenger / PM2)
// Esse arquivo simplesmente importa o servidor Node gerado pelo Astro.
import('./dist/server/entry.mjs').catch(err => {
  console.error("Falha ao iniciar o servidor Astro:", err);
  process.exit(1);
});
