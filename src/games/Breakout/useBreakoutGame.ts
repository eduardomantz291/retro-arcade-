import { useEffect, useRef, useState } from "react";
import {
  ARROW_AIM_SIDE_PADDING,
  ARROW_AIM_TOP_PADDING,
  ARROW_POWER_COOLDOWN_MS,
  ARROW_POWER_MAX_HORIZONTAL_FORCE,
  ARROW_POWER_PIERCE_HITS,
  ARROW_POWER_SHOT_SPEED,
  BOMB_CHARGES,
  BOMB_DROP_CHANCE,
  BOMB_DROP_COOLDOWN_MS,
  BOMB_EXPLOSION_BRICK_POINTS,
  BOMB_EXPLOSION_RADIUS,
  BRICK_REBUILD_INTERVAL,
  BRICK_REBUILD_RELEASE_DELAY,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HEART_BONUS_POINTS,
  HEART_DROP_CHANCE,
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
  POWER_UP_FALL_SPEED,
  POWER_UP_RADIUS,
  TNT_BRICK_POINTS,
  TNT_EXPLOSION_BRICK_POINTS,
  TNT_EXPLOSION_RADIUS,
  ULTIMATE_DURATION_MS,
  ULTIMATE_EXTRA_BALL_MAX,
  ULTIMATE_EXTRA_BALL_POINTS,
  ULTIMATE_FIXED_BALL_SPEED,
  ULTIMATE_GREEN_BRICK_POINTS,
  ULTIMATE_MAX_CHARGE,
  ULTIMATE_REQUIRED_BRICKS,
} from "./breakoutConfig";
import {
  createBricks,
  createInitialRuntime,
  createUltimateBricks,
} from "./breakoutFactory";
import type {
  BreakoutRuntime,
  BreakoutScreenState,
  Brick,
  FallingPowerUp,
  UltimateExtraBall,
} from "./breakoutTypes";

function formatSurvivalTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function formatUltimateTime(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const seconds = Math.ceil(safeMilliseconds / 1000);

  return `${seconds}s`;
}

function getBrickCenter(brick: Brick) {
  return {
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height / 2,
  };
}

