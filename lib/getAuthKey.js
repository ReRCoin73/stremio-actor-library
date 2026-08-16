// Roda UMA VEZ, no seu computador, so pra pegar o authKey da sua conta.
// Uso: node lib/getAuthKey.js seu-email@exemplo.com suaSenha
//
// O authKey e' salvo em auth.json. Depois disso, apague sua senha da tela
// do terminal (historico) e NUNCA suba auth.json pro GitHub - coloque
// no .gitignore.

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Uso: node lib/getAuthKey.js seu-email suaSenha');
  process.exit(1);
}

async function main() {
  const res = await fetch('https://api.strem.io/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (!data.result || !data.result.authKey) {
    console.error('Falha no login. Resposta da API:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const authKey = data.result.authKey;
  fs.writeFileSync(
    path.join(__dirname, '..', 'auth.json'),
    JSON.stringify({ authKey }, null, 2)
  );

  console.log('AuthKey salvo em auth.json com sucesso.');
  console.log('Agora copie o valor abaixo para a variavel STREMIO_AUTH_KEY no .env:');
  console.log(authKey);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
