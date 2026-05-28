// Motor de blocos do Breakout.
// Reúne reconstrução de ondas, dano em tijolos, TNT, bomba, flecha e ultimate.

import type { MutableRefObject } from "react";
import type { BreakoutAudioController } from "../breakoutAudio";
import {
  BOMB_EXPLOSION_BRICK_POINTS,
  BOMB_EXPLOSION_RADIUS,
  BRICK_REBUILD_INTERVAL,
  BRICK_REBUILD_RELEASE_DELAY,
  TNT_BRICK_POINTS,
  TNT_EXPLOSION_BRICK_POINTS,
  TNT_EXPLOSION_RADIUS,
  ULTIMATE_EXTRA_BALL_POINTS,
  ULTIMATE_GREEN_BRICK_POINTS,
} from "../breakoutConfig";
import { createBricks, createUltimateBricks } from "../breakoutFactory";
import type { BreakoutRuntime, Brick, UltimateExtraBall } from "../breakoutTypes";
import { getBrickCenter } from "./breakoutUtils";
import type { BreakoutPowerUpsEngine } from "./breakoutPowerUpsEngine";

type BreakoutBrickEngineContext = {
  runtimeRef: MutableRefObject<BreakoutRuntime>;
  audioRef: MutableRefObject<BreakoutAudioController | null>;
  powerUpEngine: BreakoutPowerUpsEngine;
  setScore: (value: number) => void;
  setBombCharges: (value: number) => void;
  addUltimateCharge: () => void;
  createExplosion: (x: number, y: number, color: string, amount?: number, force?: number) => void;
  createShockwave: (x: number, y: number, color: string, maxRadius: number) => void;
  forceUltimateBallSpeed: () => void;
  keepBallOnPaddle: () => void;
  releaseBallFromPaddle: () => void;
  syncArrowPowerState: () => void;
  syncHomingPowerState: () => void;
  syncShieldPowerState: () => void;
  syncUltimatePowerState: () => void;
};