export function useBreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<BreakoutRuntime>(createInitialRuntime());
  const screenStateRef = useRef<BreakoutScreenState>("start");
  const powerUpIdRef = useRef(0);
  const ultimateExtraBallIdRef = useRef(0);
  const gameStartedAtRef = useRef(0);

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

  const [isUltimateActive, setIsUltimateActive] = useState(false);
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [ultimateTimeLabel, setUltimateTimeLabel] = useState("60s");

  const isUltimateReady = ultimateCharge >= ULTIMATE_MAX_CHARGE;

  useEffect(() => {
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

    createExplosion(runtime.ball.x, runtime.ball.y, "#9b59b6", 18, 6);
    createShockwave(runtime.ball.x, runtime.ball.y, "#9b59b6", 48);

    syncHomingPowerState();
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

      pointsEarned += brick.type === "tnt" ? TNT_BRICK_POINTS : 25;

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
    runtime.ball.bombCharges = 0;
    runtime.ball.arrowPierceHits = 0;
    runtime.ball.stuckToPaddle = false;

    runtime.ultimatePower.active = true;
    runtime.ultimatePower.activatedAt = performance.now();
    runtime.ultimatePower.charge = ULTIMATE_REQUIRED_BRICKS;
    runtime.ultimatePower.paddleBounceCombo = 0;

    forceUltimateBallSpeed();

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

  function createUltimateExtraBall(hitPosition: number, index: number, total: number) {
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

    createExplosion(runtime.ball.x, runtime.ball.y, "#38ef7d", 8 + amountToSpawn, 5);
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

    setGameScreen("playing");
    frameRef.current = requestAnimationFrame(gameLoop);
  }

  function restartGame() {
    startGame();
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

  function createHeartPowerUp(x: number, y: number): FallingPowerUp {
    powerUpIdRef.current += 1;

    return {
      id: powerUpIdRef.current,
      type: "heart",
      x,
      y,
      vy: POWER_UP_FALL_SPEED,
      radius: POWER_UP_RADIUS,
      emoji: "❤️",
      color: "#ff4757",
      glow: "#ff6b81",
      active: true,
    };
  }

  function createBombPowerUp(x: number, y: number): FallingPowerUp {
    powerUpIdRef.current += 1;

    return {
      id: powerUpIdRef.current,
      type: "bomb",
      x,
      y,
      vy: POWER_UP_FALL_SPEED,
      radius: POWER_UP_RADIUS,
      emoji: "💣",
      color: "#f1c40f",
      glow: "#ff9f1a",
      active: true,
    };
  }

  function tryDropHeartFromBrick(brick: Brick) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    if (Math.random() > HEART_DROP_CHANCE) {
      return;
    }

    runtime.powerUps.push(
      createHeartPowerUp(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2
      )
    );
  }

  function tryDropBombFromBrick(brick: Brick) {
    const runtime = runtimeRef.current;
    const now = performance.now();

    if (runtime.ultimatePower.active) {
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
      createBombPowerUp(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2
      )
    );
  }

  function collectHeartPowerUp(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

    if (runtime.ultimatePower.active) {
      return;
    }

    powerUp.active = false;

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
    runtime.ball.bombCharges = BOMB_CHARGES;
    runtime.lastBombCollectedAt = performance.now();

    setBombCharges(runtime.ball.bombCharges);

    createExplosion(powerUp.x, powerUp.y, "#ff9f1a", 18, 7);
    createShockwave(powerUp.x, powerUp.y, "#f1c40f", 44);
  }

  function collectPowerUp(powerUp: FallingPowerUp) {
    if (powerUp.type === "heart") {
      collectHeartPowerUp(powerUp);
      return;
    }

    if (powerUp.type === "bomb") {
      collectBombPowerUp(powerUp);
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

    brick.active = false;
    brick.hits = 0;

    runtime.score += points;

    addUltimateCharge();

    createExplosion(brickCenter.x, brickCenter.y, brick.glow, 12, 6);
    tryDropHeartFromBrick(brick);

    if (allowBombDrop) {
      tryDropBombFromBrick(brick);
    }
  }

  function explodeTntBrick(tntBrick: Brick) {
    const runtime = runtimeRef.current;
    const tntCenter = getBrickCenter(tntBrick);

    tntBrick.active = false;

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

      destroyNormalBrickByExplosion(brick, TNT_EXPLOSION_BRICK_POINTS, true);
    }

    setScore(runtime.score);
    checkIfScreenWasCleared();
  }

  function explodeBombBallImpact(hitBrickTarget: Brick) {
    const runtime = runtimeRef.current;
    const impactCenter = getBrickCenter(hitBrickTarget);

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
    } else {
      brick.active = false;
      brick.hits = 0;

      runtime.score += 25;

      addUltimateCharge();

      createExplosion(brickCenter.x, brickCenter.y, "#4facfe", 16, 7);
      tryDropHeartFromBrick(brick);
      tryDropBombFromBrick(brick);
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

      addUltimateCharge();

      tryDropHeartFromBrick(brick);
      tryDropBombFromBrick(brick);
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
          hitBrickWithUltimateExtraBall(brick, extraBall);
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

    updateElapsedTime();
    syncArrowPowerState();
    syncHomingPowerState();
    syncUltimatePowerState();
    updatePaddle();

    if (ball.stuckToPaddle) {
      keepBallOnPaddle();
    }

    if (runtime.rebuild.active) {
      updateBrickRebuild();
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
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.vy > 0;

    if (isBallTouchingPaddle) {
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
        hitBrick(brick);

        if (!runtime.ultimatePower.active) {
          break;
        }
      }
    }

    updatePowerUps();
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
        syncUltimatePowerState();
        return;
      }

      runtime.lives -= 1;
      runtime.shake = 12;

      setLives(runtime.lives);
      syncArrowPowerState();
      syncHomingPowerState();
      syncUltimatePowerState();

      if (runtime.lives <= 0) {
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

  function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: FallingPowerUp) {
    const pulse = Math.abs(Math.sin(Date.now() / 180)) * 4;

    ctx.shadowBlur = 18 + pulse;
    ctx.shadowColor = powerUp.glow;
    ctx.fillStyle = powerUp.color;

    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px system-ui, Apple Color Emoji, Segoe UI Emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(powerUp.emoji, powerUp.x, powerUp.y + 1);
  }

  function drawTntBrick(
    ctx: CanvasRenderingContext2D,
    brick: Brick,
    yOffset: number
  ) {
    const pulse = Math.abs(Math.sin(Date.now() / 150)) * 8;
    const x = brick.x;
    const y = brick.y + yOffset;

    ctx.shadowBlur = 18 + pulse;
    ctx.shadowColor = "#ff4757";
    ctx.fillStyle = "#ff3838";

    drawRoundedRect(ctx, x, y, brick.width, brick.height, 8);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    drawRoundedRect(ctx, x + 4, y + 4, brick.width - 8, brick.height - 8, 6);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 12px Poppins, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TNT", x + brick.width / 2, y + brick.height / 2 + 1);

    ctx.strokeStyle = "rgba(241, 196, 15, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + brick.width - 12, y + 3);
    ctx.lineTo(x + brick.width - 5, y - 5);
    ctx.stroke();

    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(x + brick.width - 4, y - 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawUltimateBrick(
    ctx: CanvasRenderingContext2D,
    brick: Brick,
    yOffset: number
  ) {
    const pulse = Math.abs(Math.sin(Date.now() / 180)) * 6;

    ctx.shadowBlur = 18 + pulse;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#38ef7d";

    drawRoundedRect(
      ctx,
      brick.x,
      brick.y + yOffset,
      brick.width,
      brick.height,
      8
    );

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    drawRoundedRect(
      ctx,
      brick.x + 5,
      brick.y + yOffset + 4,
      brick.width - 10,
      4,
      999
    );
  }

  function drawShockwaves(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    for (const shockwave of runtime.shockwaves) {
      ctx.globalAlpha = Math.max(0, shockwave.life);
      ctx.strokeStyle = shockwave.color;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 22;
      ctx.shadowColor = shockwave.color;

      ctx.beginPath();
      ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  function drawBombBallAura(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (runtime.ball.bombCharges <= 0 || runtime.ultimatePower.active) {
      return;
    }

    const pulse = Math.abs(Math.sin(Date.now() / 120)) * 6;

    ctx.shadowBlur = 26 + pulse;
    ctx.shadowColor = "#ff9f1a";
    ctx.strokeStyle = "rgba(255, 159, 26, 0.95)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
      runtime.ball.x,
      runtime.ball.y,
      runtime.ball.radius + 7 + pulse * 0.2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  function drawBombBallTrail(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (runtime.ball.bombCharges <= 0 || runtime.ultimatePower.active) {
      return;
    }

    ctx.save();

    ctx.globalAlpha = 0.42;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ff9f1a";
    ctx.fillStyle = "#ff9f1a";

    for (let index = 1; index <= 4; index++) {
      const trailX = runtime.ball.x - runtime.ball.vx * index * 2.2;
      const trailY = runtime.ball.y - runtime.ball.vy * index * 2.2;
      const trailRadius = Math.max(2, runtime.ball.radius - index);

      ctx.beginPath();
      ctx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawHomingBallAura(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!runtime.homingPower.active || runtime.ultimatePower.active) {
      return;
    }

    const pulse = Math.abs(Math.sin(Date.now() / 130)) * 7;

    ctx.shadowBlur = 28 + pulse;
    ctx.shadowColor = "#9b59b6";
    ctx.strokeStyle = "rgba(155, 89, 182, 0.95)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
      runtime.ball.x,
      runtime.ball.y,
      runtime.ball.radius + 10 + pulse * 0.2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  function drawHomingBallTrail(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!runtime.homingPower.active || runtime.ultimatePower.active) {
      return;
    }

    ctx.save();

    ctx.globalAlpha = 0.38;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#9b59b6";
    ctx.fillStyle = "#9b59b6";

    for (let index = 1; index <= 5; index++) {
      const trailX = runtime.ball.x - runtime.ball.vx * index * 1.7;
      const trailY = runtime.ball.y - runtime.ball.vy * index * 1.7;
      const trailRadius = Math.max(2, runtime.ball.radius - index * 0.7);

      ctx.beginPath();
      ctx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawUltimateBallAura(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!runtime.ultimatePower.active) {
      return;
    }

    const pulse = Math.abs(Math.sin(Date.now() / 110)) * 8;

    ctx.shadowBlur = 32 + pulse;
    ctx.shadowColor = "#38ef7d";
    ctx.strokeStyle = "rgba(56, 239, 125, 0.95)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
      runtime.ball.x,
      runtime.ball.y,
      runtime.ball.radius + 12 + pulse * 0.2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  function drawUltimateExtraBalls(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!runtime.ultimatePower.active) {
      return;
    }

    ctx.save();

    for (const extraBall of runtime.ultimateExtraBalls) {
      ctx.globalAlpha = 0.42;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#38ef7d";
      ctx.fillStyle = "#38ef7d";

      ctx.beginPath();
      ctx.arc(extraBall.x, extraBall.y, extraBall.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawArrowAimGuide(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!runtime.arrowPower.aiming || runtime.ultimatePower.active) {
      return;
    }

    const velocity = getArrowShotVelocity();
    const length = 420;
    const magnitude = Math.max(1, Math.hypot(velocity.vx, velocity.vy));

    const directionX = velocity.vx / magnitude;
    const directionY = velocity.vy / magnitude;

    const startX = runtime.ball.x;
    const startY = runtime.ball.y - 10;

    ctx.save();

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#4facfe";
    ctx.fillStyle = "rgba(79, 172, 254, 0.95)";

    for (let index = 1; index <= 28; index++) {
      const progress = index / 28;
      const dotX = startX + directionX * length * progress;
      const dotY = startY + directionY * length * progress;

      if (
        dotX < 0 ||
        dotX > CANVAS_WIDTH ||
        dotY < 0 ||
        dotY > CANVAS_HEIGHT
      ) {
        continue;
      }

      const radius = 6 - progress * 3.2;

      ctx.globalAlpha = 1 - progress * 0.42;
      ctx.beginPath();
      ctx.arc(dotX, dotY, Math.max(2, radius), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
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

    const runtime = runtimeRef.current;
    const now = performance.now();

    ctx.save();

    if (runtime.shake > 0) {
      const shakeX = (Math.random() - 0.5) * runtime.shake;
      const shakeY = (Math.random() - 0.5) * runtime.shake;

      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = "#1e272e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pulse = Math.abs(Math.sin(Date.now() / 320)) * 0.14;

    ctx.fillStyle = runtime.ultimatePower.active
      ? `rgba(56, 239, 125, ${0.08 + pulse})`
      : `rgba(56, 239, 125, ${0.03 + pulse})`;

    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;

    for (let x = 0; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y < CANVAS_HEIGHT; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    for (const brick of runtime.bricks) {
      if (!brick.active) {
        continue;
      }

      const opacity = brick.hits / brick.maxHits;
      const spawnAge = brick.spawnedAt ? now - brick.spawnedAt : 999;
      const spawnProgress = Math.min(spawnAge / 240, 1);
      const yOffset =
        runtime.rebuild.active && spawnProgress < 1
          ? -(1 - spawnProgress) * 42
          : 0;

      if (brick.type === "ultimate") {
        drawUltimateBrick(ctx, brick, yOffset);
        continue;
      }

      if (brick.type === "tnt") {
        drawTntBrick(ctx, brick, yOffset);
        continue;
      }

      ctx.shadowBlur = 14;
      ctx.shadowColor = brick.glow;
      ctx.fillStyle =
        brick.maxHits > 1
          ? `rgba(241, 196, 15, ${0.55 + opacity * 0.45})`
          : brick.color;

      drawRoundedRect(
        ctx,
        brick.x,
        brick.y + yOffset,
        brick.width,
        brick.height,
        8
      );

      ctx.shadowBlur = 0;
    }

    drawShockwaves(ctx);

    for (const powerUp of runtime.powerUps) {
      if (powerUp.active) {
        drawPowerUp(ctx, powerUp);
      }
    }

    ctx.shadowBlur = 18;
    ctx.shadowColor = "#38ef7d";
    ctx.fillStyle = "#38ef7d";

    drawRoundedRect(
      ctx,
      runtime.paddle.x,
      runtime.paddle.y,
      runtime.paddle.width,
      runtime.paddle.height,
      999
    );

    drawArrowAimGuide(ctx);
    drawBombBallTrail(ctx);
    drawHomingBallTrail(ctx);
    drawUltimateExtraBalls(ctx);

    ctx.shadowBlur = 22;
    ctx.shadowColor =
      runtime.ultimatePower.active
        ? "#38ef7d"
        : runtime.ball.bombCharges > 0
          ? "#ff9f1a"
          : runtime.homingPower.active
            ? "#9b59b6"
            : "#4facfe";

    ctx.fillStyle = runtime.ultimatePower.active ? "#38ef7d" : "#ffffff";

    ctx.beginPath();
    ctx.arc(
      runtime.ball.x,
      runtime.ball.y,
      runtime.ball.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;

    drawBombBallAura(ctx);
    drawHomingBallAura(ctx);
    drawUltimateBallAura(ctx);

    for (const particle of runtime.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    ctx.restore();
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
    isUltimateActive,
    isUltimateReady,
    ultimateCharge,
    ultimateTimeLabel,
    startGame,
    restartGame,
    handlePointerMove,
    handleArrowPowerAction,
    handleHomingPowerAction,
    handleUltimatePowerAction,
  };
}