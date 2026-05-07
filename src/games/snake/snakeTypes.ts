// Tipos usados pelo Snake Game.
// Eles deixam a lógica mais segura e organizada, porque o TypeScript passa
// a entender exatamente o formato da cobrinha, frutas, partículas e telas.

// Representa uma posição no grid do jogo.
export type Point = {
  x: number;
  y: number;
};

// Partícula visual usada em explosões quando frutas são coletadas ou causam dano.
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

// Partícula de fundo usada durante o frenesi verde.
export type BackgroundParticle = {
  x: number;
  y: number;
  vy: number;
  radius: number;
  opacity: number;
};

// Estrutura base de qualquer fruta do jogo.
// As cores e brilho são usados no canvas, e points define a pontuação recebida.
export type Fruit = {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  color: string;
  glow: string;
  glowSize: number;
  points: number;
  colorStart?: string;
  colorEnd?: string;
};

// Conjunto das frutas especiais fixas que podem existir no mapa.
export type Fruits = {
  normal: Fruit;
  golden: Fruit;
  purple: Fruit;
  hybrid: Fruit;
  wanderingGreen: Fruit;
};

// Estado completo da partida em tempo real.
// Esse objeto fica dentro de um useRef no hook useSnakeGame para evitar
// re-renderizações pesadas a cada movimento da cobrinha.
export type GameRuntime = {
  snake: Point[];
  dx: number;
  dy: number;
  score: number;

  invincible: boolean;
  invincibleTime: number;

  magnetActive: boolean;
  magnetTime: number;

  frenzyActive: boolean;
  frenzyTime: number;

  particles: Particle[];
  backgroundParticles: BackgroundParticle[];
  shakeIntensity: number;

  greenMoveTimer: number;
  extraFruits: Fruit[];

  // Frutas especiais fixas do jogo.
  fruits: Fruits;

  // Frutas pretas que funcionam como perigo no mapa.
  blackFruits: Fruit[];
};

// Telas possíveis do Snake.
// start = tela inicial, countdown = contagem, playing = partida, game-over = derrota.
export type SnakeScreenState = "start" | "countdown" | "playing" | "game-over";
