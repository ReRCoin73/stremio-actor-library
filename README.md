# Minha Biblioteca por Ator — addon Stremio

Le sua biblioteca do Stremio, busca o elenco principal de cada filme/serie
no TMDB, e cria um catalogo com filtro por ator (aparece como "Genre" na
tela, mas as opcoes sao os nomes dos atores).

## O que voce precisa antes de comecar

1. **Node.js instalado** no seu computador (baixe em nodejs.org, versao LTS)
2. **Conta gratuita no TMDB**: crie em themoviedb.org -> Configuracoes -> API
   -> gera uma "API Key (v3 auth)" gratis na hora
3. **Conta no Render** (render.com) — gratis, sem cartao de credito

## Passo 1 — Instalar dependencias

Abra o terminal dentro da pasta do projeto e rode:

```
npm install
```

## Passo 2 — Pegar o authKey da sua conta Stremio

Isso roda UMA VEZ no seu computador (nunca no servidor, pra nao expor sua senha):

```
node lib/getAuthKey.js seu-email@exemplo.com suaSenhaDoStremio
```

Vai aparecer um codigo longo no terminal — isso e' o authKey.

## Passo 3 — Preencher o .env

Copie `.env.example` para um novo arquivo chamado `.env` e preencha:

```
STREMIO_AUTH_KEY=cole_o_authkey_aqui
TMDB_API_KEY=cole_sua_chave_do_tmdb_aqui
```

## Passo 4 — Testar localmente

```
npm start
```

Vai aparecer "Addon rodando na porta 7000". Na primeira vez ele demora um
pouco (esta lendo seus 100+ filmes e buscando elenco de cada um — tem uma
pausa proposital entre buscas pra nao estourar o limite gratis do TMDB).

Depois de pronto, abra no navegador: `http://localhost:7000/manifest.json`
— se aparecer um JSON, esta funcionando.

## Passo 5 — Subir pro Render (gratis, sem expirar)

1. Crie um repositorio no GitHub e suba esta pasta (o `.gitignore` ja
   protege seu `.env`, `auth.json` e `cache.json` de irem junto)
2. No Render: **New + > Web Service** > conecte o repositorio
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Em "Environment", adicione as mesmas variaveis do seu `.env`
   (STREMIO_AUTH_KEY e TMDB_API_KEY)
6. Deploy. Ao final ele te da uma URL tipo `https://seu-addon.onrender.com`

Detalhe do plano gratuito do Render: se ficar 15 min sem uso, ele "dorme" e
demora uns 30-50s pra acordar na proxima vez que voce abrir o Stremio. Nao
tem custo, nem prazo de validade — so essa demora ocasional.

## Passo 6 — Instalar no Stremio (incluindo a Samsung TV)

No navegador, acesse:
```
https://seu-addon.onrender.com/manifest.json
```
Copie essa URL. No Stremio (qualquer dispositivo, inclusive a TV), va em
Addons > cole a URL no campo de busca > Instalar.

## Limitacao importante

A lista de atores do filtro fica fixa no manifest quando voce instala o
addon (isso e' assim porque o proprio Stremio guarda um cache do manifest).
Se voce adicionar muitos filmes novos e quiser que os atores deles apareçam
no filtro, precisa **desinstalar e reinstalar** o addon de novo (ou trocar
a versao no manifest.json, o que forca o Stremio a buscar de novo).

## Alternativa sem servidor pago nem gratuito com sono

Se voce tiver um PC velho, mini-PC ou Raspberry Pi sempre ligado em casa,
rode `npm start` nele direto (com `pm2` pra manter rodando sempre) e use o
IP local ou um servico gratuito tipo Cloudflare Tunnel pra acessar de fora
de casa. Sem hibernacao, 100% gratis, sem depender de nuvem terceira.
