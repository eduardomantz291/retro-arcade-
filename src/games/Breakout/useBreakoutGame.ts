// Hook principal do Breakout.
// Concentra loop do canvas, colisões, poderes, áudio e estado da partida.

import { useEffect, useRef, useState } from "react";
import {
  ARROW_AIM_SIDE_PADDING,
  ARROW_AIM_TOP_PADDING,
  ARROW_POWER_COOLDOWN_MS,
  ARROW_POWER_MAX_HORIZONTAL_FORCE,
  ARROW_POWER_PIERCE_HITS,
  ARROW_POWER_SHOT_SPEED,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HOMING_ARROW_COMBO_MAX_TURN,
  HOMING_ARROW_COMBO_STRENGTH,
  HOMING_END_BOOST_SPEED,
  HOMING_MIN_BALL_SPEED,
  HOMING_POWER_COOLDOWN_MS,
  HOMING_POWER_DURATION_MS,
  HOMING_POWER_MAX_TURN,
  HOMING_POWER_STRENGTH,
  INITIAL_LIVES,
  MAX_LIVES,
  SHIELD_POWER_COOLDOWN_MS,
  SHIELD_POWER_DURATION_MS,
  TNT_BRICK_POINTS,
  ULTIMATE_DURATION_MS,
  ULTIMATE_EXTRA_BALL_MAX,
  ULTIMATE_FIXED_BALL_SPEED,
  ULTIMATE_MAX_CHARGE,
  ULTIMATE_REQUIRED_BRICKS,
} from "./breakoutConfig";
import {
  createBricks,
  createInitialRuntime,
  createUltimateBricks,
} from "./breakoutFactory";
import {
  createBreakoutAudioController,
  type BreakoutAudioController,
} from "./breakoutAudio";
import {
  formatSurvivalTime,
  formatUltimateTime,
  getBrickCenter,
} from "./engine/breakoutUtils";
import { createBreakoutBrickEngine } from "./engine/breakoutBrickEngine";
import { drawBreakoutRuntime } from "./engine/breakoutCanvasRenderer";
import { createBreakoutPowerUpsEngine } from "./engine/breakoutPowerUpsEngine";
import type {
  BreakoutRuntime,
  BreakoutScreenState,
  Brick,
  FallingPowerUp,
} from "./breakoutTypes";

