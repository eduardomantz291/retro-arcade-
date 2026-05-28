// Renderer completo do Breakout.
// O hook decide regras, colisao e estado; este modulo concentra a pintura do canvas
// para reduzir o tamanho da engine principal.

import {
  ARROW_AIM_SIDE_PADDING,
  ARROW_AIM_TOP_PADDING,
  ARROW_POWER_SHOT_SPEED,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  SHIELD_POWER_DURATION_MS,
} from "../breakoutConfig";
import {
  drawCurseBrick,
  drawPowerUp,
  drawRoundedRect,
  drawTntBrick,
  drawUltimateBrick,
} from "./breakoutRenderer";
import type { BreakoutRuntime } from "../breakoutTypes";

export function drawBreakoutRuntime(
  ctx: CanvasRenderingContext2D,
  runtime: BreakoutRuntime
) {

  function isShieldBlockingHazards() {
    const runtime = runtimeRef.current;
    const now = performance.now();

    return (
      runtime.shieldPower.active &&
      now - runtime.shieldPower.activatedAt < SHIELD_POWER_DURATION_MS &&
      !runtime.ultimatePower.active
    );
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

  function drawShieldAura(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;

    if (!isShieldBlockingHazards()) {
      return;
    }

    const pulse = Math.abs(Math.sin(Date.now() / 90)) * 8;
    const centerX = runtime.paddle.x + runtime.paddle.width / 2;
    const centerY = runtime.paddle.y + runtime.paddle.height / 2;

    ctx.save();

    ctx.globalAlpha = 0.82;
    ctx.shadowBlur = 28 + pulse;
    ctx.shadowColor = "#4facfe";
    ctx.strokeStyle = "rgba(79, 172, 254, 0.95)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(
      runtime.paddle.x - 10,
      runtime.paddle.y - 10,
      runtime.paddle.width + 20,
      runtime.paddle.height + 20,
      999
    );
    ctx.stroke();

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#4facfe";

    ctx.beginPath();
    ctx.arc(centerX, centerY, runtime.paddle.width / 2 + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPaddle(ctx: CanvasRenderingContext2D) {
    const runtime = runtimeRef.current;
    const now = performance.now();
    const isGhostActive =
      !runtime.ultimatePower.active && runtime.paddle.ghostUntil > now;

    ctx.save();

    if (isGhostActive) {
      const blink = Math.abs(Math.sin(Date.now() / 80)) * 0.25;

      ctx.globalAlpha = 0.22 + blink;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#9b59b6";
      ctx.fillStyle = "#be2edd";
    } else {
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#38ef7d";
      ctx.fillStyle = "#38ef7d";
    }

    drawRoundedRect(
      ctx,
      runtime.paddle.x,
      runtime.paddle.y,
      runtime.paddle.width,
      runtime.paddle.height,
      999
    );

    ctx.restore();

    drawShieldAura(ctx);
  }

  const runtimeRef = { current: runtime };
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

      if (brick.type === "curse") {
        drawCurseBrick(ctx, brick, yOffset);
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

    drawPaddle(ctx);

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

    ctx.restore();}

