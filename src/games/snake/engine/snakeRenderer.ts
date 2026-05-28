// Renderizacao do Snake.
// O hook controla regras e estado; este arquivo fica responsavel por desenhar o
// runtime atual no canvas e por atualizar particulas visuais simples.

import { CANVAS_SIZE, HALF_TILE, TILE_SIZE } from "../snakeConfig";
import type { Fruit, GameRuntime } from "../snakeTypes";

function drawFruit(ctx: CanvasRenderingContext2D, fruit: Fruit) {
  const oscillator = Math.sin(Date.now() / 150);

  ctx.shadowBlur = fruit.glowSize + oscillator * 5;
  ctx.shadowColor = fruit.glow;

  if (fruit.colorStart && fruit.colorEnd) {
    const gradient = ctx.createLinearGradient(
      fruit.x,
      fruit.y,
      fruit.x + TILE_SIZE,
      fruit.y + TILE_SIZE
    );

    gradient.addColorStop(0, fruit.colorStart);
    gradient.addColorStop(1, fruit.colorEnd);

    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = fruit.color;
  }

  ctx.beginPath();
  ctx.arc(
    fruit.x + HALF_TILE,
    fruit.y + HALF_TILE,
    fruit.radius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawFrenzyBackground(ctx: CanvasRenderingContext2D, runtime: GameRuntime) {
  if (!runtime.frenzyActive) {
    return;
  }

  const pulse = Math.abs(Math.sin(Date.now() / 250)) * 0.15;

  ctx.fillStyle = `rgba(46, 204, 113, ${0.05 + pulse})`;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  if (Math.random() < 0.4) {
    runtime.backgroundParticles.push({
      x: Math.random() * CANVAS_SIZE,
      y: CANVAS_SIZE + 10,
      vy: -(1 + Math.random() * 2),
      radius: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }
}

function drawBackgroundParticles(
  ctx: CanvasRenderingContext2D,
  runtime: GameRuntime
) {
  for (let index = runtime.backgroundParticles.length - 1; index >= 0; index--) {
    const particle = runtime.backgroundParticles[index];

    particle.y += particle.vy;

    ctx.fillStyle = `rgba(46, 204, 113, ${particle.opacity})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();

    if (particle.y < -10) {
      runtime.backgroundParticles.splice(index, 1);
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;

  for (let index = 0; index < CANVAS_SIZE; index += TILE_SIZE) {
    ctx.beginPath();
    ctx.moveTo(index, 0);
    ctx.lineTo(index, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, index);
    ctx.lineTo(CANVAS_SIZE, index);
    ctx.stroke();
  }
}

function drawFruits(ctx: CanvasRenderingContext2D, runtime: GameRuntime) {
  Object.values(runtime.fruits).forEach((fruit) => {
    if (fruit.active) {
      drawFruit(ctx, fruit);
    }
  });

  runtime.blackFruits.forEach((blackFruit) => drawFruit(ctx, blackFruit));
  runtime.extraFruits.forEach((extraFruit) => drawFruit(ctx, extraFruit));
}

function getSnakePieceColor(runtime: GameRuntime, index: number) {
  const baseColor = `hsl(${180 + index * 4}, 100%, 60%)`;
  const shouldBlink = Date.now() % 300 < 150;

  if (runtime.frenzyActive) {
    return runtime.frenzyTime < 20 && shouldBlink ? baseColor : "#2ecc71";
  }

  if (runtime.invincible) {
    return runtime.invincibleTime < 20 && shouldBlink ? baseColor : "#f1c40f";
  }

  if (runtime.magnetActive) {
    return runtime.magnetTime < 20 && shouldBlink ? baseColor : "#9b59b6";
  }

  return baseColor;
}

function drawSnake(ctx: CanvasRenderingContext2D, runtime: GameRuntime) {
  runtime.snake.forEach((piece, index) => {
    const currentColor = getSnakePieceColor(runtime, index);
    const radius = index === 0 || index === runtime.snake.length - 1 ? 8 : 2;

    ctx.fillStyle = currentColor;
    ctx.shadowBlur = 5;
    ctx.shadowColor = currentColor;

    ctx.beginPath();
    ctx.roundRect(
      piece.x + 1,
      piece.y + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
      radius
    );
    ctx.fill();

    ctx.shadowBlur = 0;

    if (index === 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

      ctx.beginPath();
      ctx.arc(piece.x + 6, piece.y + 6, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(piece.x + 14, piece.y + 6, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, runtime: GameRuntime) {
  for (let index = runtime.particles.length - 1; index >= 0; index--) {
    const particle = runtime.particles[index];

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 0.05;

    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = particle.color;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (particle.life <= 0) {
      runtime.particles.splice(index, 1);
    }
  }
}

export function drawSnakeRuntime(
  ctx: CanvasRenderingContext2D,
  runtime: GameRuntime
) {
  ctx.save();

  if (runtime.shakeIntensity > 0) {
    const shakeX = (Math.random() - 0.5) * runtime.shakeIntensity;
    const shakeY = (Math.random() - 0.5) * runtime.shakeIntensity;

    ctx.translate(shakeX, shakeY);
    runtime.shakeIntensity -= 0.5;
  }

  ctx.fillStyle = "#1e272e";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawFrenzyBackground(ctx, runtime);
  drawBackgroundParticles(ctx, runtime);
  drawGrid(ctx);
  drawFruits(ctx, runtime);
  drawSnake(ctx, runtime);
  drawParticles(ctx, runtime);

  ctx.restore();
}
