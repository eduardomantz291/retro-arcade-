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
} from "./spaceInvadersConfig";
import type { Invader, SpaceInvadersRuntime } from "./spaceInvadersTypes";

// Cria a formação inicial dos inimigos.
// Por enquanto eles são feitos só com formas geométricas no canvas.
export function createInvaders(wave = 1): Invader[] {
  const invaders: Invader[] = [];
  let id = 0;

  for (let row = 0; row < INVADER_ROWS; row++) {
    for (let column = 0; column < INVADER_COLUMNS; column++) {
      id += 1;

      const variant = row % 3 === 0 ? "square" : row % 3 === 1 ? "circle" : "triangle";

      invaders.push({
        id,
        x: INVADER_START_X + column * (INVADER_WIDTH + INVADER_GAP_X),
        y: INVADER_START_Y + row * (INVADER_HEIGHT + INVADER_GAP_Y),
        width: INVADER_WIDTH,
        height: INVADER_HEIGHT,
        active: true,
        variant,
      });
    }
  }

  return invaders.map((invader) => ({
    ...invader,
    y: invader.y + Math.min(wave - 1, 4) * 8,
  }));
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
    invaderSpeed: 0.85,

    keys: {
      left: false,
      right: false,
      shooting: false,
    },

    lastPlayerShotAt: 0,
    shake: 0,
  };
}