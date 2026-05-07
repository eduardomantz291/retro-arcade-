// Configurações principais do Snake Game.
// Alterar esses valores muda o tamanho do tabuleiro, velocidade do jogo,
// duração dos poderes e a chave usada para salvar o recorde no localStorage.

// Tamanho total do canvas em pixels. O canvas real é 400x400.
export const CANVAS_SIZE = 400;

// Tamanho de cada quadradinho do grid. A cobrinha anda de 20 em 20 pixels.
export const TILE_SIZE = 20;

// Metade do tile. Usado para centralizar frutas e colisões no meio do quadrado.
export const HALF_TILE = TILE_SIZE / 2;

// Tempo máximo do poder amarelo de proteção.
// Esse número é contado em ticks do jogo, não em segundos reais.
export const MAX_GOLDEN_TIME = 60;

// Tempo máximo do poder roxo de ímã.
// Assim como o amarelo, esse valor é reduzido a cada movimento da cobra.
export const MAX_MAGNET_TIME = 80;

// Velocidade do loop principal do jogo.
// Quanto menor o número, mais rápido a cobrinha anda.
export const TICK_SPEED = 120;

// Chave usada para salvar o recorde local do Snake no navegador.
export const HIGH_SCORE_KEY = "snakeHighScorePremium";
