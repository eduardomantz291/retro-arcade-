// Motor de power-ups do Breakout.
// Guarda criação, drops, coleta e queda dos itens para reduzir o hook principal.

import type { MutableRefObject } from "react";
import type { BreakoutAudioController } from "../breakoutAudio";
import {
  BOMB_CHARGES,
  BOMB_DROP_CHANCE,
  BOMB_DROP_COOLDOWN_MS,
  CANVAS_HEIGHT,
  GHOST_DROP_CHANCE,
  GHOST_PADDLE_DURATION_MS,
  HEART_BONUS_POINTS,
  HEART_DROP_CHANCE,
  MAX_LIVES,
  PADDLE_SHRINK_AMOUNT,
  PADDLE_SHRINK_DROP_CHANCE,
  PADDLE_SHRINK_MAX_STACKS,
  PADDLE_WIDTH,
  POWER_UP_FALL_SPEED,
  POWER_UP_RADIUS,
  SKULL_DROP_CHANCE,
} from "../breakoutConfig";
import type { BreakoutRuntime, Brick, FallingPowerUp } from "../breakoutTypes";

type BreakoutPowerUpsEngineContext = {
  runtimeRef: MutableRefObject<BreakoutRuntime>;
  powerUpIdRef: MutableRefObject<number>;
  audioRef: MutableRefObject<BreakoutAudioController | null>;
  setLives: (value: number) => void;
  setScore: (value: number) => void;
  setBombCharges: (value: number) => void;
  clampPaddle: (nextX: number) => number;
  createExplosion: (x: number, y: number, color: string, amount?: number, force?: number) => void;
  createShockwave: (x: number, y: number, color: string, maxRadius: number) => void;
  damagePlayerByHazard: (x: number, y: number, color?: string) => void;
  isShieldBlockingHazards: () => boolean;
  blockBadDropWithShield: (powerUp: FallingPowerUp) => void;
};

