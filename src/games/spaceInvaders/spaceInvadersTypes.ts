// Tipos usados pelo Space Invaders.
// Eles ajudam o TypeScript a entender a estrutura dos dados do jogo.

export type SpaceInvadersScreenState = "start" | "playing" | "game-over";

export type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
};

export type Invader = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  row: number;
  variant: "square" | "circle" | "triangle";
  color: string;
  glow: string;
};

export type BulletSource = "player" | "support" | "enemy";

export type Bullet = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  active: boolean;
  source: BulletSource;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export type LaserPower = {
  active: boolean;
  activatedAt: number;
  lastUsedAt: number;
  x: number;
};

export type SupportShip = {
  active: boolean;
  x: number;
  y: number;
  targetX: number;
  width: number;
  height: number;
  spawnedAt: number;
  expiresAt: number;
  nextMoveAt: number;
  nextShotAt: number;
};

export type SupportPower = {
  lastUsedAt: number;
  ship: SupportShip;
};

export type SpaceInvadersRuntime = {
  player: Player;
  invaders: Invader[];
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  particles: Particle[];

  score: number;
  lives: number;
  wave: number;

  invaderDirection: 1 | -1;
  invaderSpeed: number;

  keys: {
    left: boolean;
    right: boolean;
    shooting: boolean;
  };

  laserPower: LaserPower;
  supportPower: SupportPower;

  lastPlayerShotAt: number;
  shake: number;
};