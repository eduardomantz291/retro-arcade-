// Renderizacao dos inimigos comuns e summons do Space Invaders.
// Separar este desenho ajuda o hook principal a ficar focado nas regras da partida.

import type { Invader } from "../spaceInvadersTypes";

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

function drawGuardianSummon(
  ctx: CanvasRenderingContext2D,
  invader: Invader,
  pulse: number
) {
  const centerX = invader.x + invader.width / 2;
  const centerY = invader.y + invader.height / 2;

  ctx.shadowBlur = 20 + pulse;
  ctx.shadowColor = invader.glow;
  ctx.fillStyle = invader.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#071016";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawHealerSummon(
  ctx: CanvasRenderingContext2D,
  invader: Invader,
  pulse: number
) {
  const centerX = invader.x + invader.width / 2;
  const centerY = invader.y + invader.height / 2;

  ctx.shadowBlur = 20 + pulse;
  ctx.shadowColor = invader.glow;
  ctx.fillStyle = invader.color;
  drawRoundedRect(ctx, invader.x, invader.y, invader.width, invader.height, 9);

  ctx.fillStyle = "#071016";
  drawRoundedRect(ctx, centerX - 3, centerY - 10, 6, 20, 999);
  drawRoundedRect(ctx, centerX - 10, centerY - 3, 20, 6, 999);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAttackerSummon(
  ctx: CanvasRenderingContext2D,
  invader: Invader,
  pulse: number
) {
  const centerX = invader.x + invader.width / 2;
  const centerY = invader.y + invader.height / 2;

  ctx.shadowBlur = 18 + pulse;
  ctx.shadowColor = invader.glow;
  ctx.fillStyle = invader.color;

  ctx.beginPath();
  ctx.moveTo(centerX, invader.y - 4);
  ctx.lineTo(invader.x + invader.width + 4, centerY);
  ctx.lineTo(centerX, invader.y + invader.height + 4);
  ctx.lineTo(invader.x - 4, centerY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(7, 16, 22, 0.78)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawRegularInvader(ctx: CanvasRenderingContext2D, invader: Invader) {
  ctx.shadowBlur = 14;
  ctx.shadowColor = invader.glow;
  ctx.fillStyle = invader.color;

  if (invader.variant === "square") {
    drawRoundedRect(ctx, invader.x, invader.y, invader.width, invader.height, 7);
  }

  if (invader.variant === "circle") {
    ctx.beginPath();
    ctx.ellipse(
      invader.x + invader.width / 2,
      invader.y + invader.height / 2,
      invader.width / 2,
      invader.height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  if (invader.variant === "triangle") {
    ctx.beginPath();
    ctx.moveTo(invader.x + invader.width / 2, invader.y);
    ctx.lineTo(invader.x + invader.width, invader.y + invader.height);
    ctx.lineTo(invader.x, invader.y + invader.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  drawRoundedRect(ctx, invader.x + 6, invader.y + 4, invader.width - 12, 4, 999);

  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";

  ctx.beginPath();
  ctx.arc(
    invader.x + invader.width * 0.35,
    invader.y + invader.height * 0.48,
    2.3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    invader.x + invader.width * 0.65,
    invader.y + invader.height * 0.48,
    2.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

export function drawInvader(ctx: CanvasRenderingContext2D, invader: Invader) {
  const pulse = Math.abs(Math.sin(Date.now() / 220)) * 3;

  ctx.save();

  if (invader.summonRole === "guardian") {
    drawGuardianSummon(ctx, invader, pulse);
    ctx.restore();
    return;
  }

  if (invader.summonRole === "healer") {
    drawHealerSummon(ctx, invader, pulse);
    ctx.restore();
    return;
  }

  if (invader.row >= 90) {
    drawAttackerSummon(ctx, invader, pulse);
    ctx.restore();
    return;
  }

  drawRegularInvader(ctx, invader);
  ctx.restore();
}
