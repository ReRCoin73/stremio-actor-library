require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const { fetchLibrary } = require('./lib/stremioLibrary');
const { getTopCast } = require('./lib/tmdb');

const CACHE_FILE = path.join(__dirname, 'cache.json');
const REFRESH_HOURS = 6; // de quanto em quanto tempo relê a biblioteca + elenco

let cache = { updatedAt: 0, items: [], actors: [] };

// -------- Monta/atualiza o cache (biblioteca + elenco) --------
async function refreshCache() {
  console.log('Atualizando biblioteca e elenco...');
  const authKey = process.env.STREMIO_AUTH_KEY;
  const libraryItems = await fetchLibrary(authKey);

  const enriched = [];
  const actorSet = new Set();

  for (const item of libraryItems) {
    try {
      const cast = await getTopCast(item._id, item.type);
      cast.forEach(name => actorSet.add(name));

      enriched.push({
        id: item._id,
        type: item.type,
        name: item.name,
        poster: item.poster,
        cast
      });
    } catch (err) {
      console.warn(`Falha ao buscar elenco de ${item.name}:`, err.message);
      enriched.push({ id: item._id, type: item.type, name: item.name, poster: item.poster, cast: [] });
    }
    // pequena pausa pra nao estourar o rate limit gratuito do TMDB (~40 req / 10s)
    await new Promise(r => setTimeout(r, 300));
  }

  cache = {
    updatedAt: Date.now(),
    items: enriched,
    actors: Array.from(actorSet).sort((a, b) => a.localeCompare(b))
  };

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`Cache atualizado: ${enriched.length} itens, ${cache.actors.length} atores.`);
}

function loadCacheFromDisk() {
  if (fs.existsSync(CACHE_FILE)) {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
}

function cacheIsStale() {
  return Date.now() - cache.updatedAt > REFRESH_HOURS * 60 * 60 * 1000;
}

// -------- Manifest do addon --------
// OBS: reaproveitamos o campo "genre" do Stremio pra listar os ATORES,
// porque e' o unico nome de filtro que todos os clientes (incl. TV) renderizam
// como dropdown. Na tela vai aparecer escrito "Genre", mas as opcoes serao
// os nomes dos atores da sua biblioteca.
const manifest = {
  id: 'community.minhabiblioteca.porator',
  version: '1.0.0',
  name: 'Minha Biblioteca por Ator',
  description: 'Sua biblioteca do Stremio, filtravel por ator principal',
  logo: 'https://raw.githubusercontent.com/ReRCoin73/stremio-actor-library/main/public/logo.png?v=2',
  resources: ['catalog'],
  types: ['movie', 'series'],
  catalogs: [
    {
      type: 'movie',
      id: 'lib-por-ator-movie',
      name: 'Meus Filmes por Ator',
      extra: [{ name: 'genre', isRequired: false, options: [] }]
    },
    {
      type: 'series',
      id: 'lib-por-ator-series',
      name: 'Minhas Series por Ator',
      extra: [{ name: 'genre', isRequired: false, options: [] }]
    }
  ]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, extra }) => {
  if (cacheIsStale()) await refreshCache();

  const actorFiltro = extra && extra.genre;
  let items = cache.items.filter(i => i.type === type);

  if (actorFiltro) {
    items = items.filter(i => i.cast.includes(actorFiltro));
  }

  const metas = items.map(i => ({
    id: i.id,
    type: i.type,
    name: i.name,
    poster: i.poster
  }));

  return { metas };
});

// Atualiza a lista de opcoes (nomes de atores) do manifest antes de servir
function refreshManifestOptions() {
  manifest.catalogs.forEach(c => {
    c.extra[0].options = cache.actors;
  });
}

async function start() {
  loadCacheFromDisk();
  if (cacheIsStale()) await refreshCache();
  refreshManifestOptions();

  const port = process.env.PORT || 7000;
  serveHTTP(builder.getInterface(), { port });
  console.log(`Addon rodando na porta ${port}`);
}

start().catch(err => {
  console.error('Erro ao iniciar addon:', err);
  process.exit(1);
});
