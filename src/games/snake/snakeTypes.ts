export type Point = {
  x: number;
  y: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export type BackgroundParticle = {
  x: number;
  y: number;
  vy: number;
  radius: number;
  opacity: number;
};

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

export type Fruits = {
  normal: Fruit;
  golden: Fruit;
  purple: Fruit;
  black: Fruit;
  hybrid: Fruit;
  wanderingGreen: Fruit;
};

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
  fruits: Fruits;
};

export type SnakeScreenState = "start" | "countdown" | "playing" | "game-over";