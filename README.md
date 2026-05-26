# Retro Arcade Games

Retro Arcade Games e uma plataforma de jogos arcade feita com React, TypeScript e Vite.

O projeto comecou como um Snake simples em HTML, CSS e JavaScript puro. Com o tempo, a ideia evoluiu para um site arcade completo, com visual neon, jogos em canvas, sistema de usuario simulado, modo visitante, progresso por XP, niveis e jogos desbloqueaveis.

A proposta e juntar a sensacao de jogos retro com uma interface mais moderna: fundo escuro, efeitos de brilho, cards com estilo arcade, animacoes, responsividade e partidas rapidas.

## Jogos Disponiveis

### Snake Arcade

Primeiro jogo do projeto. Foi migrado de JavaScript puro para React e TypeScript.

Inclui:

- Movimento por teclado e toque.
- Frutas especiais.
- Power-ups.
- Score e recorde.
- Tela inicial, countdown e game over.
- Integracao com XP e nivel.

### Brick Breaker

Jogo inspirado em Breakout/Arkanoid, com identidade propria.

Inclui:

- Gameplay em canvas.
- Blocos, paddle e bola.
- Power-ups ofensivos e defensivos.
- Sons e musicas.
- Pontuacao, vidas e tempo.
- Integracao com XP e nivel.

### Space Invaders

Jogo arcade de nave com ondas, poderes e bosses.

Inclui:

- Nave controlada por teclado, mouse ou toque.
- Inimigos em formacao.
- Tiros do player e dos inimigos.
- Ondas com dificuldade progressiva.
- Boss na onda 5.
- Segundo boss na onda 10.
- Poderes de laser, nave de suporte e escudo.
- HUD com pontos, vidas, onda e barra de vida do boss.
- Layout responsivo.

## Funcionalidades da Plataforma

- Home com lista de jogos.
- Sistema de login e cadastro simulado.
- Modo visitante.
- Perfil do jogador.
- Dashboard com XP, nivel e progresso.
- Ranking mockado.
- Sistema local de XP e level.
- Jogos desbloqueaveis por nivel, em evolucao.
- Persistencia temporaria com `localStorage`.

## Tecnologias Utilizadas

- React.
- TypeScript.
- Vite.
- React Router.
- Context API.
- LocalStorage.
- Canvas API.
- CSS separado por pagina e por jogo.
- ESLint.

O projeto ainda nao possui backend real. Login, cadastro, progresso, XP e dados do usuario sao simulados no frontend e salvos no navegador.

## Por Que Usar Canvas

Os jogos foram feitos com a Canvas API porque ela combina bem com jogos arcade 2D.

No Space Invaders, por exemplo, a nave, os inimigos, tiros, escudo, laser, particulas e bosses sao desenhados diretamente no canvas usando formas geometricas, cores, sombras e gradientes.

Essa escolha ajuda em alguns pontos:

- Facilita animacoes frame a frame.
- Evita depender de sprites ou imagens externas para cada inimigo.
- Mantem o visual mais consistente com a proposta neon/retro.
- Permite criar bosses e efeitos especiais diretamente por codigo.
- Deixa mais facil ajustar tamanho, cor, hitbox, velocidade e comportamento.

O projeto pode receber imagens e sprites no futuro, mas a ideia atual e valorizar formas desenhadas por codigo para manter uma identidade arcade propria.

## Audio e Assets

O projeto usa arquivos de audio organizados por jogo dentro de `public/audio`.

Estrutura atual:

```txt
public/audio/snakeGame
public/audio/breakoutGame
```

Os sons e musicas foram pensados para reforcar feedback de gameplay: colisao, dano, power-up, game over, musica de menu e musica de partida.

Alguns arquivos de audio vieram de fontes publicas ou externas. Antes de uma publicacao final, e importante revisar as licencas e creditos de cada arquivo usado.

## Estrutura do Projeto

```txt
src
  components
  contexts
  features
    playerProgress
  games
    Breakout
    snake
    spaceInvaders
  pages
    Auth
    Profile
    Ranking
```

Cada jogo possui seus proprios arquivos de configuracao, tipos, logica, pagina e estilos.

Exemplo do Space Invaders:

```txt
src/games/spaceInvaders
  SpaceInvadersGamePage.tsx
  useSpaceInvadersGame.ts
  spaceInvadersConfig.ts
  spaceInvadersFactory.ts
  spaceInvadersTypes.ts
  space-invaders-style.css
```

## Como Rodar o Projeto

Para testar localmente, voce precisa ter o Node.js instalado.

Clone o repositorio:

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta:

```bash
cd retro-arcade
```

Instale as dependencias:

```bash
npm install
```

Rode o projeto em modo desenvolvimento:

```bash
npm run dev
```

Depois abra o endereco mostrado no terminal, normalmente:

```txt
http://localhost:5173
```

## Scripts Disponiveis

```bash
npm run dev
```

Inicia o servidor de desenvolvimento com Vite.

```bash
npm run build
```

Gera a build de producao.

```bash
npm run preview
```

Abre uma pre-visualizacao local da build.

```bash
npm run lint
```

Executa a verificacao do ESLint.

## Estado Atual

O projeto esta em desenvolvimento ativo.

Ja existe uma base funcional com tres jogos, sistema de usuario simulado, modo visitante, perfil, ranking mockado e progressao por XP.

Proximos passos possiveis:

- Criar backend real.
- Salvar usuarios, pontuacoes, XP e historico de partidas em banco de dados.
- Melhorar sistema de desbloqueio de jogos.
- Criar novos bosses e poderes.
- Adicionar mais sons ao Space Invaders.
- Evoluir o ranking para dados reais.
- Refatorar partes grandes da logica dos jogos.

## Observacao

Este e um projeto de estudo e evolucao continua. A ideia principal e aprender, testar mecanicas, organizar melhor o codigo e criar uma experiencia arcade cada vez mais completa.
