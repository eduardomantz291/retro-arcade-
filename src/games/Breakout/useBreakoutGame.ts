import { useEffect, useRef, useState } from "react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  INITIAL_LIVES,
} from "./breakoutConfig";
import { createBricks, createInitialRuntime } from "./breakoutFactory";
import type {
  BreakoutRuntime,
  BreakoutScreenState,
  Brick,
} from "./breakoutTypes";

export function useBreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const runtimeRef = useRef<BreakoutRuntime>(createInitialRuntime());
  const screenStateRef = useRef<BreakoutScreenState>("start");

  const [screenState, setScreenState] =
    useState<BreakoutScreenState>("start");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [level, setLevel] = useState(1);

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
    setLevel(runtime.level);
  }

  function resetBall() {
    const runtime = runtimeRef.current;

    runtime.ball.x = CANVAS_WIDTH / 2;
    runtime.ball.y = CANVAS_HEIGHT - 68;
    runtime.ball.vx = Math.random() > 0.5 ? 4 : -4;
    runtime.ball.vy = -4.6;
    runtime.ball.speed = 1;

    runtime.paddle.x = CANVAS_WIDTH / 2 - runtime.paddle.width / 2;
    runtime.paddle.targetX = runtime.paddle.x;
  }

  function startGame() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    runtimeRef.current = createInitialRuntime(1);
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
    }

    runtime.ball.vy *= -1;
    runtime.ball.speed = Math.min(runtime.ball.speed + 0.025, 1.45);

    setScore(runtime.score);

    const hasActiveBricks = runtime.bricks.some((currentBrick) => {
      return currentBrick.active;
    });

    if (!hasActiveBricks) {
      runtime.level += 1;
      runtime.bricks = createBricks(runtime.level);
      runtime.particles = [];
      runtime.shake = 10;

      resetBall();
      syncStateFromRuntime();
    }
  }

  function updateGame() {
    const runtime = runtimeRef.current;
    const { paddle, ball } = runtime;

    paddle.x += (paddle.targetX - paddle.x) * 0.24;
    paddle.x = clampPaddle(paddle.x);

    ball.x += ball.vx * ball.speed;
    ball.y += ball.vy * ball.speed;

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

      resetBall();
    }

    for (let index = runtime.particles.length - 1; index >= 0; index--) {
      const particle = runtime.particles[index];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.045;

      if (particle.life <= 0) {
        runtime.particles.splice(index, 1);
      }
    }

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

      ctx.shadowBlur = 14;
      ctx.shadowColor = brick.glow;
      ctx.fillStyle =
        brick.maxHits > 1
          ? `rgba(241, 196, 15, ${0.55 + opacity * 0.45})`
          : brick.color;

      drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 8);

      ctx.shadowBlur = 0;
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
    level,
    startGame,
    restartGame,
    handlePointerMove,
  };
}