export type BreakoutScreenState = "start" | "playing" | "game-over";

export type BrickType = "normal" | "tnt" | "ultimate";

export type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  hits: number;
  maxHits: number;
  color: string;
  glow: string;
  type: BrickType;
  spawnedAt?: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export type Shockwave = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: string;
};

export type PowerUpType = "heart" | "bomb";

export type FallingPowerUp = {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  vy: number;
  radius: number;
  emoji: string;
  color: string;
  glow: string;
  active: boolean;
};

export type UltimateExtraBall = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  active: boolean;
};

export type BreakoutRuntime = {
  paddle: {
    x: number;
    y: number;
    width: number;
    height: number;
    targetX: number;
  };

  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    speed: number;
    stuckToPaddle: boolean;
    bombCharges: number;
    arrowPierceHits: number;
  };

  arrowPower: {
    aiming: boolean;
    lastUsedAt: number;
  };

  homingPower: {
    active: boolean;
    activatedAt: number;
    lastUsedAt: number;
  };

  ultimatePower: {
    active: boolean;
    charge: number;
    activatedAt: number;
    paddleBounceCombo: number;
  };

  bricks: Brick[];
  particles: Particle[];
  shockwaves: Shockwave[];
  powerUps: FallingPowerUp[];
  ultimateExtraBalls: UltimateExtraBall[];

  score: number;
  lives: number;
  wave: number;
  shake: number;
  lastBombCollectedAt: number;

  rebuild: {
    active: boolean;
    startedAt: number;
    nextBrickIndex: number;
    releaseAt: number;
  };
};