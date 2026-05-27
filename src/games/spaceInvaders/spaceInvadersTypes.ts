// Tipos usados pelo Space Invaders.
// Eles ajudam o TypeScript a entender a estrutura dos dados do jogo.

export type SpaceInvadersScreenState =
  | "start"
  | "playing"
  | "paused"
  | "game-over"
  | "victory";

export type BossTier = "scout" | "overlord" | "quasar" | "forge" | "omega";

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

export type Boss = {
  active: boolean;
  defeated: boolean;
  wave: number;
  name: string;
  tier: BossTier;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  points: number;
  moveSpeed: number;
  bulletSpeed: number;
  attackIntervalMs: number;
  attackRestTimeMs: number;
  aimErrorRange: number;
  rainBulletCount: number;
  direction: 1 | -1;
  spawnedAt: number;
  nextAttackAt: number;
  burstShotsLeft: number;
  nextBurstShotAt: number;
  shieldActive: boolean;
  shieldHitsLeft: number;
  shieldLastActivatedAt: number;
  shieldNextShotAt: number;
  shieldAvailableAt: number;
  summonNextAt: number;
};

export type BulletSource =
  | "player"
  | "support"
  | "enemy"
  | "boss"
  | "boss-laser";

export type Bullet = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  active: boolean;
  source: BulletSource;
  damageActiveAt?: number;
  expiresAt?: number;
  createdAt?: number;
  followBossCenter?: boolean;
  color?: string;
  glow?: string;
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
  lastBossDamageAt: number;
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

export type ShieldPower = {
  active: boolean;
  activatedAt: number;
  lastBrokenAt: number;
  hitsTaken: number;
  breaking: boolean;
  brokenAt: number;
};

export type SpaceInvadersRuntime = {
  player: Player;
  invaders: Invader[];
  boss: Boss;
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
  shieldPower: ShieldPower;

  lastPlayerShotAt: number;
  shake: number;
};
