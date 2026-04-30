import {
  BALL_RADIUS,
  BRICK_COLUMNS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_ROWS,
  BRICK_SIDE,
  BRICK_TOP,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_LIVES,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  brickColors,
} from "./breakoutConfig";
import type { BreakoutRuntime, Brick } from "./breakoutTypes";

export function createBricks(wave: number) {
  const brickWidth =
    (CANVAS_WIDTH - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLUMNS - 1)) /
    BRICK_COLUMNS;

  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      const palette = brickColors[row % brickColors.length];

      // Conforme o jogo continua, os blocos superiores ficam mais resistentes.
      const hasExtraLife = wave >= 2 && row <= Math.min(2, wave - 1);
      const maxHits = hasExtraLife ? 2 : 1;

      bricks.push({
        x: BRICK_SIDE + column * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: brickWidth,
        height: BRICK_HEIGHT,
        active: true,
        hits: maxHits,
        maxHits,
        color: palette.color,
        glow: palette.glow,
      });
    }
  }

  return bricks;
}

export function createInitialRuntime(wave = 1): BreakoutRuntime {
  return {
    paddle: {
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 42,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      targetX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    },

    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 68,
      vx: 4,
      vy: -4.6,
      radius: BALL_RADIUS,
      speed: 1,
      stuckToPaddle: false,
    },

    bricks: createBricks(wave),
    particles: [],
    powerUps: [],

    score: 0,
    lives: INITIAL_LIVES,
    wave,
    shake: 0,

    rebuild: {
      active: false,
      startedAt: 0,
      nextBrickIndex: 0,
      releaseAt: 0,
    },
  };
}