export function useBreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<BreakoutRuntime>(createInitialRuntime());
  const screenStateRef = useRef<BreakoutScreenState>("start");
  const audioRef = useRef<BreakoutAudioController | null>(null);

  const powerUpIdRef = useRef(0);
  const ultimateExtraBallIdRef = useRef(0);
  const gameStartedAtRef = useRef(0);
  const pausedAtRef = useRef(0);

  const [screenState, setScreenState] =
    useState<BreakoutScreenState>("start");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bombCharges, setBombCharges] = useState(0);

  const [isArrowAiming, setIsArrowAiming] = useState(false);
  const [isArrowReady, setIsArrowReady] = useState(true);
  const [arrowCooldownProgress, setArrowCooldownProgress] = useState(1);

  const [isHomingActive, setIsHomingActive] = useState(false);
  const [isHomingReady, setIsHomingReady] = useState(true);
  const [homingCooldownProgress, setHomingCooldownProgress] = useState(1);

  const [isShieldActive, setIsShieldActive] = useState(false);
  const [isShieldReady, setIsShieldReady] = useState(true);
  const [shieldCooldownProgress, setShieldCooldownProgress] = useState(1);

  const [isUltimateActive, setIsUltimateActive] = useState(false);
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [ultimateTimeLabel, setUltimateTimeLabel] = useState("60s");

  const isUltimateReady = ultimateCharge >= ULTIMATE_MAX_CHARGE;

  useEffect(() => {
    audioRef.current = createBreakoutAudioController();
    audioRef.current.startMenuTheme();

    drawGame();

    function handleKeyDown(event: KeyboardEvent) {
      if (screenStateRef.current !== "playing") {
        return;
      }

      const runtime = runtimeRef.current;

      if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        handleArrowPowerAction();
        return;
      }

      if (event.key.toLowerCase() === "w") {
        event.preventDefault();
        handleHomingPowerAction();
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        handleShieldPowerAction();
        return;
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        handleUltimatePowerAction();
        return;
      }

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        runtime.paddle.targetX -= 54;
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        runtime.paddle.targetX += 54;
      }

      runtime.paddle.targetX = clampPaddle(runtime.paddle.targetX);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      audioRef.current?.destroy();
      audioRef.current = null;

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function setGameScreen(nextScreen: BreakoutScreenState) {
    screenStateRef.current = nextScreen;
    setScreenState(nextScreen);
  }

  function clampPaddle(nextX: number) {
    const runtime = runtimeRef.current;

    return Math.max(0, Math.min(CANVAS_WIDTH - runtime.paddle.width, nextX));
  }

  function getUltimateChargePercent() {
    const runtime = runtimeRef.current;

    return Math.min(
      ULTIMATE_MAX_CHARGE,
      Math.floor((runtime.ultimatePower.charge / ULTIMATE_REQUIRED_BRICKS) * 100)
    );
  }

  function syncStateFromRuntime() {
    const runtime = runtimeRef.current;

    setScore(runtime.score);
    setLives(runtime.lives);
    setBombCharges(runtime.ball.bombCharges);
    setUltimateCharge(getUltimateChargePercent());

    syncArrowPowerState();
    syncHomingPowerState();
    syncShieldPowerState();
    syncUltimatePowerState();
  }

  function updateElapsedTime() {
    if (gameStartedAtRef.current <= 0) {
      return;
    }

    const nextElapsedSeconds = Math.floor(
      (performance.now() - gameStartedAtRef.current) / 1000
    );

    setElapsedSeconds(nextElapsedSeconds);
  }

  function addUltimateCharge(amount = 1) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    runtime.ultimatePower.charge = Math.min(
      ULTIMATE_REQUIRED_BRICKS,
      runtime.ultimatePower.charge + amount
    );

    setUltimateCharge(getUltimateChargePercent());
  }

  function setBallVectorSpeed(targetSpeed: number) {
    const runtime = runtimeRef.current;
    const currentVelocity = Math.hypot(runtime.ball.vx, runtime.ball.vy);

    if (currentVelocity <= 0) {
      runtime.ball.vx = 4;
      runtime.ball.vy = -targetSpeed;
      return;
    }

    runtime.ball.vx = (runtime.ball.vx / currentVelocity) * targetSpeed;
    runtime.ball.vy = (runtime.ball.vy / currentVelocity) * targetSpeed;
  }

  function forceUltimateBallSpeed() {
    const runtime = runtimeRef.current;

    runtime.ball.speed = 1;
    setBallVectorSpeed(ULTIMATE_FIXED_BALL_SPEED);
  }

  function boostBallAfterHomingEnds() {
    const runtime = runtimeRef.current;

    if (runtime.ball.stuckToPaddle) {
      return;
    }

    if (runtime.ultimatePower.active) {
      return;
    }

    const currentVelocity = Math.hypot(runtime.ball.vx, runtime.ball.vy);

    if (currentVelocity >= HOMING_END_BOOST_SPEED) {
      return;
    }

    setBallVectorSpeed(HOMING_END_BOOST_SPEED);

    createExplosion(runtime.ball.x, runtime.ball.y, "#9b59b6", 12, 5);
  }

  function isShieldBlockingHazards() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    return (
      runtime.shieldPower.active &&
      now - runtime.shieldPower.activatedAt < SHIELD_POWER_DURATION_MS &&
      !runtime.ultimatePower.active
    );
  }

  function blockBadDropWithShield(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

    powerUp.active = false;
    runtime.shake = 5;

    audioRef.current?.play("shieldActivate");

    createExplosion(powerUp.x, powerUp.y, "#4facfe", 18, 7);
    createShockwave(powerUp.x, powerUp.y, "#4facfe", 42);
  }

  function syncArrowPowerState() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (runtime.ultimatePower.active) {
      runtime.arrowPower.aiming = false;

      setIsArrowAiming(false);
      setIsArrowReady(false);
      setArrowCooldownProgress(0);
      return;
    }

    if (runtime.arrowPower.aiming) {
      setIsArrowAiming(true);
      setIsArrowReady(false);
      setArrowCooldownProgress(1);
      return;
    }

    const elapsedCooldown = now - runtime.arrowPower.lastUsedAt;
    const progress = Math.min(
      1,
      Math.max(0, elapsedCooldown / ARROW_POWER_COOLDOWN_MS)
    );

    setIsArrowAiming(false);
    setIsArrowReady(progress >= 1);
    setArrowCooldownProgress(progress);
  }

  function syncHomingPowerState() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (runtime.ultimatePower.active) {
      runtime.homingPower.active = false;

      setIsHomingActive(false);
      setIsHomingReady(false);
      setHomingCooldownProgress(0);
      return;
    }

    if (runtime.homingPower.active) {
      const activeElapsed = now - runtime.homingPower.activatedAt;

      if (activeElapsed >= HOMING_POWER_DURATION_MS) {
        runtime.homingPower.active = false;
        boostBallAfterHomingEnds();
      }
    }

    if (runtime.homingPower.active) {
      setIsHomingActive(true);
      setIsHomingReady(false);
      setHomingCooldownProgress(1);
      return;
    }

    const elapsedCooldown = now - runtime.homingPower.lastUsedAt;
    const progress = Math.min(
      1,
      Math.max(0, elapsedCooldown / HOMING_POWER_COOLDOWN_MS)
    );

    setIsHomingActive(false);
    setIsHomingReady(progress >= 1);
    setHomingCooldownProgress(progress);
  }

  function syncShieldPowerState() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (runtime.ultimatePower.active) {
      runtime.shieldPower.active = false;

      setIsShieldActive(false);
      setIsShieldReady(false);
      setShieldCooldownProgress(0);
      return;
    }

    if (runtime.shieldPower.active) {
      const activeElapsed = now - runtime.shieldPower.activatedAt;

      if (activeElapsed >= SHIELD_POWER_DURATION_MS) {
        runtime.shieldPower.active = false;
      }
    }

    if (runtime.shieldPower.active) {
      setIsShieldActive(true);
      setIsShieldReady(false);
      setShieldCooldownProgress(1);
      return;
    }

    const elapsedCooldown = now - runtime.shieldPower.lastUsedAt;
    const progress = Math.min(
      1,
      Math.max(0, elapsedCooldown / SHIELD_POWER_COOLDOWN_MS)
    );

    setIsShieldActive(false);
    setIsShieldReady(progress >= 1);
    setShieldCooldownProgress(progress);
  }

  function syncUltimatePowerState() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (!runtime.ultimatePower.active) {
      setIsUltimateActive(false);
      setUltimateTimeLabel("60s");
      setUltimateCharge(getUltimateChargePercent());
      return;
    }

    const elapsed = now - runtime.ultimatePower.activatedAt;
    const remaining = ULTIMATE_DURATION_MS - elapsed;

    if (remaining <= 0) {
      finishUltimatePower();
      return;
    }

    forceUltimateBallSpeed();

    setIsUltimateActive(true);
    setUltimateTimeLabel(formatUltimateTime(remaining));
    setUltimateCharge(ULTIMATE_MAX_CHARGE);
  }

  function keepBallOnPaddle() {
    const runtime = runtimeRef.current;

    runtime.ball.x = runtime.paddle.x + runtime.paddle.width / 2;
    runtime.ball.y = runtime.paddle.y - runtime.ball.radius - 1;
  }

  function resetBall(stuckToPaddle = false) {
    const runtime = runtimeRef.current;

    runtime.ball.x = runtime.paddle.x + runtime.paddle.width / 2;
    runtime.ball.y = runtime.paddle.y - runtime.ball.radius - 1;
    runtime.ball.vx = Math.random() > 0.5 ? 4 : -4;
    runtime.ball.vy = -4.6;
    runtime.ball.speed = 1;
    runtime.ball.stuckToPaddle = stuckToPaddle;
    runtime.ball.arrowPierceHits = 0;
  }

  function releaseBallFromPaddle() {
    const runtime = runtimeRef.current;

    runtime.ball.stuckToPaddle = false;
    runtime.ball.vx = Math.random() > 0.5 ? 4 : -4;
    runtime.ball.vy = -4.8;
    runtime.ball.speed = Math.min(1 + runtime.wave * 0.025, 1.22);

    createExplosion(runtime.ball.x, runtime.ball.y, "#4facfe");
  }

  function getArrowShotVelocity() {
    const runtime = runtimeRef.current;
    const paddleCenter = runtime.paddle.x + runtime.paddle.width / 2;

    const paddleProgress = paddleCenter / CANVAS_WIDTH;
    const invertedProgress = 1 - paddleProgress;

    const targetX =
      ARROW_AIM_SIDE_PADDING +
      invertedProgress * (CANVAS_WIDTH - ARROW_AIM_SIDE_PADDING * 2);

    const targetY = ARROW_AIM_TOP_PADDING;

    const directionX = targetX - runtime.ball.x;
    const directionY = targetY - runtime.ball.y;
    const directionLength = Math.max(1, Math.hypot(directionX, directionY));

    return {
      vx: (directionX / directionLength) * ARROW_POWER_SHOT_SPEED,
      vy: (directionY / directionLength) * ARROW_POWER_SHOT_SPEED,
    };
  }

  function activateArrowAim() {
    const runtime = runtimeRef.current;

    runtime.arrowPower.aiming = true;
    runtime.arrowPower.lastUsedAt = performance.now();
    runtime.ball.stuckToPaddle = true;

    keepBallOnPaddle();

    audioRef.current?.play("arrowActivate");

    createExplosion(runtime.ball.x, runtime.ball.y, "#4facfe", 16, 5);
    syncArrowPowerState();
  }

  function launchArrowShot() {
    const runtime = runtimeRef.current;
    const shotVelocity = getArrowShotVelocity();

    runtime.arrowPower.aiming = false;
    runtime.ball.stuckToPaddle = false;
    runtime.ball.vx = shotVelocity.vx;
    runtime.ball.vy = shotVelocity.vy;
    runtime.ball.speed = 1;
    runtime.ball.arrowPierceHits = ARROW_POWER_PIERCE_HITS;

    audioRef.current?.play("arrowActivate");

    createExplosion(runtime.ball.x, runtime.ball.y, "#4facfe", 26, 8);
    createShockwave(runtime.ball.x, runtime.ball.y, "#4facfe", 48);

    syncArrowPowerState();
  }

  function handleArrowPowerAction() {
    const runtime = runtimeRef.current;

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.rebuild.active || runtime.ultimatePower.active) {
      return;
    }

    if (runtime.arrowPower.aiming) {
      launchArrowShot();
      return;
    }

    const now = performance.now();
    const isCooldownReady =
      now - runtime.arrowPower.lastUsedAt >= ARROW_POWER_COOLDOWN_MS;

    if (!isCooldownReady) {
      syncArrowPowerState();
      return;
    }

    activateArrowAim();
  }

  function handleHomingPowerAction() {
    const runtime = runtimeRef.current;

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.rebuild.active || runtime.ultimatePower.active) {
      return;
    }

    if (runtime.homingPower.active) {
      return;
    }

    const now = performance.now();
    const isCooldownReady =
      now - runtime.homingPower.lastUsedAt >= HOMING_POWER_COOLDOWN_MS;

    if (!isCooldownReady) {
      syncHomingPowerState();
      return;
    }

    runtime.homingPower.active = true;
    runtime.homingPower.activatedAt = now;
    runtime.homingPower.lastUsedAt = now;

    const currentVelocity = Math.hypot(runtime.ball.vx, runtime.ball.vy);

    if (!runtime.ball.stuckToPaddle && currentVelocity < HOMING_MIN_BALL_SPEED) {
      setBallVectorSpeed(HOMING_MIN_BALL_SPEED);
    }

    audioRef.current?.play("homingActivate");

    createExplosion(runtime.ball.x, runtime.ball.y, "#9b59b6", 18, 6);
    createShockwave(runtime.ball.x, runtime.ball.y, "#9b59b6", 48);

    syncHomingPowerState();
  }

  function handleShieldPowerAction() {
    const runtime = runtimeRef.current;

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.rebuild.active || runtime.ultimatePower.active) {
      return;
    }

    if (runtime.shieldPower.active) {
      return;
    }

    const now = performance.now();
    const isCooldownReady =
      now - runtime.shieldPower.lastUsedAt >= SHIELD_POWER_COOLDOWN_MS;

    if (!isCooldownReady) {
      syncShieldPowerState();
      return;
    }

    runtime.shieldPower.active = true;
    runtime.shieldPower.activatedAt = now;
    runtime.shieldPower.lastUsedAt = now;

    audioRef.current?.play("shieldActivate");

    createExplosion(
      runtime.paddle.x + runtime.paddle.width / 2,
      runtime.paddle.y,
      "#4facfe",
      22,
      7
    );

    createShockwave(
      runtime.paddle.x + runtime.paddle.width / 2,
      runtime.paddle.y,
      "#4facfe",
      52
    );

    syncShieldPowerState();
  }

  function breakRemainingNormalBricksForUltimate() {
    const runtime = runtimeRef.current;
    let pointsEarned = 0;

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const brickCenter = getBrickCenter(brick);

      brick.active = false;
      brick.hits = 0;

      if (brick.type === "tnt") {
        pointsEarned += TNT_BRICK_POINTS;
      } else {
        pointsEarned += 25;
      }

      createExplosion(brickCenter.x, brickCenter.y, "#38ef7d", 8, 5);
    }

    runtime.score += pointsEarned;
    setScore(runtime.score);
  }

  function startUltimateMode() {
    const runtime = runtimeRef.current;

    breakRemainingNormalBricksForUltimate();

    runtime.bricks = createUltimateBricks();
    runtime.powerUps = [];
    runtime.ultimateExtraBalls = [];

    runtime.arrowPower.aiming = false;
    runtime.homingPower.active = false;
    runtime.shieldPower.active = false;
    runtime.ball.bombCharges = 0;
    runtime.ball.arrowPierceHits = 0;
    runtime.ball.stuckToPaddle = false;
    runtime.paddle.ghostUntil = 0;

    runtime.ultimatePower.active = true;
    runtime.ultimatePower.activatedAt = performance.now();
    runtime.ultimatePower.charge = ULTIMATE_REQUIRED_BRICKS;
    runtime.ultimatePower.paddleBounceCombo = 0;

    forceUltimateBallSpeed();

    audioRef.current?.play("ultimateActivate");

    runtime.shake = 18;

    createExplosion(runtime.ball.x, runtime.ball.y, "#38ef7d", 42, 10);
    createShockwave(runtime.ball.x, runtime.ball.y, "#38ef7d", 76);

    syncStateFromRuntime();
  }

  function finishUltimatePower() {
    const runtime = runtimeRef.current;

    runtime.ultimatePower.active = false;
    runtime.ultimatePower.charge = 0;
    runtime.ultimatePower.activatedAt = 0;
    runtime.ultimatePower.paddleBounceCombo = 0;
    runtime.ultimateExtraBalls = [];

    runtime.bricks = createBricks(runtime.wave).map((brick) => ({
      ...brick,
      active: false,
      spawnedAt: undefined,
    }));

    runtime.rebuild = {
      active: true,
      startedAt: performance.now(),
      nextBrickIndex: 0,
      releaseAt: 0,
    };

    runtime.ball.speed = 1;
    runtime.ball.arrowPierceHits = 0;
    runtime.ball.bombCharges = 0;
    runtime.ball.stuckToPaddle = true;

    keepBallOnPaddle();

    runtime.shake = 12;

    createExplosion(runtime.ball.x, runtime.ball.y, "#38ef7d", 24, 7);
    createShockwave(runtime.ball.x, runtime.ball.y, "#38ef7d", 56);

    syncStateFromRuntime();
  }

  function handleUltimatePowerAction() {
    const runtime = runtimeRef.current;

    if (screenStateRef.current !== "playing") {
      return;
    }

    if (runtime.rebuild.active || runtime.ultimatePower.active) {
      return;
    }

    if (runtime.ultimatePower.charge < ULTIMATE_REQUIRED_BRICKS) {
      return;
    }

    startUltimateMode();
  }

  function createUltimateExtraBall(
    hitPosition: number,
    index: number,
    total: number
  ) {
    const runtime = runtimeRef.current;

    if (!runtime.ultimatePower.active) {
      return;
    }

    if (runtime.ultimateExtraBalls.length >= ULTIMATE_EXTRA_BALL_MAX) {
      return;
    }

    ultimateExtraBallIdRef.current += 1;

    const mainDirection = runtime.ball.vx >= 0 ? 1 : -1;
    const extraDirection = -mainDirection;
    const spread = total <= 1 ? 0 : index - (total - 1) / 2;
    const verticalSpeed = 6.2;
    const horizontalBase = Math.max(3.8, Math.abs(hitPosition * 6.4));
    const horizontalSpeed = horizontalBase + Math.abs(spread) * 0.75;

    runtime.ultimateExtraBalls.push({
      id: ultimateExtraBallIdRef.current,
      x: runtime.ball.x,
      y: runtime.ball.y,
      vx: extraDirection * horizontalSpeed + spread * 0.85,
      vy: -verticalSpeed - Math.abs(spread) * 0.22,
      radius: 6,
      speed: 1,
      active: true,
    });
  }

  function spawnUltimateExtraBalls(hitPosition: number) {
    const runtime = runtimeRef.current;

    if (!runtime.ultimatePower.active) {
      return;
    }

    const availableSlots =
      ULTIMATE_EXTRA_BALL_MAX - runtime.ultimateExtraBalls.length;

    if (availableSlots <= 0) {
      return;
    }

    const amountToSpawn = Math.min(
      runtime.ultimatePower.paddleBounceCombo,
      availableSlots
    );

    for (let index = 0; index < amountToSpawn; index++) {
      createUltimateExtraBall(hitPosition, index, amountToSpawn);
    }

    createExplosion(
      runtime.ball.x,
      runtime.ball.y,
      "#38ef7d",
      8 + amountToSpawn,
      5
    );
  }

  function findNearestActiveBrick() {
    const runtime = runtimeRef.current;
    let nearestBrick: Brick | null = null;
    let nearestDistance = Infinity;

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const brickCenter = getBrickCenter(brick);
      const distance = Math.hypot(
        brickCenter.x - runtime.ball.x,
        brickCenter.y - runtime.ball.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestBrick = brick;
      }
    }

    return nearestBrick;
  }

  function applyHomingToBall() {
    const runtime = runtimeRef.current;

    if (!runtime.homingPower.active || runtime.ultimatePower.active) {
      return;
    }

    if (runtime.ball.stuckToPaddle) {
      return;
    }

    const targetBrick = findNearestActiveBrick();

    if (!targetBrick) {
      return;
    }

    const targetCenter = getBrickCenter(targetBrick);
    const isArrowHomingCombo = runtime.ball.arrowPierceHits > 0;

    const homingStrength = isArrowHomingCombo
      ? HOMING_ARROW_COMBO_STRENGTH
      : HOMING_POWER_STRENGTH;

    const homingMaxTurn = isArrowHomingCombo
      ? HOMING_ARROW_COMBO_MAX_TURN
      : HOMING_POWER_MAX_TURN;

    const currentSpeed = Math.max(
      isArrowHomingCombo ? 10 : HOMING_MIN_BALL_SPEED,
      Math.hypot(runtime.ball.vx, runtime.ball.vy)
    );

    const directionX = targetCenter.x - runtime.ball.x;
    const directionY = targetCenter.y - runtime.ball.y;
    const directionLength = Math.max(1, Math.hypot(directionX, directionY));

    const desiredVx = (directionX / directionLength) * currentSpeed;
    const desiredVy = (directionY / directionLength) * currentSpeed;

    const nextVx =
      runtime.ball.vx + (desiredVx - runtime.ball.vx) * homingStrength;
    const nextVy =
      runtime.ball.vy + (desiredVy - runtime.ball.vy) * homingStrength;

    const turnX = Math.max(
      -homingMaxTurn,
      Math.min(homingMaxTurn, nextVx - runtime.ball.vx)
    );

    const turnY = Math.max(
      -homingMaxTurn,
      Math.min(homingMaxTurn, nextVy - runtime.ball.vy)
    );

    runtime.ball.vx += turnX;
    runtime.ball.vy += turnY;

    const normalizedSpeed = Math.max(
      isArrowHomingCombo ? 10 : HOMING_MIN_BALL_SPEED,
      Math.hypot(runtime.ball.vx, runtime.ball.vy)
    );

    runtime.ball.vx = (runtime.ball.vx / normalizedSpeed) * currentSpeed;
    runtime.ball.vy = (runtime.ball.vy / normalizedSpeed) * currentSpeed;
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    runtimeRef.current = createInitialRuntime(1);
    powerUpIdRef.current = 0;
    ultimateExtraBallIdRef.current = 0;
    gameStartedAtRef.current = performance.now();

    setElapsedSeconds(0);
    syncStateFromRuntime();

    audioRef.current?.startGameplayTheme();

    setGameScreen("playing");
    frameRef.current = requestAnimationFrame(gameLoop);
  }

  function restartGame() {
    startGame();
  }

  function backToStartScreen() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    runtimeRef.current = createInitialRuntime(1);
    powerUpIdRef.current = 0;
    ultimateExtraBallIdRef.current = 0;
    gameStartedAtRef.current = 0;

    setElapsedSeconds(0);
    syncStateFromRuntime();

    audioRef.current?.startMenuTheme();

    setGameScreen("start");
  }

  function shiftRuntimeTimestamps(deltaMs: number) {
    const runtime = runtimeRef.current;

    gameStartedAtRef.current += deltaMs;
    runtime.arrowPower.lastUsedAt += deltaMs;
    runtime.homingPower.activatedAt += deltaMs;
    runtime.homingPower.lastUsedAt += deltaMs;
    runtime.shieldPower.activatedAt += deltaMs;
    runtime.shieldPower.lastUsedAt += deltaMs;
    runtime.ultimatePower.activatedAt += deltaMs;
    runtime.paddle.ghostUntil += deltaMs;
    runtime.rebuild.startedAt += deltaMs;
    runtime.rebuild.releaseAt += deltaMs;
    runtime.lastBombCollectedAt += deltaMs;
  }

  function pauseGame() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    pausedAtRef.current = performance.now();
    audioRef.current?.stopAllThemes();
    setGameScreen("paused");
  }

  function resumeGame() {
    if (screenStateRef.current !== "paused") {
      return;
    }

    if (pausedAtRef.current > 0) {
      shiftRuntimeTimestamps(performance.now() - pausedAtRef.current);
      pausedAtRef.current = 0;
    }

    audioRef.current?.startGameplayTheme();
    setGameScreen("playing");
    frameRef.current = requestAnimationFrame(gameLoop);
  }

  function handlePointerMove(clientX: number) {
    if (screenStateRef.current !== "playing") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const runtime = runtimeRef.current;
    runtime.paddle.targetX = clampPaddle(x - runtime.paddle.width / 2);
  }

  function createExplosion(
    x: number,
    y: number,
    color: string,
    amount = 10,
    force = 5
  ) {
    const runtime = runtimeRef.current;

    for (let index = 0; index < amount; index++) {
      runtime.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * force,
        vy: (Math.random() - 0.5) * force,
        life: 1,
        color,
      });
    }
  }

  function createShockwave(
    x: number,
    y: number,
    color: string,
    maxRadius: number
  ) {
    const runtime = runtimeRef.current;

    runtime.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius,
      life: 1,
      color,
    });
  }

  const powerUpEngine = createBreakoutPowerUpsEngine({
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
  });

  function endGameIfNeeded() {
    const runtime = runtimeRef.current;

    if (runtime.lives > 0) {
      return;
    }

    audioRef.current?.stopAllThemes();
    audioRef.current?.play("gameOver");

    setGameScreen("game-over");

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function damagePlayerByHazard(x: number, y: number, color = "#ff4757") {
    const runtime = runtimeRef.current;

    runtime.lives -= 1;
    runtime.shake = 16;

    audioRef.current?.play("damageHit");

    setLives(runtime.lives);

    createExplosion(x, y, color, 24, 8);
    createShockwave(x, y, color, 46);

    endGameIfNeeded();
  }

  const brickEngine = createBreakoutBrickEngine({
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
  });

  function updatePaddle() {
    const runtime = runtimeRef.current;

    runtime.paddle.x +=
      (runtime.paddle.targetX - runtime.paddle.x) * 0.24;

    runtime.paddle.x = clampPaddle(runtime.paddle.x);
  }

  function updateParticles() {
    const runtime = runtimeRef.current;

    for (let index = runtime.particles.length - 1; index >= 0; index--) {
      const particle = runtime.particles[index];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.045;

      if (particle.life <= 0) {
        runtime.particles.splice(index, 1);
      }
    }
  }

  function updateShockwaves() {
    const runtime = runtimeRef.current;

    for (let index = runtime.shockwaves.length - 1; index >= 0; index--) {
      const shockwave = runtime.shockwaves[index];

      shockwave.radius += 5.6;
      shockwave.life -= 0.045;

      if (
        shockwave.life <= 0 ||
        shockwave.radius >= shockwave.maxRadius
      ) {
        runtime.shockwaves.splice(index, 1);
      }
    }
  }

  function updateUltimateExtraBalls() {
    const runtime = runtimeRef.current;

    if (!runtime.ultimatePower.active) {
      runtime.ultimateExtraBalls = [];
      return;
    }

    for (let index = runtime.ultimateExtraBalls.length - 1; index >= 0; index--) {
      const extraBall = runtime.ultimateExtraBalls[index];

      extraBall.x += extraBall.vx * extraBall.speed;
      extraBall.y += extraBall.vy * extraBall.speed;

      if (extraBall.x - extraBall.radius <= 0) {
        extraBall.x = extraBall.radius;
        extraBall.vx *= -1;
      }

      if (extraBall.x + extraBall.radius >= CANVAS_WIDTH) {
        extraBall.x = CANVAS_WIDTH - extraBall.radius;
        extraBall.vx *= -1;
      }

      if (extraBall.y - extraBall.radius <= 0) {
        extraBall.y = extraBall.radius;
        extraBall.vy *= -1;
      }

      if (extraBall.y - extraBall.radius > CANVAS_HEIGHT) {
        runtime.ultimateExtraBalls.splice(index, 1);
        continue;
      }

      for (const brick of runtime.bricks) {
        if (!brick.active) {
          continue;
        }

        const isInsideBrick =
          extraBall.x + extraBall.radius >= brick.x &&
          extraBall.x - extraBall.radius <= brick.x + brick.width &&
          extraBall.y + extraBall.radius >= brick.y &&
          extraBall.y - extraBall.radius <= brick.y + brick.height;

        if (isInsideBrick) {
          brickEngine.hitBrickWithUltimateExtraBall(brick, extraBall);
          break;
        }
      }
    }
  }

  function bounceArrowShotFromBottom() {
    const runtime = runtimeRef.current;

    runtime.ball.y = CANVAS_HEIGHT - runtime.ball.radius - 1;
    runtime.ball.vy = -Math.abs(runtime.ball.vy);

    runtime.ball.arrowPierceHits = 0;
    runtime.ball.speed = 1;

    runtime.shake = 7;

    createExplosion(runtime.ball.x, runtime.ball.y, "#4facfe", 16, 6);
    createShockwave(runtime.ball.x, runtime.ball.y, "#4facfe", 42);
  }

  function bounceUltimateBallFromBottom() {
    const runtime = runtimeRef.current;

    runtime.ball.y = CANVAS_HEIGHT - runtime.ball.radius - 1;
    runtime.ball.vy = -Math.abs(runtime.ball.vy);
    runtime.ball.speed = 1;

    runtime.ultimatePower.paddleBounceCombo = 0;
    runtime.shake = 6;

    forceUltimateBallSpeed();

    createExplosion(runtime.ball.x, runtime.ball.y, "#38ef7d", 14, 6);
  }

  function updateGame() {
    const runtime = runtimeRef.current;
    const { paddle, ball } = runtime;
    const now = performance.now();
    const isPaddleGhostActive =
      !runtime.ultimatePower.active && runtime.paddle.ghostUntil > now;

    updateElapsedTime();
    syncArrowPowerState();
    syncHomingPowerState();
    syncShieldPowerState();
    syncUltimatePowerState();
    updatePaddle();

    if (ball.stuckToPaddle) {
      keepBallOnPaddle();
    }

    if (runtime.rebuild.active) {
      brickEngine.updateBrickRebuild();
      updateParticles();
      updateShockwaves();

      if (runtime.shake > 0) {
        runtime.shake -= 0.5;
      }

      return;
    }

    if (!ball.stuckToPaddle) {
      applyHomingToBall();

      if (runtime.ultimatePower.active) {
        forceUltimateBallSpeed();
      }

      ball.x += ball.vx * ball.speed;
      ball.y += ball.vy * ball.speed;
    }

    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx *= -1;

      if (runtime.ultimatePower.active) {
        forceUltimateBallSpeed();
      }
    }

    if (ball.x + ball.radius >= CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.radius;
      ball.vx *= -1;

      if (runtime.ultimatePower.active) {
        forceUltimateBallSpeed();
      }
    }

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -1;

      if (runtime.ultimatePower.active) {
        forceUltimateBallSpeed();
      }
    }

    const isBallTouchingPaddle =
      !isPaddleGhostActive &&
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.vy > 0;

    if (isBallTouchingPaddle) {
      audioRef.current?.play("paddleHit");

      const paddleCenter = paddle.x + paddle.width / 2;
      const hitPosition = (ball.x - paddleCenter) / (paddle.width / 2);

      if (runtime.ultimatePower.active) {
        runtime.ultimatePower.paddleBounceCombo += 1;

        ball.vx = hitPosition * 6.4;
        ball.vy = -Math.abs(ball.vy);
        ball.speed = 1;

        forceUltimateBallSpeed();

        spawnUltimateExtraBalls(hitPosition);
        createExplosion(ball.x, ball.y, "#38ef7d", 18, 7);
      } else if (ball.arrowPierceHits > 0) {
        const directionX = hitPosition * ARROW_POWER_MAX_HORIZONTAL_FORCE;
        const directionY = -10;
        const directionLength = Math.max(1, Math.hypot(directionX, directionY));

        ball.vx = (directionX / directionLength) * ARROW_POWER_SHOT_SPEED;
        ball.vy = (directionY / directionLength) * ARROW_POWER_SHOT_SPEED;
        ball.speed = 1;

        createExplosion(ball.x, ball.y, "#4facfe", 18, 7);
      } else {
        ball.vx = hitPosition * 5.4;
        ball.vy = -Math.abs(ball.vy);

        createExplosion(ball.x, ball.y, "#38ef7d");
      }

      ball.y = paddle.y - ball.radius - 1;
    }

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const isBallInsideBrick =
        ball.x + ball.radius >= brick.x &&
        ball.x - ball.radius <= brick.x + brick.width &&
        ball.y + ball.radius >= brick.y &&
        ball.y - ball.radius <= brick.y + brick.height;

      if (isBallInsideBrick) {
        brickEngine.hitBrick(brick);

        if (!runtime.ultimatePower.active) {
          break;
        }
      }
    }

    powerUpEngine.updatePowerUps();
    updateUltimateExtraBalls();

    if (ball.y - ball.radius > CANVAS_HEIGHT) {
      runtime.arrowPower.aiming = false;

      if (runtime.ultimatePower.active) {
        bounceUltimateBallFromBottom();
        return;
      }

      if (ball.arrowPierceHits > 0) {
        bounceArrowShotFromBottom();
        syncArrowPowerState();
        syncHomingPowerState();
        syncShieldPowerState();
        syncUltimatePowerState();
        return;
      }

      runtime.lives -= 1;
      runtime.shake = 12;

      audioRef.current?.play("damageHit");

      setLives(runtime.lives);
      syncArrowPowerState();
      syncHomingPowerState();
      syncShieldPowerState();
      syncUltimatePowerState();

      if (runtime.lives <= 0) {
        audioRef.current?.stopAllThemes();
        audioRef.current?.play("gameOver");

        setGameScreen("game-over");

        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }

        return;
      }

      resetBall(false);
    }

    updateParticles();
    updateShockwaves();

    if (runtime.shake > 0) {
      runtime.shake -= 0.5;
    }
  }

  function drawGame() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    drawBreakoutRuntime(ctx, runtimeRef.current);
  }
  function gameLoop() {
    if (screenStateRef.current !== "playing") {
      return;
    }

    updateGame();
    drawGame();

    frameRef.current = requestAnimationFrame(gameLoop);
  }

  return {
    canvasRef,
    screenState,
    score,
    lives,
    maxLives: MAX_LIVES,
    elapsedSeconds,
    elapsedTimeLabel: formatSurvivalTime(elapsedSeconds),
    bombCharges,
    isArrowAiming,
    isArrowReady,
    arrowCooldownProgress,
    isHomingActive,
    isHomingReady,
    homingCooldownProgress,
    isShieldActive,
    isShieldReady,
    shieldCooldownProgress,
    isUltimateActive,
    isUltimateReady,
    ultimateCharge,
    ultimateTimeLabel,
    startGame,
    restartGame,
    pauseGame,
    resumeGame,
    backToStartScreen,
    handlePointerMove,
    handleArrowPowerAction,
    handleHomingPowerAction,
    handleShieldPowerAction,
    handleUltimatePowerAction,
  };
}
