// Renderizacao de entidades visuais do Breakout.
// O hook principal decide o que existe no jogo; este arquivo sabe como desenhar
// power-ups e blocos especiais no canvas.

import type { Brick, FallingPowerUp } from "../breakoutTypes";

export function drawRoundedRect(
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

export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: FallingPowerUp
) {
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

export function drawTntBrick(
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

export function drawCurseBrick(
  ctx: CanvasRenderingContext2D,
  brick: Brick,
  yOffset: number
) {
  const pulse = Math.abs(Math.sin(Date.now() / 130)) * 9;
  const x = brick.x;
  const y = brick.y + yOffset;

  ctx.shadowBlur = 20 + pulse;
  ctx.shadowColor = "#ff4757";
  ctx.fillStyle = "#2d123f";

  drawRoundedRect(ctx, x, y, brick.width, brick.height, 8);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 71, 87, 0.28)";
  drawRoundedRect(ctx, x + 4, y + 4, brick.width - 8, brick.height - 8, 6);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 14px system-ui, Apple Color Emoji, Segoe UI Emoji";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("☠️", x + brick.width / 2, y + brick.height / 2 + 1);
}

export function drawUltimateBrick(
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
