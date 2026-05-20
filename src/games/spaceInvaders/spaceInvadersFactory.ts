import {
  CANVAS_WIDTH,
  INVADER_COLUMNS,
  INVADER_GAP_X,
  INVADER_GAP_Y,
  INVADER_HEIGHT,
  INVADER_ROWS,
  INVADER_START_X,
  INVADER_START_Y,
  INVADER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_LIVES,
  PLAYER_WIDTH,
  PLAYER_Y,
  SUPPORT_SHIP_HEIGHT,
  SUPPORT_SHIP_WIDTH,
} from "./spaceInvadersConfig";
import type {
  Invader,
  SpaceInvadersRuntime,
  SupportShip,
} from "./spaceInvadersTypes";

function getInvaderVisualByRow(row: number) {
  // Fileiras de cima ficam mais especiais visualmente.
  // Topo roxo, meio amarelo, parte de baixo verde.
  if (row === 0) {
    return {
      color: "#be2edd",
      glow: "#e056fd",
    };
  }

  if (row === 1) {
    return {
      color: "#f1c40f",
      glow: "#f9ca24",
    };
  }

  return {
    color: "#38ef7d",
    glow: "#26de81",
  };
}

// Cria a formação inicial dos inimigos.
// Por enquanto eles são feitos só com formas geométricas no canvas.
export function createInvaders(wave = 1): Invader[] {
  const invaders: Invader[] = [];
  let id = 0;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let column = 0; column < INVADER_COLUMNS; column++) {
      id += 1;

      const variant =
        row % 3 === 0 ? "square" : row % 3 === 1 ? "circle" : "triangle";

      const visual = getInvaderVisualByRow(row);

      invaders.push({
        id,
        row,
        x: INVADER_START_X + column * (INVADER_WIDTH + INVADER_GAP_X),
        y: INVADER_START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        active: true,
        variant,
        color: visual.color,
        glow: visual.glow,
      });
    }
  }

  return invaders.map((invader) => ({
    ...invader,
    y: invader.y + Math.min(wave - 1, 4) * 6,
  }));
}

function createInactiveSupportShip(): SupportShip {
  return {
    active: false,
    x: CANVAS_WIDTH / 2 - SUPPORT_SHIP_WIDTH / 2,
    y: PLAYER_Y + 36,
    targetX: CANVAS_WIDTH / 2 - SUPPORT_SHIP_WIDTH / 2,
    width: SUPPORT_SHIP_WIDTH,
    height: SUPPORT_SHIP_HEIGHT,
    spawnedAt: 0,
    expiresAt: 0,
    nextMoveAt: 0,
    nextShotAt: 0,
  };
}

// Cria o estado inicial completo da partida.
export function createInitialSpaceInvadersRuntime(): SpaceInvadersRuntime {
  return {
    player: {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: PLAYER_Y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      targetX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    },

    invaders: createInvaders(1),
    playerBullets: [],
    enemyBullets: [],
    particles: [],

    score: 0,
    lives: PLAYER_LIVES,
    wave: 1,

    invaderDirection: 1,
    invaderSpeed: 0.42,

    keys: {
      left: false,
      right: false,
      shooting: false,
    },

    laserPower: {
      active: false,
      activatedAt: 0,
      lastUsedAt: -15000,
      x: CANVAS_WIDTH / 2,
    },

    supportPower: {
      lastUsedAt: -10000,
      ship: createInactiveSupportShip(),
    },

    lastPlayerShotAt: 0,
    shake: 0,
  };
}