export function createBreakoutBrickEngine({
  runtimeRef,
  audioRef,
  powerUpEngine,
  setScore,
  setBombCharges,
  addUltimateCharge,
  createExplosion,
  createShockwave,
  forceUltimateBallSpeed,
  keepBallOnPaddle,
  releaseBallFromPaddle,
  syncArrowPowerState,
  syncHomingPowerState,
  syncShieldPowerState,
  syncUltimatePowerState,
}: BreakoutBrickEngineContext) {
  function beginBrickRebuild() {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      runtime.bricks = createUltimateBricks();
      createExplosion(runtime.ball.x, runtime.ball.y, "#38ef7d", 18, 6);
      return;
    }

    runtime.wave += 1;
    runtime.bricks = createBricks(runtime.wave).map((brick) => ({
      ...brick,
      active: false,
      spawnedAt: undefined,
    }));

    runtime.powerUps = [];
    runtime.arrowPower.aiming = false;

    runtime.rebuild = {
      active: true,
      startedAt: performance.now(),
      nextBrickIndex: 0,
      releaseAt: 0,
    };

    runtime.shake = 10;
    runtime.ball.stuckToPaddle = true;

    keepBallOnPaddle();
    syncArrowPowerState();
    syncHomingPowerState();
    syncShieldPowerState();
    syncUltimatePowerState();
  }

  function updateBrickRebuild() {
    const runtime = runtimeRef.current;

    if (!runtime.rebuild.active) {
      return;
    }

    const now = performance.now();
    const elapsed = now - runtime.rebuild.startedAt;

    const targetBrickIndex = Math.min(
      runtime.bricks.length,
      Math.floor(elapsed / BRICK_REBUILD_INTERVAL) + 1
    );

    while (runtime.rebuild.nextBrickIndex < targetBrickIndex) {
      const brick = runtime.bricks[runtime.rebuild.nextBrickIndex];

      if (brick) {
        brick.active = true;
        brick.spawnedAt = now;
      }

      runtime.rebuild.nextBrickIndex += 1;
    }

    const allBricksSpawned =
      runtime.rebuild.nextBrickIndex >= runtime.bricks.length;

    if (!allBricksSpawned) {
      return;
    }

    if (runtime.rebuild.releaseAt === 0) {
      runtime.rebuild.releaseAt = now + BRICK_REBUILD_RELEASE_DELAY;
      return;
    }

    if (now >= runtime.rebuild.releaseAt) {
      runtime.rebuild.active = false;
      runtime.rebuild.releaseAt = 0;
      releaseBallFromPaddle();
    }
  }

  function checkIfScreenWasCleared() {
    const runtime = runtimeRef.current;

    const hasActiveBricks = runtime.bricks.some((currentBrick) => {
      return currentBrick.active;
    });

    if (!hasActiveBricks) {
      beginBrickRebuild();
    }
  }

  function destroyNormalBrickByExplosion(
    brick: Brick,
    points: number,
    allowBombDrop: boolean
  ) {
    const runtime = runtimeRef.current;
    const brickCenter = getBrickCenter(brick);

    if (brick.type === "curse") {
      destroyCurseBrick(brick);
      return;
    }

    brick.active = false;
    brick.hits = 0;

    audioRef.current?.play("brickBreak");

    runtime.score += points;

    addUltimateCharge();

    createExplosion(brickCenter.x, brickCenter.y, brick.glow, 12, 6);

    powerUpEngine.tryDropHeartFromBrick(brick);
    powerUpEngine.tryDropBadPowerUpFromBrick(brick);

    if (allowBombDrop) {
      powerUpEngine.tryDropBombFromBrick(brick);
    }
  }

  function destroyCurseBrick(brick: Brick) {
    const runtime = runtimeRef.current;
    const brickCenter = getBrickCenter(brick);

    brick.active = false;
    brick.hits = 0;

    audioRef.current?.play("brickBreak");

    runtime.score += 20;
    runtime.shake = 8;

    addUltimateCharge();

    createExplosion(brickCenter.x, brickCenter.y, "#ff4757", 16, 7);
    createShockwave(brickCenter.x, brickCenter.y, "#ff4757", 36);

    powerUpEngine.tryDropSkullFromCurseBrick(brick);

    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function explodeTntBrick(tntBrick: Brick) {
    const runtime = runtimeRef.current;
    const tntCenter = getBrickCenter(tntBrick);

    tntBrick.active = false;

    audioRef.current?.play("tntExplosion");

    runtime.score += TNT_BRICK_POINTS;
    runtime.shake = 18;

    addUltimateCharge();

    createShockwave(tntCenter.x, tntCenter.y, "#ff6b6b", TNT_EXPLOSION_RADIUS);
    createExplosion(tntCenter.x, tntCenter.y, "#ff4757", 34, 10);
    createExplosion(tntCenter.x, tntCenter.y, "#f1c40f", 20, 8);

    for (const brick of runtime.bricks) {
      if (!brick.active || brick === tntBrick) {
        continue;
      }

      const brickCenter = getBrickCenter(brick);
      const distance = Math.hypot(
        brickCenter.x - tntCenter.x,
        brickCenter.y - tntCenter.y
      );

      if (distance > TNT_EXPLOSION_RADIUS) {
        continue;
      }

      if (brick.type === "curse") {
        destroyCurseBrick(brick);
        continue;
      }

      destroyNormalBrickByExplosion(brick, TNT_EXPLOSION_BRICK_POINTS, true);
    }

    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function explodeBombBallImpact(hitBrickTarget: Brick) {
    const runtime = runtimeRef.current;
    const impactCenter = getBrickCenter(hitBrickTarget);

    audioRef.current?.play("bombExplosion");

    runtime.shake = 12;

    createShockwave(
      impactCenter.x,
      impactCenter.y,
      "#ff9f1a",
      BOMB_EXPLOSION_RADIUS
    );

    createExplosion(impactCenter.x, impactCenter.y, "#ff9f1a", 24, 8);
    createExplosion(impactCenter.x, impactCenter.y, "#f1c40f", 12, 7);

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const brickCenter = getBrickCenter(brick);
      const distance = Math.hypot(
        brickCenter.x - impactCenter.x,
        brickCenter.y - impactCenter.y
      );

      if (distance > BOMB_EXPLOSION_RADIUS) {
        continue;
      }

      if (brick.type === "tnt") {
        explodeTntBrick(brick);
        continue;
      }

      if (brick.type === "curse") {
        destroyCurseBrick(brick);
        continue;
      }

      destroyNormalBrickByExplosion(
        brick,
        BOMB_EXPLOSION_BRICK_POINTS,
        false
      );
    }

    runtime.ball.bombCharges = Math.max(0, runtime.ball.bombCharges - 1);
    setBombCharges(runtime.ball.bombCharges);

    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function destroyBrickByArrowShot(brick: Brick) {
    const runtime = runtimeRef.current;
    const brickCenter = getBrickCenter(brick);

    if (brick.type === "tnt") {
      explodeTntBrick(brick);
    } else if (brick.type === "curse") {
      destroyCurseBrick(brick);
    } else {
      brick.active = false;
      brick.hits = 0;

      audioRef.current?.play("brickBreak");

      runtime.score += 25;

      addUltimateCharge();

      createExplosion(brickCenter.x, brickCenter.y, "#4facfe", 16, 7);
      powerUpEngine.tryDropHeartFromBrick(brick);
      powerUpEngine.tryDropBadPowerUpFromBrick(brick);
      powerUpEngine.tryDropBombFromBrick(brick);
    }

    runtime.ball.arrowPierceHits = Math.max(
      0,
      runtime.ball.arrowPierceHits - 1
    );

    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function destroyUltimateBrick(brick: Brick, points: number) {
    const runtime = runtimeRef.current;
    const brickCenter = getBrickCenter(brick);

    brick.active = false;
    brick.hits = 0;

    audioRef.current?.play("brickBreak");

    runtime.score += points;

    createExplosion(brickCenter.x, brickCenter.y, "#38ef7d", 14, 7);
    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function hitBrick(brick: Brick) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active || brick.type === "ultimate") {
      destroyUltimateBrick(brick, ULTIMATE_GREEN_BRICK_POINTS);
      forceUltimateBallSpeed();
      return;
    }

    if (runtime.ball.bombCharges > 0) {
      explodeBombBallImpact(brick);

      if (runtime.ball.arrowPierceHits > 0) {
        runtime.ball.arrowPierceHits = Math.max(
          0,
          runtime.ball.arrowPierceHits - 1
        );

        runtime.ball.speed = Math.min(runtime.ball.speed + 0.02, 1.55);
        return;
      }

      runtime.ball.vy *= -1;
      runtime.ball.speed = Math.min(runtime.ball.speed + 0.04, 1.5);

      return;
    }

    if (runtime.ball.arrowPierceHits > 0) {
      destroyBrickByArrowShot(brick);

      runtime.ball.speed = Math.min(runtime.ball.speed + 0.015, 1.55);
      return;
    }

    if (brick.type === "tnt") {
      explodeTntBrick(brick);

      runtime.ball.vy *= -1;
      runtime.ball.speed = Math.min(runtime.ball.speed + 0.035, 1.45);

      return;
    }

    if (brick.type === "curse") {
      destroyCurseBrick(brick);

      runtime.ball.vy *= -1;
      runtime.ball.speed = Math.min(runtime.ball.speed + 0.035, 1.45);

      return;
    }

    brick.hits -= 1;

    runtime.score += 10;
    runtime.shake = 4;

    createExplosion(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      brick.glow
    );

    if (brick.hits <= 0) {
      brick.active = false;
      runtime.score += 15;

      audioRef.current?.play("brickBreak");

      addUltimateCharge();

      powerUpEngine.tryDropHeartFromBrick(brick);
      powerUpEngine.tryDropBadPowerUpFromBrick(brick);
      powerUpEngine.tryDropBombFromBrick(brick);
    }

    runtime.ball.vy *= -1;
    runtime.ball.speed = Math.min(runtime.ball.speed + 0.025, 1.45);

    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function hitBrickWithUltimateExtraBall(
    brick: Brick,
    extraBall: UltimateExtraBall
  ) {
    if (brick.type !== "ultimate") {
      extraBall.vy *= -1;
      return;
    }

    destroyUltimateBrick(brick, ULTIMATE_EXTRA_BALL_POINTS);
    extraBall.vy *= -1;
  }


  return {
    beginBrickRebuild,
    hitBrick,
    hitBrickWithUltimateExtraBall,
    updateBrickRebuild,
  };
}
