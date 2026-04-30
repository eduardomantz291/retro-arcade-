
export type BreakoutScreenState = "start" | "playing" | "game-over";

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
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export type PowerUpType = "heart";

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
  };

  bricks: Brick[];
  particles: Particle[];
  powerUps: FallingPowerUp[];

  score: number;
  lives: number;
  level: number;
  shake: number;
};