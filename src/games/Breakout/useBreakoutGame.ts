import { useEffect, useRef, useState } from "react";
import {
  BRICK_REBUILD_INTERVAL,
  BRICK_REBUILD_RELEASE_DELAY,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  HEART_BONUS_POINTS,
  HEART_DROP_CHANCE,
  INITIAL_LIVES,
  MAX_LIVES,
  POWER_UP_FALL_SPEED,
  POWER_UP_RADIUS,
} from "./breakoutConfig";
import { createBricks, createInitialRuntime } from "./breakoutFactory";
import type {
  BreakoutRuntime,
  BreakoutScreenState,
  Brick,
  FallingPowerUp,
} from "./breakoutTypes";

function formatSurvivalTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export function useBreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<BreakoutRuntime>(createInitialRuntime());
  const screenStateRef = useRef<BreakoutScreenState>("start");
  const powerUpIdRef = useRef(0);
  const gameStartedAtRef = useRef(0);

  const [screenState, setScreenState] =
    useState<BreakoutScreenState>("start");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    drawGame();

    function handleKeyDown(event: KeyboardEvent) {
      if (screenStateRef.current !== "playing") {
        return;
      }

      const runtime = runtimeRef.current;

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

  function syncStateFromRuntime() {
    const runtime = runtimeRef.current;

    setScore(runtime.score);
    setLives(runtime.lives);
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
  }

  function releaseBallFromPaddle() {
    const runtime = runtimeRef.current;

    runtime.ball.stuckToPaddle = false;
    runtime.ball.vx = Math.random() > 0.5 ? 4 : -4;
    runtime.ball.vy = -4.8;
    runtime.ball.speed = Math.min(1 + runtime.wave * 0.025, 1.22);

    createExplosion(runtime.ball.x, runtime.ball.y, "#4facfe");
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    runtimeRef.current = createInitialRuntime(1);
    powerUpIdRef.current = 0;
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

  function createExplosion(x: number, y: number, color: string) {
    const runtime = runtimeRef.current;

    for (let index = 0; index < 10; index++) {
      runtime.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        color,
      });
    }
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

  function tryDropHeartFromBrick(brick: Brick) {
    const runtime = runtimeRef.current;

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

  function collectHeartPowerUp(powerUp: FallingPowerUp) {
    const runtime = runtimeRef.current;

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

  function updatePowerUps() {
    const runtime = runtimeRef.current;
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
        collectHeartPowerUp(powerUp);
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

    runtime.wave += 1;
    runtime.bricks = createBricks(runtime.wave).map((brick) => ({
      ...brick,
      active: false,
      spawnedAt: undefined,
    }));

    runtime.powerUps = [];
    runtime.rebuild = {
      active: true,
      startedAt: performance.now(),
      nextBrickIndex: 0,
      releaseAt: 0,
    };

    runtime.shake = 10;
    runtime.ball.stuckToPaddle = true;

    keepBallOnPaddle();
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

  function hitBrick(brick: Brick) {
    const runtime = runtimeRef.current;

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

      tryDropHeartFromBrick(brick);
    }

    runtime.ball.vy *= -1;
    runtime.ball.speed = Math.min(runtime.ball.speed + 0.025, 1.45);

    setScore(runtime.score);

    const hasActiveBricks = runtime.bricks.some((currentBrick) => {
      return currentBrick.active;
    });

    if (!hasActiveBricks) {
      beginBrickRebuild();
    }
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

  function updateGame() {
    const runtime = runtimeRef.current;
    const { paddle, ball } = runtime;

    updateElapsedTime();
    updatePaddle();

    if (ball.stuckToPaddle) {
      keepBallOnPaddle();
    }

    if (runtime.rebuild.active) {
      updateBrickRebuild();
      updateParticles();

      if (runtime.shake > 0) {
        runtime.shake -= 0.5;
      }

      return;
    }

    if (!ball.stuckToPaddle) {
      ball.x += ball.vx * ball.speed;
      ball.y += ball.vy * ball.speed;
    }

    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx *= -1;
    }

    if (ball.x + ball.radius >= CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.radius;
      ball.vx *= -1;
    }

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy *= -1;
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

      ball.vx = hitPosition * 5.4;
      ball.vy = -Math.abs(ball.vy);
      ball.y = paddle.y - ball.radius - 1;

      createExplosion(ball.x, ball.y, "#38ef7d");
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
        break;
      }
    }

    updatePowerUps();

    if (ball.y - ball.radius > CANVAS_HEIGHT) {
      runtime.lives -= 1;
      runtime.shake = 12;

      setLives(runtime.lives);

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

    ctx.fillStyle = `rgba(56, 239, 125, ${0.03 + pulse})`;
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

    ctx.shadowBlur = 20;
    ctx.shadowColor = "#4facfe";
    ctx.fillStyle = "#ffffff";

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
    startGame,
    restartGame,
    handlePointerMove,
  };
}