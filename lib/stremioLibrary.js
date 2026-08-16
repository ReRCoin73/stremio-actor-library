const fetch = require('node-fetch');

// Puxa a biblioteca inteira da conta (todos os itens salvos/favoritos).
async function fetchLibrary(authKey) {
  const res = await fetch('https://api.strem.io/api/datastoreGet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authKey,
      collection: 'libraryItem',
      all: true
    })
  });

  const data = await res.json();

  if (!data.result) {
    throw new Error('Nao foi possivel ler a library. Verifique o authKey. Resposta: ' + JSON.stringify(data));
  }

  // Mantem so filmes e series (remove itens ja removidos/arquivados)
  return data.result.filter(item => !item.removed && (item.type === 'movie' || item.type === 'series'));
}

module.exports = { fetchLibrary };
