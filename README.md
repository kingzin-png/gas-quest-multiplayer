# GAS QUEST Multiplayer

Quiz multiplayer com 18 perguntas e 6 fases sobre gases. O apresentador cria uma sala com código de 6 dígitos e controla as perguntas; alunos respondem no celular. Acertos dão 100 pontos, dicas custam até 50 pontos, ranking em tempo real.

## Executar localmente

Instale Node.js 18+ e execute nesta pasta:

```bash
npm install
npm start
```

Abra http://localhost:3000.

## Publicar online

1. Envie os arquivos desta pasta a um repositório GitHub.
2. No Render ou serviço de hospedagem compatível com Node.js e WebSocket, crie um Web Service conectado ao repositório.
3. Configure **Build command** `npm install` e **Start command** `npm start`.
4. Aguarde a implantação e compartilhe a URL HTTPS gerada.

**Limitações:** salas em memória (reiniciar o servidor encerra partidas); fechar a página do apresentador encerra a sala; alunos só entram antes do início. Teste a conexão e o plano de hospedagem antes de apresentar. O ZIP não publica automaticamente o site.
