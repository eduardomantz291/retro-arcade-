// Fábricas de estado do Breakout.
// Montam blocos, poderes e runtime inicial usados pelo hook principal.

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

function chooseTntBrickIndex(totalBricks: number) {
  const safeStart = BRICK_COLUMNS + 1;
  const safeEnd = totalBricks - BRICK_COLUMNS - 2;

  if (safeEnd <= safeStart) {
    return Math.floor(totalBricks / 2);
  }

  return Math.floor(Math.random() * (safeEnd - safeStart + 1)) + safeStart;
}

function getCurseBrickCount(wave: number) {
  if (wave <= 1) {
    return 1;
  }

  if (wave <= 3) {
    return 2;
  }

  if (wave <= 5) {
    return 3;
  }

  return Math.min(6, 3 + Math.floor((wave - 5) / 2));
}

function addCurseBricks(bricks: Brick[], wave: number) {
  const curseCount = getCurseBrickCount(wave);

  const availableIndexes = bricks
    .map((brick, index) => ({ brick, index }))
    .filter(({ brick }) => brick.type === "normal")
    .map(({ index }) => index)
    .sort(() => Math.random() - 0.5);

  for (let index = 0; index < curseCount; index++) {
    const brickIndex = availableIndexes[index];
    const brick = bricks[brickIndex];

    if (!brick) {
      continue;
    }

    bricks[brickIndex] = {
      ...brick,
      type: "curse",
      hits: 1,
      maxHits: 1,
      color: "#2d123f",
      glow: "#ff4757",
    };
  }
}

export function createBricks(wave: number) {
  const brickWidth =
    (CANVAS_WIDTH - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLUMNS - 1)) /
    BRICK_COLUMNS;

  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      const palette = brickColors[row % brickColors.length];

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
        type: "normal",
      });
    }
  }

  const tntIndex = chooseTntBrickIndex(bricks.length);
  const tntBrick = bricks[tntIndex];

  if (tntBrick) {
    bricks[tntIndex] = {
      ...tntBrick,
      type: "tnt",
      hits: 1,
      maxHits: 1,
      color: "#ff3838",
      glow: "#ff6b6b",
    };
  }

  addCurseBricks(bricks, wave);

  return bricks;
}

export function createUltimateBricks() {
  const brickWidth =
    (CANVAS_WIDTH - BRICK_SIDE * 2 - BRICK_GAP * (BRICK_COLUMNS - 1)) /
    BRICK_COLUMNS;

  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      bricks.push({
        x: BRICK_SIDE + column * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: brickWidth,
        height: BRICK_HEIGHT,
        active: true,
        hits: 1,
        maxHits: 1,
        color: "#38ef7d",
        glow: "#38ef7d",
        type: "ultimate",
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
      shrinkStacks: 0,
      ghostUntil: 0,
    },

    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 68,
      vx: 4,
      vy: -4.6,
      radius: BALL_RADIUS,
      speed: 1,
      stuckToPaddle: false,
      bombCharges: 0,
      arrowPierceHits: 0,
    },

    arrowPower: {
      aiming: false,
      lastUsedAt: -Infinity,
    },

    homingPower: {
      active: false,
      activatedAt: 0,
      lastUsedAt: -Infinity,
    },

    shieldPower: {
      active: false,
      activatedAt: 0,
      lastUsedAt: -Infinity,
    },

    ultimatePower: {
      active: false,
      charge: 0,
      activatedAt: 0,
      paddleBounceCombo: 0,
    },

    bricks: createBricks(wave),
    particles: [],
    shockwaves: [],
    powerUps: [],
    ultimateExtraBalls: [],

    score: 0,
    lives: INITIAL_LIVES,
    wave,
    shake: 0,
    lastBombCollectedAt: -Infinity,

    rebuild: {
      active: false,
      startedAt: 0,
      nextBrickIndex: 0,
      releaseAt: 0,
    },
  };
}