export function createBreakoutPowerUpsEngine({
  runtimeRef,
  powerUpIdRef,
  audioRef,
  setLives,
  setScore,
  setBombCharges,
  clampPaddle,
  createExplosion,
  createShockwave,
  damagePlayerByHazard,
  isShieldBlockingHazards,
  blockBadDropWithShield,
}: BreakoutPowerUpsEngineContext) {
  function createPowerUp(
    type: FallingPowerUp["type"],
    x: number,
    y: number
  ): FallingPowerUp {
    powerUpIdRef.current += 1;

    const powerUpData = {
      heart: {
        emoji: "❤️",
        color: "#ff4757",
        glow: "#ff6b81",
        vy: POWER_UP_FALL_SPEED,
      },
      bomb: {
        emoji: "💣",
        color: "#f1c40f",
        glow: "#ff9f1a",
        vy: POWER_UP_FALL_SPEED,
      },
      skull: {
        emoji: "☠️",
        color: "#2d123f",
        glow: "#ff4757",
        vy: POWER_UP_FALL_SPEED + 0.25,
      },
      shrink: {
        emoji: "🔻",
        color: "#ff9f1a",
        glow: "#f1c40f",
        vy: POWER_UP_FALL_SPEED + 0.1,
      },
      ghost: {
        emoji: "👻",
        color: "#9b59b6",
        glow: "#be2edd",
        vy: POWER_UP_FALL_SPEED + 0.15,
      },
    } satisfies Record<
      FallingPowerUp["type"],
      {
        emoji: string;
        color: string;
        glow: string;
        vy: number;
      }
    >;

    return {
      id: powerUpIdRef.current,
      type,
      x,
      y,
      vy: powerUpData[type].vy,
      radius: POWER_UP_RADIUS,
      emoji: powerUpData[type].emoji,
      color: powerUpData[type].color,
      glow: powerUpData[type].glow,
      active: true,
    };
  }

  function createHeartPowerUp(x: number, y: number) {
    return createPowerUp("heart", x, y);
  }

  function createBombPowerUp(x: number, y: number) {
    return createPowerUp("bomb", x, y);
  }

  function createSkullPowerUp(x: number, y: number) {
    return createPowerUp("skull", x, y);
  }

  function createShrinkPowerUp(x: number, y: number) {
    return createPowerUp("shrink", x, y);
  }

  function createGhostPowerUp(x: number, y: number) {
    return createPowerUp("ghost", x, y);
  }

  function tryDropHeartFromBrick(brick: Brick) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    if (brick.type !== "normal") {
      return;
    }

    if (Math.random() > HEART_DROP_CHANCE) {
      return;
    }

    runtime.powerUps.push(
      createHeartPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2)
    );
  }

  function tryDropBadPowerUpFromBrick(brick: Brick) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    if (brick.type !== "normal") {
      return;
    }

    const roll = Math.random();

    if (roll < GHOST_DROP_CHANCE) {
      runtime.powerUps.push(
        createGhostPowerUp(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2
        )
      );

      return;
    }

    if (roll < GHOST_DROP_CHANCE + PADDLE_SHRINK_DROP_CHANCE) {
      runtime.powerUps.push(
        createShrinkPowerUp(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2
        )
      );
    }
  }

  function tryDropSkullFromCurseBrick(brick: Brick) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    if (brick.type !== "curse") {
      return;
    }

    if (Math.random() > SKULL_DROP_CHANCE) {
      return;
    }

    runtime.powerUps.push(
      createSkullPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2)
    );
  }

  function tryDropBombFromBrick(brick: Brick) {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (runtime.ultimatePower.active) {
      return;
    }

    if (brick.type !== "normal") {
      return;
    }

    const isHardBrick = brick.maxHits > 1;
    const hasBombPowerActive = runtime.ball.bombCharges > 0;

    const hasFallingBomb = runtime.powerUps.some((powerUp) => {
      return powerUp.type === "bomb";
    });

    const isBombOnCooldown =
      now - runtime.lastBombCollectedAt < BOMB_DROP_COOLDOWN_MS;

    if (!isHardBrick || hasBombPowerActive || hasFallingBomb || isBombOnCooldown) {
      return;
    }

    if (Math.random() > BOMB_DROP_CHANCE) {
      return;
    }

    runtime.powerUps.push(
      createBombPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2)
    );
  }

  function collectHeartPowerUp(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    powerUp.active = false;

    audioRef.current?.play("heartPickup");

    if (runtime.lives < MAX_LIVES) {
      runtime.lives += 1;
      setLives(runtime.lives);

      createExplosion(powerUp.x, powerUp.y, "#ff6b81");
      return;
    }

    runtime.score += HEART_BONUS_POINTS;
    setScore(runtime.score);

    createExplosion(powerUp.x, powerUp.y, "#f1c40f");
  }

  function collectBombPowerUp(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    powerUp.active = false;

    audioRef.current?.play("bombExplosion");

    runtime.ball.bombCharges = BOMB_CHARGES;
    runtime.lastBombCollectedAt = performance.now();

    setBombCharges(runtime.ball.bombCharges);

    createExplosion(powerUp.x, powerUp.y, "#ff9f1a", 18, 7);
    createShockwave(powerUp.x, powerUp.y, "#f1c40f", 44);
  }

  function collectSkullPowerUp(powerUp: FallingPowerUp) {
    powerUp.active = false;

    if (isShieldBlockingHazards()) {
      blockBadDropWithShield(powerUp);
      return;
    }

    audioRef.current?.play("debuffHit");

    damagePlayerByHazard(powerUp.x, powerUp.y, "#ff4757");
  }

  function collectShrinkPowerUp(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

    powerUp.active = false;

    if (runtime.ultimatePower.active) {
      return;
    }

    if (isShieldBlockingHazards()) {
      blockBadDropWithShield(powerUp);
      return;
    }

    audioRef.current?.play("debuffHit");

    const currentCenter = runtime.paddle.x + runtime.paddle.width / 2;

    runtime.paddle.shrinkStacks = Math.min(
      PADDLE_SHRINK_MAX_STACKS,
      runtime.paddle.shrinkStacks + 1
    );

    runtime.paddle.width =
      PADDLE_WIDTH - runtime.paddle.shrinkStacks * PADDLE_SHRINK_AMOUNT;

    runtime.paddle.x = clampPaddle(currentCenter - runtime.paddle.width / 2);
    runtime.paddle.targetX = runtime.paddle.x;

    runtime.shake = 9;

    createExplosion(powerUp.x, powerUp.y, "#ff9f1a", 18, 7);
    createShockwave(powerUp.x, powerUp.y, "#ff9f1a", 38);
  }

  function collectGhostPowerUp(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

    powerUp.active = false;

    if (runtime.ultimatePower.active) {
      return;
    }

    if (isShieldBlockingHazards()) {
      blockBadDropWithShield(powerUp);
      return;
    }

    audioRef.current?.play("debuffHit");

    runtime.paddle.ghostUntil = performance.now() + GHOST_PADDLE_DURATION_MS;
    runtime.shake = 10;

    createExplosion(powerUp.x, powerUp.y, "#9b59b6", 20, 7);
    createShockwave(powerUp.x, powerUp.y, "#9b59b6", 44);
  }

  function collectPowerUp(powerUp: FallingPowerUp) {
    if (powerUp.type === "heart") {
      collectHeartPowerUp(powerUp);
      return;
    }

    if (powerUp.type === "bomb") {
      collectBombPowerUp(powerUp);
      return;
    }

    if (powerUp.type === "skull") {
      collectSkullPowerUp(powerUp);
      return;
    }

    if (powerUp.type === "shrink") {
      collectShrinkPowerUp(powerUp);
      return;
    }

    if (powerUp.type === "ghost") {
      collectGhostPowerUp(powerUp);
    }
  }

  function updatePowerUps() {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      runtime.powerUps = [];
      return;
    }

    const { paddle } = runtime;

    for (let index = runtime.powerUps.length - 1; index >= 0; index--) {
      const powerUp = runtime.powerUps[index];

      powerUp.y += powerUp.vy;

      const isTouchingPaddle =
        powerUp.y + powerUp.radius >= paddle.y &&
        powerUp.y - powerUp.radius <= paddle.y + paddle.height &&
        powerUp.x + powerUp.radius >= paddle.x &&
        powerUp.x - powerUp.radius <= paddle.x + paddle.width;

      if (isTouchingPaddle) {
        collectPowerUp(powerUp);
        runtime.powerUps.splice(index, 1);
        continue;
      }

      if (powerUp.y - powerUp.radius > CANVAS_HEIGHT) {
        runtime.powerUps.splice(index, 1);
      }
    }
  }


  return {
    tryDropBadPowerUpFromBrick,
    tryDropBombFromBrick,
    tryDropHeartFromBrick,
    tryDropSkullFromCurseBrick,
    updatePowerUps,
  };
}

export type BreakoutPowerUpsEngine = ReturnType<
  typeof createBreakoutPowerUpsEngine
>;
